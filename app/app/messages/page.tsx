"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, Timestamp, query, where, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/components/AuthProvider";
import { Innovation } from "@/types/innovation";
import { Message } from "@/types/innovation";
import { getDocs } from "firebase/firestore";

export default function MessagesPage() {
  const { user } = useAuth();
  const [messageType, setMessageType] = useState<"general" | "innovation">("general");
  const [selectedInnovationId, setSelectedInnovationId] = useState<string>("");
  const [content, setContent] = useState("");
  const [innovations, setInnovations] = useState<Innovation[]>([]);
  const [userMessages, setUserMessages] = useState<Message[]>([]);
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchInnovations();
    if (user?.uid) {
      fetchUserMessages();
    }
  }, [user]);

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
      console.error("Error fetching innovations:", error);
    }
  };

  const fetchUserMessages = async () => {
    if (!user?.uid) return;
    
    setLoadingMessages(true);
    try {
      const messagesQuery = query(
        collection(db, "messages"),
        where("createdBy", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      const messagesData = messagesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      })) as Message[];
      setUserMessages(messagesData);
    } catch (error) {
      console.error("Error fetching user messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.uid) {
      alert("You must be logged in to send a message.");
      return;
    }

    if (!content.trim()) {
      alert("Please enter a message.");
      return;
    }

    if (messageType === "innovation" && !selectedInnovationId) {
      alert("Please select an innovation.");
      return;
    }

    setSubmitting(true);
    setSuccess(false);

    try {
      const selectedInnovation = innovations.find((inv) => inv.id === selectedInnovationId);
      
      const now = Timestamp.now();
      const messageData: Omit<Message, "id"> = {
        type: messageType,
        content: content.trim(),
        createdBy: user.uid,
        createdByEmail: user.email || undefined,
        createdAt: now.toDate(),
        read: false,
        ...(messageType === "innovation" && {
          innovationId: selectedInnovationId,
          innovationTitle: selectedInnovation?.title,
        }),
      };

      await addDoc(collection(db, "messages"), messageData);
      
      setContent("");
      setSelectedInnovationId("");
      setSuccess(true);
      
      // Refresh user messages list
      fetchUserMessages();
      
      setTimeout(() => setSuccess(false), 5000);
    } catch (error: any) {
      alert("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (messageId: string, currentlyArchived: boolean) => {
    if (!user?.uid || !messageId) return;

    try {
      const messageRef = doc(db, "messages", messageId);
      await updateDoc(messageRef, { archived: !currentlyArchived });
      // Refresh messages list
      fetchUserMessages();
    } catch (error) {
      alert("Failed to archive message. Please try again.");
    }
  };

  // Filter messages based on archive status
  const filteredMessages = userMessages.filter((message) => {
    if (showArchived) {
      return true; // Show all messages
    }
    return !message.archived; // Show only non-archived messages
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Send a Message</h1>
        <p className="mt-1 text-muted">
          Share your thoughts, feedback, or questions with the team.
        </p>
      </div>

      {/* Success message */}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-200">
          <p className="font-medium">Message sent successfully!</p>
          <p className="text-sm">Your message has been received and will be reviewed by the admin team.</p>
        </div>
      )}

      {/* Message Form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Message Type Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Message Type *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="messageType"
                  value="general"
                  checked={messageType === "general"}
                  onChange={(e) => {
                    setMessageType("general");
                    setSelectedInnovationId("");
                  }}
                  className="h-4 w-4"
                />
                <span>General Message</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="messageType"
                  value="innovation"
                  checked={messageType === "innovation"}
                  onChange={(e) => setMessageType("innovation")}
                  className="h-4 w-4"
                />
                <span>Innovation-Specific Message</span>
              </label>
            </div>
          </div>

          {/* Innovation Selection (only for innovation-specific messages) */}
          {messageType === "innovation" && (
            <div>
              <label htmlFor="innovation" className="mb-2 block text-sm font-medium">
                Select Innovation *
              </label>
              <select
                id="innovation"
                value={selectedInnovationId}
                onChange={(e) => setSelectedInnovationId(e.target.value)}
                required={messageType === "innovation"}
                className="w-full"
              >
                <option value="">Choose an innovation...</option>
                {innovations.map((innovation) => (
                  <option key={innovation.id} value={innovation.id}>
                    {innovation.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Message Content */}
          <div>
            <label htmlFor="content" className="mb-2 block text-sm font-medium">
              Message *
            </label>
            <textarea
              id="content"
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                messageType === "innovation"
                  ? "Share your thoughts, feedback, or questions about this innovation..."
                  : "Share your thoughts, feedback, or questions..."
              }
              required
              className="w-full"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      </div>

      {/* User's Past Messages */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Your Messages</h2>
            <p className="mt-1 text-sm text-muted">
              View all messages you have sent.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <span className="text-muted">Show archived</span>
            </label>
          </div>
        </div>

        {loadingMessages ? (
          <div className="card py-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="card py-12 text-center">
            <p className="text-muted">
              {showArchived 
                ? "You haven't sent any messages yet."
                : "No active messages. Check 'Show archived' to see archived messages."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((message) => (
              <div 
                key={message.id} 
                className={`card ${message.archived ? "opacity-60" : ""}`}
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
                      {message.archived && (
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">
                          Archived
                        </span>
                      )}
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
                  <button
                    onClick={() => message.id && handleArchive(message.id, message.archived || false)}
                    className="ml-4 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-border"
                    title={message.archived ? "Unarchive message" : "Archive message"}
                  >
                    {message.archived ? (
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
                          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                        />
                      </svg>
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
                          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="card border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/20">
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
              About Messages
            </p>
            <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
              Your messages are private and can only be viewed by administrators. 
              Use general messages for general feedback or questions. Use innovation-specific 
              messages to provide feedback about a particular innovation or project.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

