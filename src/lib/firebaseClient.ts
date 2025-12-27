import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Only initialize if we have valid, non-empty config values
// This prevents build-time errors when env vars are missing
let _app: ReturnType<typeof initializeApp> | undefined;
let _auth: ReturnType<typeof getAuth> | undefined;
let _db: ReturnType<typeof getFirestore> | undefined;

if (
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "" &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== ""
) {
  try {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    _auth = getAuth(_app);
    _db = getFirestore(_app);
  } catch (error) {
    // Silently fail during build - will be initialized at runtime
    if (process.env.NODE_ENV !== "production" || typeof window !== "undefined") {
      console.warn("Firebase initialization failed:", error);
    }
  }
}

// Export - will throw at runtime if not initialized, but won't break build
export const app = _app!;
export const auth = _auth!;
export const db = _db!;
