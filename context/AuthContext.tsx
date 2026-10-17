import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { db } from '../utils/db';
import { storage } from '../utils/storage';
import { auth } from '../src/config/firebase';
import { onAuthStateChanged, signInAnonymously, applyActionCode } from "firebase/auth";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db as firestore } from "../src/config/firebase";
import { ADMIN_EMAIL, isExecutiveAdminEmail, SecurityVerificationPurpose } from "../utils/securityVerification";

export interface AuthResult {
  success: boolean;
  message?: string;
  user?: User;
  isNewUser?: boolean;
  isUserNotFound?: boolean;
}

export interface SignUpData {
  fullName: string;
  email: string;
  password: string;
  mobile?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup' | 'forgot' | 'resetConfirm';
  authModalCode: string;
  openAuthModal: (mode?: 'login' | 'signup' | 'forgot' | 'resetConfirm', code?: string) => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<AuthResult>;
  loginWithGoogle: () => Promise<AuthResult>;
  signup: (userData: SignUpData) => Promise<AuthResult>;
  forgotPassword: (email: string) => Promise<AuthResult>;
  confirmPasswordReset: (oobCode: string, newPassword: string, emailHint?: string) => Promise<AuthResult>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
  sendVerificationEmail: () => Promise<AuthResult>;
  requestSecurityCode: (email: string, purpose?: SecurityVerificationPurpose) => Promise<AuthResult>;
  verifySecurityCode: (email: string, code: string) => Promise<AuthResult>;
  updateProfile: (data: { displayName?: string; photoURL?: string; fullName?: string; mobile?: string }) => Promise<AuthResult>;
  updateEmail: (newEmail: string, currentPassword?: string) => Promise<AuthResult>;
  deleteAccount: (currentPassword?: string) => Promise<AuthResult>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => storage.getUser());
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'forgot' | 'resetConfirm'>('login');
  const [authModalCode, setAuthModalCode] = useState('');

  const openAuthModal = (mode: 'login' | 'signup' | 'forgot' | 'resetConfirm' = 'login', code: string = '') => {
    setAuthModalMode(mode);
    setAuthModalCode(code);
    setIsAuthModalOpen(true);
  };

  useEffect(() => {
    let isMounted = true;

    // Check if user came from a Firebase password reset email link or email verification
    if (typeof window !== 'undefined') {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash);
        const modeParam = searchParams.get('mode') || hashParams.get('mode');
        const codeParam = searchParams.get('oobCode') || hashParams.get('oobCode') || searchParams.get('code') || hashParams.get('code');

        if ((modeParam === 'resetPassword' || modeParam === 'action') && codeParam) {
          openAuthModal('resetConfirm', codeParam);
        } else if (modeParam === 'verifyEmail' && codeParam) {
          applyActionCode(auth, codeParam)
            .then(() => {
              const currentCached = storage.getUser();
              if (currentCached) {
                const updated = { ...currentCached, emailVerified: true };
                storage.setUser(updated);
                setUser(updated);
              }
            })
            .catch((err) => console.warn('Action code verification error:', err));
        } else if (codeParam) {
          openAuthModal('resetConfirm', codeParam);
        }
      } catch (e) {}
    }

    // Initialize initial user from storage cache for immediate render
    const cachedInitial = storage.getUser();
    if (cachedInitial && isMounted) {
      const isAdmin = isExecutiveAdminEmail(cachedInitial.email) || cachedInitial.role === 'admin';
      setUser({
        ...cachedInitial,
        role: isAdmin ? 'admin' : (cachedInitial.role || 'user')
      });
    }

    // Set observer on Auth object and Firestore user document
    let unsubscribeProfile: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser && !firebaseUser.isAnonymous) {
        try {
          const userDocRef = doc(firestore, "users", firebaseUser.uid);
          unsubscribeProfile = onSnapshot(userDocRef, (userDoc) => {
            if (!isMounted) return;
            const isAdminEmail = isExecutiveAdminEmail(firebaseUser.email || '');
            const cleanName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Client Operative';

            if (userDoc.exists()) {
              const userData = userDoc.data();
              const addressData = userData.address || (userData.addresses && userData.addresses.length > 0 ? userData.addresses[0] : undefined);
              let joinedIso = new Date().toISOString();
              if (userData.createdAt?.seconds) {
                joinedIso = new Date(userData.createdAt.seconds * 1000).toISOString();
              } else if (typeof userData.createdAt === 'string') {
                joinedIso = userData.createdAt;
              } else if (typeof userData.joinedDate === 'string') {
                joinedIso = userData.joinedDate;
              }

              const fullUser: User = {
                id: firebaseUser.uid,
                _id: firebaseUser.uid,
                email: (firebaseUser.email || userData.email || '').toLowerCase().trim(),
                fullName: userData.fullName || cleanName,
                displayName: userData.displayName || userData.fullName || cleanName,
                photoURL: firebaseUser.photoURL || userData.photoURL || undefined,
                emailVerified: Boolean(firebaseUser.emailVerified || userData.emailVerified || userData.securityVerified),
                mobile: userData.mobile || '',
                alternateMobile: addressData?.alternateMobile || userData.alternateMobile || '',
                role: isAdminEmail ? 'admin' : (userData.role || 'user'),
                stage: (userData.stage as any) || 'applicant',
                houseCode: userData.houseCode || userData.houseId || '',
                houseId: userData.houseId || userData.houseCode || '',
                address: addressData,
                orders: [], 
                joinedDate: joinedIso
              };
              setUser(fullUser);
              storage.setUser(fullUser);
            } else {
              // Auto-sync & consolidate dossier in Firestore for user
              const fallbackUser: User = {
                id: firebaseUser.uid,
                _id: firebaseUser.uid,
                email: (firebaseUser.email || '').toLowerCase().trim(),
                fullName: cleanName,
                displayName: cleanName,
                photoURL: firebaseUser.photoURL || undefined,
                emailVerified: firebaseUser.emailVerified,
                mobile: '',
                role: isAdminEmail ? 'admin' : 'user',
                stage: 'applicant',
                houseCode: '',
                houseId: '',
                orders: [],
                joinedDate: new Date().toISOString()
              };
              setUser(fallbackUser);
              storage.setUser(fallbackUser);

              db.syncAndConsolidateUserDossier(firebaseUser.uid, firebaseUser.email || '', {
                fullName: cleanName,
                displayName: cleanName,
                emailVerified: firebaseUser.emailVerified
              }).catch(() => {});
            }
            setIsLoading(false);
          }, (error) => {
            console.warn("User profile listener warning:", error);
            setIsLoading(false);
          });
        } catch (e) {
          console.error("Error setting up user profile listener:", e);
          setIsLoading(false);
        }
      } else {
        // Check if we have an active verified session in local storage (e.g. after security code login or admin session)
        const localUser = storage.getUser();
        const localToken = storage.getToken();
        if (localUser && localToken && isMounted) {
          setUser(localUser);
          // Attach Firestore listener for localUser.id so profile changes sync in real time
          try {
            const userDocRef = doc(firestore, "users", localUser.id);
            unsubscribeProfile = onSnapshot(userDocRef, (userDoc) => {
              if (!isMounted || !userDoc.exists()) return;
              const userData = userDoc.data();
              const isAdminEmail = isExecutiveAdminEmail(localUser.email || userData.email || '');
              const addressData = userData.address || (userData.addresses && userData.addresses.length > 0 ? userData.addresses[0] : localUser.address);
              const syncedUser: User = {
                ...localUser,
                id: userDoc.id,
                _id: userDoc.id,
                email: (userData.email || localUser.email || '').toLowerCase().trim(),
                fullName: userData.fullName || localUser.fullName,
                displayName: userData.displayName || userData.fullName || localUser.displayName,
                mobile: userData.mobile ?? localUser.mobile ?? '',
                role: isAdminEmail ? 'admin' : (userData.role || localUser.role || 'user'),
                stage: (userData.stage as any) || localUser.stage || 'applicant',
                houseCode: userData.houseCode || userData.houseId || '',
                houseId: userData.houseId || userData.houseCode || '',
                emailVerified: Boolean(userData.emailVerified || userData.securityVerified || localUser.emailVerified),
                address: addressData
              };
              setUser(syncedUser);
              storage.setUser(syncedUser);
            });
          } catch {}
          setIsLoading(false);
        } else {
          if (isMounted) setUser(null);
          try {
            await signInAnonymously(auth);
          } catch (e: any) {
            // Expected if anonymous sign-in is disabled
          }
          if (isMounted) setIsLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const refreshUser = async () => {
    try {
      const currentUser = await db.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (e) {
      console.warn("Refresh user error:", e);
    }
  };

  const login = async (email: string, password: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const loggedUser = await db.loginUser(email, password);
      setUser(loggedUser as User);
      setIsLoading(false);
      return { success: true, user: loggedUser as User };
    } catch (error: any) {
      console.error("Login failed", error);
      setIsLoading(false);
      let message = error.message || 'Authentication error. Please verify your details.';
      let isUserNotFound = false;

      if (error.code === 'auth/user-not-found') {
        message = 'No account found for this email address. Please register first.';
        isUserNotFound = true;
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        message = error.message || 'Incorrect password for this account. Please verify your password or use Forgot Password.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Access temporarily restricted for security. You may also reset your password.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      }
      return { success: false, message, isUserNotFound };
    }
  };

  const loginWithGoogle = async (): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const googleUser = await db.loginUserWithGoogle(); 
      setUser(googleUser as User);
      setIsLoading(false);
      return { success: true, user: googleUser as User };
    } catch (error: any) {
      console.error("Google login failed", error);
      setIsLoading(false);
      let message = error.message || 'Authentication failed';
      if (error.code === 'auth/operation-not-allowed') {
        message = 'Google Sign-In is not enabled on this system.';
      } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        message = 'Google sign-in popup was closed.';
      }
      return { success: false, message };
    }
  };

  const signup = async (userData: SignUpData): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const newUser = await db.registerUser({
        fullName: userData.fullName,
        email: userData.email,
        password: userData.password,
        mobile: userData.mobile
      });
      setUser(newUser as User);
      setIsLoading(false);
      return { success: true, user: newUser as User };
    } catch (error: any) {
      console.error("Signup failed", error);
      setIsLoading(false);
      let message = error.message || 'Registration failed. Please check your details.';
      let isExistingUser = false;
      if (error.code === 'auth/email-already-in-use') {
        message = 'An account is already linked to this email address. Please sign in instead.';
        isExistingUser = true;
      } else if (error.code === 'auth/weak-password') {
        message = 'Password must be at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Network connection issue. Please check your internet connection.';
      } else if (error.code === 'auth/operation-not-allowed') {
        message = 'Email and password registration is currently unavailable.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please wait a moment before trying again.';
      }
      return { success: false, message, isNewUser: !isExistingUser };
    }
  };

  const forgotPassword = async (email: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const res = await db.resetPasswordWithFirebase(email);
      setIsLoading(false);
      return res;
    } catch (e: any) {
      setIsLoading(false);
      return { success: false, message: e.message || 'Password recovery failed' };
    }
  };

  const confirmPasswordReset = async (oobCode: string, newPassword: string, emailHint?: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const res = await db.confirmPasswordResetWithFirebase(oobCode, newPassword, emailHint);
      setIsLoading(false);
      return res;
    } catch (e: any) {
      setIsLoading(false);
      return { success: false, message: e.message || 'Password update failed' };
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const res = await db.updateCurrentUserPassword(currentPassword, newPassword);
      setIsLoading(false);
      return res;
    } catch (e: any) {
      setIsLoading(false);
      return { success: false, message: e.message || 'Password change failed' };
    }
  };

  const sendVerificationEmail = async (): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const res = await db.sendVerificationEmail();
      setIsLoading(false);
      return res;
    } catch (e: any) {
      setIsLoading(false);
      return { success: false, message: e.message || 'Verification dispatch failed' };
    }
  };

  const requestSecurityCode = async (email: string, purpose: SecurityVerificationPurpose = 'EMAIL_VERIFICATION'): Promise<AuthResult> => {
    try {
      const res = await db.requestSecurityVerificationCode(email, purpose);
      return { success: res.success, message: res.message };
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to dispatch verification link.' };
    }
  };

  const verifySecurityCode = async (email: string, code: string): Promise<AuthResult> => {
    try {
      const res = await db.verifyUserSecurityCode(email, code);
      if (res.success && user) {
        const updated = { ...user, emailVerified: true };
        setUser(updated);
        storage.setUser(updated);
      }
      return { success: res.success, message: res.message };
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to verify security code.' };
    }
  };

  const updateProfile = async (data: { displayName?: string; photoURL?: string; fullName?: string; mobile?: string }): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const res = await db.updateCurrentAuthProfile(data);
      if (res.success && res.user) {
        setUser(res.user);
      }
      setIsLoading(false);
      return res;
    } catch (e: any) {
      setIsLoading(false);
      return { success: false, message: e.message || 'Profile update failed' };
    }
  };

  const updateEmail = async (newEmail: string, currentPassword?: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const res = await db.updateUserEmail(newEmail, currentPassword);
      if (res.success && user) {
        setUser({ ...user, email: newEmail.toLowerCase().trim() });
      }
      setIsLoading(false);
      return res;
    } catch (e: any) {
      setIsLoading(false);
      return { success: false, message: e.message || 'Email update failed' };
    }
  };

  const deleteAccount = async (currentPassword?: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const res = await db.deleteCurrentUserAccount(currentPassword);
      if (res.success) {
        setUser(null);
      }
      setIsLoading(false);
      return res;
    } catch (e: any) {
      setIsLoading(false);
      return { success: false, message: e.message || 'Account deletion failed' };
    }
  };

  const logout = async () => {
    await db.logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthModalOpen,
      authModalMode,
      authModalCode,
      openAuthModal,
      closeAuthModal: () => setIsAuthModalOpen(false),
      login,
      loginWithGoogle,
      signup,
      forgotPassword,
      confirmPasswordReset,
      updatePassword,
      sendVerificationEmail,
      requestSecurityCode,
      verifySecurityCode,
      updateProfile,
      updateEmail,
      deleteAccount,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    const fallback: AuthContextType = {
      user: storage.getUser(),
      isLoading: false,
      isAuthModalOpen: false,
      authModalMode: 'login',
      authModalCode: '',
      openAuthModal: () => {},
      closeAuthModal: () => {},
      login: async () => ({ success: false, message: 'Initializing auth...' }),
      loginWithGoogle: async () => ({ success: false, message: 'Initializing auth...' }),
      signup: async () => ({ success: false, message: 'Initializing auth...' }),
      forgotPassword: async () => ({ success: false, message: 'Initializing auth...' }),
      confirmPasswordReset: async () => ({ success: false, message: 'Initializing auth...' }),
      updatePassword: async () => ({ success: false, message: 'Initializing auth...' }),
      sendVerificationEmail: async () => ({ success: false, message: 'Initializing auth...' }),
      requestSecurityCode: async () => ({ success: false, message: 'Initializing auth...' }),
      verifySecurityCode: async () => ({ success: false, message: 'Initializing auth...' }),
      updateProfile: async () => ({ success: false, message: 'Initializing auth...' }),
      updateEmail: async () => ({ success: false, message: 'Initializing auth...' }),
      deleteAccount: async () => ({ success: false, message: 'Initializing auth...' }),
      logout: () => {},
      refreshUser: async () => {}
    };
    return fallback;
  }
  return context;
};
