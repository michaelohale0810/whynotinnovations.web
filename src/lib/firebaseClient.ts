import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Lazy initialization - only initialize when actually accessed
let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;
let _db: Firestore | undefined;

function initializeFirebase() {
  if (_app) {
    return { app: _app, auth: _auth!, db: _db! };
  }

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Check if we have valid config
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error(
      "Firebase configuration is missing. Please set NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variables."
    );
  }

  _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  _auth = getAuth(_app);
  _db = getFirestore(_app);

  return { app: _app, auth: _auth, db: _db };
}

// Export lazy getters using Proxy to initialize on first access
export const app = new Proxy({} as FirebaseApp, {
  get(_target, prop) {
    if (!_app) {
      initializeFirebase();
    }
    return (_app as any)[prop];
  },
}) as FirebaseApp;

export const auth = new Proxy({} as Auth, {
  get(_target, prop) {
    if (!_auth) {
      initializeFirebase();
    }
    return (_auth as any)[prop];
  },
}) as Auth;

export const db = new Proxy({} as Firestore, {
  get(_target, prop) {
    if (!_db) {
      initializeFirebase();
    }
    return (_db as any)[prop];
  },
}) as Firestore;
