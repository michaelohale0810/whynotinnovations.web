import { doc, getDoc } from "firebase/firestore";
import { db, getDb } from "./firebaseClient";

/**
 * Check if a user is an admin by looking up their UID in the admins collection
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const adminDoc = await getDoc(doc(getDb(), "admins", userId));
    return adminDoc.exists();
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Get admin document for a user
 */
export async function getAdmin(userId: string) {
  try {
    const adminDoc = await getDoc(doc(getDb(), "admins", userId));
    if (adminDoc.exists()) {
      return { id: adminDoc.id, ...adminDoc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting admin:", error);
    return null;
  }
}
