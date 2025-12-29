import { NextRequest, NextResponse } from "next/server";
import { adminAuth, initializeAdmin } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

// Get Firestore instance (will be initialized when needed)
function getAdminDb() {
  try {
    if (!adminAuth) {
      initializeAdmin();
    }
    return getFirestore();
  } catch (error) {
    console.error("Failed to initialize Firestore:", error);
    throw error;
  }
}

/**
 * Check if a user is an admin using Admin SDK
 */
async function isAdmin(userId: string): Promise<boolean> {
  try {
    const adminDb = getAdminDb();
    const adminDoc = await adminDb.collection("admins").doc(userId).get();
    return adminDoc.exists;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Verify ID token and get user ID
 */
async function verifyIdToken(idToken: string): Promise<string | null> {
  try {
    let authInstance = adminAuth;
    if (!authInstance) {
      authInstance = initializeAdmin();
    }
    const decodedToken = await authInstance.verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    console.error("Error verifying ID token:", error);
    return null;
  }
}

/**
 * GET - List all users (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Ensure adminAuth is initialized
    let authInstance = adminAuth;
    if (!authInstance) {
      try {
        authInstance = initializeAdmin();
      } catch (initError: any) {
        console.error("Firebase Admin Auth initialization failed:", initError);
        return NextResponse.json(
          { error: `Server configuration error: Firebase Admin SDK not initialized. ${initError.message || "Please check FIREBASE_SERVICE_ACCOUNT environment variable."}` },
          { status: 500 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const idToken = searchParams.get("idToken");

    if (!idToken) {
      return NextResponse.json(
        { error: "Unauthorized: ID token required" },
        { status: 401 }
      );
    }

    let userId: string | null;
    try {
      userId = await verifyIdToken(idToken);
    } catch (error: any) {
      console.error("Token verification error:", error);
      return NextResponse.json(
        { error: "Unauthorized: Invalid or expired ID token" },
        { status: 401 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid ID token" },
        { status: 401 }
      );
    }

    // Check if requesting user is admin
    let adminStatus: boolean;
    try {
      adminStatus = await isAdmin(userId);
    } catch (error: any) {
      console.error("Error checking admin status:", error);
      return NextResponse.json(
        { error: "Failed to verify admin status" },
        { status: 500 }
      );
    }

    if (!adminStatus) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // List all users using Firebase Admin SDK
    let listUsersResult;
    try {
      listUsersResult = await authInstance.listUsers();
    } catch (error: any) {
      console.error("Error listing users from Firebase Admin:", error);
      return NextResponse.json(
        { error: `Failed to list users: ${error.message || "Unknown error"}` },
        { status: 500 }
      );
    }
    
    // Check admin status for each user
    const usersWithAdminStatus = await Promise.all(
      listUsersResult.users.map(async (userRecord) => {
        try {
          const userIsAdmin = await isAdmin(userRecord.uid);
          return {
            uid: userRecord.uid,
            email: userRecord.email,
            emailVerified: userRecord.emailVerified,
            disabled: userRecord.disabled,
            isAdmin: userIsAdmin,
            metadata: {
              creationTime: userRecord.metadata.creationTime,
              lastSignInTime: userRecord.metadata.lastSignInTime,
            },
          };
        } catch (error: any) {
          console.error(`Error checking admin status for user ${userRecord.uid}:`, error);
          // Return user without admin status if check fails
          return {
            uid: userRecord.uid,
            email: userRecord.email,
            emailVerified: userRecord.emailVerified,
            disabled: userRecord.disabled,
            isAdmin: false,
            metadata: {
              creationTime: userRecord.metadata.creationTime,
              lastSignInTime: userRecord.metadata.lastSignInTime,
            },
          };
        }
      })
    );

    return NextResponse.json({ users: usersWithAdminStatus });
  } catch (error: any) {
    console.error("Error listing users:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: `Failed to list users: ${error.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new user account (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Ensure adminAuth is initialized
    let authInstance = adminAuth;
    if (!authInstance) {
      try {
        authInstance = initializeAdmin();
      } catch (initError: any) {
        console.error("Firebase Admin Auth initialization failed:", initError);
        return NextResponse.json(
          { error: `Server configuration error: Firebase Admin SDK not initialized. ${initError.message || "Please check FIREBASE_SERVICE_ACCOUNT environment variable."}` },
          { status: 500 }
        );
      }
    }

    const body = await request.json();
    const { email, password, idToken } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Verify ID token to get user ID
    if (!idToken) {
      return NextResponse.json(
        { error: "Unauthorized: ID token required" },
        { status: 401 }
      );
    }

    let userId: string | null;
    try {
      userId = await verifyIdToken(idToken);
    } catch (error: any) {
      console.error("Token verification error:", error);
      return NextResponse.json(
        { error: "Unauthorized: Invalid or expired ID token" },
        { status: 401 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid ID token" },
        { status: 401 }
      );
    }

    // Check if requesting user is admin
    const adminStatus = await isAdmin(userId);
    if (!adminStatus) {
      console.error(`User ${userId} is not an admin`);
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Create user using Firebase Admin SDK
    const userRecord = await authInstance.createUser({
      email,
      password,
      emailVerified: false,
    });

    return NextResponse.json({
      success: true,
      userId: userRecord.uid,
      email: userRecord.email,
      message: "User created successfully",
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    
    // Handle specific Firebase Auth errors
    if (error.code === "auth/email-already-exists") {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }
    
    if (error.code === "auth/invalid-email") {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create user. Please try again." },
      { status: 500 }
    );
  }
}

