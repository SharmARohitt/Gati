/**
 * GATI Firebase Configuration
 * Lazy initialization — Firebase only runs in the browser, never during SSR/build.
 * This prevents Vercel build failures when env vars aren't available at build time.
 */

import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';

// These are module-level lazy references
let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;

function getFirebaseApp(): FirebaseApp {
  if (_app) return _app;

  // Only initialize in browser
  if (typeof window === 'undefined') {
    throw new Error('Firebase cannot be initialized on the server');
  }

  const { initializeApp, getApps, getApp } = require('firebase/app');

  const config = {
    apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  _app = getApps().length === 0 ? initializeApp(config) : getApp();
  return _app!;
}

function getFirebaseAuth(): Auth {
  if (_auth) return _auth;

  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth cannot be initialized on the server');
  }

  const { getAuth } = require('firebase/auth');
  _auth = getAuth(getFirebaseApp());
  return _auth!;
}

// Proxy objects — safe to import anywhere, only initialize when accessed in browser
export const app = new Proxy({} as FirebaseApp, {
  get(_target, prop) {
    return (getFirebaseApp() as any)[prop];
  },
});

export const auth = new Proxy({} as Auth, {
  get(_target, prop) {
    return (getFirebaseAuth() as any)[prop];
  },
});

export default app;
