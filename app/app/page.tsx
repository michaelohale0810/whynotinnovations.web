"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/components/AuthProvider";
import { Innovation } from "@/types/innovation";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
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
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
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

  // Fetch innovations
  useEffect(() => {
    fetchInnovations();
  }, []);

  const fetchInnovations = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch innovations directly from Firestore
      // Firestore rules allow public read access to innovations
      const innovationsSnapshot = await getDocs(collection(db, "innovations"));
      const innovationsData = innovationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      })) as Innovation[];
      setInnovations(innovationsData);
    } catch (err: any) {
      console.error("Error fetching innovations:", err);
      setError("Failed to load innovations. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInnovation = () => {
    router.push("/admin");
  };

  // Calculate progress based on status
  const getProgress = (status: string) => {
    switch (status) {
      case "completed":
        return 100;
      case "active":
        return 50;
      case "pending":
        return 0;
      default:
        return 0;
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">
            Welcome back{user?.displayName || user?.email ? `, ${user.displayName || user.email?.split("@")[0]}` : ""}!
          </h1>
          <p className="mt-1 text-muted">
            View and explore all available innovation projects.
          </p>
        </div>
        {isAdmin && (
          <button onClick={handleCreateInnovation} className="btn btn-primary w-full sm:w-auto">
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Innovation
          </button>
        )}
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

      {/* Innovations grid */}
      {!error && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {innovations.map((innovation) => {
            const progress = getProgress(innovation.status);
            return (
              <div
                key={innovation.id}
                className="card transition-all hover:border-accent/50 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{innovation.title}</h3>
                    <p className="mt-1 text-sm text-muted line-clamp-2">
                      {innovation.description}
                    </p>
                  </div>
                  <span
                    className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      innovation.status === "active"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : innovation.status === "completed"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}
                  >
                    {innovation.status.charAt(0).toUpperCase() +
                      innovation.status.slice(1)}
                  </span>
                </div>

                {/* Website Link */}
                {innovation.link && (
                  <div className="mt-3">
                    <a
                      href={innovation.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
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
                      Test Innovation
                    </a>
                  </div>
                )}

                {/* Tags */}
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

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-muted">Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Meta info */}
                <div className="mt-4 flex items-center justify-between text-xs text-muted">
                  <div className="flex items-center gap-1">
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {new Date(innovation.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!error && innovations.length === 0 && (
        <div className="card py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <svg
              className="h-8 w-8 text-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <h3 className="mt-4 font-semibold">No Innovations Yet</h3>
          <p className="mt-1 text-sm text-muted">
            {isAdmin
              ? "Get started by creating your first innovation."
              : "Check back later for available innovation projects."}
          </p>
          {isAdmin && (
            <button
              onClick={handleCreateInnovation}
              className="btn btn-primary mt-4"
            >
              Create Innovation
            </button>
          )}
        </div>
      )}
    </div>
  );
}
