"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, getDb } from "@/lib/firebaseClient";
import { useAuth } from "@/components/AuthProvider";

interface User {
  uid: string;
  email: string | undefined;
  emailVerified: boolean;
  disabled: boolean;
  isAdmin?: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime: string | undefined;
  };
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Check admin status and fetch users
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.uid) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const adminDoc = await getDoc(doc(getDb(), "admins", user.uid));
        const exists = adminDoc.exists();
        setIsAdmin(exists);
        if (exists) {
          fetchUsers();
        }
      } catch (error: any) {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      checkAdmin();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUsers = async () => {
    if (!user?.uid) return;

    setLoadingUsers(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/admin/users?idToken=${encodeURIComponent(idToken)}`);
      
      // Check content type to ensure we got JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // Try to get text to see what we got
        const text = await response.text();
        console.error("Non-JSON response received:", text.substring(0, 200));
        setError("Server returned an invalid response. Please check server logs.");
        setUsers([]);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || "Failed to fetch users";
        console.error("Error fetching users:", errorMsg);
        setError(errorMsg);
        setUsers([]);
        return;
      }

      // Ensure we have an array
      if (Array.isArray(data.users)) {
        setUsers(data.users);
        console.log("Fetched users:", data.users.length);
      } else {
        console.error("Invalid response format:", data);
        setError("Invalid response format from server");
        setUsers([]);
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      // Check if it's a JSON parse error
      if (error.message && error.message.includes("JSON")) {
        setError("Server returned an invalid response. This may indicate a server configuration issue. Please check that FIREBASE_SERVICE_ACCOUNT is set correctly.");
      } else {
        setError(`Failed to fetch users: ${error.message || "Unknown error"}`);
      }
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string | undefined) => {
    if (!user?.uid) return;

    if (!confirm(`Are you sure you want to delete user ${userEmail || userId}? This action cannot be undone.`)) {
      return;
    }

    setDeletingUserId(userId);

    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/admin/users/${userId}?idToken=${encodeURIComponent(idToken)}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to delete user. Please try again.");
        return;
      }

      // Refresh users list
      fetchUsers();
    } catch (error: any) {
      setError("Failed to delete user. Please try again.");
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!user?.uid) {
      setError("You must be logged in to create users.");
      return;
    }

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      // Get ID token for authentication
      const idToken = await user.getIdToken();
      
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          idToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create user. Please try again.");
        return;
      }

      // Success
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
      
      // Refresh users list
      fetchUsers();
    } catch (error: any) {
      setError("Failed to create user. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container py-20">
        <div className="mx-auto max-w-md">
          <div className="card text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <svg
                className="h-8 w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-xl font-semibold">Access Denied</h2>
            <p className="mt-2 text-muted">
              You do not have admin privileges to access this page.
            </p>
            <div className="mt-6">
              <a href="/" className="btn btn-primary">
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New User</h1>
        <p className="mt-1 text-muted">
          Create new user accounts for participants. These will be regular users, not admins.
        </p>
      </div>

      {/* Success message */}
      {success && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-200">
          <p className="font-medium">User created successfully!</p>
          <p className="text-sm">The new user can now log in with the email and password you provided.</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Create User Form */}
      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">
              Password *
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full"
            />
            <p className="mt-1 text-xs text-muted">
              Password must be at least 6 characters long.
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium">
              Confirm Password *
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>

      {/* Users List */}
      <div className="mt-8 space-y-4">
        <div>
          <h2 className="text-2xl font-bold">All Users</h2>
          <p className="mt-1 text-sm text-muted">
            Manage user accounts. Admin users and your own account cannot be deleted.
          </p>
        </div>

        {loadingUsers ? (
          <div className="card py-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            <p className="mt-4 text-sm text-muted">Loading users...</p>
          </div>
        ) : error && users.length === 0 ? (
          <div className="card border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-900/20">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={fetchUsers}
              className="btn btn-secondary mt-4"
            >
              Try Again
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="card py-12 text-center">
            <p className="text-muted">No users found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((userItem) => {
              const isCurrentUser = userItem.uid === user?.uid;
              const isUserAdmin = userItem.isAdmin || false;
              
              return (
                <div key={userItem.uid} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-medium text-white">
                          {userItem.email?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{userItem.email || "No email"}</p>
                            {isCurrentUser && (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                You
                              </span>
                            )}
                            {isUserAdmin && (
                              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                Admin
                              </span>
                            )}
                            {userItem.emailVerified && (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                Verified
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-muted">
                            Created: {new Date(userItem.metadata.creationTime).toLocaleString()}
                            {userItem.metadata.lastSignInTime && (
                              <> • Last sign in: {new Date(userItem.metadata.lastSignInTime).toLocaleString()}</>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteUser(userItem.uid, userItem.email)}
                      disabled={isCurrentUser || isUserAdmin || deletingUserId === userItem.uid}
                      className="ml-4 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                      title={
                        isCurrentUser
                          ? "You cannot delete your own account"
                          : isUserAdmin
                          ? "Admin users cannot be deleted"
                          : "Delete user"
                      }
                    >
                      {deletingUserId === userItem.uid ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                      ) : (
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 card max-w-2xl border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/20">
        <div className="flex gap-3">
          <svg
            className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-100">
              About User Creation
            </p>
            <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
              Users created here will be regular participants with access to the participant portal. 
              They will be able to send messages and view innovations. To create admin accounts, 
              you must manually add them to the admins collection in Firestore.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

