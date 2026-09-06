import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { db } from '../utils/db';
import { storage } from '../utils/storage';
import { auth } from '../src/config/firebase';
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { db as firestore } from "../src/config/firebase";

interface AuthResult {
  success: boolean;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<AuthResult>;
  loginWithGoogle: () => Promise<AuthResult>;
  signup: (userData: Omit<User, 'id' | 'joinedDate' | 'orders'>) => Promise<AuthResult>;
  forgotPassword: (email: string) => Promise<AuthResult>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize user state immediately from local storage cache if available
  const [user, setUser] = useState<User | null>(() => storage.getUser());
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Initialize session verification on load
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      // 1. Verify token or cached session
      try {
        const currentUser = await db.getCurrentUser();
        if (currentUser && isMounted) {
          const isAdmin = currentUser.email === 'unk410066@gmail.com' || 
                          currentUser.email === 'muhammadbinbasheer777@gmail.com' ||
                          currentUser.role === 'admin';
          setUser({
            ...currentUser,
            role: isAdmin ? 'admin' : (currentUser.role || 'user')
          });
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Session verification fallback:', err);
      }

      // 2. Firebase Auth Listener
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
              const isAdminEmail = firebaseUser.email === 'muhammadbinbasheer777@gmail.com' || 
                                   firebaseUser.email === 'unk410066@gmail.com';
              if (userDoc.exists()) {
                const userData = userDoc.data();
                const addressData = userData.address || (userData.addresses && userData.addresses.length > 0 ? userData.addresses[0] : undefined);
                const fullUser: User = {
                  id: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  fullName: userData.fullName || 'Client Operative',
                  mobile: userData.mobile || '',
                  alternateMobile: addressData?.alternateMobile || '',
                  role: isAdminEmail ? 'admin' : (userData.role || 'user'),
                  address: addressData,
                  orders: [], 
                  joinedDate: userData.createdAt ? new Date(userData.createdAt.seconds * 1000).toISOString() : new Date().toISOString()
                };
                setUser(fullUser);
                storage.setUser(fullUser);
              } else {
                const fallbackUser: User = {
                  id: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  fullName: firebaseUser.displayName || 'Client Operative',
                  mobile: '',
                  role: isAdminEmail ? 'admin' : 'user',
                  orders: [],
                  joinedDate: new Date().toISOString()
                };
                setUser(fallbackUser);
                storage.setUser(fallbackUser);
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
          // If no Firebase User but we have a valid session in storage, keep it
          const localUser = storage.getUser();
          if (localUser && isMounted) {
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
        unsubscribeAuth();
        if (unsubscribeProfile) unsubscribeProfile();
      };
    };

    initAuth();

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
      setIsAuthModalOpen(false);
      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      console.error("Login failed", error);
      setIsLoading(false);
      let message = error.message || 'Invalid email or passkey. Please verify your credentials.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        message = 'Invalid email or passkey. Please verify your credentials.';
      } else if (error.code === 'auth/user-not-found') {
        message = 'No account located for this email. Please establish an identity first.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Access temporarily restricted for security.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      }
      return { success: false, message };
    }
  };

  const loginWithGoogle = async (): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const googleUser = await db.loginUserWithGoogle(); 
      setUser(googleUser as User);
      setIsAuthModalOpen(false);
      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      console.error("Google login failed", error);
      setIsLoading(false);
      let message = error.message || 'Authentication failed';
      if (error.code === 'auth/operation-not-allowed') {
        message = 'Google Sign-In is not enabled in Firebase Authentication.';
      } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        message = 'Google sign-in popup was closed.';
      }
      return { success: false, message };
    }
  };

  const signup = async (userData: Omit<User, 'id' | 'joinedDate' | 'orders'>): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const newUser = await db.registerUser(userData);
      setUser(newUser as User);
      setIsAuthModalOpen(false);
      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      console.error("Signup failed", error);
      setIsLoading(false);
      let message = error.message || 'Registration failed. Please check your details.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'An account is already linked to this email. Please initialize session.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Passcode must be at least 6 characters in length.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      }
      return { success: false, message };
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
      return { success: false, message: e.message || 'Passcode recovery failed' };
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
      openAuthModal: () => setIsAuthModalOpen(true),
      closeAuthModal: () => setIsAuthModalOpen(false),
      login,
      loginWithGoogle,
      signup,
      forgotPassword,
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
