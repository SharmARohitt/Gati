'use client';

/**
 * GATI Auth Provider — Firebase
 * Replaces Supabase auth entirely
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { firebaseAuth } from '@/lib/firebase/authHelpers';

// Normalized app user
interface AppUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  fullName: string;
  avatarUrl?: string;
  photoURL?: string;
}

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeUser(fbUser: FirebaseUser): AppUser {
  const email = fbUser.email || '';
  // Use displayName if set (Google auth), otherwise format email nicely
  // e.g. "sharmaa.rohit2005@gmail.com" → "Sharmaa Rohit"
  let displayName = fbUser.displayName;
  if (!displayName) {
    const localPart = email.split('@')[0]; // e.g. "sharmaa.rohit2005"
    // Remove trailing numbers and split on dots/underscores
    const cleaned = localPart.replace(/\d+$/, '').replace(/[._]/g, ' ').trim();
    // Capitalize each word
    displayName = cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || email;
  }
  return {
    id: fbUser.uid,
    username: displayName,
    email,
    role: 'admin',
    fullName: displayName,
    avatarUrl: fbUser.photoURL || undefined,
    photoURL: fbUser.photoURL || undefined,
  };
}

export function AuthProviderWrapper({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const { data, error } = await firebaseAuth.signIn(email, password);
    if (error) {
      // Make Firebase error messages user-friendly
      const msg = error.message.includes('wrong-password') || error.message.includes('invalid-credential')
        ? 'Invalid email or password.'
        : error.message.includes('user-not-found')
        ? 'No account found with this email.'
        : error.message.includes('too-many-requests')
        ? 'Too many attempts. Please try again later.'
        : 'Login failed. Please try again.';
      return { success: false, error: msg };
    }
    return { success: !!data };
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    const { data, error } = await firebaseAuth.signInWithGoogle();
    if (error) {
      if (error.message.includes('popup-closed')) return { success: false, error: 'Sign-in cancelled.' };
      return { success: false, error: 'Google sign-in failed. Please try again.' };
    }
    return { success: !!data };
  };

  const logout = async () => {
    await firebaseAuth.signOut();
  };

  const user = firebaseUser ? normalizeUser(firebaseUser) : null;

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      isAuthenticated: !!firebaseUser,
      isLoading,
      login,
      loginWithGoogle,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProviderWrapper');
  }
  return context;
}
