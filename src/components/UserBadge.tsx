"use client";

import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, getDb } from "@/lib/firebaseClient";
import { useAuth } from "./AuthProvider";

export function UserBadge() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Check admin status directly from Firestore
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.uid) {
        setIsAdmin(false);
        return;
      }

      try {
        // Use getDb() to get the actual Firestore instance (not the proxy)
        // This ensures Firestore's doc() function recognizes it properly
        const dbInstance = getDb();
        
        // Check if user has an admin document in Firestore
        // Firestore rules allow users to read their own admin document
        const adminDoc = await getDoc(doc(dbInstance, "admins", user.uid));
        setIsAdmin(adminDoc.exists());
        console.log("Admin check:", { userId: user.uid, isAdmin: adminDoc.exists() });
      } catch (error) {
        console.error("Error checking admin status:", error);
        console.error("Error details:", error);
        setIsAdmin(false);
      }
    };

    if (user) {
      checkAdmin();
    }
  }, [user]);

  const handleSignIn = () => {
    router.push("/login");
  };

  const handleSignOut = async () => {
    try {
      // Sign out from Firebase first
      await signOut(auth);

      // Clear session cookie
      await fetch("/api/auth/session", {
        method: "DELETE",
      });

      // Wait a moment for auth state to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Redirect to home page with full page reload to ensure everything is cleared
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out error:", error);
      // Even if there's an error, try to redirect
      window.location.href = "/";
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-10 w-10 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  // Logged out state
  if (!user) {
    return (
      <button
        onClick={handleSignIn}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
          />
        </svg>
        Sign in
      </button>
    );
  }

  // Logged in state
  return (
    <div className="flex items-center gap-3">
      <div 
        className="flex items-center gap-2"
        title={user.email || "User"}
      >
        <div 
          className="relative flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-medium text-white"
          title={user.email || "User"}
        >
          {user.displayName?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || "U"}
          {isAdmin && (
            <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-green-500 ring-2 ring-background">
              <span className="sr-only">Admin</span>
            </span>
          )}
        </div>
        <div className="hidden flex-col md:flex">
          <span 
            className="text-sm font-medium"
            title={user.email || "User"}
          >
            {user.displayName || user.email?.split("@")[0]}
          </span>
          {isAdmin && (
            <span className="text-xs font-medium text-accent">Admin</span>
          )}
        </div>
      </div>
      <button
        onClick={handleSignOut}
        className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-border hover:text-foreground"
      >
        Sign out
      </button>
    </div>
  );
}
