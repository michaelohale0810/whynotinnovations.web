import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth, setPersistence, browserLocalPersistence } from "firebase/auth";
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

  // Check if we have valid config with detailed error messages
  const missingVars: string[] = [];
  if (!firebaseConfig.apiKey) missingVars.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!firebaseConfig.authDomain) missingVars.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!firebaseConfig.projectId) missingVars.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (!firebaseConfig.storageBucket) missingVars.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  if (!firebaseConfig.messagingSenderId) missingVars.push("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  if (!firebaseConfig.appId) missingVars.push("NEXT_PUBLIC_FIREBASE_APP_ID");

  if (missingVars.length > 0) {
    const errorMsg = `Firebase configuration is missing the following environment variables: ${missingVars.join(", ")}. ` +
      `If using Firebase Secrets, ensure they are created in Google Secret Manager and referenced in apphosting.yaml. ` +
      `The secret names must match exactly (e.g., secret name "NEXT_PUBLIC_FIREBASE_API_KEY" should match the variable name).`;
    console.error(errorMsg);
    console.error("Current env vars:", {
      hasApiKey: !!firebaseConfig.apiKey,
      hasAuthDomain: !!firebaseConfig.authDomain,
      hasProjectId: !!firebaseConfig.projectId,
      hasStorageBucket: !!firebaseConfig.storageBucket,
      hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
      hasAppId: !!firebaseConfig.appId,
    });
    throw new Error(errorMsg);
  }

  _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  _auth = getAuth(_app);
  _db = getFirestore(_app);

  // Explicitly set persistence to localStorage (default, but being explicit)
  // This ensures auth state persists across page reloads
  if (typeof window !== "undefined") {
    setPersistence(_auth, browserLocalPersistence).catch((error) => {
      console.error("Error setting auth persistence:", error);
    });
  }

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

// For db, we need to ensure it returns the actual Firestore instance
// because Firestore functions like doc() do type checking that doesn't work with Proxy
// We'll initialize it lazily but return the actual instance
export const db = new Proxy({} as Firestore, {
  get(_target, prop) {
    if (!_db) {
      initializeFirebase();
    }
    const value = (_db as any)[prop];
    if (typeof value === 'function') {
      return value.bind(_db);
    }
    return value;
  },
  // These traps help the proxy be recognized as the actual Firestore instance
  getPrototypeOf() {
    if (!_db) {
      initializeFirebase();
    }
    return Object.getPrototypeOf(_db!);
  },
  has(_target, prop) {
    if (!_db) {
      initializeFirebase();
    }
    return prop in (_db as any);
  },
  // This is the key - when the proxy is used as an argument (like doc(db, ...)),
  // we need to return the actual instance
  apply(_target, _thisArg, args) {
    if (!_db) {
      initializeFirebase();
    }
    return (_db as any).apply(_thisArg, args);
  },
}) as Firestore;

// Create a helper function that ensures db is initialized and returns the actual instance
// This can be used when passing db to functions that do strict type checking
export function getDb(): Firestore {
  if (!_db) {
    initializeFirebase();
  }
  return _db!;
}
