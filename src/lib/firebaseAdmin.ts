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
        // Try to parse the service account JSON
        // First, try parsing as-is
        let serviceAccountKey: any;
        try {
          serviceAccountKey = JSON.parse(serviceAccountJson);
        } catch (firstParseError: any) {
          // If that fails, try removing outer quotes (common issue when setting secrets)
          let cleanedJson = serviceAccountJson.trim();
          
          // Remove surrounding quotes if present
          if ((cleanedJson.startsWith('"') && cleanedJson.endsWith('"')) ||
              (cleanedJson.startsWith("'") && cleanedJson.endsWith("'"))) {
            cleanedJson = cleanedJson.slice(1, -1);
            // Unescape any escaped quotes
            cleanedJson = cleanedJson.replace(/\\"/g, '"').replace(/\\'/g, "'");
          }
          
          try {
            serviceAccountKey = JSON.parse(cleanedJson);
          } catch (secondParseError: any) {
            // If still failing, provide detailed error
            const error = new Error(
              `Failed to parse FIREBASE_SERVICE_ACCOUNT: ${firstParseError.message}. ` +
              `The value should be a valid JSON object as a single-line string. ` +
              `Make sure there are no extra quotes around the JSON. ` +
              `First 100 chars: ${serviceAccountJson.substring(0, 100)}`
            );
            initializationError = error;
            console.error("Firebase Admin initialization error:", error);
            console.error("Service account JSON length:", serviceAccountJson.length);
            throw error;
          }
        }
        
        // Validate that we have the required fields
        if (!serviceAccountKey.type || !serviceAccountKey.project_id || !serviceAccountKey.private_key) {
          const error = new Error(
            `FIREBASE_SERVICE_ACCOUNT is missing required fields. ` +
            `Expected: type, project_id, private_key. ` +
            `Found: ${Object.keys(serviceAccountKey).join(", ")}`
          );
          initializationError = error;
          console.error("Firebase Admin initialization error:", error);
          throw error;
        }
        
        if (getApps().length === 0) {
          initializeApp({
            credential: cert(serviceAccountKey),
          });
        }
      } catch (parseError: any) {
        // If it's already our custom error, re-throw it
        if (initializationError) {
          throw initializationError;
        }
        // Otherwise create a new error
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

