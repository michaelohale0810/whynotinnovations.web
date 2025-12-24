"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, collection, getDocs, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/components/AuthProvider";
import { Message } from "@/types/innovation";
import Link from "next/link";

export default function AdminMessagesPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "general" | "innovation" | "unread">("all");

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.uid) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        const exists = adminDoc.exists();
        setIsAdmin(exists);
        if (exists) {
          fetchMessages();
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

  const fetchMessages = async () => {
    try {
      const messagesQuery = query(collection(db, "messages"), orderBy("createdAt", "desc"));
      const messagesSnapshot = await getDocs(messagesQuery);
      const messagesData = messagesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      })) as Message[];
      setMessages(messagesData);
    } catch (error) {
      alert("Failed to fetch messages. Please try again.");
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!user?.uid || !isAdmin) {
      return;
    }

    try {
      const messageRef = doc(db, "messages", messageId);
      await updateDoc(messageRef, { read: true });
      fetchMessages();
    } catch (error) {
      alert("Failed to mark message as read.");
    }
  };

  const filteredMessages = messages.filter((message) => {
    if (filter === "general") return message.type === "general";
    if (filter === "innovation") return message.type === "innovation";
    if (filter === "unread") return !message.read;
    return true;
  });

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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="mt-1 text-muted">
          View and manage messages from participants.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-border">
        {[
          { value: "all", label: "All Messages" },
          { value: "unread", label: "Unread" },
          { value: "general", label: "General" },
          { value: "innovation", label: "Innovation-Specific" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as typeof filter)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === tab.value
                ? "border-b-2 border-accent text-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.value === "unread" && messages.filter((m) => !m.read).length > 0 && (
              <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-white">
                {messages.filter((m) => !m.read).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="card py-12 text-center">
            <p className="text-muted">
              {filter === "all"
                ? "No messages yet."
                : filter === "unread"
                ? "No unread messages."
                : `No ${filter} messages.`}
            </p>
          </div>
        ) : (
          filteredMessages.map((message) => (
            <div
              key={message.id}
              className={`card ${!message.read ? "border-l-4 border-l-accent bg-accent/5" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        message.type === "general"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                      }`}
                    >
                      {message.type === "general" ? "General" : "Innovation"}
                    </span>
                    {!message.read && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-white">
                        New
                      </span>
                    )}
                    <span className="text-xs text-muted">
                      {message.createdByEmail || "Unknown user"}
                    </span>
                    <span className="text-xs text-muted">
                      {new Date(message.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {message.type === "innovation" && message.innovationTitle && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-muted">
                        Innovation: {message.innovationTitle}
                      </p>
                    </div>
                  )}

                  <p className="mt-3 whitespace-pre-wrap">{message.content}</p>
                </div>

                {!message.read && (
                  <button
                    onClick={() => message.id && markAsRead(message.id)}
                    className="ml-4 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-border"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="card text-center">
          <div className="text-2xl font-bold">{messages.length}</div>
          <div className="mt-1 text-sm text-muted">Total Messages</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold">
            {messages.filter((m) => !m.read).length}
          </div>
          <div className="mt-1 text-sm text-muted">Unread</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold">
            {messages.filter((m) => m.type === "innovation").length}
          </div>
          <div className="mt-1 text-sm text-muted">Innovation-Specific</div>
        </div>
      </div>
    </div>
  );
}

