import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

const adminDb = getFirestore();

/**
 * Check if a user is an admin using Admin SDK
 */
async function isAdmin(userId: string): Promise<boolean> {
  try {
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
    const decodedToken = await adminAuth.verifyIdToken(idToken);
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
    const adminStatus = await isAdmin(userId);
    if (!adminStatus) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // List all users using Firebase Admin SDK
    const listUsersResult = await adminAuth.listUsers();
    
    // Check admin status for each user
    const usersWithAdminStatus = await Promise.all(
      listUsersResult.users.map(async (userRecord) => {
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
      })
    );

    return NextResponse.json({ users: usersWithAdminStatus });
  } catch (error: any) {
    console.error("Error listing users:", error);
    return NextResponse.json(
      { error: "Failed to list users" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new user account (admin only)
 */
export async function POST(request: NextRequest) {
  try {
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
    const userRecord = await adminAuth.createUser({
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

