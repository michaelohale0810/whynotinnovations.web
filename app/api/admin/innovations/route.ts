import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { Innovation } from "@/types/innovation";
import { isAdmin } from "@/lib/admin";

// GET - List all innovations (public, no auth required)
export async function GET() {
  try {
    const innovationsSnapshot = await getDocs(collection(db, "innovations"));
    const innovations = innovationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
    }));

    return NextResponse.json({ innovations });
  } catch (error) {
    console.error("Error fetching innovations:", error);
    return NextResponse.json(
      { error: "Failed to fetch innovations" },
      { status: 500 }
    );
  }
}

// POST - Create a new innovation (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: userId required" },
        { status: 401 }
      );
    }

    const adminStatus = await isAdmin(userId);
    if (!adminStatus) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const now = Timestamp.now();
    const innovationData = {
      title: body.title,
      description: body.description,
      status: body.status || "pending",
      createdAt: now,
      updatedAt: now,
      tags: body.tags || [],
      createdBy: userId,
    };

    const docRef = await addDoc(collection(db, "innovations"), innovationData);

    return NextResponse.json({
      id: docRef.id,
      ...innovationData,
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
    });
  } catch (error) {
    console.error("Error creating innovation:", error);
    return NextResponse.json(
      { error: "Failed to create innovation" },
      { status: 500 }
    );
  }
}
