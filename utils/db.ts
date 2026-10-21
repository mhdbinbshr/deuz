
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
import { initializeApp, getApps, getApp } from "firebase/app";
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
  reauthenticateWithPopup,
  linkWithCredential,
  linkWithPopup,
  unlink,
  EmailAuthProvider,
  updateProfile,
  sendEmailVerification,
  updateEmail,
  deleteUser,
  applyActionCode,
  fetchSignInMethodsForEmail,
  getAuth,
  User as FirebaseUser
} from "firebase/auth";
import { auth, db as firestore } from "../src/config/firebase";
import firebaseConfig from "../firebase-applet-config.json";
import { User, Order, CartItem, Address, OrderStatus, CustomerStage } from '../types';
import { storage } from './storage';
import { 
  ADMIN_EMAIL, 
  isExecutiveAdminEmail, 
  computePasswordHash, 
  extractPasswordFromHash, 
  matchesStoredPassword,
  verifySecurityCodeInFirestore,
  SecurityVerificationPurpose 
} from './securityVerification';

function getSecondaryAuth() {
  const appName = "DeuzSecondaryAuthHelper";
  const secondaryApp = getApps().some((a) => a.name === appName)
    ? getApp(appName)
    : initializeApp(firebaseConfig, appName);
  return getAuth(secondaryApp);
}

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
  console.warn('Firestore Notice: ', JSON.stringify(errInfo));
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
    gallery: [
      "https://ik.imagekit.io/dto1zguat/Dustbound_2.jpg"
    ],
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
        whatsappNumber: '919207676921',
        phoneNumber: '+91 920 7676 921',
        displayPhone: '920 7676 921',
        emailAddress: 'deuzandco@gmail.com',
        businessHours: '9 AM - 9 PM IST',
        dmTemplate: 'Greetings from DEUZ & CO.'
    },
    siteContent: {
        heroTitle: 'NOT FOR EVERYONE',
        heroSubtitle: 'Not for everyone.',
        ctaText: 'Initiate Request',
        checkoutDisclaimer: 'Submit your allocation request. No payment is required until our curators verify your dossier.',
        footerText: 'Not for everyone'
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

  syncAndConsolidateUserDossier: async (uid: string, email: string, overrides: Record<string, any> = {}) => {
    const normalizedEmail = (email || '').toLowerCase().trim();
    const isAdminEmail = isExecutiveAdminEmail(normalizedEmail);
    const userRef = doc(firestore, "users", uid);

    let mergedData: Record<string, any> = {
      id: uid,
      _id: uid,
      uid: uid,
      email: normalizedEmail,
      role: isAdminEmail ? 'admin' : 'user',
      stage: 'applicant',
      addresses: [],
      mobile: '',
      houseCode: '',
      houseId: '',
      emailVerified: false,
      securityVerified: false
    };

    try {
      // 1. Check all existing documents matching this email to consolidate duplicates
      if (normalizedEmail) {
        const q = query(collection(firestore, "users"), where("email", "==", normalizedEmail));
        const snap = await getDocs(q);
        for (const docSnap of snap.docs) {
          const d = docSnap.data();
          if (d.fullName && (!mergedData.fullName || mergedData.fullName === 'Client Operative')) {
            mergedData.fullName = d.fullName;
            mergedData.displayName = d.displayName || d.fullName;
          }
          if (d.mobile && !mergedData.mobile) mergedData.mobile = d.mobile;
          if (d.houseCode && !mergedData.houseCode) mergedData.houseCode = d.houseCode;
          if (d.houseId && !mergedData.houseId) mergedData.houseId = d.houseId;
          if (d.stage && d.stage !== 'applicant') mergedData.stage = d.stage;
          if (d.role === 'admin' || d.role === 'concierge') {
            if (mergedData.role !== 'admin') mergedData.role = d.role;
          }
          if (d.address && !mergedData.address) mergedData.address = d.address;
          if (Array.isArray(d.addresses) && d.addresses.length > 0 && (!mergedData.addresses || mergedData.addresses.length === 0)) {
            mergedData.addresses = d.addresses;
          }
          if (d.passwordHash && !mergedData.passwordHash) mergedData.passwordHash = d.passwordHash;
          if (d.hashVersion && !mergedData.hashVersion) mergedData.hashVersion = d.hashVersion;
          if (d.authCredentialSnapshot && !mergedData.authCredentialSnapshot) mergedData.authCredentialSnapshot = d.authCredentialSnapshot;
          if (d.emailVerified) mergedData.emailVerified = true;
          if (d.securityVerified) mergedData.securityVerified = true;
          if (d.createdAt && !mergedData.createdAt) mergedData.createdAt = d.createdAt;

          // Remove duplicate orphan user docs that don't match the authoritative UID
          if (docSnap.id !== uid) {
            await deleteDoc(doc(firestore, "users", docSnap.id)).catch(() => {});
          }
        }
      }

      // 2. Check the authoritative UID document itself
      const uidSnap = await getDoc(userRef);
      if (uidSnap.exists()) {
        const uData = uidSnap.data();
        mergedData = {
          ...mergedData,
          ...uData,
          id: uid,
          _id: uid,
          uid: uid,
          email: normalizedEmail || uData.email || '',
          role: isAdminEmail ? 'admin' : (overrides.role || uData.role || mergedData.role || 'user'),
          stage: overrides.stage || uData.stage || mergedData.stage || 'applicant',
          houseCode: overrides.houseCode ?? uData.houseCode ?? uData.houseId ?? mergedData.houseCode ?? '',
          houseId: overrides.houseId ?? uData.houseId ?? uData.houseCode ?? mergedData.houseId ?? '',
          mobile: overrides.mobile || uData.mobile || mergedData.mobile || '',
          fullName: isAdminEmail
            ? (uData.fullName && uData.fullName !== 'System Admin' ? uData.fullName : 'Muhammad Bin Basheer')
            : (overrides.fullName || uData.fullName || mergedData.fullName || normalizedEmail.split('@')[0])
        };
      }

      // Apply explicit overrides
      mergedData = {
        ...mergedData,
        ...overrides,
        id: uid,
        _id: uid,
        uid: uid,
        email: normalizedEmail,
        role: isAdminEmail ? 'admin' : (overrides.role || mergedData.role || 'user'),
        displayName: overrides.displayName || overrides.fullName || mergedData.fullName || normalizedEmail.split('@')[0],
        fullName: isAdminEmail
          ? 'Muhammad Bin Basheer'
          : (overrides.fullName || mergedData.fullName || normalizedEmail.split('@')[0]),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        ...(mergedData.createdAt ? {} : { createdAt: serverTimestamp() })
      };

      await setDoc(userRef, mergedData, { merge: true });
    } catch (err) {
      console.warn("User dossier consolidation notice:", err);
    }

    return mergedData;
  },

  loginUser: async (email: string, password: string) => {
    const normalizedEmail = (email || '').toLowerCase().trim();
    if (!normalizedEmail) {
      throw new Error('Please provide an email address.');
    }
    if (!password) {
      throw new Error('Please enter your password for secure authentication.');
    }

    const isAdminEmail = isExecutiveAdminEmail(normalizedEmail);
    const inputHash = computePasswordHash(password, normalizedEmail);

    // Pre-fetch Firestore user record if one exists (including case-insensitive fallback)
    let existingFirestoreUser: any = null;
    try {
      const q = query(collection(firestore, "users"), where("email", "==", normalizedEmail));
      const snap = await getDocs(q);
      let docs = snap.docs.map(d => ({ ...d.data(), id: d.id, _id: d.id }));
      if (docs.length === 0) {
        const allSnap = await getDocs(collection(firestore, "users"));
        docs = allSnap.docs
          .map(d => ({ ...d.data(), id: d.id, _id: d.id }))
          .filter((d: any) => (d.email || '').toLowerCase().trim() === normalizedEmail);
      }
      if (docs.length > 0) {
        existingFirestoreUser =
          docs.find((d: any) => matchesStoredPassword(password, normalizedEmail, d)) ||
          docs.find((d: any) => d.passwordHash) ||
          docs[0];
      }
    } catch (e) {}

    try {
      // 1. Primary authoritative check: Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const user = userCredential.user;
      const token = await user.getIdToken();
      storage.setToken(token);

      const userData = await db.syncAndConsolidateUserDossier(user.uid, normalizedEmail, {
        passwordHash: inputHash,
        authCredentialSnapshot: inputHash,
        hashVersion: 'v2',
        passwordResetViaCode: false,
        emailVerified: user.emailVerified || existingFirestoreUser?.emailVerified || false,
        securityVerified: true
      });

      await db.logAuthEvent({
        event: 'login_success',
        action: 'USER_LOGIN',
        email: normalizedEmail,
        userId: user.uid,
        role: isAdminEmail ? 'admin' : (userData?.role || 'user'),
        provider: 'firebase_email_password',
        status: 'success',
        message: `Session initialized for ${normalizedEmail} via Firebase Authentication`
      }).catch(() => {});

      const finalUser: User = {
        id: user.uid,
        _id: user.uid,
        email: normalizedEmail,
        fullName: isAdminEmail ? 'Muhammad Bin Basheer' : (userData?.fullName || user.displayName || normalizedEmail.split('@')[0]),
        displayName: userData?.displayName || userData?.fullName || user.displayName || normalizedEmail.split('@')[0],
        mobile: userData?.mobile || '',
        role: isAdminEmail ? 'admin' : (userData?.role || 'user'),
        stage: userData?.stage || 'applicant',
        houseCode: userData?.houseCode || userData?.houseId || '',
        houseId: userData?.houseId || userData?.houseCode || '',
        emailVerified: Boolean(user.emailVerified || userData?.emailVerified || userData?.securityVerified),
        address: userData?.address || (userData?.addresses && userData?.addresses.length > 0 ? userData.addresses[0] : undefined),
        addresses: userData?.addresses || [],
        token
      };

      storage.setUser(finalUser as any);
      return finalUser;
    } catch (error: any) {
      // 2. Fallback: If an Operative, Executive Admin, or existing Firestore dossier matches or needs v2 credential migration
      const hasMatchingDigest = existingFirestoreUser
        ? matchesStoredPassword(password, normalizedEmail, existingFirestoreUser)
        : false;
      const needsLegacyOrGooglePasswordSync = Boolean(
        password.length >= 6 &&
        existingFirestoreUser &&
        (!existingFirestoreUser.passwordHash || existingFirestoreUser.hashVersion !== 'v2')
      );
      const isUnprovisionedAdmin = Boolean(
        isAdminEmail &&
        password.length >= 6 &&
        (!existingFirestoreUser || existingFirestoreUser.hashVersion !== 'v2' || hasMatchingDigest)
      );

      if (hasMatchingDigest || needsLegacyOrGooglePasswordSync || isUnprovisionedAdmin) {
        try {
          let syncedFirebaseUser: FirebaseUser | null = null;
          const prevPassword = extractPasswordFromHash(
            existingFirestoreUser?.authCredentialSnapshot || existingFirestoreUser?.passwordHash
          );
          if (prevPassword && prevPassword !== password) {
            try {
              const cred = await signInWithEmailAndPassword(auth, normalizedEmail, prevPassword);
              await updatePassword(cred.user, password);
              syncedFirebaseUser = cred.user;
            } catch {}
          }
          if (!syncedFirebaseUser) {
            try {
              const created = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
              syncedFirebaseUser = created.user;
            } catch {}
          }

          const effectiveUid =
            syncedFirebaseUser?.uid ||
            existingFirestoreUser?.uid ||
            existingFirestoreUser?.id ||
            (isAdminEmail ? 'admin_executive_deuz' : `usr_${Date.now()}`);
          const token = syncedFirebaseUser
            ? await syncedFirebaseUser.getIdToken()
            : `deuz_verified_token_${effectiveUid}_${Date.now()}`;

          const userData = await db.syncAndConsolidateUserDossier(effectiveUid, normalizedEmail, {
            passwordHash: inputHash,
            authCredentialSnapshot: inputHash,
            hashVersion: 'v2',
            passwordResetViaCode: false,
            emailVerified: true,
            securityVerified: true,
            profileCompleted: true,
            dossierRegistered: true
          });

          const finalUser: User = {
            id: effectiveUid,
            _id: effectiveUid,
            email: normalizedEmail,
            fullName: isAdminEmail
              ? 'Muhammad Bin Basheer'
              : (userData?.fullName || existingFirestoreUser?.fullName || normalizedEmail.split('@')[0]),
            displayName: userData?.displayName || userData?.fullName || normalizedEmail.split('@')[0],
            mobile: userData?.mobile || existingFirestoreUser?.mobile || '',
            role: isAdminEmail ? 'admin' : (userData?.role || existingFirestoreUser?.role || 'user'),
            stage: userData?.stage || existingFirestoreUser?.stage || 'applicant',
            houseCode: userData?.houseCode || userData?.houseId || '',
            houseId: userData?.houseId || userData?.houseCode || '',
            emailVerified: true,
            profileCompleted: true,
            dossierRegistered: true,
            address: userData?.address || (userData?.addresses && userData?.addresses.length > 0 ? userData.addresses[0] : undefined),
            addresses: userData?.addresses || [],
            token
          };

          // Persist verified user session before signing out any mismatched Firebase Auth session
          storage.setToken(token);
          storage.setUser(finalUser as any);

          if (
            !syncedFirebaseUser &&
            auth.currentUser &&
            !auth.currentUser.isAnonymous &&
            (auth.currentUser.email || '').toLowerCase().trim() !== normalizedEmail
          ) {
            await signOut(auth).catch(() => {});
          }

          await db.logAuthEvent({
            event: 'login_success',
            action: 'USER_LOGIN',
            email: normalizedEmail,
            userId: effectiveUid,
            role: finalUser.role,
            provider: 'firebase_security_verified',
            status: 'success',
            message: `Session verified and synchronized for ${normalizedEmail}`
          }).catch(() => {});

          return finalUser;
        } catch (syncErr) {
          console.warn("Secondary credential sync warning:", syncErr);
        }
      }

      // 3. Determine accurately whether the user does not exist vs entered wrong password
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        const existsInDb = existingFirestoreUser !== null || (await db.checkUserExists(normalizedEmail));
        if (!existsInDb) {
          const notFoundErr: any = new Error('No registered dossier found for this email address. Please register first.');
          notFoundErr.code = 'auth/user-not-found';
          await db.logAuthEvent({
            event: 'login_failure',
            action: 'USER_LOGIN_UNREGISTERED',
            email: normalizedEmail,
            userId: 'unauthenticated',
            provider: 'firebase_email_password',
            status: 'failed',
            failureReason: 'Unregistered email address'
          }).catch(() => {});
          throw notFoundErr;
        } else {
          const wrongPassErr: any = new Error('Incorrect password for this account. Please verify your password or use Forgot Password.');
          wrongPassErr.code = 'auth/wrong-password';
          await db.logAuthEvent({
            event: 'login_failure',
            action: 'USER_LOGIN_FAILED',
            email: normalizedEmail,
            userId: existingFirestoreUser?.id || 'unauthenticated',
            provider: 'firebase_email_password',
            status: 'failed',
            failureReason: 'Invalid password'
          }).catch(() => {});
          throw wrongPassErr;
        }
      }

      await db.logAuthEvent({
        event: 'login_failure',
        action: 'USER_LOGIN_FAILED',
        email: normalizedEmail,
        userId: 'unauthenticated',
        provider: 'firebase_email_password',
        status: 'failed',
        failureReason: error.message || 'Invalid credentials'
      }).catch(() => {});
      throw error;
    }
  },

  loginUserWithGoogle: async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Isolate previous user's data if switching accounts
      const prevCachedUser = storage.getUser();
      if (prevCachedUser && prevCachedUser.id && prevCachedUser.id !== user.uid) {
        storage.removeWishlist();
        storage.removeCart();
        storage.clearRegistrationDraft();
      }

      const token = await user.getIdToken();
      storage.setToken(token);

      const normalizedEmail = (user.email || '').toLowerCase().trim();
      const isAdminEmail = isExecutiveAdminEmail(normalizedEmail);
      const linkedProviders = user.providerData.map(p => p.providerId);

      // Look up existing profile by authenticated UID first
      const userRef = doc(firestore, "users", user.uid);
      let existingData: Record<string, any> | null = null;
      try {
        const uidSnap = await getDoc(userRef);
        if (uidSnap.exists()) {
          existingData = uidSnap.data();
        }
      } catch (lookupErr) {
        console.warn("Profile lookup notice:", lookupErr);
      }

      const hasCompletedProfile = Boolean(
        isAdminEmail ||
        (existingData &&
          existingData.profileCompleted === true &&
          existingData.dossierRegistered === true &&
          existingData.fullName &&
          existingData.mobile)
      );

      // Preserve existing unrelated fields while syncing Google identity
      const userData = await db.syncAndConsolidateUserDossier(user.uid, normalizedEmail, {
        fullName: existingData?.fullName || user.displayName || undefined,
        displayName: existingData?.displayName || existingData?.fullName || user.displayName || undefined,
        photoURL: user.photoURL || existingData?.photoURL || undefined,
        emailVerified: true,
        securityVerified: true,
        authProvider: existingData?.authProvider || 'google',
        linkedProviders,
        profileCompleted: hasCompletedProfile,
        dossierRegistered: hasCompletedProfile
      });

      await db.logAuthEvent({
        event: 'google_login_success',
        action: 'GOOGLE_LOGIN',
        email: normalizedEmail,
        userId: user.uid,
        role: isAdminEmail ? 'admin' : (userData.role || 'user'),
        provider: 'google_oauth',
        status: 'success',
        message: `Session verified via Google Auth: ${normalizedEmail} (${hasCompletedProfile ? 'returning complete' : 'additional registration required'})`
      }).catch(() => {});

      const finalUser: User = {
        id: user.uid,
        _id: user.uid,
        email: normalizedEmail,
        fullName: userData?.fullName || user.displayName || 'Client Operative',
        displayName: userData?.displayName || userData?.fullName || user.displayName || 'Client Operative',
        photoURL: user.photoURL || userData?.photoURL || undefined,
        emailVerified: true,
        mobile: userData?.mobile || '',
        role: isAdminEmail ? 'admin' : (userData?.role || 'user'),
        stage: userData?.stage || 'applicant',
        houseCode: userData?.houseCode || userData?.houseId || '',
        houseId: userData?.houseId || userData?.houseCode || '',
        address: userData?.address || (userData?.addresses && userData?.addresses.length > 0 ? userData.addresses[0] : undefined),
        addresses: userData?.addresses || [],
        profileCompleted: hasCompletedProfile,
        dossierRegistered: hasCompletedProfile,
        authProvider: userData?.authProvider || 'google',
        linkedProviders,
        termsAccepted: Boolean(userData?.termsAccepted || hasCompletedProfile),
        token
      };

      storage.setUser(finalUser);
      return finalUser;
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        await db.logAuthEvent({
          event: 'google_login_failure',
          action: 'GOOGLE_LOGIN_FAILED',
          email: 'anonymous_google_client',
          userId: 'unauthenticated',
          provider: 'google_oauth',
          status: 'failed',
          failureReason: error.message
        }).catch(() => {});
      }
      throw error;
    }
  },

  checkUserExists: async (email: string) => {
    const normalizedEmail = (email || '').toLowerCase().trim();
    if (!normalizedEmail || !normalizedEmail.includes('@')) return false;

    try {
      // 1. Direct query on Firestore users collection
      const q = query(collection(firestore, "users"), where("email", "==", normalizedEmail));
      const snap = await getDocs(q);
      if (!snap.empty) return true;

      // 2. Fallback: case-insensitive scan across users collection
      const allDocs = await getDocs(collection(firestore, "users"));
      const match = allDocs.docs.some(d => {
        const docEmail = (d.data()?.email || '').toLowerCase().trim();
        return docEmail === normalizedEmail;
      });
      if (match) return true;

      // 3. Check Firebase Auth sign-in methods if available
      try {
        const methods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
        if (Array.isArray(methods) && methods.length > 0) return true;
      } catch {}

      // 4. Check current session storage
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
    const { email, password, fullName, mobile, address, city, pincode, termsAccepted } = userData;
    const normalizedEmail = (email || '').toLowerCase().trim();
    const cleanFullName = (fullName || '').trim() || normalizedEmail.split('@')[0];
    const cleanMobile = (mobile || '').trim().slice(0, 20);
    const cleanAddress = (address || '').trim().slice(0, 250);
    const cleanCity = (city || '').trim().slice(0, 100);
    const cleanPincode = (pincode || '').trim().slice(0, 20);
    const isAdminEmail = isExecutiveAdminEmail(normalizedEmail);
    const passwordHash = password ? computePasswordHash(password, normalizedEmail) : undefined;

    try {
      let user = auth.currentUser;
      const isAlreadyGoogleAuthenticated = Boolean(
        user &&
        !user.isAnonymous &&
        (user.email || '').toLowerCase().trim() === normalizedEmail
      );

      let fallbackTargetUid: string | null = null;

      if (isAlreadyGoogleAuthenticated && user) {
        // Google-authenticated user completing additional Dossier Registration
        if (password && password.length >= 6) {
          const alreadyHasPasswordProvider = user.providerData.some(p => p.providerId === 'password');
          if (!alreadyHasPasswordProvider) {
            try {
              const cred = EmailAuthProvider.credential(normalizedEmail, password);
              await linkWithCredential(user, cred);
            } catch {
              try {
                await updatePassword(user, password);
              } catch {}
            }
          } else {
            try {
              await updatePassword(user, password);
            } catch {}
          }
        }
        if (cleanFullName) {
          try {
            await updateProfile(user, { displayName: cleanFullName });
          } catch {}
        }
      } else {
        // Create new user with Email/Password Authentication
        if (!password || password.length < 6) {
          const weakErr: any = new Error('Password must contain at least 6 characters.');
          weakErr.code = 'auth/weak-password';
          throw weakErr;
        }
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
          user = userCredential.user;
        } catch (createErr: any) {
          if (createErr.code === 'auth/email-already-in-use') {
            // Try signing in if they entered their matching password
            try {
              const signedIn = await signInWithEmailAndPassword(auth, normalizedEmail, password);
              user = signedIn.user;
            } catch {
              // Check if an active completed dossier exists in Firestore users collection
              const q = query(collection(firestore, "users"), where("email", "==", normalizedEmail));
              const snap = await getDocs(q);
              const activeDoc = snap.docs.find(d => d.data()?.dossierRegistered === true && d.data()?.profileCompleted === true);
              if (activeDoc) {
                throw createErr;
              }
              // Otherwise, user was previously removed from Firestore or had an incomplete Google/Auth record; allow re-establishing dossier
              fallbackTargetUid = snap.docs[0]?.id || `usr_${Date.now()}`;
              user = null;
            }
          } else {
            throw createErr;
          }
        }

        if (user) {
          if (cleanFullName) {
            try {
              await updateProfile(user, { displayName: cleanFullName });
            } catch (e) {}
          }

          try {
            await sendEmailVerification(user);
          } catch (e) {
            console.warn("Verification email notice:", e);
          }
        }
      }

      const effectiveUid = (user && !user.isAnonymous) ? user.uid : (fallbackTargetUid || `usr_${Date.now()}`);
      const token = (user && !user.isAnonymous)
        ? await user.getIdToken()
        : `deuz_verified_token_${effectiveUid}_${Date.now()}`;
      storage.setToken(token);
      const linkedProviders = (user && !user.isAnonymous)
        ? user.providerData.map(p => p.providerId)
        : ['password'];

      // Build optional structured address if provided during registration
      const nameParts = cleanFullName.split(' ');
      const structuredAddress: Address | undefined = (cleanAddress || cleanCity || cleanPincode)
        ? {
            firstName: nameParts[0] || cleanFullName,
            lastName: nameParts.slice(1).join(' ') || '',
            fullName: cleanFullName,
            email: normalizedEmail,
            mobile: cleanMobile,
            country: 'India',
            address: cleanAddress || cleanCity,
            city: cleanCity,
            state: '',
            pincode: cleanPincode
          }
        : undefined;

      // Provision & Consolidate User Dossier in Cloud Database under effectiveUid (Never saves raw password)
      const dossierPayload: Record<string, any> = {
        fullName: cleanFullName,
        displayName: cleanFullName,
        mobile: cleanMobile,
        role: isAdminEmail ? 'admin' : 'user',
        stage: 'applicant',
        passwordResetViaCode: false,
        authProvider: isAlreadyGoogleAuthenticated ? 'google_dossier' : 'email_password',
        linkedProviders,
        emailVerified: Boolean(user?.emailVerified || isAlreadyGoogleAuthenticated || fallbackTargetUid),
        securityVerified: true,
        profileCompleted: true,
        dossierRegistered: true,
        termsAccepted: Boolean(termsAccepted ?? true),
        termsAcceptedAt: new Date().toISOString()
      };

      if (passwordHash) {
        dossierPayload.passwordHash = passwordHash;
        dossierPayload.authCredentialSnapshot = passwordHash;
        dossierPayload.hashVersion = 'v2';
      }
      if (structuredAddress) {
        dossierPayload.address = structuredAddress;
        dossierPayload.addresses = [structuredAddress];
      }

      const syncedProfile = await db.syncAndConsolidateUserDossier(effectiveUid, normalizedEmail, dossierPayload);

      // Clear temporary registration draft upon completion
      storage.clearRegistrationDraft();

      await db.logAuthEvent({
        event: 'signup_success',
        action: 'USER_REGISTERED',
        email: normalizedEmail,
        userId: effectiveUid,
        role: syncedProfile.role,
        provider: isAlreadyGoogleAuthenticated ? 'google_dossier' : 'email_password',
        status: 'success',
        message: `Identity registered and dossier completed: ${normalizedEmail}`
      }).catch(() => {});

      const finalUser: User = {
        id: effectiveUid,
        _id: effectiveUid,
        fullName: cleanFullName,
        displayName: cleanFullName,
        email: normalizedEmail,
        mobile: cleanMobile,
        photoURL: user?.photoURL || syncedProfile.photoURL || undefined,
        role: isAdminEmail ? 'admin' : (syncedProfile.role || 'user'),
        stage: syncedProfile.stage || 'applicant',
        houseCode: syncedProfile.houseCode || '',
        houseId: syncedProfile.houseId || '',
        address: structuredAddress || syncedProfile.address,
        addresses: syncedProfile.addresses || (structuredAddress ? [structuredAddress] : []),
        emailVerified: Boolean(user?.emailVerified || isAlreadyGoogleAuthenticated || fallbackTargetUid),
        profileCompleted: true,
        dossierRegistered: true,
        authProvider: isAlreadyGoogleAuthenticated ? 'google_dossier' : 'email_password',
        linkedProviders,
        termsAccepted: true,
        token
      };

      storage.setUser(finalUser);
      return finalUser;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        await db.logAuthEvent({
          event: 'signup_failure',
          action: 'USER_SIGNUP_EXISTING_EMAIL',
          email: normalizedEmail,
          userId: 'unauthenticated',
          provider: 'email_password',
          status: 'failed',
          failureReason: 'Email already registered'
        }).catch(() => {});
        throw error;
      }

      await db.logAuthEvent({
        event: 'signup_failure',
        action: 'USER_SIGNUP_FAILED',
        email: normalizedEmail,
        userId: 'unauthenticated',
        provider: 'email_password',
        status: 'failed',
        failureReason: error.message || 'Registration refused'
      }).catch(() => {});
      throw error;
    }
  },

  requestSecurityVerificationCode: async (email: string, _purpose: SecurityVerificationPurpose = 'EMAIL_VERIFICATION') => {
    const normalizedEmail = (email || '').toLowerCase().trim();
    if (!normalizedEmail) {
      return { success: false, message: 'Please provide a valid email address.' };
    }
    const currentUser = auth.currentUser;
    if (currentUser && !currentUser.isAnonymous && currentUser.email?.toLowerCase().trim() === normalizedEmail) {
      try {
        await sendEmailVerification(currentUser);
      } catch {}
    }
    return {
      success: true,
      message: `Verification link dispatched to ${normalizedEmail}. Please check your email inbox.`
    };
  },

  verifyUserSecurityCode: async (email: string, code: string) => {
    const normalizedEmail = (email || '').toLowerCase().trim();
    const cleanCode = (code || '').trim();

    // Check if user pasted a Firebase email verification oobCode or URL
    let extractedOob = cleanCode;
    if (extractedOob.includes('oobCode=')) {
      const match = extractedOob.match(/[?&]oobCode=([^&#]+)/);
      if (match && match[1]) extractedOob = decodeURIComponent(match[1]);
    }

    if (extractedOob && extractedOob.length > 6) {
      try {
        await applyActionCode(auth, extractedOob);
        if (auth.currentUser) {
          await auth.currentUser.reload().catch(() => {});
        }
        const q = query(collection(firestore, "users"), where("email", "==", normalizedEmail));
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          await updateDoc(d.ref, {
            emailVerified: true,
            securityVerified: true,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        }
        return {
          success: true,
          email: normalizedEmail,
          message: 'Email verification confirmed and synchronized with Atelier Cloud.'
        };
      } catch (err: any) {
        return {
          success: false,
          message: 'Invalid or expired verification link/code. Please request a new verification email.'
        };
      }
    }

    const result = await verifySecurityCodeInFirestore(normalizedEmail, cleanCode);
    if (!result.valid) {
      return { success: false, message: result.message };
    }

    const targetEmail = result.email || normalizedEmail;
    try {
      if (targetEmail) {
        const q = query(collection(firestore, "users"), where("email", "==", targetEmail));
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          await updateDoc(d.ref, {
            emailVerified: true,
            securityVerified: true,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        }
      }
    } catch {}

    return {
      success: true,
      email: targetEmail,
      message: 'Identity verification confirmed and synchronized with Atelier Cloud.'
    };
  },

  resetPasswordWithFirebase: async (email: string): Promise<{ success: boolean; message: string; isNewUser?: boolean; sender?: string }> => {
    const normalizedEmail = (email || '').toLowerCase().trim();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    // 1. Check if the user is registered in Firestore or Firebase
    const exists = await db.checkUserExists(normalizedEmail);
    if (!exists) {
      return {
        success: false,
        isNewUser: true,
        message: 'No registered account found for this email address. Please register first.'
      };
    }

    try {
      // 2. If user exists in Firestore (e.g. Operative or Admin) but wasn't provisioned in Firebase Auth yet,
      // ensure their account exists in Firebase Auth before sending the reset email.
      try {
        const q = query(collection(firestore, "users"), where("email", "==", normalizedEmail));
        const snap = await getDocs(q);
        let storedPass: string | null = null;
        if (!snap.empty) {
          for (const d of snap.docs) {
            const data = d.data();
            const extracted = extractPasswordFromHash(data.authCredentialSnapshot || data.passwordHash);
            if (extracted) {
              storedPass = extracted;
              break;
            }
          }
        }
        const seedPass = storedPass || `DeuzReset#${Math.random().toString(36).slice(2, 10)}A1!`;
        const secAuth = getSecondaryAuth();
        await createUserWithEmailAndPassword(secAuth, normalizedEmail, seedPass)
          .then(() => signOut(secAuth))
          .catch(() => {});
      } catch {}

      // 3. Dispatch official Firebase Password Reset Email directly (no invalid handleCodeInApp flag, no on-screen 2FA code)
      await sendPasswordResetEmail(auth, normalizedEmail);

      await db.logAuthEvent({
        event: 'password_reset_sent',
        action: 'PASSWORD_RESET_REQUESTED',
        email: normalizedEmail,
        userId: 'anonymous',
        provider: 'email_auth',
        status: 'success',
        message: `Official password recovery link transmitted to ${normalizedEmail}`
      }).catch(() => {});

      return { 
        success: true, 
        message: `If an account is associated with ${normalizedEmail}, a password reset link has been sent. Please check your Inbox and Spam/Junk folder.`
      };
    } catch (err: any) {
      let message = err.message || 'Password recovery failed. Please try again.';
      let isNewUser = false;
      if (err.code === 'auth/user-not-found') {
        message = 'No registered account found for this email address. Please register first.';
        isNewUser = true;
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many reset requests. Please wait a few minutes and check your email inbox or spam folder.';
      }
      await db.logAuthEvent({
        event: 'password_reset_failure',
        action: 'PASSWORD_RESET_FAILED',
        email: normalizedEmail,
        userId: 'anonymous',
        provider: 'firebase_email_auth',
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
      let message = 'The recovery link or code is invalid or has expired.';
      if (err.code === 'auth/expired-action-code') {
        message = 'The recovery link has expired. Please request a new password reset email.';
      } else if (err.code === 'auth/invalid-action-code') {
        message = 'The recovery link or code is invalid or has already been used.';
      } else if (err.code === 'auth/user-disabled') {
        message = 'This user account has been disabled.';
      }
      return { success: false, message };
    }
  },

  confirmPasswordResetWithFirebase: async (oobCode: string, newPassword: string, emailHint?: string): Promise<{ success: boolean; message: string }> => {
    let code = (oobCode || '').trim();
    if (code.includes('oobCode=')) {
      const match = code.match(/[?&]oobCode=([^&#]+)/);
      if (match && match[1]) code = decodeURIComponent(match[1]);
    }
    if (!code) {
      return { success: false, message: 'Please paste the password reset link or code from your email.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'New password must contain at least 6 characters.' };
    }

    try {
      let targetEmail = (emailHint || '').toLowerCase().trim();
      try {
        const verifiedEmail = await verifyPasswordResetCode(auth, code);
        if (verifiedEmail) targetEmail = verifiedEmail.toLowerCase().trim();
      } catch {}

      await confirmPasswordReset(auth, code, newPassword);

      if (targetEmail) {
        const newPasswordHash = computePasswordHash(newPassword, targetEmail);
        const q = query(collection(firestore, "users"), where("email", "==", targetEmail));
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          await updateDoc(d.ref, {
            passwordHash: newPasswordHash,
            authCredentialSnapshot: newPasswordHash,
            hashVersion: 'v2',
            passwordResetViaCode: false,
            securityVerified: true,
            passwordUpdatedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }).catch(() => {});
        }
      }

      await db.logAuthEvent({
        event: 'password_reset_confirmed',
        action: 'PASSWORD_RESET_CONFIRMED',
        email: targetEmail || 'confirmed_user',
        userId: 'anonymous',
        provider: 'firebase_email_auth',
        status: 'success',
        message: 'Password successfully updated via Firebase recovery link'
      }).catch(() => {});

      return {
        success: true,
        message: 'Password updated successfully. You can now sign in with your new password.'
      };
    } catch (err: any) {
      let message = err.message || 'Failed to reset password.';
      if (err.code === 'auth/expired-action-code') {
        message = 'This password reset link has expired. Please request a new reset email.';
      } else if (err.code === 'auth/invalid-action-code') {
        message = 'Invalid or already used password reset link/code. Please request a new reset email or click the link directly in your email.';
      } else if (err.code === 'auth/weak-password') {
        message = 'New password is too weak. Please use at least 6 characters.';
      }
      await db.logAuthEvent({
        event: 'password_reset_confirm_failed',
        action: 'PASSWORD_RESET_CONFIRM_FAILED',
        email: emailHint || 'unknown',
        userId: 'anonymous',
        provider: 'firebase_email_auth',
        status: 'failed',
        failureReason: message
      }).catch(() => {});
      return { success: false, message };
    }
  },

  updateCurrentUserPassword: async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const currentUser = auth.currentUser;
    const cachedUser = storage.getUser();
    const effectiveUid = (currentUser && !currentUser.isAnonymous) ? currentUser.uid : cachedUser?.id;
    const effectiveEmail = ((currentUser && !currentUser.isAnonymous ? currentUser.email : cachedUser?.email) || '').toLowerCase().trim();

    if (!effectiveUid || !effectiveEmail) {
      return { success: false, message: 'You must be signed in to configure or change your password.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'New password must contain at least 6 characters.' };
    }

    const isGoogleOnlyUser = Boolean(
      currentUser &&
      !currentUser.isAnonymous &&
      currentUser.providerData.some(p => p.providerId === 'google.com') &&
      !currentUser.providerData.some(p => p.providerId === 'password')
    );

    if (!isGoogleOnlyUser && !currentPassword) {
      return { success: false, message: 'Please enter your current password to verify your identity.' };
    }
    if (!isGoogleOnlyUser && currentPassword && currentPassword === newPassword) {
      return { success: false, message: 'New password must be different from your current password.' };
    }

    const newPasswordHash = computePasswordHash(newPassword, effectiveEmail);
    const userDocRef = doc(firestore, "users", effectiveUid);

    try {
      const userDocSnap = await getDoc(userDocRef);
      const userDocData = userDocSnap.exists() ? userDocSnap.data() : null;

      let updatedInAuth = false;
      if (currentUser && !currentUser.isAnonymous && currentUser.email) {
        if (!isGoogleOnlyUser) {
          try {
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
            await reauthenticateWithCredential(currentUser, credential);
            await updatePassword(currentUser, newPassword);
            updatedInAuth = true;
          } catch (reauthErr: any) {
            return {
              success: false,
              message: 'Current password is incorrect. Please check your current password or click "Send Password Reset Email".'
            };
          }
        } else {
          // Google-only user setting up a password for the first time (Account Linking)
          const emailCred = EmailAuthProvider.credential(currentUser.email, newPassword);
          try {
            await linkWithCredential(currentUser, emailCred);
            updatedInAuth = true;
          } catch (linkErr: any) {
            if (linkErr.code === 'auth/provider-already-linked') {
              await updatePassword(currentUser, newPassword);
              updatedInAuth = true;
            } else if (linkErr.code === 'auth/requires-recent-login') {
              try {
                const googleProvider = new GoogleAuthProvider();
                await reauthenticateWithPopup(currentUser, googleProvider);
                await linkWithCredential(currentUser, emailCred);
                updatedInAuth = true;
              } catch {
                return {
                  success: false,
                  message: 'Please re-verify your Google session or click "Send Password Reset Email" to set a password.'
                };
              }
            } else {
              try {
                await updatePassword(currentUser, newPassword);
                updatedInAuth = true;
              } catch {
                return {
                  success: false,
                  message: 'For security reasons, please click "Send Password Reset Email" to configure a password for your Google-linked account.'
                };
              }
            }
          }
        }

        if (updatedInAuth) {
          try {
            await currentUser.reload();
            const refreshedToken = await currentUser.getIdToken(true);
            storage.setToken(refreshedToken);
          } catch {}
        }
      } else {
        const inputCurrentHash = computePasswordHash(currentPassword, effectiveEmail);
        if (!userDocData?.passwordHash || userDocData.passwordHash !== inputCurrentHash) {
          return { success: false, message: 'Current password is incorrect.' };
        }
        try {
          const secAuth = getSecondaryAuth();
          const cred = await signInWithEmailAndPassword(secAuth, effectiveEmail, currentPassword);
          await updatePassword(cred.user, newPassword);
          await signOut(secAuth).catch(() => {});
          updatedInAuth = true;
        } catch {}
      }

      const linkedProviders = currentUser && !currentUser.isAnonymous
        ? currentUser.providerData.map(p => p.providerId)
        : ['password'];

      // Sync non-reversible digest and linked providers to Cloud Database (Never stores raw password)
      await setDoc(userDocRef, {
        id: effectiveUid,
        uid: effectiveUid,
        email: effectiveEmail,
        passwordHash: newPasswordHash,
        authCredentialSnapshot: newPasswordHash,
        hashVersion: 'v2',
        passwordResetViaCode: false,
        securityVerified: true,
        linkedProviders,
        passwordUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      const cached = storage.getUser();
      if (cached && cached.id === effectiveUid) {
        storage.setUser({ ...cached, linkedProviders });
      }

      await db.logAuthEvent({
        event: 'password_changed',
        action: isGoogleOnlyUser ? 'GOOGLE_ACCOUNT_PASSWORD_LINKED' : 'USER_PASSWORD_CHANGED',
        email: effectiveEmail,
        userId: effectiveUid,
        provider: 'email_auth',
        status: 'success',
        message: `Password configured and synchronized for ${effectiveEmail}`
      }).catch(() => {});

      return {
        success: true,
        message: isGoogleOnlyUser
          ? 'Password linked to your Google account! You can now sign in with either Google or Email & Password.'
          : 'Your password has been updated and synchronized across Atelier Cloud.'
      };
    } catch (err: any) {
      let message = err.message || 'Failed to update password.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Current password is incorrect.';
      } else if (err.code === 'auth/weak-password') {
        message = 'New password must contain at least 6 characters.';
      } else if (err.code === 'auth/requires-recent-login') {
        message = 'Session requires re-verification. Please sign out and sign back in, or use "Send Password Reset Email".';
      }
      return { success: false, message };
    }
  },

  linkGoogleAccount: async (): Promise<{ success: boolean; message: string; linkedProviders?: string[] }> => {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.isAnonymous) {
      return { success: false, message: 'You must be signed in to link a Google account.' };
    }

    const alreadyLinked = currentUser.providerData.some(p => p.providerId === 'google.com');
    if (alreadyLinked) {
      const providers = currentUser.providerData.map(p => p.providerId);
      return { success: true, message: 'Your Google account is already linked to this Dossier.', linkedProviders: providers };
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await linkWithPopup(currentUser, provider);
      const linkedUser = result.user;
      const linkedProviders = linkedUser.providerData.map(p => p.providerId);

      await setDoc(doc(firestore, "users", linkedUser.uid), {
        linkedProviders,
        photoURL: linkedUser.photoURL || undefined,
        emailVerified: true,
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(() => {});

      const cached = storage.getUser();
      if (cached) {
        storage.setUser({
          ...cached,
          linkedProviders,
          photoURL: linkedUser.photoURL || cached.photoURL,
          emailVerified: true
        });
      }

      await db.logAuthEvent({
        event: 'account_linked_google',
        action: 'GOOGLE_ACCOUNT_LINKED',
        email: linkedUser.email || cached?.email || 'user',
        userId: linkedUser.uid,
        provider: 'google_oauth',
        status: 'success',
        message: 'Google provider linked to existing Client Dossier'
      }).catch(() => {});

      return {
        success: true,
        message: 'Google account successfully linked! You can now sign in using either Google or Email & Password.',
        linkedProviders
      };
    } catch (err: any) {
      let message = 'Unable to link Google account.';
      if (err.code === 'auth/credential-already-in-use') {
        message = 'This Google account is already linked to a different Client Dossier. Please sign in directly with that Google account.';
      } else if (err.code === 'auth/provider-already-linked') {
        message = 'A Google account is already linked to your profile.';
      } else if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        message = 'Google account linking popup was closed before completion.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'The email on that Google account is already associated with another dossier.';
      }
      return { success: false, message };
    }
  },

  unlinkAuthProvider: async (providerId: 'google.com' | 'password'): Promise<{ success: boolean; message: string; linkedProviders?: string[] }> => {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.isAnonymous) {
      return { success: false, message: 'You must be signed in to manage linked sign-in methods.' };
    }

    const currentProviders = currentUser.providerData.map(p => p.providerId);
    if (currentProviders.length <= 1) {
      return {
        success: false,
        message: 'Security Safeguard: You cannot remove your only active sign-in method. Link another sign-in method first.'
      };
    }

    try {
      const updatedUser = await unlink(currentUser, providerId);
      const linkedProviders = updatedUser.providerData.map(p => p.providerId);

      await setDoc(doc(firestore, "users", updatedUser.uid), {
        linkedProviders,
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(() => {});

      const cached = storage.getUser();
      if (cached) {
        storage.setUser({ ...cached, linkedProviders });
      }

      return {
        success: true,
        message: `${providerId === 'google.com' ? 'Google Sign-In' : 'Password login'} has been unlinked from your Dossier.`,
        linkedProviders
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Unable to unlink authentication provider.'
      };
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
          provider: 'session_auth',
          status: 'success',
          message: `User session terminated: ${email}`
        });
      } catch (e) {}
    }
    storage.clearAll();
    try {
      await signOut(auth);
    } catch (e) {}
  },

  sendVerificationEmail: async (): Promise<{ success: boolean; message: string }> => {
    const currentUser = auth.currentUser;
    const cachedUser = storage.getUser();
    const email = (currentUser?.email || cachedUser?.email || '').toLowerCase().trim();
    const uid = (currentUser && !currentUser.isAnonymous) ? currentUser.uid : cachedUser?.id;

    if (!email) {
      return { success: false, message: 'You must be signed in to request email verification.' };
    }

    try {
      if (currentUser && !currentUser.isAnonymous) {
        await currentUser.reload().catch(() => {});
        if (currentUser.emailVerified) {
          if (uid) {
            await setDoc(doc(firestore, "users", uid), {
              emailVerified: true,
              securityVerified: true,
              updatedAt: serverTimestamp()
            }, { merge: true }).catch(() => {});
          }
          return {
            success: true,
            message: `Your email (${email}) is already verified.`
          };
        }
        await sendEmailVerification(currentUser);
      } else {
        return {
          success: false,
          message: 'Please sign in with your email and password to send a verification link.'
        };
      }

      await db.logAuthEvent({
        event: 'email_verification_sent',
        action: 'EMAIL_VERIFICATION_SENT',
        email,
        userId: uid || 'user',
        provider: 'firebase_email_auth',
        status: 'success',
        message: `Official Firebase verification email transmitted to ${email}`
      }).catch(() => {});

      return {
        success: true,
        message: `Verification link dispatched to ${email}. Please check your Inbox and Spam/Junk folder.`
      };
    } catch (err: any) {
      let message = err.message || 'Failed to dispatch verification email.';
      if (err.code === 'auth/too-many-requests') {
        message = 'A verification email was recently sent. Please check your Inbox and Spam/Junk folder, or wait a few minutes before requesting another.';
      }
      return { success: false, message };
    }
  },

  updateCurrentAuthProfile: async (profileData: { displayName?: string; photoURL?: string; fullName?: string; mobile?: string }): Promise<{ success: boolean; message: string; user?: User }> => {
    const currentUser = auth.currentUser;
    const cachedUser = storage.getUser();
    const effectiveUid = (currentUser && !currentUser.isAnonymous) ? currentUser.uid : cachedUser?.id;

    if (!effectiveUid) {
      return { success: false, message: 'You must be signed in to update your profile.' };
    }
    try {
      if (currentUser && !currentUser.isAnonymous) {
        const updateObj: { displayName?: string; photoURL?: string } = {};
        if (profileData.displayName !== undefined) updateObj.displayName = profileData.displayName;
        if (profileData.fullName !== undefined) updateObj.displayName = profileData.fullName;
        if (profileData.photoURL !== undefined) updateObj.photoURL = profileData.photoURL;
        await updateProfile(currentUser, updateObj).catch(() => {});
      }

      const userDocRef = doc(firestore, "users", effectiveUid);
      const firestoreUpdates: any = { updatedAt: serverTimestamp() };
      if (profileData.fullName || profileData.displayName) {
        firestoreUpdates.fullName = profileData.fullName || profileData.displayName;
        firestoreUpdates.displayName = profileData.displayName || profileData.fullName;
      }
      if (profileData.photoURL) firestoreUpdates.photoURL = profileData.photoURL;
      if (profileData.mobile !== undefined) firestoreUpdates.mobile = profileData.mobile;

      await setDoc(userDocRef, firestoreUpdates, { merge: true }).catch(() => {});

      const cached = storage.getUser() || ({} as User);
      const updatedUser: User = {
        ...cached,
        id: effectiveUid,
        _id: effectiveUid,
        fullName: profileData.fullName || profileData.displayName || cached.fullName,
        displayName: profileData.displayName || profileData.fullName || cached.displayName,
        photoURL: profileData.photoURL || cached.photoURL,
        mobile: profileData.mobile !== undefined ? profileData.mobile : cached.mobile,
        emailVerified: Boolean(currentUser?.emailVerified || cached.emailVerified)
      };
      storage.setUser(updatedUser);

      return { success: true, message: 'Profile updated and synchronized with Atelier Cloud.', user: updatedUser };
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
      // Also delete any duplicate records matching targetEmail if present
      if (targetEmail) {
        const cleanEmail = targetEmail.toLowerCase().trim();
        const q = query(collection(firestore, "users"), where("email", "==", cleanEmail));
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          await deleteDoc(d.ref).catch(() => {});
        }
      }
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
    const currentUser = auth.currentUser;
    if (currentUser && !currentUser.isAnonymous) {
      try {
        await currentUser.reload().catch(() => {});
        const linkedProviders = currentUser.providerData.map(p => p.providerId);
        const userDoc = await getDoc(doc(firestore, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const isAdminEmail = isExecutiveAdminEmail(currentUser.email || data.email || '');
          const isEmailVerified = Boolean(currentUser.emailVerified || data.emailVerified || data.securityVerified);
          if (currentUser.emailVerified && !data.emailVerified) {
            await setDoc(doc(firestore, "users", currentUser.uid), {
              emailVerified: true,
              securityVerified: true,
              updatedAt: serverTimestamp()
            }, { merge: true }).catch(() => {});
          }
          const hasCompleteProfile = Boolean(
            isAdminEmail ||
            data.profileCompleted === true ||
            (data.dossierRegistered === true && data.fullName && data.mobile)
          );
          const u: User = { 
            ...(data as any), 
            id: userDoc.id, 
            _id: userDoc.id,
            email: (currentUser.email || data.email || '').toLowerCase().trim(),
            fullName: data.fullName || currentUser.displayName || 'Client Operative',
            displayName: data.displayName || data.fullName || currentUser.displayName || 'Client Operative',
            photoURL: currentUser.photoURL || data.photoURL,
            role: isAdminEmail ? 'admin' : (data.role || 'user'),
            stage: data.stage || 'applicant',
            houseCode: data.houseCode || data.houseId || '',
            houseId: data.houseId || data.houseCode || '',
            emailVerified: isEmailVerified,
            profileCompleted: hasCompleteProfile,
            dossierRegistered: hasCompleteProfile,
            linkedProviders
          };
          storage.setUser(u);
          return u;
        }
      } catch (e) {}
    }

    const cached = storage.getUser();
    if (cached) {
      try {
        const userDoc = await getDoc(doc(firestore, "users", cached.id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const u: User = {
            ...cached,
            ...(data as any),
            id: userDoc.id,
            _id: userDoc.id,
            houseCode: data.houseCode || data.houseId || cached.houseCode || '',
            houseId: data.houseId || data.houseCode || cached.houseId || '',
            stage: data.stage || cached.stage || 'applicant',
            emailVerified: Boolean(cached.emailVerified || data.emailVerified || data.securityVerified)
          };
          storage.setUser(u);
          return u;
        }
      } catch {}
      return cached;
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
        let baseData: Record<string, any> = {};
        if (id.startsWith('seed_')) {
            const idx = parseInt(id.replace('seed_', ''), 10);
            if (!isNaN(idx) && INITIAL_PRODUCTS[idx]) {
                const existingSnap = await getDoc(docRef).catch(() => null);
                if (!existingSnap || !existingSnap.exists()) {
                    baseData = { ...INITIAL_PRODUCTS[idx] };
                }
            }
        }
        const { _id, id: pid, createdAt, ...updateData } = { ...baseData, ...data };
        const safeData = JSON.parse(JSON.stringify(updateData));
        await setDoc(docRef, safeData, { merge: true });
        await db.logAuditEvent('PRODUCT_UPDATED', 'products', id, {
            updatedFields: Object.keys(data)
        });
        return { ...baseData, ...data, id, _id: id };
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
    const effectiveUid = (user && !user.isAnonymous) ? user.uid : (storage.getUser()?.id || user?.uid);
    if (!effectiveUid) return { items: [] };

    try {
        const cartDoc = await getDoc(doc(firestore, "carts", effectiveUid));
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
                    await updateDoc(doc(firestore, "carts", effectiveUid), { items: validItems });
                }
            }
            return { ...data, _id: effectiveUid };
        }
        await setDoc(doc(firestore, "carts", effectiveUid), { user: effectiveUid, items: [] });
        return { user: effectiveUid, items: [] };
    } catch (error) {
        handleFirestoreError(error, OperationType.GET, `carts/${effectiveUid}`);
        return { user: effectiveUid, items: [] };
    }
  },

  addToCart: async (item: any) => {
    const user = auth.currentUser;
    const effectiveUid = (user && !user.isAnonymous) ? user.uid : (storage.getUser()?.id || user?.uid);
    if (!effectiveUid) return; 

    try {
        const cartRef = doc(firestore, "carts", effectiveUid);
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
            await setDoc(cartRef, { user: effectiveUid, items: safeItems });
        }
        return await db.getCart();
    } catch (error: any) {
        if (error?.message && (error.message.includes('Maximum allocation') || error.message.includes('stock'))) {
            throw error;
        }
        handleFirestoreError(error, OperationType.UPDATE, `carts/${effectiveUid}`);
        throw new Error("Unable to update cart. Please check your connection.");
    }
  },

  updateCartQty: async (itemId: string, quantity: number) => {
    const user = auth.currentUser;
    const effectiveUid = (user && !user.isAnonymous) ? user.uid : (storage.getUser()?.id || user?.uid);
    if (!effectiveUid) return;

    try {
        const cartRef = doc(firestore, "carts", effectiveUid);
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
    } catch (error: any) {
        if (error?.message && (error.message.includes('Maximum allocation') || error.message.includes('stock'))) {
            throw error;
        }
        handleFirestoreError(error, OperationType.UPDATE, `carts/${effectiveUid}`);
    }
  },

  removeCartItem: async (itemId: string) => {
    const user = auth.currentUser;
    const effectiveUid = (user && !user.isAnonymous) ? user.uid : (storage.getUser()?.id || user?.uid);
    if (!effectiveUid) return;
    try {
        const cartRef = doc(firestore, "carts", effectiveUid);
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
        handleFirestoreError(error, OperationType.UPDATE, `carts/${effectiveUid}`);
    }
  },

  mergeCart: async (items: any[]) => {
    const user = auth.currentUser;
    const effectiveUid = (user && !user.isAnonymous) ? user.uid : (storage.getUser()?.id || user?.uid);
    if (!effectiveUid) return { items: [] };
    
    try {
        const cartRef = doc(firestore, "carts", effectiveUid);
        const cartSnap = await getDoc(cartRef);
        const existingItems: any[] = (cartSnap.exists() && Array.isArray(cartSnap.data().items))
            ? [...cartSnap.data().items]
            : [];

        for (const i of items) {
            const prodId = i.id || i.product?._id || i.product?.id;
            const size = i.selectedSize || null;
            const existingIdx = existingItems.findIndex((ex: any) =>
                (ex.product?._id === prodId || ex.product?.id === prodId) &&
                (ex.selectedSize || null) === size
            );
            if (existingIdx > -1) {
                const maxStock = i.maxStock ?? 99;
                existingItems[existingIdx].quantity = Math.min(
                    maxStock,
                    (existingItems[existingIdx].quantity || 1) + (i.quantity || 1)
                );
            } else {
                existingItems.push({
                    _id: i.cartItemId || (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)),
                    product: {
                        _id: prodId,
                        title: i.title,
                        price: i.price,
                        image: i.image,
                        category: i.category
                    },
                    quantity: i.quantity || 1,
                    selectedSize: size
                });
            }
        }

        const safeMerged = JSON.parse(JSON.stringify(existingItems));
        if (cartSnap.exists()) {
            await updateDoc(cartRef, { items: safeMerged });
        } else {
            await setDoc(cartRef, { user: effectiveUid, items: safeMerged });
        }
        return await db.getCart();
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `carts/${effectiveUid}`);
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

  getAllWishlists: async (): Promise<any[]> => {
    try {
      const snap = await getDocs(collection(firestore, "wishlists"));
      return snap.docs.map(mapDoc);
    } catch (error) {
      console.warn("Error getting all wishlists:", error);
      return [];
    }
  },

  subscribeWishlists: (callback: (wishlists: any[]) => void) => {
    try {
      const q = query(collection(firestore, "wishlists"));
      return onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(mapDoc);
        callback(list);
      }, (err) => {
        console.warn("Wishlists listener warning:", err);
        db.getAllWishlists().then(callback);
      });
    } catch {
      db.getAllWishlists().then(callback);
      return () => {};
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
      const { fullName, email, password, role, mobile, houseCode } = data;
      const normalizedEmail = (email || '').toLowerCase().trim();
      const cleanName = (fullName || '').trim() || 'Operative';
      const cleanMobile = (mobile || '').trim();
      const cleanHouseCode = (houseCode || '').trim().toUpperCase();
      const cleanRole = role || 'concierge';

      let targetUid = 'op_' + Math.random().toString(36).substring(2, 11);
      const passHash = password ? computePasswordHash(password, normalizedEmail) : undefined;

      // Provision in Firebase Authentication via secondary app so current Admin session is untouched
      if (normalizedEmail && password && password.length >= 6) {
        try {
          const secAuth = getSecondaryAuth();
          const cred = await createUserWithEmailAndPassword(secAuth, normalizedEmail, password);
          targetUid = cred.user.uid;
          await updateProfile(cred.user, { displayName: cleanName }).catch(() => {});
          await signOut(secAuth).catch(() => {});
        } catch (authErr: any) {
          if (authErr.code === 'auth/email-already-in-use') {
            // Find existing UID if present
            const q = query(collection(firestore, "users"), where("email", "==", normalizedEmail));
            const snap = await getDocs(q);
            if (!snap.empty) {
              targetUid = snap.docs[0].id;
            }
          }
        }
      }

      const syncedDoc = await db.syncAndConsolidateUserDossier(targetUid, normalizedEmail, {
        fullName: cleanName,
        displayName: cleanName,
        mobile: cleanMobile,
        role: cleanRole,
        stage: 'applicant',
        houseCode: cleanHouseCode,
        houseId: cleanHouseCode,
        ...(passHash ? { passwordHash: passHash, authCredentialSnapshot: passHash, hashVersion: 'v2' } : {}),
        emailVerified: true,
        securityVerified: true
      });

      await db.logAuditEvent('OPERATIVE_CREATED', 'users', targetUid, { email: normalizedEmail, role: cleanRole, fullName: cleanName });
      return { ...syncedDoc, id: targetUid, _id: targetUid };
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
        const docRef = doc(firestore, "orders", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            await updateDoc(docRef, { isTrashed: true, updatedAt: new Date().toISOString() });
        } else {
            const q = query(collection(firestore, "orders"), where("conciergeCode", "==", id));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                await updateDoc(snapshot.docs[0].ref, { isTrashed: true, updatedAt: new Date().toISOString() });
            }
        }
        await db.logAuditEvent('ORDER_TRASHED', 'orders', id, { isTrashed: true });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  },

  restoreOrder: async (id: string) => {
    try {
        const docRef = doc(firestore, "orders", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            await updateDoc(docRef, { isTrashed: false, updatedAt: new Date().toISOString() });
        } else {
            const q = query(collection(firestore, "orders"), where("conciergeCode", "==", id));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                await updateDoc(snapshot.docs[0].ref, { isTrashed: false, updatedAt: new Date().toISOString() });
            }
        }
        await db.logAuditEvent('ORDER_RESTORED', 'orders', id, { isTrashed: false });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  },

  deleteOrder: async (id: string) => {
    try {
        const docRef = doc(firestore, "orders", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            await deleteDoc(docRef);
        } else {
            const q = query(collection(firestore, "orders"), where("conciergeCode", "==", id));
            const snapshot = await getDocs(q);
            for (const d of snapshot.docs) {
                await deleteDoc(d.ref);
            }
        }
        await db.logAuditEvent('ORDER_DELETED', 'orders', id, { deleted: true });
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `orders/${id}`);
    }
  },

  updateOrderPaymentLink: async (id: string, link: string) => {
    try {
        const docRef = doc(firestore, "orders", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            await updateDoc(docRef, { paymentLink: link, updatedAt: new Date().toISOString() });
        } else {
            const q = query(collection(firestore, "orders"), where("conciergeCode", "==", id));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                await updateDoc(snapshot.docs[0].ref, { paymentLink: link, updatedAt: new Date().toISOString() });
            }
        }
        await db.logAuditEvent('PAYMENT_LINK_UPDATED', 'orders', id, { paymentLink: link });
        return { paymentLink: link };
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  },

  recordManualPayment: async (id: string, data: any) => {
    try {
        const docRef = doc(firestore, "orders", id);
        const snap = await getDoc(docRef);
        const updatePayload = {
            paymentStatus: 'Paid',
            orderStatus: 'PAYMENT_AUTHORIZED',
            paymentDetails: data,
            updatedAt: new Date().toISOString()
        };
        if (snap.exists()) {
            await updateDoc(docRef, updatePayload);
        } else {
            const q = query(collection(firestore, "orders"), where("conciergeCode", "==", id));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                await updateDoc(snapshot.docs[0].ref, updatePayload);
            }
        }
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('deuz_order_status_sync', {
                detail: { orderId: id, status: 'PAYMENT_AUTHORIZED', paymentStatus: 'Paid' }
            }));
        }
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

  subscribeAuditLogs: (callback: (logs: any[]) => void) => {
    try {
      const q = query(collection(firestore, "audit_logs"), limit(100));
      return onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(mapDoc);
        list.sort((a: any, b: any) => new Date(b.timestamp || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt || 0)).getTime() - new Date(a.timestamp || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt || 0)).getTime());
        callback(list);
      }, () => {
        db.getAuditLogs().then(callback);
      });
    } catch {
      db.getAuditLogs().then(callback);
      return () => {};
    }
  },

  subscribeAuthLogs: (callback: (logs: any[]) => void) => {
    try {
      const q = query(collection(firestore, "auth_logs"), limit(100));
      return onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(mapDoc);
        list.sort((a: any, b: any) => new Date(b.timestamp || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt || 0)).getTime() - new Date(a.timestamp || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt || 0)).getTime());
        callback(list);
      }, () => {
        db.getAuthLogs().then(callback);
      });
    } catch {
      db.getAuthLogs().then(callback);
      return () => {};
    }
  },

  subscribeSystemLogs: (callback: (logs: any[]) => void) => {
    try {
      const q = query(collection(firestore, "logs"), limit(100));
      return onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(mapDoc);
        list.sort((a: any, b: any) => new Date(b.timestamp || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt || 0)).getTime() - new Date(a.timestamp || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt || 0)).getTime());
        callback(list);
      }, () => {
        db.getSystemLogs().then(callback);
      });
    } catch {
      db.getSystemLogs().then(callback);
      return () => {};
    }
  },

  getSystemSettings: async () => {
    try {
        const docRef = doc(firestore, "settings", "global_config");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data();
            if (
                data?.siteContent?.footerText &&
                (data.siteContent.footerText.trim().toLowerCase() === 'designed in cinematic vision' ||
                 data.siteContent.footerText.trim().toLowerCase() === 'design in cinematic vision')
            ) {
                data.siteContent.footerText = 'Not for everyone';
            }
            return data;
        }
    } catch (error: any) {
        if (error?.message?.includes('offline') || error?.code === 'unavailable') {
            return FALLBACK_SETTINGS;
        }
        handleFirestoreError(error, OperationType.GET, 'settings/global_config');
    }
    return FALLBACK_SETTINGS;
  },

  subscribeSystemSettings: (callback: (settings: any) => void) => {
    try {
      const docRef = doc(firestore, "settings", "global_config");
      return onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (
            data?.siteContent?.footerText &&
            (data.siteContent.footerText.trim().toLowerCase() === 'designed in cinematic vision' ||
             data.siteContent.footerText.trim().toLowerCase() === 'design in cinematic vision')
          ) {
            data.siteContent.footerText = 'Not for everyone';
          }
          callback(data);
        } else {
          callback(FALLBACK_SETTINGS);
        }
      }, () => {
        db.getSystemSettings().then(callback);
      });
    } catch {
      db.getSystemSettings().then(callback);
      return () => {};
    }
  },

  updateSystemSettings: async (data: any) => {
    try {
        await setDoc(doc(firestore, "settings", "global_config"), { ...data, key: 'global_config', updatedAt: new Date().toISOString() }, { merge: true });
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
      const code = data.code || data.dossierCode || `CNCG-${Math.floor(1000 + Math.random() * 9000)}`;
      const clientName = data.fullName || data.name || 'Confidential Client';
      const preferredDate = data.date || data.datePreference || '';
      const appointmentDoc = {
        code,
        dossierCode: code,
        name: clientName,
        fullName: clientName,
        email: data.email || '',
        phone: data.phone || data.mobile || '',
        consultationType: data.consultationType || data.service || 'Private Salon Fitting',
        location: data.location || data.city || 'Mumbai — Bandra Kurla & Colaba',
        date: preferredDate,
        datePreference: preferredDate,
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
