
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
  runTransaction,
  onSnapshot
} from "firebase/firestore";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signInAnonymously,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateProfile,
  sendEmailVerification,
  updateEmail,
  deleteUser,
  applyActionCode,
  User as FirebaseUser
} from "firebase/auth";
import { auth, db as firestore } from "../src/config/firebase";
import { User, Order, CartItem, Address, OrderStatus, CustomerStage } from '../types';
import { storage } from './storage';
import { ADMIN_EMAIL, isExecutiveAdminEmail } from './securityVerification';

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
        // Sync local storage if active user is updated
        const current = storage.getUser();
        if (current && (current.id === userId || current._id === userId)) {
          storage.setUser({ ...current, ...safeData });
        }
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  },

  updateUserStage: async (userId: string, stage: CustomerStage) => {
    try {
      const userRef = doc(firestore, "users", userId);
      await updateDoc(userRef, { 
        stage,
        updatedAt: serverTimestamp() 
      });
      const current = storage.getUser();
      if (current && (current.id === userId || current._id === userId)) {
        storage.setUser({ ...current, stage });
      }
      await db.logAuditEvent('USER_STAGE_UPGRADED', 'users', userId, { stage, timestamp: new Date().toISOString() });
      return { success: true, stage };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      throw error;
    }
  },

  updateUserHouseCode: async (userId: string, rawCode: string) => {
    try {
      const cleanCode = rawCode.trim().toUpperCase();
      if (!cleanCode) {
        throw new Error('House Code cannot be empty.');
      }

      // Query if this house code is already assigned to another user in Firestore
      const usersRef = collection(firestore, "users");
      const qCode = query(usersRef, where("houseCode", "==", cleanCode));
      const snapCode = await getDocs(qCode);
      const isDuplicateCode = snapCode.docs.some(d => d.id !== userId);

      if (isDuplicateCode) {
        throw new Error(`House Code "${cleanCode}" is already assigned to another patron. Please choose a unique House Code.`);
      }

      const qId = query(usersRef, where("houseId", "==", cleanCode));
      const snapId = await getDocs(qId);
      const isDuplicateId = snapId.docs.some(d => d.id !== userId);

      if (isDuplicateId) {
        throw new Error(`House ID "${cleanCode}" is already assigned to another patron. Please choose a unique House Code.`);
      }

      const userRef = doc(firestore, "users", userId);
      await updateDoc(userRef, { 
        houseCode: cleanCode,
        houseId: cleanCode,
        updatedAt: serverTimestamp() 
      });

      // Update local cached user if active user is modified
      const current = storage.getUser();
      if (current && (current.id === userId || current._id === userId)) {
        storage.setUser({ ...current, houseCode: cleanCode, houseId: cleanCode });
      }

      await db.logAuditEvent('USER_HOUSE_CODE_ASSIGNED', 'users', userId, { 
        houseCode: cleanCode, 
        assignedBy: auth.currentUser?.email || 'admin',
        timestamp: new Date().toISOString() 
      });

      return { success: true, houseCode: cleanCode };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      throw error;
    }
  },

  loginUser: async (email: string, password: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail) {
      throw new Error('Please provide an email address.');
    }
    if (!password) {
      throw new Error('Please enter your password for secure authentication.');
    }

    const isAdminEmail = normalizedEmail === ADMIN_EMAIL;

    // Direct Firebase Authentication: strict validation against Firebase Auth.
    // When a password is changed, Firebase Auth is the single source of truth.
    // Old passwords are strictly rejected with auth/invalid-credential.
    try {
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
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
          await updateDoc(userRef, { 
            lastLoginAt: serverTimestamp(),
            ...(isAdminEmail ? { role: 'admin', fullName: userData.fullName || 'Muhammad Bin Basheer' } : {})
          });
        } else {
          userData = {
            fullName: isAdminEmail ? 'Muhammad Bin Basheer' : (user.displayName || normalizedEmail.split('@')[0]),
            email: normalizedEmail,
            role: isAdminEmail ? 'admin' : 'user',
            stage: 'initiative',
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

      // Log authentication success across Firebase audit collection
      await db.logAuthEvent({
        event: 'login_success',
        action: 'USER_LOGIN',
        email: normalizedEmail,
        userId: user.uid,
        role: isAdminEmail ? 'admin' : (userData?.role || 'user'),
        provider: 'firebase_email_password',
        status: 'success',
        message: `Session initialized for ${normalizedEmail} via Firebase Authentication`
      });

      const finalUser = {
        id: user.uid,
        _id: user.uid,
        email: normalizedEmail,
        fullName: isAdminEmail ? 'Muhammad Bin Basheer' : (userData?.fullName || user.displayName || normalizedEmail.split('@')[0]),
        mobile: userData?.mobile || '',
        role: isAdminEmail ? 'admin' : (userData?.role || 'user'),
        stage: userData?.stage || 'initiative',
        houseCode: userData?.houseCode || userData?.houseId || '',
        houseId: userData?.houseId || userData?.houseCode || '',
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
      const isAdminEmail = normalizedEmail === ADMIN_EMAIL;

      const userRef = doc(firestore, "users", user.uid);
      const userSnap = await getDoc(userRef);

      let userData: any;
      if (!userSnap.exists()) {
        userData = {
          fullName: user.displayName || 'Client Operative',
          email: normalizedEmail,
          role: isAdminEmail ? 'admin' : 'user',
          stage: 'initiative',
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
        stage: userData?.stage || 'initiative',
        houseCode: userData?.houseCode || userData?.houseId || '',
        houseId: userData?.houseId || userData?.houseCode || '',
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
    const normalizedEmail = (email || '').toLowerCase().trim();
    if (!normalizedEmail) return false;
    if (normalizedEmail === ADMIN_EMAIL.toLowerCase().trim()) return true;

    try {
      const q = query(collection(firestore, "users"), where("email", "==", normalizedEmail));
      const snap = await getDocs(q);
      if (!snap.empty) return true;

      // Fallback: check all docs case-insensitively
      const allDocs = await getDocs(collection(firestore, "users"));
      const match = allDocs.docs.some(doc => {
        const docEmail = (doc.data()?.email || '').toLowerCase().trim();
        return docEmail === normalizedEmail;
      });
      if (match) return true;

      // Check current session storage
      const cached = storage.getUser();
      if (cached && (cached.email || '').toLowerCase().trim() === normalizedEmail) {
        return true;
      }

      return false;
    } catch {
      const cached = storage.getUser();
      if (cached && (cached.email || '').toLowerCase().trim() === normalizedEmail) {
        return true;
      }
      return false; 
    }
  },

  registerUser: async (userData: any) => {
    const { email, password, fullName, mobile } = userData;
    const normalizedEmail = (email || '').toLowerCase().trim();
    const cleanFullName = (fullName || '').trim() || normalizedEmail.split('@')[0];
    const cleanMobile = (mobile || '').trim().slice(0, 20);
    const isAdminEmail = normalizedEmail === ADMIN_EMAIL;

    try {
      // 1. Primary: Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      const user = userCredential.user;

      if (cleanFullName) {
        try {
          await updateProfile(user, { displayName: cleanFullName });
        } catch (e) {}
      }

      // Automatically dispatch email verification
      try {
        await sendEmailVerification(user);
      } catch (e) {
        console.warn("Auto verification email dispatch notice:", e);
      }

      const token = await user.getIdToken();
      storage.setToken(token);

      // 2. Provision User Dossier in Cloud Firestore
      const newUserProfile = {
        id: user.uid,
        uid: user.uid,
        fullName: cleanFullName,
        displayName: cleanFullName,
        email: normalizedEmail,
        mobile: cleanMobile,
        role: isAdminEmail ? 'admin' : 'user',
        stage: 'initiative',
        addresses: [],
        emailVerified: user.emailVerified,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      };

      try {
        await setDoc(doc(firestore, "users", user.uid), newUserProfile);
      } catch (err) {
        console.warn("User dossier firestore sync notice:", err);
      }

      // 3. Log event across Firebase Console collections
      await db.logAuthEvent({
        event: 'signup_success',
        action: 'USER_REGISTERED',
        email: normalizedEmail,
        userId: user.uid,
        role: newUserProfile.role,
        provider: 'firebase_email_password',
        status: 'success',
        message: `New identity registered: ${normalizedEmail}`
      }).catch(() => {});

      const finalUser: User = {
        id: user.uid,
        _id: user.uid,
        fullName: cleanFullName,
        displayName: cleanFullName,
        email: normalizedEmail,
        mobile: cleanMobile,
        role: isAdminEmail ? 'admin' : 'user',
        stage: 'initiative',
        addresses: [],
        emailVerified: user.emailVerified,
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
      }).catch(() => {});
      throw error;
    }
  },

  resetPasswordWithFirebase: async (email: string): Promise<{ success: boolean; message: string; isNewUser?: boolean; sender?: string }> => {
    const normalizedEmail = (email || '').toLowerCase().trim();
    if (!normalizedEmail) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    try {
      // 1. Try sending password reset email with continue URL
      const continueUrl = typeof window !== 'undefined' && window.location?.origin
        ? `${window.location.origin}/?mode=resetPassword`
        : 'https://ais-dev-znj7fh45drqnif6slnr5iv-87346794639.asia-southeast1.run.app/?mode=resetPassword';

      try {
        await sendPasswordResetEmail(auth, normalizedEmail, {
          url: continueUrl,
          handleCodeInApp: true
        });
      } catch (settingsErr: any) {
        // If domain not allowlisted for continue URL, send standard reset email
        if (settingsErr.code === 'auth/unauthorized-continue-uri') {
          await sendPasswordResetEmail(auth, normalizedEmail);
        } else {
          throw settingsErr;
        }
      }

      await db.logAuthEvent({
        event: 'password_reset_sent',
        action: 'PASSWORD_RESET_REQUESTED',
        email: normalizedEmail,
        userId: 'anonymous',
        provider: 'email_auth',
        status: 'success',
        message: `Password reset link transmitted to ${normalizedEmail}`
      }).catch(() => {});

      return { 
        success: true, 
        message: `Password reset link dispatched to ${normalizedEmail}.`,
        sender: 'noreply@gen-lang-client-0255030909.firebaseapp.com'
      };
    } catch (err: any) {
      let message = err.message || 'Password recovery failed.';
      let isNewUser = false;
      if (err.code === 'auth/user-not-found') {
        message = 'No registered account found for this email address. Please register first.';
        isNewUser = true;
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many requests. Please wait a moment before trying again.';
      }
      await db.logAuthEvent({
        event: 'password_reset_failure',
        action: 'PASSWORD_RESET_FAILED',
        email: normalizedEmail,
        userId: 'anonymous',
        provider: 'email_auth',
        status: 'failed',
        failureReason: message
      }).catch(() => {});
      return { success: false, isNewUser, message };
    }
  },

  verifyPasswordResetCodeWithFirebase: async (oobCode: string): Promise<{ success: boolean; email?: string; message?: string }> => {
    let cleanCode = (oobCode || '').trim();
    if (cleanCode.includes('oobCode=')) {
      const match = cleanCode.match(/[?&]oobCode=([^&#]+)/);
      if (match && match[1]) cleanCode = decodeURIComponent(match[1]);
    }
    try {
      const email = await verifyPasswordResetCode(auth, cleanCode);
      return { success: true, email };
    } catch (err: any) {
      let message = 'The recovery code is invalid or has expired.';
      if (err.code === 'auth/expired-action-code') {
        message = 'The recovery link has expired. Please request a new recovery link.';
      } else if (err.code === 'auth/invalid-action-code') {
        message = 'The recovery code is invalid or has already been used.';
      } else if (err.code === 'auth/user-disabled') {
        message = 'This user account has been disabled.';
      }
      return { success: false, message };
    }
  },

  confirmPasswordResetWithFirebase: async (oobCode: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    let code = (oobCode || '').trim();
    if (code.includes('oobCode=')) {
      const match = code.match(/[?&]oobCode=([^&#]+)/);
      if (match && match[1]) code = decodeURIComponent(match[1]);
    }
    if (!code) {
      return { success: false, message: 'Recovery code or link is required.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'New password must contain at least 6 characters.' };
    }

    try {
      await confirmPasswordReset(auth, code, newPassword);
      await db.logAuthEvent({
        event: 'password_reset_confirmed',
        action: 'PASSWORD_RESET_CONFIRMED',
        email: 'confirmed_user',
        userId: 'anonymous',
        provider: 'email_auth',
        status: 'success',
        message: 'Password successfully updated via recovery code'
      }).catch(() => {});

      return {
        success: true,
        message: 'Password updated successfully. You can now sign in with your new credentials.'
      };
    } catch (err: any) {
      let message = err.message || 'Failed to reset password.';
      if (err.code === 'auth/expired-action-code') {
        message = 'The recovery code has expired. Please request a new recovery link.';
      } else if (err.code === 'auth/invalid-action-code') {
        message = 'The recovery code is invalid or has already been used.';
      } else if (err.code === 'auth/weak-password') {
        message = 'New password is too weak. Please use at least 6 characters.';
      }
      await db.logAuthEvent({
        event: 'password_reset_confirm_failed',
        action: 'PASSWORD_RESET_CONFIRM_FAILED',
        email: 'unknown',
        userId: 'anonymous',
        provider: 'email_auth',
        status: 'failed',
        failureReason: message
      }).catch(() => {});
      return { success: false, message };
    }
  },

  updateCurrentUserPassword: async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.isAnonymous) {
      return { success: false, message: 'You must be signed in to change your password.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'New password must contain at least 6 characters.' };
    }

    try {
      if (currentUser.email && currentPassword) {
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
      }

      await updatePassword(currentUser, newPassword);
      try {
        const refreshedToken = await currentUser.getIdToken(true);
        storage.setToken(refreshedToken);
      } catch (tokenErr) {
        console.debug('Token refresh notice:', tokenErr);
      }
      await db.logAuthEvent({
        event: 'password_changed',
        action: 'USER_PASSWORD_CHANGED',
        email: currentUser.email || 'user',
        userId: currentUser.uid,
        provider: 'email_auth',
        status: 'success',
        message: `Password changed successfully for ${currentUser.email}`
      }).catch(() => {});

      return { success: true, message: 'Your password has been successfully updated.' };
    } catch (err: any) {
      let message = err.message || 'Failed to update password.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Current password is incorrect.';
      } else if (err.code === 'auth/weak-password') {
        message = 'New password must contain at least 6 characters.';
      } else if (err.code === 'auth/requires-recent-login') {
        message = 'For security reasons, please re-authenticate before changing your password.';
      }
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

  sendVerificationEmail: async (): Promise<{ success: boolean; message: string }> => {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.isAnonymous) {
      return { success: false, message: 'You must be signed in to request email verification.' };
    }
    try {
      await sendEmailVerification(currentUser);
      await db.logAuthEvent({
        event: 'email_verification_sent',
        action: 'EMAIL_VERIFICATION_SENT',
        email: currentUser.email || 'user',
        userId: currentUser.uid,
        provider: 'email_auth',
        status: 'success',
        message: `Verification email transmitted to ${currentUser.email}`
      }).catch(() => {});
      return { success: true, message: `Verification email dispatched to ${currentUser.email}. Please inspect your inbox.` };
    } catch (err: any) {
      let message = err.message || 'Failed to dispatch verification email.';
      if (err.code === 'auth/too-many-requests') {
        message = 'Too many requests. Please wait a moment before requesting another verification email.';
      }
      return { success: false, message };
    }
  },

  updateCurrentAuthProfile: async (profileData: { displayName?: string; photoURL?: string; fullName?: string; mobile?: string }): Promise<{ success: boolean; message: string; user?: User }> => {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.isAnonymous) {
      return { success: false, message: 'You must be signed in to update your profile.' };
    }
    try {
      const updateObj: { displayName?: string; photoURL?: string } = {};
      if (profileData.displayName !== undefined) updateObj.displayName = profileData.displayName;
      if (profileData.fullName !== undefined) updateObj.displayName = profileData.fullName;
      if (profileData.photoURL !== undefined) updateObj.photoURL = profileData.photoURL;

      await updateProfile(currentUser, updateObj);

      const userDocRef = doc(firestore, "users", currentUser.uid);
      const firestoreUpdates: any = { updatedAt: serverTimestamp() };
      if (profileData.fullName || profileData.displayName) {
        firestoreUpdates.fullName = profileData.fullName || profileData.displayName;
      }
      if (profileData.photoURL) firestoreUpdates.photoURL = profileData.photoURL;
      if (profileData.mobile) firestoreUpdates.mobile = profileData.mobile;

      await updateDoc(userDocRef, firestoreUpdates).catch(() => {});

      const cached = storage.getUser() || {} as User;
      const updatedUser: User = {
        ...cached,
        fullName: profileData.fullName || profileData.displayName || cached.fullName,
        displayName: profileData.displayName || profileData.fullName || cached.displayName,
        photoURL: profileData.photoURL || cached.photoURL,
        mobile: profileData.mobile || cached.mobile,
        emailVerified: currentUser.emailVerified
      };
      storage.setUser(updatedUser);

      return { success: true, message: 'Profile updated successfully.', user: updatedUser };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to update profile.' };
    }
  },

  updateUserEmail: async (newEmail: string, currentPassword?: string): Promise<{ success: boolean; message: string }> => {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.isAnonymous) {
      return { success: false, message: 'You must be signed in to update your email.' };
    }
    const normalizedEmail = (newEmail || '').toLowerCase().trim();
    if (!normalizedEmail) {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    try {
      if (currentPassword && currentUser.email) {
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
      }
      await updateEmail(currentUser, normalizedEmail);

      const userDocRef = doc(firestore, "users", currentUser.uid);
      await updateDoc(userDocRef, { email: normalizedEmail, updatedAt: serverTimestamp() }).catch(() => {});

      const cached = storage.getUser();
      if (cached) {
        storage.setUser({ ...cached, email: normalizedEmail });
      }
      return { success: true, message: 'Email address updated successfully.' };
    } catch (err: any) {
      let message = err.message || 'Failed to update email address.';
      if (err.code === 'auth/requires-recent-login') {
        message = 'For security reasons, please provide your current password before changing your email.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'This email address is already in use by another account.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Invalid email address provided.';
      }
      return { success: false, message };
    }
  },

  deleteCurrentUserAccount: async (currentPassword?: string): Promise<{ success: boolean; message: string }> => {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.isAnonymous) {
      return { success: false, message: 'You must be signed in to delete your account.' };
    }
    const uid = currentUser.uid;
    const email = currentUser.email || 'user';
    try {
      if (currentPassword && currentUser.email) {
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
      }
      await deleteDoc(doc(firestore, "users", uid)).catch(() => {});
      await deleteUser(currentUser);
      storage.removeToken();
      storage.removeUser();
      await db.logAuthEvent({
        event: 'account_deleted',
        action: 'USER_ACCOUNT_DELETED',
        email,
        userId: uid,
        provider: 'email_auth',
        status: 'success',
        message: `Account deleted: ${email}`
      }).catch(() => {});
      return { success: true, message: 'Your dossier and credentials have been permanently deleted.' };
    } catch (err: any) {
      let message = err.message || 'Failed to delete account.';
      if (err.code === 'auth/requires-recent-login') {
        message = 'Security protocol: please re-authenticate with your password before deleting your account.';
      }
      return { success: false, message };
    }
  },

  /**
   * Admin method to permanently remove a user record/dossier from Firestore.
   */
  deleteUserByAdmin: async (userId: string, targetEmail?: string): Promise<{ success: boolean; message: string }> => {
    if (!userId) {
      return { success: false, message: 'Invalid user identifier.' };
    }
    try {
      await deleteDoc(doc(firestore, "users", userId));
      await db.logAuditEvent(
        'ADMIN_REMOVED_USER_DOSSIER',
        'users',
        userId,
        {
          targetEmail: targetEmail || 'unknown',
          removedBy: auth.currentUser?.email || 'executive_admin',
          timestamp: new Date().toISOString()
        }
      ).catch(() => {});
      return { success: true, message: `User dossier removed from archives.` };
    } catch (err: any) {
      console.error('Error removing user:', err);
      return { success: false, message: err.message || 'Failed to remove user.' };
    }
  },

  getCurrentUser: async () => {
    // Check cached user in storage
    const cached = storage.getUser();
    if (cached) return cached;

    // Check Firebase Auth
    const currentUser = auth.currentUser;
    if (currentUser && !currentUser.isAnonymous) {
      try {
        const userDoc = await getDoc(doc(firestore, "users", currentUser.uid));
        if (userDoc.exists()) {
          const u = { 
            ...userDoc.data(), 
            id: userDoc.id, 
            _id: userDoc.id,
            displayName: currentUser.displayName || userDoc.data().fullName,
            photoURL: currentUser.photoURL || userDoc.data().photoURL,
            emailVerified: currentUser.emailVerified
          } as User;
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
        if (error?.message?.includes('offline') || error?.code === 'unavailable') {
            return INITIAL_PRODUCTS.map((p, idx) => ({ ...p, id: `seed_${idx}`, _id: `seed_${idx}` }));
        }
        handleFirestoreError(error, OperationType.LIST, 'products');
        return INITIAL_PRODUCTS.map((p, idx) => ({ ...p, id: `seed_${idx}`, _id: `seed_${idx}` }));
    }
  },

  subscribeProducts: (callback: (products: any[]) => void) => {
    try {
      const q = query(collection(firestore, "products"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        if (!querySnapshot.empty) {
          const prods = querySnapshot.docs.map(mapDoc);
          callback(prods);
        } else {
          // If empty in Firestore, fetch or fallback
          db.getProducts().then(callback);
        }
      }, (error) => {
        console.warn("Product live subscription error, falling back to static:", error);
        db.getProducts().then(callback);
      });
      return unsubscribe;
    } catch (err) {
      console.warn("Could not attach products snapshot listener:", err);
      db.getProducts().then(callback);
      return () => {};
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

  // --- WISHLIST / FAVOURITES ---

  getWishlist: async (userId?: string): Promise<any[]> => {
    const user = auth.currentUser;
    const uid = userId || user?.uid;
    const localItems = storage.getWishlist();
    if (!uid) return localItems;
    
    try {
      const snap = await getDoc(doc(firestore, "wishlists", uid));
      if (snap.exists() && Array.isArray(snap.data().items)) {
        const firestoreItems = snap.data().items;
        // Merge with any local items if not present
        const merged = [...firestoreItems];
        for (const loc of localItems) {
          if (!merged.some(m => m.id === loc.id)) {
            merged.push(loc);
          }
        }
        storage.setWishlist(merged);
        return merged;
      }
      return localItems;
    } catch (error) {
      console.warn("Error fetching wishlist from Firestore, falling back to local:", error);
      return localItems;
    }
  },

  saveWishlist: async (userIdOrItems: any, maybeItems?: any[]) => {
    let uid = auth.currentUser?.uid;
    let items: any[] = [];
    if (Array.isArray(userIdOrItems)) {
      items = userIdOrItems;
    } else if (typeof userIdOrItems === 'string' && Array.isArray(maybeItems)) {
      uid = userIdOrItems;
      items = maybeItems;
    }
    storage.setWishlist(items);
    if (!uid) return;
    
    try {
      await setDoc(doc(firestore, "wishlists", uid), {
        user: uid,
        items,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.warn("Could not sync wishlist to Firestore:", error);
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

        // Generate unique purchase code strictly formatted as DEUZ-TIME-DDMMYY
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        const time = `${hh}${min}${ss}`;
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yy = String(now.getFullYear()).slice(-2);
        const ddmmyy = `${dd}${mm}${yy}`;
        
        // Use client-generated code if it already follows DEUZ-TIME-DDMMYY, otherwise create fresh
        const conciergeCode = (data.orderCode && data.orderCode.startsWith('DEUZ-')) 
            ? data.orderCode 
            : `DEUZ-${time}-${ddmmyy}`;

        const localUser = storage.getUser();
        const effectiveUid = user ? user.uid : (localUser ? localUser.id : null);
        const effectiveEmail = address?.email || user?.email || (localUser ? localUser.email : null);

        const orderData = {
            user: effectiveUid || null,
            conciergeCode, 
            items,
            shippingAddress: address,
            totalAmount: total,
            contactMethod: contactMethod || data.contactMethod || 'private',
            preferredContactMethod: data.preferredContactMethod || null,
            clientEmail: effectiveEmail || null,
            clientMobile: address?.mobile || null,
            paymentStatus: 'Pending',
            orderStatus: 'ORDER_SECURED',
            createdAt: serverTimestamp(),
            statusHistory: [{
                status: 'ORDER_SECURED',
                timestamp: new Date().toISOString(),
                changedBy: user ? user.uid : (localUser ? localUser.fullName || 'Client' : 'Guest')
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

        const fullConfirmedOrder = {
            ...orderData,
            id: conciergeCode,
            _id: conciergeCode,
            code: conciergeCode,
            conciergeCode,
            createdAt: new Date().toISOString()
        };
        storage.saveConfirmedOrder(fullConfirmedOrder);
        storage.saveOrderCode(conciergeCode);

        return {
            success: true,
            orderId: conciergeCode,
            orderCode: conciergeCode,
            order: fullConfirmedOrder,
            message: 'Dossier Registered'
        };
    } catch (error: any) {
        // Fallback local storage guarantee so client never loses their confirmed dossier
        const fallbackOrder = {
            id: data.orderCode || `DEUZ-${Date.now()}`,
            conciergeCode: data.orderCode || `DEUZ-${Date.now()}`,
            code: data.orderCode || `DEUZ-${Date.now()}`,
            items,
            shippingAddress: address,
            totalAmount: total,
            total,
            contactMethod: contactMethod || data.contactMethod || 'private',
            orderStatus: 'ORDER_SECURED',
            paymentStatus: 'Pending',
            createdAt: new Date().toISOString()
        };
        storage.saveConfirmedOrder(fallbackOrder);
        if (data.orderCode) storage.saveOrderCode(data.orderCode);

        try {
          handleFirestoreError(error, OperationType.CREATE, 'orders');
        } catch (loggedErr) {
          console.warn("Firestore sync warning on order creation, continuing with local dossier:", loggedErr);
        }

        return {
            success: true,
            orderId: fallbackOrder.conciergeCode,
            orderCode: fallbackOrder.conciergeCode,
            order: fallbackOrder,
            message: 'Dossier Registered Locally'
        };
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
        const docRef = doc(firestore, "orders", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            await updateDoc(docRef, { contactMethod: channel });
        } else {
            const q = query(collection(firestore, "orders"), where("conciergeCode", "==", id));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                await updateDoc(snapshot.docs[0].ref, { contactMethod: channel });
            }
        }
        await db.logAuditEvent('CHANNEL_UPDATED', 'orders', id, { contactMethod: channel });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  },

  updateOrderNotes: async (id: string, notes: string) => {
    try {
        const docRef = doc(firestore, "orders", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            await updateDoc(docRef, { internalNotes: notes });
        } else {
            const q = query(collection(firestore, "orders"), where("conciergeCode", "==", id));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                await updateDoc(snapshot.docs[0].ref, { internalNotes: notes });
            }
        }
        await db.logAuditEvent('ORDER_NOTES_UPDATED', 'orders', id, { notes });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  },

  trackOrder: async (code: string) => {
    if (!code) throw new Error("Allocation code required");
    const cleanCode = code.trim();

    // 1. Check local storage cache first for instant retrieval
    const localCached = storage.getConfirmedOrderByCode(cleanCode);

    try {
        const docRef = doc(firestore, "orders", cleanCode);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const mapped = mapDoc(docSnap);
            storage.saveConfirmedOrder(mapped);
            return mapped;
        }
        
        // Fallback to query if it was created with auto-id previously
        const q = query(collection(firestore, "orders"), where("conciergeCode", "==", cleanCode));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            const mapped = mapDoc(snapshot.docs[0]);
            storage.saveConfirmedOrder(mapped);
            return mapped;
        }

        if (localCached) return localCached;
        
        throw new Error("Dossier not found");
    } catch (error: any) {
        if (localCached) return localCached;
        if (error.message === "Dossier not found") throw error;
        handleFirestoreError(error, OperationType.GET, `orders/${cleanCode}`);
        throw error;
    }
  },

  subscribeOrder: (code: string, callback: (order: any) => void) => {
    if (!code) return () => {};
    const cleanCode = code.trim();

    // Check local storage first for immediate rendering
    const localOrder = storage.getConfirmedOrderByCode(cleanCode);
    if (localOrder) {
      callback(localOrder);
    }

    const unsubscribers: (() => void)[] = [];

    try {
      const docRef = doc(firestore, "orders", cleanCode);
      const unsubscribeDoc = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const mapped = mapDoc(snap);
          storage.saveConfirmedOrder(mapped);
          callback(mapped);
        } else {
          // Fallback query if code is stored in conciergeCode
          const q = query(collection(firestore, "orders"), where("conciergeCode", "==", cleanCode));
          getDocs(q).then(snapshot => {
            if (!snapshot.empty) {
              const mapped = mapDoc(snapshot.docs[0]);
              storage.saveConfirmedOrder(mapped);
              callback(mapped);
            }
          }).catch(console.error);
        }
      }, (err) => {
        console.warn("Order snapshot error, falling back to one-time fetch:", err);
        db.trackOrder(cleanCode).then(callback).catch(() => {});
      });
      unsubscribers.push(unsubscribeDoc);

      // Real-time query listener for conciergeCode
      const q = query(collection(firestore, "orders"), where("conciergeCode", "==", cleanCode));
      const unsubscribeQuery = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const mapped = mapDoc(snapshot.docs[0]);
          storage.saveConfirmedOrder(mapped);
          callback(mapped);
        }
      }, (err) => {
        console.warn("Order query listener error:", err);
      });
      unsubscribers.push(unsubscribeQuery);
    } catch (error) {
      db.trackOrder(cleanCode).then(callback).catch(() => {});
    }

    // Local intra-browser sync event listener
    const handleLocalSync = (e: any) => {
      const detail = e.detail;
      if (!detail || detail.orderId === cleanCode || detail.orderId === localOrder?.id || detail.orderId === localOrder?._id) {
        db.trackOrder(cleanCode).then(callback).catch(() => {
          const updated = storage.getConfirmedOrderByCode(cleanCode);
          if (updated) callback(updated);
        });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('deuz_order_status_sync', handleLocalSync);
      window.addEventListener('storage', handleLocalSync);
      unsubscribers.push(() => {
        window.removeEventListener('deuz_order_status_sync', handleLocalSync);
        window.removeEventListener('storage', handleLocalSync);
      });
    }

    return () => {
      unsubscribers.forEach(unsub => {
        try { unsub(); } catch (_) {}
      });
    };
  },

  getMyOrders: async () => {
    const user = auth.currentUser;
    const localUser = storage.getUser();
    const localConfirmed = storage.getConfirmedOrders();
    const orderCodes = storage.getOrderCodes();

    const ordersMap = new Map<string, any>();

    // 1. Preload locally confirmed orders
    for (const order of localConfirmed) {
      const key = order.conciergeCode || order.code || order.orderCode || order.id || order._id;
      if (key) {
        ordersMap.set(key, order);
      }
    }

    try {
      const fetchedDocs: any[] = [];
      const effectiveUid = user?.uid || localUser?.id;
      const effectiveEmail = user?.email || localUser?.email;

      // 2. Query Firestore by UID
      if (effectiveUid) {
        try {
          const qUid = query(collection(firestore, "orders"), where("user", "==", effectiveUid));
          const snapshotUid = await getDocs(qUid);
          snapshotUid.docs.forEach(d => fetchedDocs.push(mapDoc(d)));
        } catch (e) {
          console.warn("UID order query error:", e);
        }
      }

      // 3. Query Firestore by Client Email
      if (effectiveEmail) {
        try {
          const qEmail = query(collection(firestore, "orders"), where("clientEmail", "==", effectiveEmail));
          const snapshotEmail = await getDocs(qEmail);
          snapshotEmail.docs.forEach(d => fetchedDocs.push(mapDoc(d)));
        } catch (e) {
          console.warn("Email order query error:", e);
        }
      }

      // 4. Query individual order codes stored locally
      for (const code of orderCodes) {
        if (code && !ordersMap.has(code)) {
          try {
            const docRef = doc(firestore, "orders", code);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              fetchedDocs.push(mapDoc(docSnap));
            }
          } catch (e) {
            // Silently proceed
          }
        }
      }

      // 5. Merge fetched docs and update local cache
      for (const order of fetchedDocs) {
        const key = order.conciergeCode || order.code || order.orderCode || order.id || order._id;
        if (key) {
          ordersMap.set(key, order);
          storage.saveConfirmedOrder(order);
        }
      }
    } catch (error) {
      console.warn("Firestore getMyOrders warning:", error);
    }

    const allOrders = Array.from(ordersMap.values());

    // Sort descending by createdAt
    return allOrders.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt || 0)).getTime();
      const dateB = new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt || 0)).getTime();
      return dateB - dateA;
    });
  },

  subscribeMyOrders: (callback: (orders: any[]) => void) => {
    // 1. Immediately emit locally cached confirmed orders
    const initialOrders = storage.getConfirmedOrders();
    if (initialOrders && initialOrders.length > 0) {
      callback(initialOrders);
    }

    const unsubscribers: (() => void)[] = [];

    const refreshAndEmit = async () => {
      try {
        const freshOrders = await db.getMyOrders();
        callback(freshOrders);
      } catch (err) {
        const fallback = storage.getConfirmedOrders();
        callback(fallback);
      }
    };

    // Initial load
    refreshAndEmit();

    // 2. Real-time Firestore listeners
    try {
      const qAll = query(collection(firestore, "orders"));
      const unsubCollection = onSnapshot(qAll, (snapshot) => {
        const user = auth.currentUser;
        const localUser = storage.getUser();
        const effectiveUid = user?.uid || localUser?.id;
        const userEmail = (user?.email || localUser?.email || '').toLowerCase().trim();
        const knownCodes = new Set<string>();
        storage.getConfirmedOrders().forEach(o => {
          const c = o.conciergeCode || o.code || o.orderCode || o.id || o._id;
          if (c) knownCodes.add(c);
        });
        storage.getOrderCodes().forEach(c => {
          if (c) knownCodes.add(c);
        });

        // Filter and update orders relevant to this user
        snapshot.docs.forEach(docSnap => {
          const order = mapDoc(docSnap);
          const orderUser = order.user;
          const clientEmail = (order.clientEmail || order.shippingAddress?.email || '').toLowerCase().trim();
          const orderCode = order.conciergeCode || order.code || order.orderCode || order.id || order._id;

          const isUserOrder = 
            (effectiveUid && orderUser === effectiveUid) ||
            (userEmail && clientEmail && clientEmail === userEmail) ||
            (orderCode && knownCodes.has(orderCode)) ||
            knownCodes.has(docSnap.id);

          if (isUserOrder) {
            storage.saveConfirmedOrder(order);
          }
        });

        refreshAndEmit();
      }, (err) => {
        console.warn("Orders collection live listener warning:", err);
      });

      unsubscribers.push(unsubCollection);
    } catch (e) {
      console.warn("Failed to attach collection listener:", e);
    }

    // 3. Listen for local window sync events (e.g. if updated in current window or other tabs)
    const handleLocalSync = () => {
      refreshAndEmit();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('deuz_order_status_sync', handleLocalSync);
      window.addEventListener('storage', handleLocalSync);
      unsubscribers.push(() => {
        window.removeEventListener('deuz_order_status_sync', handleLocalSync);
        window.removeEventListener('storage', handleLocalSync);
      });
    }

    return () => {
      unsubscribers.forEach(unsub => {
        try { unsub(); } catch (_) {}
      });
    };
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

        // Update local storage cache
        const local = storage.getConfirmedOrderByCode(orderId);
        if (local) {
            storage.saveConfirmedOrder({ ...local, orderStatus: 'CANCELLED', internalNotes: `Cancelled: ${reason}` });
        }
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('deuz_order_status_sync', {
                detail: { orderId, status: 'CANCELLED' }
            }));
        }

        await db.logAuditEvent('ORDER_CANCELLED', 'orders', orderId, { reason });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  },

  // --- ADMIN ---

  getAllOrders: async () => {
    try {
        try {
          const q = query(collection(firestore, "orders"), orderBy("createdAt", "desc"));
          const snapshot = await getDocs(q);
          return snapshot.docs.map(mapDoc);
        } catch (orderErr) {
          // Fallback if index on createdAt desc isn't created yet
          const qFallback = query(collection(firestore, "orders"));
          const snapshot = await getDocs(qFallback);
          const list = snapshot.docs.map(mapDoc);
          list.sort((a, b) => {
            const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (new Date(a.createdAt || 0).getTime());
            const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (new Date(b.createdAt || 0).getTime());
            return tB - tA;
          });
          return list;
        }
    } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'orders');
        return [];
    }
  },

  subscribeOrders: (callback: (orders: any[]) => void) => {
    try {
      const q = query(collection(firestore, "orders"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(mapDoc);
        list.sort((a, b) => {
          const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (new Date(a.createdAt || 0).getTime());
          const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (new Date(b.createdAt || 0).getTime());
          return tB - tA;
        });
        callback(list);
      }, (err) => {
        console.warn("Orders live listener warning:", err);
        db.getAllOrders().then(callback);
      });
      return unsubscribe;
    } catch (e) {
      db.getAllOrders().then(callback);
      return () => {};
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

  subscribeUsers: (callback: (users: any[]) => void) => {
    try {
      const q = query(collection(firestore, "users"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(mapDoc);
        callback(list);
      }, (err) => {
        console.warn("Users live listener warning:", err);
        db.getUsers().then(callback);
      });
      return unsubscribe;
    } catch (e) {
      db.getUsers().then(callback);
      return () => {};
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
        const data: any = { 
            orderStatus: status,
            updatedAt: new Date().toISOString()
        };
        if (internalNotes !== undefined) data.internalNotes = internalNotes;

        const docRef = doc(firestore, "orders", id);
        const snap = await getDoc(docRef);
        let updatedDocData: any = null;

        if (snap.exists()) {
            const existingHistory = snap.data().statusHistory || [];
            data.statusHistory = [
                ...existingHistory,
                {
                    status,
                    timestamp: new Date().toISOString(),
                    changedBy: 'Executive Atelier Desk'
                }
            ];
            await updateDoc(docRef, data);
            updatedDocData = { ...snap.data(), ...data, id: snap.id, _id: snap.id, conciergeCode: snap.data().conciergeCode || snap.id };
        } else {
            const q = query(collection(firestore, "orders"), where("conciergeCode", "==", id));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const existingHistory = snapshot.docs[0].data().statusHistory || [];
                data.statusHistory = [
                    ...existingHistory,
                    {
                        status,
                        timestamp: new Date().toISOString(),
                        changedBy: 'Executive Atelier Desk'
                    }
                ];
                await updateDoc(snapshot.docs[0].ref, data);
                updatedDocData = { ...snapshot.docs[0].data(), ...data, id: snapshot.docs[0].id, _id: snapshot.docs[0].id, conciergeCode: snapshot.docs[0].data().conciergeCode || snapshot.docs[0].id };
            }
        }

        // Keep local cache perfectly synchronized
        if (updatedDocData) {
            storage.saveConfirmedOrder(updatedDocData);
        } else {
            const local = storage.getConfirmedOrderByCode(id);
            if (local) {
                storage.saveConfirmedOrder({ 
                    ...local, 
                    orderStatus: status as any, 
                    ...(internalNotes !== undefined ? { internalNotes } : {}) 
                });
            }
        }

        // Instant notification to any listening component in this or other tabs
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('deuz_order_status_sync', {
                detail: { orderId: id, status, internalNotes }
            }));
        }

        await db.logAuditEvent('ORDER_STATUS_UPDATED', 'orders', id, { status, internalNotes });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  },

  updateOrderTracking: async (id: string, trackingInfo: { carrier: string, trackingNumber: string, trackingUrl: string }) => {
    try {
        const docRef = doc(firestore, "orders", id);
        const snap = await getDoc(docRef);
        let updatedDocData: any = null;

        if (snap.exists()) {
            await updateDoc(docRef, { trackingInfo });
            updatedDocData = { ...snap.data(), trackingInfo, id: snap.id, _id: snap.id };
        } else {
            const q = query(collection(firestore, "orders"), where("conciergeCode", "==", id));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                await updateDoc(snapshot.docs[0].ref, { trackingInfo });
                updatedDocData = { ...snapshot.docs[0].data(), trackingInfo, id: snapshot.docs[0].id, _id: snapshot.docs[0].id };
            }
        }

        if (updatedDocData) {
            storage.saveConfirmedOrder(updatedDocData);
        }
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('deuz_order_status_sync', {
                detail: { orderId: id, trackingInfo }
            }));
        }

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
    const role = params.role || (email === ADMIN_EMAIL ? 'admin' : 'user');
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
  },

  // --- PRIVATE CONCIERGE ATELIER APPOINTMENTS ---

  submitAppointment: async (data: any) => {
    try {
      const code = data.code || `CNCG-${Math.floor(1000 + Math.random() * 9000)}`;
      const appointmentDoc = {
        code,
        name: data.name || 'Anonymous Client',
        email: data.email,
        phone: data.phone || '',
        consultationType: data.consultationType || 'Private Salon Fitting',
        location: data.location || 'Mumbai — Bandra Kurla & Colaba',
        datePreference: data.datePreference || '',
        notes: data.notes || '',
        status: data.status || 'PENDING',
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(firestore, "appointments"), appointmentDoc);
      await db.logAuditEvent('APPOINTMENT_SUBMITTED', 'appointments', docRef.id, {
        code,
        name: appointmentDoc.name,
        consultationType: appointmentDoc.consultationType,
        location: appointmentDoc.location
      });
      return { ...appointmentDoc, id: docRef.id, _id: docRef.id };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'appointments');
      throw error;
    }
  },

  getAppointments: async () => {
    try {
      const q = query(collection(firestore, "appointments"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(mapDoc);
    } catch (error) {
      // Fallback query without ordering if index is missing
      try {
        const q2 = query(collection(firestore, "appointments"));
        const snap = await getDocs(q2);
        return snap.docs.map(mapDoc);
      } catch (err2) {
        handleFirestoreError(error, OperationType.LIST, 'appointments');
        return [];
      }
    }
  },

  subscribeAppointments: (callback: (appointments: any[]) => void) => {
    try {
      const q = query(collection(firestore, "appointments"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(mapDoc);
        // Sort in memory by createdAt descending
        list.sort((a, b) => {
          const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (new Date(a.createdAt || 0).getTime());
          const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (new Date(b.createdAt || 0).getTime());
          return tB - tA;
        });
        callback(list);
      }, (err) => {
        console.warn("Appointments listener warning:", err);
        db.getAppointments().then(callback);
      });
      return unsubscribe;
    } catch (e) {
      db.getAppointments().then(callback);
      return () => {};
    }
  },

  updateAppointmentStatus: async (id: string, status: string) => {
    try {
      await updateDoc(doc(firestore, "appointments", id), { status });
      await db.logAuditEvent('APPOINTMENT_STATUS_UPDATED', 'appointments', id, { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appointments/${id}`);
      throw error;
    }
  },

  deleteAppointment: async (id: string) => {
    try {
      await deleteDoc(doc(firestore, "appointments", id));
      await db.logAuditEvent('APPOINTMENT_DELETED', 'appointments', id, { id });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `appointments/${id}`);
      throw error;
    }
  },

  getAppointmentByCode: async (code: string) => {
    try {
      const q = query(collection(firestore, "appointments"), where("code", "==", code.trim().toUpperCase()), limit(1));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return mapDoc(snapshot.docs[0]);
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `appointments/code_${code}`);
      return null;
    }
  }
};
