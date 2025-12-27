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
 * DELETE - Delete a user account (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: targetUserId } = await params;
    const { searchParams } = new URL(request.url);
    const idToken = searchParams.get("idToken");

    if (!idToken) {
      return NextResponse.json(
        { error: "Unauthorized: ID token required" },
        { status: 401 }
      );
    }

    let requestingUserId: string | null;
    try {
      requestingUserId = await verifyIdToken(idToken);
    } catch (error: any) {
      console.error("Token verification error:", error);
      return NextResponse.json(
        { error: "Unauthorized: Invalid or expired ID token" },
        { status: 401 }
      );
    }

    if (!requestingUserId) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid ID token" },
        { status: 401 }
      );
    }

    // Check if requesting user is admin
    const adminStatus = await isAdmin(requestingUserId);
    if (!adminStatus) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Prevent admins from deleting themselves
    if (targetUserId === requestingUserId) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    // Check if target user is an admin (prevent deleting admins)
    const targetIsAdmin = await isAdmin(targetUserId);
    if (targetIsAdmin) {
      return NextResponse.json(
        { error: "Cannot delete admin users. Remove admin status first." },
        { status: 400 }
      );
    }

    // Delete user using Firebase Admin SDK
    await adminAuth.deleteUser(targetUserId);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting user:", error);

    if (error.code === "auth/user-not-found") {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete user. Please try again." },
      { status: 500 }
    );
  }
}

