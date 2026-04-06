
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  writeBatch,
  serverTimestamp,
  limit,
  runTransaction
} from "firebase/firestore";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signInAnonymously,
  GoogleAuthProvider,
  signOut,
  User as FirebaseUser
} from "firebase/auth";
import { auth, db as firestore } from "../src/config/firebase";
import { User, Order, CartItem, Address, OrderStatus } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo?: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDoc(doc(firestore, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

const FALLBACK_SETTINGS = {
    key: 'global_config',
    conciergeConfig: {
        instagramHandle: 'deuzandco',
        whatsappNumber: '918848918633',
        emailAddress: 'deuzandco@gmail.com',
        businessHours: '9 AM - 9 PM IST',
        dmTemplate: 'Greetings from DEUZ & CO.'
    },
    siteContent: {
        heroTitle: 'CINEMATIC REALITY',
        heroSubtitle: 'Crafting immersive visual experiences for the world\'s leading brands and storytellers.',
        ctaText: 'Initiate Request',
        checkoutDisclaimer: 'Submit your allocation request. No payment is required until our curators verify your dossier.',
        footerText: 'Designed in Cinematic Vision'
    }
};

// Helper to map Firestore docs to our types
const mapDoc = (doc: any) => ({ ...doc.data(), _id: doc.id, id: doc.id });

export const setAuthToken = (token: string | null) => {
  // No-op for Firebase Client SDK, handled internally
};

export const db = {
  // --- AUTHENTICATION ---
  
  validateSession: async (token: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    
    try {
        const userDoc = await getDoc(doc(firestore, "users", currentUser.uid));
        if (userDoc.exists()) {
            return { ...userDoc.data(), id: userDoc.id, _id: userDoc.id } as any;
        }
        return null;
    } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        return null;
    }
  },

  updateUserProfile: async (userId: string, data: any) => {
    try {
        await updateDoc(doc(firestore, "users", userId), data);
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  },

  loginUser: async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    try {
        const userDoc = await getDoc(doc(firestore, "users", userCredential.user.uid));
        if (userDoc.exists()) {
            return { ...userDoc.data(), id: userDoc.id, _id: userDoc.id } as any;
        }
    } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${userCredential.user.uid}`);
    }
    return { 
        id: userCredential.user.uid, 
        _id: userCredential.user.uid,
        email: userCredential.user.email,
        role: 'user'
    };
  },

  loginUserWithGoogle: async (email: string, name: string) => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    try {
        const userRef = doc(firestore, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            const newUser = {
                fullName: user.displayName || name,
                email: user.email,
                role: 'user',
                createdAt: serverTimestamp(),
                mobile: '',
                addresses: []
            };
            await setDoc(userRef, newUser);
            return { ...newUser, id: user.uid, _id: user.uid };
        }
        return { ...userSnap.data(), id: user.uid, _id: user.uid };
    } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        throw error;
    }
  },

  checkUserExists: async (email: string) => {
    return false; 
  },

  registerUser: async (userData: any) => {
    const { email, password, fullName, mobile } = userData;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    const newUser = {
        fullName,
        email,
        mobile,
        role: 'user', // Default role
        addresses: [],
        createdAt: serverTimestamp()
    };

    try {
        await setDoc(doc(firestore, "users", userCredential.user.uid), newUser);
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${userCredential.user.uid}`);
    }
    return { ...newUser, id: userCredential.user.uid, _id: userCredential.user.uid };
  },

  logoutUser: async () => {
    await signOut(auth);
  },

  // --- PRODUCTS ---

  getProducts: async () => {
    try {
        const q = query(collection(firestore, "products"));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return [];
        }

        return querySnapshot.docs.map(mapDoc);
    } catch (error: any) {
        if (error.message && error.message.includes('the client is offline')) {
            console.error("Please check your Firebase configuration.");
        }
        handleFirestoreError(error, OperationType.LIST, 'products');
        return [];
    }
  },

  getProductById: async (id: string) => {
    try {
        const docRef = doc(firestore, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return mapDoc(docSnap);
        }
        return null;
    } catch (error) {
        handleFirestoreError(error, OperationType.GET, `products/${id}`);
        return null;
    }
  },

  createProduct: async (data: any) => {
    try {
        const docRef = await addDoc(collection(firestore, "products"), {
            ...data,
            createdAt: serverTimestamp()
        });
        return { ...data, id: docRef.id, _id: docRef.id };
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'products');
        throw error;
    }
  },

  updateProduct: async (id: string, data: any) => {
    try {
        const docRef = doc(firestore, "products", id);
        const { _id, id: pid, ...updateData } = data;
        await setDoc(docRef, updateData, { merge: true });
        return { ...data, id };
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
        throw error;
    }
  },

  deleteProduct: async (id: string) => {
    try {
        await deleteDoc(doc(firestore, "products", id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
        throw error;
    }
  },

  // --- CART ---

  getCart: async () => {
    const user = auth.currentUser;
    if (!user) return { items: [] };

    try {
        const cartDoc = await getDoc(doc(firestore, "carts", user.uid));
        if (cartDoc.exists()) {
            const data = cartDoc.data();
            return { ...data, _id: user.uid };
        }
        await setDoc(doc(firestore, "carts", user.uid), { user: user.uid, items: [] });
        return { user: user.uid, items: [] };
    } catch (error) {
        handleFirestoreError(error, OperationType.GET, `carts/${user.uid}`);
        return { user: user.uid, items: [] };
    }
  },

  addToCart: async (item: any) => {
    const user = auth.currentUser;
    if (!user) return; 

    try {
        const cartRef = doc(firestore, "carts", user.uid);
        const cartSnap = await getDoc(cartRef);
        
        let productData = item;
        try {
            const pDoc = await getDoc(doc(firestore, "products", item.productId || item.id));
            if (pDoc.exists()) productData = { ...pDoc.data(), _id: pDoc.id };
        } catch (e) { /* ignore */ }

        let currentItems = cartSnap.exists() ? cartSnap.data().items : [];
        const existingIdx = currentItems.findIndex((i: any) => 
            (i.product._id === (item.productId || item.id) || i.product.id === (item.productId || item.id)) && 
            i.selectedSize === item.selectedSize
        );

        if (existingIdx > -1) {
            currentItems[existingIdx].quantity += (item.quantity || 1);
        } else {
            currentItems.push({
                product: {
                    _id: item.productId || item.id || item.product._id,
                    title: productData.title || item.title,
                    price: productData.price || item.price,
                    image: productData.image || item.image,
                    category: productData.category,
                    countInStock: productData.countInStock
                },
                quantity: item.quantity || 1,
                selectedSize: item.selectedSize
            });
        }

        await setDoc(cartRef, { user: user.uid, items: currentItems }, { merge: true });
        return { user: user.uid, items: currentItems };
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `carts/${user.uid}`);
        throw new Error("Unable to update cart. Please check your connection.");
    }
  },

  updateCartQty: async (itemId: string, quantity: number) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const cartRef = doc(firestore, "carts", user.uid);
        const cartSnap = await getDoc(cartRef);
        if (!cartSnap.exists()) return;

        let items = cartSnap.data().items;
        // Logic for updating single item in array would typically involve identifying it
        // For this mock-up of Firebase logic, we return empty to trigger refresh or handle in context
        return { items };
    } catch (error) {
        handleFirestoreError(error, OperationType.GET, `carts/${user.uid}`);
    }
  },

  removeCartItem: async (itemId: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
        const cartRef = doc(firestore, "carts", user.uid);
        const cartSnap = await getDoc(cartRef);
        if (!cartSnap.exists()) return;
        
        return { items: cartSnap.data().items }; 
    } catch (error) {
        handleFirestoreError(error, OperationType.GET, `carts/${user.uid}`);
    }
  },

  mergeCart: async (items: any[]) => {
    const user = auth.currentUser;
    if (!user) return { items: [] };
    
    try {
        const cartRef = doc(firestore, "carts", user.uid);
        
        const formattedItems = items.map(i => ({
            product: {
                _id: i.id,
                title: i.title,
                price: i.price,
                image: i.image,
                category: i.category
            },
            quantity: i.quantity,
            selectedSize: i.selectedSize
        }));

        await setDoc(cartRef, { user: user.uid, items: formattedItems }, { merge: true });
        return { user: user.uid, items: formattedItems };
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `carts/${user.uid}`);
    }
  },

  // --- ORDERS ---

  createConciergeOrder: async (data: any) => {
    const user = auth.currentUser;
    const { items, address, total, contactMethod } = data;
    
    try {
        const counterRef = doc(firestore, 'system', 'orderCounter');
        
        const conciergeCode = await runTransaction(firestore, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            let currentNumber = 111;
            
            if (counterDoc.exists()) {
                currentNumber = counterDoc.data().lastOrderNumber + 1;
                transaction.update(counterRef, { lastOrderNumber: currentNumber });
            } else {
                transaction.set(counterRef, { lastOrderNumber: currentNumber });
            }
            
            const now = new Date();
            const dd = String(now.getDate()).padStart(2, '0');
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const yy = String(now.getFullYear()).slice(-2);
            
            return `DEUZ-${dd}${mm}${yy}-${currentNumber}`;
        });

        const orderData = {
            user: user ? user.uid : null,
            conciergeCode, 
            items,
            shippingAddress: address,
            totalAmount: total,
            contactMethod: contactMethod || 'private',
            paymentStatus: 'Pending',
            orderStatus: 'ORDER_SECURED',
            createdAt: serverTimestamp(),
            statusHistory: [{
                status: 'ORDER_SECURED',
                timestamp: new Date(),
                changedBy: user ? user.uid : 'Guest'
            }]
        };

        // Remove undefined values to prevent Firestore errors
        const removeUndefined = (obj: any): any => {
            if (obj === undefined) return null;
            if (obj === null) return null;
            if (typeof obj !== 'object') return obj;
            if (Array.isArray(obj)) return obj.map(removeUndefined);
            
            // Check if it's a plain object. If not (e.g. Date, FieldValue), return as is.
            if (obj.constructor !== Object) return obj;
            
            const newObj: any = {};
            for (const key in obj) {
                if (obj[key] !== undefined) {
                    newObj[key] = removeUndefined(obj[key]);
                }
            }
            return newObj;
        };

        const sanitizedOrderData = removeUndefined(orderData);

        const docRef = doc(firestore, "orders", conciergeCode);
        await setDoc(docRef, sanitizedOrderData);
        
        items.forEach(async (item: any) => {
            try {
                const pid = item.id || item.product?._id;
                if (pid) {
                    const pRef = doc(firestore, "products", pid);
                    const pSnap = await getDoc(pRef);
                    if (pSnap.exists()) {
                        const current = pSnap.data().countInStock || 0;
                        await updateDoc(pRef, { countInStock: Math.max(0, current - item.quantity) });
                    }
                }
            } catch (e) {
                // Ignore silent product updates if permissions fail, order is priority
            }
        });

        return {
            success: true,
            orderId: conciergeCode,
            orderCode: conciergeCode,
            order: orderData,
            message: 'Dossier Registered'
        };
    } catch (error: any) {
        handleFirestoreError(error, OperationType.CREATE, 'orders');
        throw error;
    }
  },

  markConversationStarted: async (id: string, interaction: any) => {
    try {
        const ref = doc(firestore, "orders", id);
        await updateDoc(ref, {
            conversationStartedAt: serverTimestamp()
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  },

  updateOrderChannel: async (id: string, channel: string) => {
    try {
        await updateDoc(doc(firestore, "orders", id), { contactMethod: channel });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  },

  trackOrder: async (code: string) => {
    try {
        const docRef = doc(firestore, "orders", code);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) return mapDoc(docSnap);
        
        // Fallback to query if it was created with auto-id previously
        const q = query(collection(firestore, "orders"), where("conciergeCode", "==", code));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            return mapDoc(snapshot.docs[0]);
        }
        
        throw new Error("Dossier not found");
    } catch (error: any) {
        if (error.message === "Dossier not found") throw error;
        handleFirestoreError(error, OperationType.GET, `orders/${code}`);
        throw error;
    }
  },

  getMyOrders: async () => {
    const user = auth.currentUser;
    if (!user) return [];
    
    try {
        const q = query(collection(firestore, "orders"), where("user", "==", user.uid));
        const snapshot = await getDocs(q);
        const orders = snapshot.docs.map(mapDoc);
        // Sort by createdAt descending on the client to avoid needing a composite index
        return orders.sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'orders');
        return [];
    }
  },

  cancelOrder: async (orderId: string, reason: string) => {
    try {
        const ref = doc(firestore, "orders", orderId);
        const orderSnap = await getDoc(ref);
        if (orderSnap.exists()) {
            const orderData = orderSnap.data();
            // Restore stock
            if (orderData.items && Array.isArray(orderData.items)) {
                for (const item of orderData.items) {
                    if (item.product) {
                        const productRef = doc(firestore, "products", item.product);
                        const productSnap = await getDoc(productRef);
                        if (productSnap.exists()) {
                            const currentStock = productSnap.data().countInStock || 0;
                            await updateDoc(productRef, { countInStock: currentStock + item.quantity });
                        }
                    }
                }
            }
        }
        await updateDoc(ref, { 
            orderStatus: 'CANCELLED', 
            internalNotes: `Cancelled: ${reason}` 
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  },

  // --- ADMIN ---

  getAllOrders: async () => {
    try {
        const q = query(collection(firestore, "orders"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(mapDoc);
    } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'orders');
        return [];
    }
  },

  getUsers: async () => {
    try {
        const snapshot = await getDocs(collection(firestore, "users"));
        return snapshot.docs.map(mapDoc);
    } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'users');
        return [];
    }
  },

  createUser: async (data: any) => {
    // Note: Creating secondary users from client SDK while logged in as admin is complex in Firebase
    // This is a placeholder. Real implementation requires Cloud Functions.
    throw new Error("Direct admin user creation requires backend function.");
  },

  updateOrderStatus: async (id: string, status: string, internalNotes?: string) => {
    try {
        const data: any = { orderStatus: status };
        if (internalNotes !== undefined) data.internalNotes = internalNotes;
        await updateDoc(doc(firestore, "orders", id), data);
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  },

  updateOrderTracking: async (id: string, trackingInfo: { carrier: string, trackingNumber: string, trackingUrl: string }) => {
    try {
        await updateDoc(doc(firestore, "orders", id), { trackingInfo });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  },

  trashOrder: async (id: string) => {
    try {
        await updateDoc(doc(firestore, "orders", id), { isTrashed: true });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  },

  restoreOrder: async (id: string) => {
    try {
        await updateDoc(doc(firestore, "orders", id), { isTrashed: false });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  },

  updateOrderPaymentLink: async (id: string, link: string) => {
    try {
        await updateDoc(doc(firestore, "orders", id), { paymentLink: link });
        return { paymentLink: link };
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  },

  recordManualPayment: async (id: string, data: any) => {
    try {
        await updateDoc(doc(firestore, "orders", id), {
            paymentStatus: 'Paid',
            orderStatus: 'PAYMENT_AUTHORIZED',
            paymentDetails: data
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  },

  getAuditLogs: async () => {
    try {
        const q = query(collection(firestore, "audit_logs"), orderBy("timestamp", "desc"), limit(50));
        const snap = await getDocs(q);
        return snap.docs.map(mapDoc);
    } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'audit_logs');
        return [];
    }
  },

  getSystemSettings: async () => {
    try {
        const docRef = doc(firestore, "settings", "global_config");
        const snap = await getDoc(docRef);
        if (snap.exists()) return snap.data();
    } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'settings/global_config');
    }
    return FALLBACK_SETTINGS;
  },

  updateSystemSettings: async (data: any) => {
    try {
        await setDoc(doc(firestore, "settings", "global_config"), data, { merge: true });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'settings/global_config');
    }
  },
  
  bootstrapSystem: async (data: any) => {
      const { email, password, fullName } = data;
      
      try {
          // 1. Create in Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          
          // 2. Create Admin Profile in Firestore
          const newAdmin = {
              fullName: fullName || 'System Admin',
              email,
              mobile: '0000000000',
              role: 'admin',
              createdAt: serverTimestamp(),
              addresses: []
          };
          
          await setDoc(doc(firestore, "users", userCredential.user.uid), newAdmin);
          return { ...newAdmin, id: userCredential.user.uid, token: await userCredential.user.getIdToken() };
      } catch (error: any) {
          if (error.code === 'auth/email-already-in-use') {
             // Recover if user exists but data missing (e.g. partial setup)
             try {
                 const userCredential = await signInWithEmailAndPassword(auth, email, password);
                 await setDoc(doc(firestore, "users", userCredential.user.uid), { role: 'admin' }, { merge: true });
                 return { id: userCredential.user.uid, email, role: 'admin', token: await userCredential.user.getIdToken() };
             } catch (err) {
                 handleFirestoreError(err, OperationType.UPDATE, 'users');
                 throw err;
             }
          }
          handleFirestoreError(error, OperationType.CREATE, 'users');
          throw error;
      }
  }
};
