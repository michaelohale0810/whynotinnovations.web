"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db, getDb } from "@/lib/firebaseClient";
import { useAuth } from "@/components/AuthProvider";
import { Innovation } from "@/types/innovation";

export default function DashboardPage() {
  const { user } = useAuth();
  const [innovations, setInnovations] = useState<Innovation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Check admin status directly from Firestore
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.uid) {
        setIsAdmin(false);
        return;
      }

      try {
        // Check if user has an admin document in Firestore
        // Firestore rules allow users to read their own admin document
        const adminDoc = await getDoc(doc(getDb(), "admins", user.uid));
        setIsAdmin(adminDoc.exists());
        console.log("Admin check:", { userId: user.uid, isAdmin: adminDoc.exists() });
      } catch (error: any) {
        console.error("Error checking admin status:", error);
        console.error("Error code:", error?.code);
        console.error("Error message:", error?.message);
        setIsAdmin(false);
      }
    };

    if (user) {
      checkAdmin();
    }
  }, [user]);

  // Fetch innovations - wait for user to be loaded first
  useEffect(() => {
    // Only fetch if user is loaded (even if null, we know auth state is ready)
    if (user !== undefined) {
      fetchInnovations();
    }
  }, [user]);

  const fetchInnovations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Ensure Firebase is initialized by accessing db
      // The proxy will initialize Firebase if needed
      try {
        // This will trigger initialization if not already done
        const dbInstance = db;
        if (!dbInstance) {
          throw new Error("Firebase Firestore is not initialized. Please check your environment variables.");
        }
      } catch (initError: any) {
        console.error("Firebase initialization error:", initError);
        throw new Error(`Firebase initialization failed: ${initError.message}. Please check your environment variables.`);
      }
      
      // Fetch innovations directly from Firestore
      // Firestore rules allow public read access to innovations
      const innovationsSnapshot = await getDocs(collection(getDb(), "innovations"));
      const innovationsData = innovationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      })) as Innovation[];
      setInnovations(innovationsData);
    } catch (err: any) {
      console.error("Error fetching innovations:", err);
      console.error("Error code:", err?.code);
      console.error("Error message:", err?.message);
      console.error("Error details:", err);
      
      // Provide more specific error messages
      let errorMessage = "Failed to load innovations. Please try again later.";
      if (err?.code === "permission-denied") {
        errorMessage = "Permission denied. Please check your Firestore security rules.";
      } else if (err?.code === "unavailable") {
        errorMessage = "Firestore is temporarily unavailable. Please try again later.";
      } else if (err?.message?.includes("Firebase") || err?.message?.includes("environment variables")) {
        errorMessage = err.message;
      } else if (err?.code) {
        errorMessage = `Firebase error (${err.code}): ${err.message || "Unknown error"}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">
          Welcome back{user?.displayName || user?.email ? `, ${user.displayName || user.email?.split("@")[0]}` : ""}!
        </h1>
        <p className="mt-1 text-muted">
          View and explore all available innovation projects.
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="card border-red-200 bg-red-50 p-4 text-center dark:border-red-900/50 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button onClick={fetchInnovations} className="btn btn-secondary mt-3">
            Try Again
          </button>
        </div>
      )}

      {/* Innovations List */}
      {!error && (
        <div className="space-y-4">
          {innovations.length === 0 ? (
            <div className="card py-12 text-center">
              <p className="text-muted">No innovations yet. Check back later for available innovation projects.</p>
            </div>
          ) : (
            innovations.map((innovation) => (
              <div key={innovation.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{innovation.title}</h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          innovation.status === "active"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : innovation.status === "completed"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {innovation.status}
                      </span>
                    </div>
                    <p className="mt-2 text-muted">{innovation.description}</p>
                    {innovation.link && (
                      <div className="mt-3">
                        <a
                          href={innovation.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
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
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                          Test Innovation Website
                        </a>
                      </div>
                    )}
                    {innovation.tags && innovation.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {innovation.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="mt-3 text-xs text-muted">
                      Created: {new Date(innovation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
