/**
 * GATI Firebase Auth Helpers
 * Wraps Firebase auth methods for use across the app
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  getIdToken,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const firebaseAuth = {
  // Sign in with email and password
  async signIn(email: string, password: string): Promise<{ data: UserCredential | null; error: Error | null }> {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return { data: credential, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  },

  // Sign in with Google
  async signInWithGoogle(): Promise<{ data: UserCredential | null; error: Error | null }> {
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      return { data: credential, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  },

  // Register with email and password
  async signUp(email: string, password: string, displayName?: string): Promise<{ data: UserCredential | null; error: Error | null }> {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName && credential.user) {
        await updateProfile(credential.user, { displayName });
      }
      return { data: credential, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  },

  // Sign out
  async signOut(): Promise<{ error: Error | null }> {
    try {
      await signOut(auth);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  },

  // Send password reset email
  async resetPassword(email: string): Promise<{ error: Error | null }> {
    try {
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  },

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  // Get ID token for server-side verification
  async getIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    try {
      return await getIdToken(user);
    } catch {
      return null;
    }
  },

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },
};
