"use client";

import { useState, useEffect } from "react";
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  Timestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/components/AuthProvider";
import { Innovation } from "@/types/innovation";
import Link from "next/link";

export default function AdminPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [innovations, setInnovations] = useState<Innovation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInnovation, setEditingInnovation] = useState<Innovation | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "pending" as "active" | "completed" | "pending",
    tags: "",
    link: "",
  });

  // Check admin status directly from Firestore
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.uid) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Check if user has an admin document in Firestore
        // Firestore rules allow users to read their own admin document
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        const exists = adminDoc.exists();
        setIsAdmin(exists);
      } catch (error: any) {
        // If it's a permission error, the user is likely not an admin
        // But we'll still set it to false to show the access denied page
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

  // Fetch innovations
  useEffect(() => {
    if (isAdmin) {
      fetchInnovations();
    }
  }, [isAdmin]);

  const fetchInnovations = async () => {
    try {
      const innovationsSnapshot = await getDocs(collection(db, "innovations"));
      const innovationsData = innovationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      })) as Innovation[];
      setInnovations(innovationsData);
    } catch (error) {
      alert("Failed to fetch innovations. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !isAdmin) {
      alert("You must be an admin to perform this action.");
      return;
    }

    try {
      const tags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      if (editingInnovation?.id) {
        // Update existing innovation
        const innovationRef = doc(db, "innovations", editingInnovation.id);
        await updateDoc(innovationRef, {
          title: formData.title,
          description: formData.description,
          status: formData.status,
          tags: tags,
          link: formData.link.trim() || undefined,
          updatedAt: Timestamp.now(),
        });
      } else {
        // Create new innovation
        const now = Timestamp.now();
        await addDoc(collection(db, "innovations"), {
          title: formData.title,
          description: formData.description,
          status: formData.status,
          tags: tags,
          link: formData.link.trim() || undefined,
          createdAt: now,
          updatedAt: now,
          createdBy: user.uid,
        });
      }

      // Reset form and refresh list
      setFormData({ title: "", description: "", status: "pending", tags: "", link: "" });
      setShowForm(false);
      setEditingInnovation(null);
      fetchInnovations();
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to save innovation. Please try again.";
      alert(errorMessage);
    }
  };

  const handleEdit = (innovation: Innovation) => {
    setEditingInnovation(innovation);
    setFormData({
      title: innovation.title,
      description: innovation.description,
      status: innovation.status,
      tags: innovation.tags?.join(", ") || "",
      link: innovation.link || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!user?.uid || !isAdmin) {
      alert("You must be an admin to perform this action.");
      return;
    }
    
    if (!confirm("Are you sure you want to delete this innovation?")) {
      return;
    }

    try {
      const innovationRef = doc(db, "innovations", id);
      await deleteDoc(innovationRef);
      fetchInnovations();
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to delete innovation. Please try again.";
      alert(errorMessage);
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
              <Link href="/" className="btn btn-primary">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Innovations</h1>
          <p className="mt-1 text-muted">
            Manage innovations (projects) in the system.
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingInnovation(null);
            setFormData({
              title: "",
              description: "",
              status: "pending",
              tags: "",
              link: "",
            });
          }}
          className="btn btn-primary w-full sm:w-auto"
        >
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
          Add Innovation
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingInnovation ? "Edit Innovation" : "Add Innovation"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingInnovation(null);
                  setFormData({
                    title: "",
                    description: "",
                    status: "pending",
                    tags: "",
                    link: "",
                  });
                }}
                className="rounded-lg p-2 hover:bg-border"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="mb-2 block text-sm font-medium">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-medium"
                >
                  Description *
                </label>
                <textarea
                  id="description"
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div>
                <label htmlFor="status" className="mb-2 block text-sm font-medium">
                  Status *
                </label>
                <select
                  id="status"
                  required
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as "active" | "completed" | "pending",
                    })
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label htmlFor="tags" className="mb-2 block text-sm font-medium">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  id="tags"
                  placeholder="innovation, project, tech"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                />
              </div>

              <div>
                <label htmlFor="link" className="mb-2 block text-sm font-medium">
                  Website Link (for user testing)
                </label>
                <input
                  type="url"
                  id="link"
                  placeholder="https://example.com"
                  value={formData.link}
                  onChange={(e) =>
                    setFormData({ ...formData, link: e.target.value })
                  }
                />
                <p className="mt-1 text-xs text-muted">
                  Optional: Link to the innovation website for user testing
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingInnovation(null);
                    setFormData({
                      title: "",
                      description: "",
                      status: "pending",
                      tags: "",
                      link: "",
                    });
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingInnovation ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Innovations List */}
      <div className="space-y-4">
        {innovations.length === 0 ? (
          <div className="card py-12 text-center">
            <p className="text-muted">No innovations yet. Create your first one!</p>
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
                <div className="ml-4 flex gap-2">
                  <button
                    onClick={() => handleEdit(innovation)}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-border"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => innovation.id && handleDelete(innovation.id)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
