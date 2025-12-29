import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db, getDb } from "@/lib/firebaseClient";

/**
 * Check if the current user is an admin
 * Note: This is a simplified version. In production, you should:
 * 1. Verify the ID token using Firebase Admin SDK
 * 2. Extract the user ID from the verified token
 * 3. Check the admins collection
 * 
 * For now, this expects the userId to be passed as a query param or header
 * (which should only be used from authenticated client-side code)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    const adminDoc = await getDoc(doc(getDb(), "admins", userId));
    return NextResponse.json({ isAdmin: adminDoc.exists() });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}
