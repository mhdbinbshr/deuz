
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { db } from '../utils/db';
import { auth } from '../src/config/firebase';
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
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
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // --- Firebase Auth Listener ---
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        if (firebaseUser.isAnonymous) {
            // Guest User - We treat as null in UI but they have auth tokens for DB rules
            setUser(null);
            setIsLoading(false);
        } else {
            try {
              // Fetch additional profile data from Firestore 'users' collection
              const userDocRef = doc(firestore, "users", firebaseUser.uid);
              
              unsubscribeProfile = onSnapshot(userDocRef, (userDoc) => {
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  const isAdminEmail = firebaseUser.email === 'muhammadbinbasheer777@gmail.com' || firebaseUser.email === 'unk410066@gmail.com';
                  const addressData = userData.address || (userData.addresses && userData.addresses.length > 0 ? userData.addresses[0] : undefined);
                  setUser({
                    id: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    fullName: userData.fullName || 'User',
                    mobile: userData.mobile || '',
                    alternateMobile: addressData?.alternateMobile || '',
                    role: isAdminEmail ? 'admin' : (userData.role || 'user'),
                    address: addressData,
                    orders: [], 
                    joinedDate: userData.createdAt ? new Date(userData.createdAt.seconds * 1000).toISOString() : new Date().toISOString()
                  });
                } else {
                  // Fallback
                  const isAdminEmail = firebaseUser.email === 'muhammadbinbasheer777@gmail.com' || firebaseUser.email === 'unk410066@gmail.com';
                  setUser({
                    id: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    fullName: firebaseUser.displayName || 'User',
                    mobile: '',
                    role: isAdminEmail ? 'admin' : 'user',
                    orders: [],
                    joinedDate: new Date().toISOString()
                  });
                }
                setIsLoading(false);
              }, (error) => {
                console.error("Error fetching user profile:", error);
                setIsLoading(false);
              });
            } catch (e) {
              console.error("Error setting up user profile listener:", e);
              setIsLoading(false);
            }
        }
      } else {
        // No user -> Attempt to sign in anonymously
        setUser(null);
        try {
            await signInAnonymously(auth);
        } catch (e: any) {
            if (e.code === 'auth/admin-restricted-operation') {
                console.warn("Guest login disabled in Firebase Console. App running in public view mode (Read-Only).");
            } else {
                console.error("Auto-guest login failed", e);
            }
        }
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const refreshUser = async () => {
    // Trigger re-render or data fetch if needed
  };

  const login = async (email: string, password: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
        await db.loginUser(email, password);
        setIsAuthModalOpen(false);
        return { success: true };
    } catch (error: any) {
        console.error("Login failed", error);
        setIsLoading(false);
        return { success: false, message: error.message || 'Invalid credentials' };
    }
  };

  const loginWithGoogle = async (): Promise<AuthResult> => {
    setIsLoading(true);
    try {
        await db.loginUserWithGoogle("mock", "mock"); 
        setIsAuthModalOpen(false);
        return { success: true };
    } catch (error: any) {
        console.error("Google login failed", error);
        setIsLoading(false);
        let message = error.message || 'Authentication failed';
        if (error.code === 'auth/operation-not-allowed') {
            message = 'Google Sign-In is not enabled. Please enable it in the Firebase Console under Authentication > Sign-in method.';
        }
        return { success: false, message };
    }
  };

  const signup = async (userData: Omit<User, 'id' | 'joinedDate' | 'orders'>): Promise<AuthResult> => {
    setIsLoading(true);
    try {
        await db.registerUser(userData);
        setIsAuthModalOpen(false);
        return { success: true };
    } catch (error: any) {
        console.error("Signup failed", error);
        setIsLoading(false);
        return { success: false, message: error.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    await db.logoutUser();
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
