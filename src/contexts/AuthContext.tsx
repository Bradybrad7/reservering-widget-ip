/**
 * Firebase Authentication Context Provider
 * Handles user authentication and admin authorization
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User 
} from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdminStatus = async (currentUser: User) => {
    try {
      const idTokenResult = await currentUser.getIdTokenResult();
      const adminClaim = !!idTokenResult.claims.admin;
      setIsAdmin(adminClaim);
      return adminClaim;
    } catch (error) {
      console.error('❌ Failed to check admin status:', error);
      setIsAdmin(false);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        await checkAdminStatus(currentUser);
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const adminStatus = await checkAdminStatus(userCredential.user);
      
      if (!adminStatus) {
        await firebaseSignOut(auth);
        throw new Error('Geen admin rechten');
      }
      
      console.log('✅ Admin ingelogd:', email);
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      throw new Error(error.message || 'Login mislukt');
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setIsAdmin(false);
      console.log('✅ Uitgelogd');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      throw error;
    }
  };

  const refreshAdminStatus = async () => {
    if (user) {
      await checkAdminStatus(user);
    }
  };

  const value = {
    user,
    isAdmin,
    loading,
    signIn,
    signOut,
    refreshAdminStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Export convenient hooks
export const useIsAdmin = () => useAuth().isAdmin;
export const useUser = () => useAuth().user;
export const useAuthLoading = () => useAuth().loading;
