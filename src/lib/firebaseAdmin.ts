import { initializeApp, getApps, cert, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin SDK
let adminAuth: ReturnType<typeof getAuth> | null = null;
let initializationError: Error | null = null;

function initializeAdmin() {
  if (adminAuth) {
    return adminAuth;
  }

  if (initializationError) {
    throw initializationError;
  }

  try {
    // Check if we have service account credentials as JSON string
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccountJson) {
      try {
        // Parse the service account JSON
        const serviceAccountKey = JSON.parse(serviceAccountJson);
        
        if (getApps().length === 0) {
          initializeApp({
            credential: cert(serviceAccountKey),
          });
        }
      } catch (parseError: any) {
        const error = new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT: ${parseError.message}`);
        initializationError = error;
        console.error("Firebase Admin initialization error:", error);
        throw error;
      }
    } else {
      // Use Application Default Credentials (works on Firebase hosting/Cloud Functions)
      // Or use environment variables for individual credentials
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      
      if (projectId) {
        if (getApps().length === 0) {
          initializeApp({
            projectId,
            credential: applicationDefault(),
          });
        }
      } else {
        // Fallback: try to initialize with default credentials
        if (getApps().length === 0) {
          initializeApp();
        }
      }
    }
    
    adminAuth = getAuth();
    return adminAuth;
  } catch (error: any) {
    initializationError = error;
    console.error("Firebase Admin initialization error:", error);
    console.error("Error details:", {
      hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
      hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      serviceAccountLength: process.env.FIREBASE_SERVICE_ACCOUNT?.length || 0,
    });
    throw error;
  }
}

// Initialize on module load
try {
  initializeAdmin();
} catch (error) {
  // Error will be thrown when adminAuth is accessed
  console.error("Failed to initialize Firebase Admin SDK on module load:", error);
}

export { adminAuth, initializeAdmin };

