import { initializeApp, getApps, cert, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin SDK
let adminAuth: ReturnType<typeof getAuth>;

if (getApps().length === 0) {
  try {
    // Check if we have service account credentials as JSON string
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccountJson) {
      // Parse the service account JSON
      const serviceAccountKey = JSON.parse(serviceAccountJson);
      
      initializeApp({
        credential: cert(serviceAccountKey),
      });
    } else {
      // Use Application Default Credentials (works on Firebase hosting/Cloud Functions)
      // Or use environment variables for individual credentials
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      
      if (projectId) {
        initializeApp({
          projectId,
          credential: applicationDefault(),
        });
      } else {
        // Fallback: try to initialize with default credentials
        initializeApp();
      }
    }
    
    adminAuth = getAuth();
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    // Create a mock auth object to prevent crashes
    // In production, ensure proper credentials are set
    adminAuth = getAuth();
  }
} else {
  adminAuth = getAuth();
}

export { adminAuth };

