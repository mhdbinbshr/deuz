import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { db } from '../utils/db';
import { storage } from '../utils/storage';
import { auth } from '../src/config/firebase';
import { onAuthStateChanged, signInAnonymously, applyActionCode } from "firebase/auth";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db as firestore } from "../src/config/firebase";
import { ADMIN_EMAIL } from "../utils/securityVerification";

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
  confirmPasswordReset: (oobCode: string, newPassword: string) => Promise<AuthResult>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
  sendVerificationEmail: () => Promise<AuthResult>;
  updateProfile: (data: { displayName?: string; photoURL?: string; fullName?: string; mobile?: string }) => Promise<AuthResult>;
  updateEmail: (newEmail: string, currentPassword?: string) => Promise<AuthResult>;
  deleteAccount: (currentPassword?: string) => Promise<AuthResult>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize user state immediately from local storage cache if available
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

  // Initialize session verification on load and check URL for password reset links
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
              console.log('Email verified successfully via deep link');
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
      const isAdmin = cachedInitial.email === ADMIN_EMAIL || cachedInitial.role === 'admin';
      setUser({
        ...cachedInitial,
        role: isAdmin ? 'admin' : (cachedInitial.role || 'user')
      });
    }

    // Set observer on Auth object as recommended by Firebase
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
            const isAdminEmail = firebaseUser.email === ADMIN_EMAIL;
            const cleanName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Client Operative';

            if (userDoc.exists()) {
              const userData = userDoc.data();
              const addressData = userData.address || (userData.addresses && userData.addresses.length > 0 ? userData.addresses[0] : undefined);
              const fullUser: User = {
                id: firebaseUser.uid,
                _id: firebaseUser.uid,
                email: firebaseUser.email || '',
                fullName: userData.fullName || cleanName,
                displayName: userData.displayName || cleanName,
                photoURL: firebaseUser.photoURL || userData.photoURL || undefined,
                emailVerified: firebaseUser.emailVerified || userData.emailVerified || false,
                mobile: userData.mobile || '',
                alternateMobile: addressData?.alternateMobile || '',
                role: isAdminEmail ? 'admin' : (userData.role || 'user'),
                stage: (userData.stage as any) || 'applicant',
                houseCode: userData.houseCode || userData.houseId || '',
                houseId: userData.houseId || userData.houseCode || '',
                address: addressData,
                orders: [], 
                joinedDate: userData.createdAt ? new Date(userData.createdAt.seconds * 1000).toISOString() : new Date().toISOString()
              };
              setUser(fullUser);
              storage.setUser(fullUser);
            } else {
              // Auto-sync dossier in Firestore for user
              const fallbackUser: User = {
                id: firebaseUser.uid,
                _id: firebaseUser.uid,
                email: firebaseUser.email || '',
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

              try {
                setDoc(userDocRef, {
                  id: firebaseUser.uid,
                  uid: firebaseUser.uid,
                  fullName: cleanName,
                  displayName: cleanName,
                  email: (firebaseUser.email || '').toLowerCase().trim(),
                  mobile: '',
                  role: isAdminEmail ? 'admin' : 'user',
                  stage: 'applicant',
                  addresses: [],
                  emailVerified: firebaseUser.emailVerified,
                  createdAt: serverTimestamp(),
                  lastLoginAt: serverTimestamp()
                }, { merge: true }).catch(() => {});
              } catch (e) {}
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
        // If no Firebase User but we have a valid executive session in storage, keep it
        const localUser = storage.getUser();
        if (localUser && isMounted && localUser.role === 'admin') {
          setUser(localUser);
          setIsLoading(false);
        } else {
          if (isMounted) setUser(null);
          // Attempt guest anonymous sign-in for security rules tokens
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

    return () => {
      isMounted = false;
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
        try {
          const exists = await db.checkUserExists(email);
          if (!exists) {
            isUserNotFound = true;
            message = 'No registered dossier found. Please register first.';
          } else {
            message = 'Invalid email or password. Please verify your credentials.';
          }
        } catch {
          message = 'Invalid email or password. Please verify your credentials.';
        }
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Access temporarily restricted for security.';
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

  const confirmPasswordReset = async (oobCode: string, newPassword: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const res = await db.confirmPasswordResetWithFirebase(oobCode, newPassword);
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
