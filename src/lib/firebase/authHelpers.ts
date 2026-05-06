/**
 * GATI Firebase Auth Helpers
 * All Firebase calls are lazy — safe to import anywhere.
 * Firebase only initializes in the browser.
 */

import type { User, UserCredential } from 'firebase/auth';

async function getAuth() {
  const { auth } = await import('./config');
  return auth;
}

export const firebaseAuth = {
  async signIn(email: string, password: string): Promise<{ data: UserCredential | null; error: Error | null }> {
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const auth = await getAuth();
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return { data: credential, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  },

  async signInWithGoogle(): Promise<{ data: UserCredential | null; error: Error | null }> {
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const auth = await getAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const credential = await signInWithPopup(auth, provider);
      return { data: credential, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  },

  async signUp(email: string, password: string, displayName?: string): Promise<{ data: UserCredential | null; error: Error | null }> {
    try {
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const auth = await getAuth();
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName && credential.user) {
        await updateProfile(credential.user, { displayName });
      }
      return { data: credential, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  },

  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { signOut } = await import('firebase/auth');
      const auth = await getAuth();
      await signOut(auth);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  },

  async resetPassword(email: string): Promise<{ error: Error | null }> {
    try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      const auth = await getAuth();
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  },

  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    try {
      // Synchronous — only works after Firebase is initialized
      const { auth } = require('./config');
      return auth.currentUser ?? null;
    } catch {
      return null;
    }
  },

  async getIdToken(): Promise<string | null> {
    try {
      const { getIdToken } = await import('firebase/auth');
      const auth = await getAuth();
      const user = auth.currentUser;
      if (!user) return null;
      return await getIdToken(user);
    } catch {
      return null;
    }
  },

  onAuthStateChanged(callback: (user: User | null) => void) {
    if (typeof window === 'undefined') return () => {};
    import('firebase/auth').then(({ onAuthStateChanged }) => {
      import('./config').then(({ auth }) => {
        onAuthStateChanged(auth, callback);
      });
    });
    return () => {};
  },
};
