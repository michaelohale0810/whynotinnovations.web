export interface Innovation {
  id?: string;
  title: string;
  description: string;
  status: "active" | "completed" | "pending";
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string; // User ID
  tags?: string[];
  link?: string; // Link to the innovation website for user testing
  // Add more fields as needed
}

export interface Admin {
  id?: string;
  email: string;
  userId: string; // Firebase Auth UID
  createdAt: Date | string;
  createdBy?: string; // Admin who added this admin
}

export interface Message {
  id?: string;
  type: "general" | "innovation";
  innovationId?: string; // Required if type is "innovation"
  innovationTitle?: string; // For display purposes
  content: string;
  createdBy: string; // User ID
  createdByEmail?: string; // User email for display
  createdAt: Date | string;
  read?: boolean; // Admin can mark messages as read
  archived?: boolean; // User can archive their own messages
}

