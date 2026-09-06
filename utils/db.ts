
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  getDocFromServer,
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
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser
} from "firebase/auth";
import { auth, db as firestore } from "../src/config/firebase";
import { User, Order, CartItem, Address, OrderStatus } from '../types';
import { storage } from './storage';

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

export const INITIAL_PRODUCTS = [
  {
    title: "DEUZ FORM 01 — SOVEREIGN",
    price: 12000,
    category: "Apparel",
    productType: "APPAREL",
    fit: "regular",
    image: "https://ik.imagekit.io/dto1zguat/Evolve_1.jpg",
    gallery: [
      "https://ik.imagekit.io/dto1zguat/Evolve_4.jpg?updatedAt=1775278133983"
    ],
    houseCode: "DEUZ-F01-SOV",
    countInStock: 25,
    isArchived: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    sizeStock: { "S": 5, "M": 8, "L": 6, "XL": 4, "XXL": 2 },
    details: {
      "Silhouette": "Sculpted Architectural",
      "Fabric": "480 GSM Heavy French Terry",
      "Craft": "Hand-finished in Studio",
      "Cut": "Singular House Pattern"
    },
    description: "Anchored in singularity. Precision-cut silhouette crafted from structured heavyweight cotton with architectural shoulder drape.",
    imageTag: "SIGNATURE PIECE"
  },
  {
    title: "DEUZ FORM 01 — DUSTBOUND",
    price: 14500,
    category: "Apparel",
    productType: "APPAREL",
    fit: "oversized",
    image: "https://ik.imagekit.io/dto1zguat/Dustbound_1.jpg?updatedAt=1775277953541",
    gallery: [],
    houseCode: "DEUZ-F01-DST",
    countInStock: 18,
    isArchived: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    sizeStock: { "S": 3, "M": 6, "L": 5, "XL": 3, "XXL": 1 },
    details: {
      "Silhouette": "Oversized Drape",
      "Fabric": "Custom Mineral Washed Fleece",
      "Origin": "Limited Capsule",
      "Finish": "Raw Distressed Hem"
    },
    description: "A study in earth and erosion. Mineral washed for a unique tonal gradient with raw-edge detailing.",
    imageTag: "LIMITED CAPSULE"
  },
  {
    title: "DEUZ FORM 01 — ETERNAL HORIZON",
    price: 16000,
    category: "Apparel",
    productType: "APPAREL",
    fit: "regular",
    image: "https://ik.imagekit.io/dto1zguat/EternalHorizon_1.jpg?updatedAt=1775278022400",
    gallery: [
      "https://ik.imagekit.io/dto1zguat/EternalHorizon_2.jpg?updatedAt=1775278048419"
    ],
    houseCode: "DEUZ-F01-ETH",
    countInStock: 12,
    isArchived: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    sizeStock: { "S": 2, "M": 4, "L": 3, "XL": 2, "XXL": 1 },
    details: {
      "Silhouette": "Tailored Box Fit",
      "Fabric": "Double-faced Bonded Wool Blend",
      "Hardware": "Matte Obsidian Snaps",
      "Lining": "Cupro Bemberg"
    },
    description: "The definitive outerwear expression of the house. Monolithic geometry with covert magnetic closures.",
    imageTag: "OUTERWEAR"
  },
  {
    title: "DEUZ FORM 01 — EVOLVE TEE",
    price: 9500,
    category: "Apparel",
    productType: "APPAREL",
    fit: "oversized",
    image: "https://ik.imagekit.io/dto1zguat/Evolve_4.jpg?updatedAt=1775278133983",
    gallery: [
      "https://ik.imagekit.io/dto1zguat/Evolve_1.jpg"
    ],
    houseCode: "DEUZ-F01-EVL",
    countInStock: 30,
    isArchived: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    sizeStock: { "S": 6, "M": 10, "L": 8, "XL": 4, "XXL": 2 },
    details: {
      "Silhouette": "Relaxed Dropped Shoulder",
      "Fabric": "320 GSM Combed Mercerized Cotton",
      "Edition": "House Release"
    },
    description: "Minimalist precision. Elevated essential featuring subtle tonal house typography and seamless collar reinforcement.",
    imageTag: "CORE RELEASE"
  },
  {
    title: "DEUZ CARD COLLECTION — FORM 01",
    price: 3500,
    category: "Cards",
    productType: "CARD",
    image: "https://images.unsplash.com/photo-1634926878768-2a5b3c426d49?q=80&w=1000&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1614728853913-1e2221eb8364?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1000&auto=format&fit=crop"
    ],
    houseCode: "DEUZ-CRD-01",
    countInStock: 50,
    isArchived: false,
    sizes: ["Standard"],
    sizeStock: { "Standard": 50 },
    details: {
      "Stock": "350 GSM Black Core Linen",
      "Finish": "Gold Foil Hot Stamping",
      "Deck": "54 Bespoke Illustrated Cards",
      "Box": "Magnetic Clasp Obsidian Case"
    },
    description: "A visual symphony in your hand. Handcrafted luxury playing cards designed for collectors.",
    imageTag: "COLLECTORS EDITION"
  }
];

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
        heroTitle: 'NOT FOR EVERYONE',
        heroSubtitle: 'Not for everyone.',
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
        const safeData = JSON.parse(JSON.stringify(data));
        await updateDoc(doc(firestore, "users", userId), safeData);
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  },

  loginUser: async (email: string, password: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    const isAdminEmail = normalizedEmail === 'unk410066@gmail.com' || normalizedEmail === 'muhammadbinbasheer777@gmail.com';

    // 1. Primary: Direct Firebase Authentication
    try {
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      } catch (fbErr: any) {
        // If it is the authorized system administrator and the account isn't enrolled yet,
        // auto-provision the admin in Firebase Authentication seamlessly
        if ((fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/invalid-credential') && isAdminEmail) {
          try {
            userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
            await updateProfile(userCredential.user, { displayName: 'Executive Operator' });
          } catch (createErr) {
            throw fbErr;
          }
        } else {
          // Secondary fallback to server API if available
          try {
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: normalizedEmail, password })
            });
            if (res.ok) {
              const data = await res.json();
              if (data.token) storage.setToken(data.token);
              storage.setUser(data);
              // Also sync into Firebase Auth in background
              try {
                const autoCred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
                if (data.fullName) await updateProfile(autoCred.user, { displayName: data.fullName });
              } catch (autoErr) {}
              return data;
            }
          } catch (apiErr) {}
          throw fbErr;
        }
      }

      const user = userCredential.user;
      const token = await user.getIdToken();
      storage.setToken(token);

      // Fetch or sync user dossier in Cloud Firestore
      const userRef = doc(firestore, "users", user.uid);
      let userData: any = null;
      try {
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          userData = { ...userDoc.data(), id: userDoc.id, _id: userDoc.id };
          await updateDoc(userRef, { lastLoginAt: serverTimestamp() });
        } else {
          userData = {
            fullName: user.displayName || normalizedEmail.split('@')[0],
            email: normalizedEmail,
            role: isAdminEmail ? 'admin' : 'user',
            mobile: user.phoneNumber || '',
            addresses: [],
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp()
          };
          await setDoc(userRef, userData);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }

      // Log authentication success across Firebase console collections
      await db.logAuthEvent({
        event: 'login_success',
        action: 'USER_LOGIN',
        email: normalizedEmail,
        userId: user.uid,
        role: userData?.role || (isAdminEmail ? 'admin' : 'user'),
        provider: 'firebase_email_password',
        status: 'success',
        message: `Session initialized for ${normalizedEmail} via Firebase Authentication`
      });

      const finalUser = {
        id: user.uid,
        _id: user.uid,
        email: normalizedEmail,
        fullName: userData?.fullName || user.displayName || normalizedEmail.split('@')[0],
        mobile: userData?.mobile || '',
        role: userData?.role || (isAdminEmail ? 'admin' : 'user'),
        address: userData?.address || (userData?.addresses && userData?.addresses.length > 0 ? userData.addresses[0] : undefined),
        addresses: userData?.addresses || [],
        token
      };

      storage.setUser(finalUser as any);
      return finalUser;
    } catch (error: any) {
      await db.logAuthEvent({
        event: 'login_failure',
        action: 'USER_LOGIN_FAILED',
        email: normalizedEmail,
        userId: 'unauthenticated',
        provider: 'firebase_email_password',
        status: 'failed',
        failureReason: error.message || 'Invalid credentials'
      });
      throw error;
    }
  },

  loginUserWithGoogle: async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const token = await user.getIdToken();
      storage.setToken(token);

      const normalizedEmail = (user.email || '').toLowerCase().trim();
      const isAdminEmail = normalizedEmail === 'unk410066@gmail.com' || normalizedEmail === 'muhammadbinbasheer777@gmail.com';

      const userRef = doc(firestore, "users", user.uid);
      const userSnap = await getDoc(userRef);

      let userData: any;
      if (!userSnap.exists()) {
        userData = {
          fullName: user.displayName || 'Client Operative',
          email: normalizedEmail,
          role: isAdminEmail ? 'admin' : 'user',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          mobile: user.phoneNumber || '',
          addresses: []
        };
        await setDoc(userRef, userData);
        await db.logAuthEvent({
          event: 'google_signup_success',
          action: 'GOOGLE_SIGNUP',
          email: normalizedEmail,
          userId: user.uid,
          role: userData.role,
          provider: 'firebase_google',
          status: 'success',
          message: `New account established via Firebase Google Auth: ${normalizedEmail}`
        });
      } else {
        userData = userSnap.data();
        await updateDoc(userRef, { lastLoginAt: serverTimestamp() });
        await db.logAuthEvent({
          event: 'google_login_success',
          action: 'GOOGLE_LOGIN',
          email: normalizedEmail,
          userId: user.uid,
          role: userData.role || (isAdminEmail ? 'admin' : 'user'),
          provider: 'firebase_google',
          status: 'success',
          message: `Session verified via Firebase Google Auth: ${normalizedEmail}`
        });
      }

      const finalUser = {
        id: user.uid,
        _id: user.uid,
        email: normalizedEmail,
        fullName: userData?.fullName || user.displayName || 'Client Operative',
        mobile: userData?.mobile || '',
        role: userData?.role || (isAdminEmail ? 'admin' : 'user'),
        address: userData?.address || (userData?.addresses && userData?.addresses.length > 0 ? userData.addresses[0] : undefined),
        addresses: userData?.addresses || [],
        token
      };

      storage.setUser(finalUser as any);
      return finalUser;
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        await db.logAuthEvent({
          event: 'google_login_failure',
          action: 'GOOGLE_LOGIN_FAILED',
          email: 'anonymous_google_client',
          userId: 'unauthenticated',
          provider: 'firebase_google',
          status: 'failed',
          failureReason: error.message
        });
      }
      throw error;
    }
  },

  checkUserExists: async (email: string) => {
    try {
      const q = query(collection(firestore, "users"), where("email", "==", email.toLowerCase().trim()));
      const snap = await getDocs(q);
      return !snap.empty;
    } catch {
      return false; 
    }
  },

  registerUser: async (userData: any) => {
    const { email, password, fullName, mobile } = userData;
    const normalizedEmail = email.toLowerCase().trim();
    const isAdminEmail = normalizedEmail === 'unk410066@gmail.com' || normalizedEmail === 'muhammadbinbasheer777@gmail.com';

    try {
      // 1. Primary: Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      const user = userCredential.user;

      if (fullName) {
        try {
          await updateProfile(user, { displayName: fullName });
        } catch (e) {}
      }

      const token = await user.getIdToken();
      storage.setToken(token);

      // 2. Provision User Dossier in Cloud Firestore
      const newUserProfile = {
        fullName: fullName || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        mobile: mobile || '',
        role: isAdminEmail ? 'admin' : 'user',
        addresses: [],
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      };

      await setDoc(doc(firestore, "users", user.uid), newUserProfile);

      // 3. Log event across Firebase Console collections
      await db.logAuthEvent({
        event: 'signup_success',
        action: 'USER_REGISTERED',
        email: normalizedEmail,
        userId: user.uid,
        role: newUserProfile.role,
        provider: 'firebase_email_password',
        status: 'success',
        message: `New identity registered via Firebase Authentication: ${normalizedEmail}`
      });

      const finalUser = {
        id: user.uid,
        _id: user.uid,
        ...newUserProfile,
        token
      };

      storage.setUser(finalUser as any);
      return finalUser;
    } catch (error: any) {
      await db.logAuthEvent({
        event: 'signup_failure',
        action: 'USER_SIGNUP_FAILED',
        email: normalizedEmail,
        userId: 'unauthenticated',
        provider: 'firebase_email_password',
        status: 'failed',
        failureReason: error.message || 'Registration refused'
      });
      throw error;
    }
  },

  resetPasswordWithFirebase: async (email: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    try {
      await sendPasswordResetEmail(auth, normalizedEmail);
      await db.logAuthEvent({
        event: 'password_reset_sent',
        action: 'PASSWORD_RESET_REQUESTED',
        email: normalizedEmail,
        userId: 'anonymous',
        provider: 'firebase_auth',
        status: 'success',
        message: `Firebase password reset link transmitted to ${normalizedEmail}`
      });
      return { success: true, message: `Passcode recovery instructions transmitted to ${normalizedEmail} via Firebase.` };
    } catch (err: any) {
      let message = err.message || 'Passcode recovery failed.';
      if (err.code === 'auth/user-not-found') {
        message = 'No registered dossier located for this email address.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      }
      await db.logAuthEvent({
        event: 'password_reset_failure',
        action: 'PASSWORD_RESET_FAILED',
        email: normalizedEmail,
        userId: 'anonymous',
        provider: 'firebase_auth',
        status: 'failed',
        failureReason: message
      });
      return { success: false, message };
    }
  },

  logoutUser: async () => {
    const cachedUser = storage.getUser();
    const user = auth.currentUser;
    const uid = (user && !user.isAnonymous) ? user.uid : (cachedUser?.id || 'guest');
    const email = user?.email || cachedUser?.email;
    if (email) {
      try {
        await db.logAuthEvent({
          event: 'logout_success',
          action: 'USER_LOGOUT',
          email,
          userId: uid,
          provider: 'firebase_auth',
          status: 'success',
          message: `User session terminated: ${email}`
        });
      } catch (e) {}
    }
    storage.removeToken();
    storage.removeUser();
    try {
      await signOut(auth);
    } catch (e) {}
  },

  getCurrentUser: async () => {
    // Check token with /api/auth/me
    const token = storage.getToken();
    if (token) {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const user = await res.json();
          storage.setUser(user);
          return user;
        }
      } catch (e) {}
    }

    // Check cached user in storage
    const cached = storage.getUser();
    if (cached) return cached;

    // Check Firebase Auth
    const currentUser = auth.currentUser;
    if (currentUser && !currentUser.isAnonymous) {
      try {
        const userDoc = await getDoc(doc(firestore, "users", currentUser.uid));
        if (userDoc.exists()) {
          const u = { ...userDoc.data(), id: userDoc.id, _id: userDoc.id } as User;
          storage.setUser(u);
          return u;
        }
      } catch (e) {}
    }
    return null;
  },

  // --- PRODUCTS ---

  getProducts: async () => {
    try {
        const q = query(collection(firestore, "products"));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            // Check if we can seed initial catalog to Firestore
            const seededList: any[] = [];
            for (const item of INITIAL_PRODUCTS) {
                try {
                    const docRef = await addDoc(collection(firestore, "products"), {
                        ...item,
                        createdAt: serverTimestamp()
                    });
                    seededList.push({ ...item, id: docRef.id, _id: docRef.id });
                } catch (seedErr) {
                    // Non-admin will fail addDoc; silently continue to fallback
                    break;
                }
            }
            if (seededList.length === INITIAL_PRODUCTS.length) {
                await db.logAuditEvent('CATALOG_SEEDED', 'products', 'system', { count: seededList.length });
                return seededList;
            }
            return INITIAL_PRODUCTS.map((p, idx) => ({ ...p, id: `seed_${idx}`, _id: `seed_${idx}` }));
        }

        return querySnapshot.docs.map(mapDoc);
    } catch (error: any) {
        if (error.message && error.message.includes('the client is offline')) {
            console.error("Please check your Firebase configuration.");
        }
        handleFirestoreError(error, OperationType.LIST, 'products');
        return INITIAL_PRODUCTS.map((p, idx) => ({ ...p, id: `seed_${idx}`, _id: `seed_${idx}` }));
    }
  },

  getProductById: async (id: string) => {
    try {
        const docRef = doc(firestore, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return mapDoc(docSnap);
        }
        // Check fallback initial products if not in DB
        const found = INITIAL_PRODUCTS.find((p, idx) => p.houseCode === id || `seed_${idx}` === id);
        if (found) return { ...found, id, _id: id };
        return null;
    } catch (error) {
        handleFirestoreError(error, OperationType.GET, `products/${id}`);
        return null;
    }
  },

  createProduct: async (data: any) => {
    try {
        const safeData = JSON.parse(JSON.stringify(data));
        const docRef = await addDoc(collection(firestore, "products"), {
            ...safeData,
            createdAt: serverTimestamp()
        });
        await db.logAuditEvent('PRODUCT_CREATED', 'products', docRef.id, {
            title: data.title,
            price: data.price,
            category: data.category,
            countInStock: data.countInStock
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
        const { _id, id: pid, createdAt, ...updateData } = data;
        const safeData = JSON.parse(JSON.stringify(updateData));
        await setDoc(docRef, safeData, { merge: true });
        await db.logAuditEvent('PRODUCT_UPDATED', 'products', id, {
            updatedFields: Object.keys(updateData)
        });
        return { ...data, id };
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
        throw error;
    }
  },

  deleteProduct: async (id: string) => {
    try {
        await deleteDoc(doc(firestore, "products", id));
        await db.logAuditEvent('PRODUCT_DELETED', 'products', id, { id });
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
            if (data.items && data.items.length > 0) {
                let cartModified = false;
                const validItems = [];
                
                for (const item of data.items) {
                    try {
                        const pId = item.product?._id || item.product?.id;
                        if (pId) {
                            const pDoc = await getDoc(doc(firestore, "products", pId));
                            if (pDoc.exists()) {
                                const pData = pDoc.data();
                                
                                let maxStock = pData.countInStock ?? 0;
                                if (item.selectedSize && pData.sizeStock && typeof pData.sizeStock[item.selectedSize] === 'number') {
                                    maxStock = pData.sizeStock[item.selectedSize];
                                }
                                
                                if (maxStock <= 0) {
                                    cartModified = true;
                                    continue;
                                }

                                item.product = {
                                    ...item.product,
                                    countInStock: pData.countInStock ?? null,
                                    sizeStock: pData.sizeStock || null,
                                    price: pData.price || item.product.price,
                                    title: pData.title || item.product.title,
                                    image: pData.image || item.product.image
                                };
                                validItems.push(item);
                            } else {
                                cartModified = true;
                            }
                        } else {
                            cartModified = true;
                        }
                    } catch (e) {
                        validItems.push(item);
                    }
                }
                
                data.items = validItems;
                if (cartModified) {
                    await updateDoc(doc(firestore, "carts", user.uid), { items: validItems });
                }
            }
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

        let currentItems = (cartSnap.exists() && cartSnap.data().items) ? cartSnap.data().items : [];
        const existingIdx = currentItems.findIndex((i: any) => 
            (i.product._id === (item.productId || item.id) || i.product.id === (item.productId || item.id)) && 
            i.selectedSize === item.selectedSize
        );

        if (existingIdx > -1) {
            const maxStock = item.selectedSize && productData.sizeStock && typeof productData.sizeStock[item.selectedSize] === 'number'
                ? productData.sizeStock[item.selectedSize]
                : productData.countInStock ?? 99;
                
            if (currentItems[existingIdx].quantity + (item.quantity || 1) > maxStock) {
                throw new Error(JSON.stringify({ error: "Maximum allocation reached for this artifact." }));
            }
            currentItems[existingIdx].quantity += (item.quantity || 1);
        } else {
            const maxStock = item.selectedSize && productData.sizeStock && typeof productData.sizeStock[item.selectedSize] === 'number'
                ? productData.sizeStock[item.selectedSize]
                : productData.countInStock ?? 99;
                
            if ((item.quantity || 1) > maxStock) {
                throw new Error(JSON.stringify({ error: "Maximum allocation reached for this artifact." }));
            }
            
            currentItems.push({
                _id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                product: {
                    _id: item.productId || item.id || item.product?._id || "",
                    title: productData.title || item.title || "",
                    price: productData.price || item.price || 0,
                    image: productData.image || item.image || "",
                    category: productData.category || "",
                    countInStock: productData.countInStock ?? null,
                    sizeStock: productData.sizeStock || null
                },
                quantity: item.quantity || 1,
                selectedSize: item.selectedSize || null
            });
        }

        // Strip any undefined values that might cause Firestore errors
        const safeItems = JSON.parse(JSON.stringify(currentItems));

        if (cartSnap.exists()) {
            await updateDoc(cartRef, { items: safeItems });
        } else {
            await setDoc(cartRef, { user: user.uid, items: safeItems });
        }
        return await db.getCart();
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

        let items = cartSnap.data().items || [];
        const itemIndex = items.findIndex((i: any) => {
            const currentItemId = i._id || i.cartItemId || `${i.product?._id || i.product?.id}_${i.selectedSize}`;
            return currentItemId === itemId;
        });

        if (itemIndex > -1) {
            const item = items[itemIndex];
            const maxStock = item.selectedSize && item.product?.sizeStock && typeof item.product.sizeStock[item.selectedSize] === 'number'
                ? item.product.sizeStock[item.selectedSize]
                : item.product?.countInStock ?? 99;
                
            if (quantity > maxStock) {
                throw new Error(JSON.stringify({ error: "Maximum allocation reached for this artifact." }));
            }
            items[itemIndex].quantity = quantity;
            await updateDoc(cartRef, { items });
        }
        
        return await db.getCart();
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `carts/${user.uid}`);
    }
  },

  removeCartItem: async (itemId: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
        const cartRef = doc(firestore, "carts", user.uid);
        const cartSnap = await getDoc(cartRef);
        if (!cartSnap.exists()) return;
        
        const currentItems = cartSnap.data().items || [];
        const updatedItems = currentItems.filter((i: any) => {
            const currentItemId = i._id || i.cartItemId || `${i.product?._id || i.product?.id}_${i.selectedSize}`;
            return currentItemId !== itemId;
        });
        
        await updateDoc(cartRef, { items: updatedItems });
        return await db.getCart(); 
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `carts/${user.uid}`);
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

        const cartSnap = await getDoc(cartRef);
        if (cartSnap.exists()) {
            await updateDoc(cartRef, { items: formattedItems });
        } else {
            await setDoc(cartRef, { user: user.uid, items: formattedItems });
        }
        return await db.getCart();
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `carts/${user.uid}`);
    }
  },

  // --- ORDERS ---

  createConciergeOrder: async (data: any) => {
    const user = auth.currentUser;
    const { items, address, total, contactMethod } = data;
    
    try {
        // Verify stock before proceeding
        for (const item of items) {
            const pid = item.id || item.product?._id;
            if (pid) {
                const pRef = doc(firestore, "products", pid);
                const pSnap = await getDoc(pRef);
                if (pSnap.exists()) {
                    const productData = pSnap.data();
                    let maxStock = productData.countInStock ?? 0;
                    if (item.selectedSize && productData.sizeStock && typeof productData.sizeStock[item.selectedSize] === 'number') {
                        maxStock = productData.sizeStock[item.selectedSize];
                    }
                    if (maxStock < item.quantity) {
                        throw new Error(`Item "${item.title || 'Unknown'}" is out of stock or exceeds available quantity.`);
                    }
                } else {
                    const fallbackProduct = INITIAL_PRODUCTS.find((p, idx) => `seed_${idx}` === pid || p.houseCode === pid || p.title === item.title);
                    if (fallbackProduct) {
                        let maxStock = fallbackProduct.countInStock ?? 20;
                        if (item.selectedSize && fallbackProduct.sizeStock && typeof (fallbackProduct.sizeStock as any)[item.selectedSize] === 'number') {
                            maxStock = (fallbackProduct.sizeStock as any)[item.selectedSize];
                        }
                        if (maxStock < item.quantity) {
                            throw new Error(`Item "${item.title || 'Unknown'}" is out of stock or exceeds available quantity.`);
                        }
                    }
                }
            }
        }

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
                        const productData = pSnap.data();
                        const current = productData.countInStock || 0;
                        const updateData: any = { countInStock: Math.max(0, current - item.quantity) };
                        
                        if (item.selectedSize && productData.sizeStock && typeof productData.sizeStock[item.selectedSize] === 'number') {
                            const newSizeStock = { ...productData.sizeStock };
                            newSizeStock[item.selectedSize] = Math.max(0, newSizeStock[item.selectedSize] - item.quantity);
                            updateData.sizeStock = newSizeStock;
                            
                            const outOfStock = Object.entries(newSizeStock)
                                .filter(([_, stock]) => (stock as number) <= 0)
                                .map(([s, _]) => s);
                            updateData.outOfStockSizes = outOfStock;
                        }
                        
                        await updateDoc(pRef, updateData);
                    }
                }
            } catch (e) {
                // Ignore silent product updates if permissions fail, order is priority
            }
        });

        // Log order creation in audit log
        await db.logAuditEvent(
            'ORDER_CREATED',
            'orders',
            conciergeCode,
            {
                orderCode: conciergeCode,
                itemCount: items.length,
                totalAmount: total,
                contactMethod: contactMethod || 'private',
                city: address?.city,
                state: address?.state
            }
        );

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
        await db.logAuditEvent('CONVERSATION_STARTED', 'orders', id, {
            channel: interaction?.channel || 'concierge'
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  },

  updateOrderChannel: async (id: string, channel: string) => {
    try {
        await updateDoc(doc(firestore, "orders", id), { contactMethod: channel });
        await db.logAuditEvent('CHANNEL_UPDATED', 'orders', id, { contactMethod: channel });
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
                            const productData = productSnap.data();
                            const currentStock = productData.countInStock || 0;
                            const updateData: any = { countInStock: currentStock + item.quantity };
                            
                            if (item.selectedSize && productData.sizeStock && typeof productData.sizeStock[item.selectedSize] === 'number') {
                                const newSizeStock = { ...productData.sizeStock };
                                newSizeStock[item.selectedSize] = newSizeStock[item.selectedSize] + item.quantity;
                                updateData.sizeStock = newSizeStock;
                                
                                const outOfStock = Object.entries(newSizeStock)
                                    .filter(([_, stock]) => (stock as number) <= 0)
                                    .map(([s, _]) => s);
                                updateData.outOfStockSizes = outOfStock;
                            }
                            
                            await updateDoc(productRef, updateData);
                        }
                    }
                }
            }
        }
        await updateDoc(ref, { 
            orderStatus: 'CANCELLED', 
            internalNotes: `Cancelled: ${reason}` 
        });
        await db.logAuditEvent('ORDER_CANCELLED', 'orders', orderId, { reason });
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
    try {
        const { fullName, email, role, mobile } = data;
        const opId = 'op_' + Math.random().toString(36).substring(2, 11);
        const newUserDoc = {
            fullName: fullName || 'Operative',
            email,
            mobile: mobile || '',
            role: role || 'concierge',
            createdAt: serverTimestamp(),
            addresses: []
        };
        await setDoc(doc(firestore, "users", opId), newUserDoc);
        await db.logAuditEvent('OPERATIVE_CREATED', 'users', opId, { email, role, fullName });
        return { ...newUserDoc, id: opId, _id: opId };
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'users');
        throw error;
    }
  },

  updateOrderStatus: async (id: string, status: string, internalNotes?: string) => {
    try {
        const data: any = { orderStatus: status };
        if (internalNotes !== undefined) data.internalNotes = internalNotes;
        await updateDoc(doc(firestore, "orders", id), data);
        await db.logAuditEvent('ORDER_STATUS_UPDATED', 'orders', id, { status, internalNotes });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  },

  updateOrderTracking: async (id: string, trackingInfo: { carrier: string, trackingNumber: string, trackingUrl: string }) => {
    try {
        await updateDoc(doc(firestore, "orders", id), { trackingInfo });
        await db.logAuditEvent('TRACKING_UPDATED', 'orders', id, trackingInfo);
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  },

  trashOrder: async (id: string) => {
    try {
        await updateDoc(doc(firestore, "orders", id), { isTrashed: true });
        await db.logAuditEvent('ORDER_TRASHED', 'orders', id, { isTrashed: true });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  },

  restoreOrder: async (id: string) => {
    try {
        await updateDoc(doc(firestore, "orders", id), { isTrashed: false });
        await db.logAuditEvent('ORDER_RESTORED', 'orders', id, { isTrashed: false });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  },

  updateOrderPaymentLink: async (id: string, link: string) => {
    try {
        await updateDoc(doc(firestore, "orders", id), { paymentLink: link });
        await db.logAuditEvent('PAYMENT_LINK_UPDATED', 'orders', id, { paymentLink: link });
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
        await db.logAuditEvent('PAYMENT_RECORDED', 'orders', id, {
            amount: data?.amount,
            method: data?.method,
            referenceId: data?.referenceId
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  },

  logAuditEvent: async (action: string, targetResource: string, targetId: string, details: any = {}, performedBy?: any) => {
    try {
        const currentUser = auth.currentUser;
        const performer = performedBy || {
            fullName: currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'System Client'),
            email: currentUser?.email || 'client@deuz.co',
            uid: currentUser?.uid || 'guest'
        };
        const safeDetails = details ? JSON.parse(JSON.stringify(details)) : {};
        const logData = {
            action,
            targetResource,
            targetId: String(targetId || ''),
            details: safeDetails,
            performedBy: performer,
            timestamp: new Date().toISOString(),
            createdAt: serverTimestamp()
        };
        await addDoc(collection(firestore, "audit_logs"), logData);
    } catch (logErr) {
        console.warn("Audit log notice:", logErr);
    }
  },

  logAuthEvent: async (params: {
    event: string;
    action?: string;
    email?: string;
    userId?: string;
    role?: string;
    provider?: string;
    status: 'success' | 'failed' | 'pending';
    failureReason?: string;
    message?: string;
    level?: 'info' | 'warn' | 'error' | 'security';
    details?: any;
  }) => {
    const timestamp = new Date().toISOString();
    const currentUser = auth.currentUser;
    const email = params.email || currentUser?.email || '';
    const userId = params.userId || (currentUser && !currentUser.isAnonymous ? currentUser.uid : 'anonymous');
    const provider = params.provider || 'firebase_auth';
    const role = params.role || (email === 'unk410066@gmail.com' || email === 'muhammadbinbasheer777@gmail.com' ? 'admin' : 'user');
    const status = params.status;
    const action = params.action || params.event.toUpperCase();

    // 1. Write to auth_logs collection on Firebase
    try {
      await addDoc(collection(firestore, "auth_logs"), {
        event: params.event,
        email,
        userId: String(userId),
        role,
        provider,
        status,
        failureReason: params.failureReason || null,
        timestamp,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn("Auth log write notice:", e);
    }

    // 2. Write to logs collection on Firebase
    try {
      await addDoc(collection(firestore, "logs"), {
        level: status === 'failed' ? 'warn' : (params.level || 'info'),
        category: 'auth',
        message: params.message || `${action}: ${email || 'guest'} [${status.toUpperCase()}]`,
        action,
        userId: String(userId),
        userEmail: email,
        metadata: { provider, status, failureReason: params.failureReason || null, ...params.details },
        timestamp,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn("Log write notice:", e);
    }

    // 3. Write to audit_logs collection on Firebase
    try {
      await addDoc(collection(firestore, "audit_logs"), {
        action,
        targetResource: 'users',
        targetId: String(userId || email || ''),
        details: { email, status, provider, failureReason: params.failureReason || null, ...params.details },
        performedBy: {
          fullName: currentUser?.displayName || (email ? email.split('@')[0] : 'System Client'),
          email: email || 'system@deuz.co',
          uid: String(userId || 'system')
        },
        timestamp,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn("Audit log notice:", e);
    }
  },

  getAuditLogs: async () => {
    try {
        const q = query(collection(firestore, "audit_logs"), orderBy("timestamp", "desc"), limit(100));
        const snap = await getDocs(q);
        if (!snap.empty) {
            return snap.docs.map(mapDoc);
        }
        // Fallback without ordering in case composite index is not yet built
        const fallbackQ = query(collection(firestore, "audit_logs"), limit(100));
        const fallbackSnap = await getDocs(fallbackQ);
        const list = fallbackSnap.docs.map(mapDoc);
        return list.sort((a: any, b: any) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime());
    } catch (error) {
        try {
            const fallbackQ = query(collection(firestore, "audit_logs"), limit(100));
            const fallbackSnap = await getDocs(fallbackQ);
            const list = fallbackSnap.docs.map(mapDoc);
            return list.sort((a: any, b: any) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime());
        } catch (err2) {
            handleFirestoreError(error, OperationType.LIST, 'audit_logs');
            return [];
        }
    }
  },

  getAuthLogs: async () => {
    try {
        const q = query(collection(firestore, "auth_logs"), orderBy("timestamp", "desc"), limit(100));
        const snap = await getDocs(q);
        if (!snap.empty) {
            return snap.docs.map(mapDoc);
        }
        const fallbackQ = query(collection(firestore, "auth_logs"), limit(100));
        const fallbackSnap = await getDocs(fallbackQ);
        const list = fallbackSnap.docs.map(mapDoc);
        return list.sort((a: any, b: any) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime());
    } catch (error) {
        try {
            const fallbackQ = query(collection(firestore, "auth_logs"), limit(100));
            const fallbackSnap = await getDocs(fallbackQ);
            const list = fallbackSnap.docs.map(mapDoc);
            return list.sort((a: any, b: any) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime());
        } catch (err2) {
            handleFirestoreError(error, OperationType.LIST, 'auth_logs');
            return [];
        }
    }
  },

  getSystemLogs: async () => {
    try {
        const q = query(collection(firestore, "logs"), orderBy("timestamp", "desc"), limit(100));
        const snap = await getDocs(q);
        if (!snap.empty) {
            return snap.docs.map(mapDoc);
        }
        const fallbackQ = query(collection(firestore, "logs"), limit(100));
        const fallbackSnap = await getDocs(fallbackQ);
        const list = fallbackSnap.docs.map(mapDoc);
        return list.sort((a: any, b: any) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime());
    } catch (error) {
        try {
            const fallbackQ = query(collection(firestore, "logs"), limit(100));
            const fallbackSnap = await getDocs(fallbackQ);
            const list = fallbackSnap.docs.map(mapDoc);
            return list.sort((a: any, b: any) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime());
        } catch (err2) {
            handleFirestoreError(error, OperationType.LIST, 'logs');
            return [];
        }
    }
  },

  getSystemSettings: async () => {
    try {
        const docRef = doc(firestore, "settings", "global_config");
        const snap = await getDoc(docRef);
        if (snap.exists()) return snap.data();
    } catch (error: any) {
        if (error?.message?.includes('offline') || error?.code === 'unavailable') {
            return FALLBACK_SETTINGS;
        }
        handleFirestoreError(error, OperationType.GET, 'settings/global_config');
    }
    return FALLBACK_SETTINGS;
  },

  updateSystemSettings: async (data: any) => {
    try {
        await setDoc(doc(firestore, "settings", "global_config"), { ...data, key: 'global_config' }, { merge: true });
        await db.logAuditEvent('SETTINGS_UPDATED', 'settings', 'global_config', {
            updatedKeys: Object.keys(data)
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'settings/global_config');
        throw error;
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
          await db.logAuditEvent('SYSTEM_BOOTSTRAPPED', 'users', userCredential.user.uid, { email, role: 'admin' });
          return { ...newAdmin, id: userCredential.user.uid, token: await userCredential.user.getIdToken() };
      } catch (error: any) {
          if (error.code === 'auth/email-already-in-use') {
             // Recover if user exists but data missing (e.g. partial setup)
             try {
                 const userCredential = await signInWithEmailAndPassword(auth, email, password);
                 await setDoc(doc(firestore, "users", userCredential.user.uid), { role: 'admin' }, { merge: true });
                 await db.logAuditEvent('ADMIN_PROMOTED', 'users', userCredential.user.uid, { email, role: 'admin' });
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
