import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { isAdmin } from "@/lib/admin";

// GET - Get a single innovation (public, no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const innovationDoc = await getDoc(doc(db, "innovations", id));

    if (!innovationDoc.exists()) {
      return NextResponse.json(
        { error: "Innovation not found" },
        { status: 404 }
      );
    }

    const data = innovationDoc.data();
    return NextResponse.json({
      id: innovationDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching innovation:", error);
    return NextResponse.json(
      { error: "Failed to fetch innovation" },
      { status: 500 }
    );
  }
}

// PUT - Update an innovation (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const innovationRef = doc(db, "innovations", id);

    // Check if innovation exists
    const innovationDoc = await getDoc(innovationRef);
    if (!innovationDoc.exists()) {
      return NextResponse.json(
        { error: "Innovation not found" },
        { status: 404 }
      );
    }

    const updateData = {
      title: body.title,
      description: body.description,
      status: body.status,
      tags: body.tags || [],
      updatedAt: Timestamp.now(),
    };

    await updateDoc(innovationRef, updateData);

    const updatedDoc = await getDoc(innovationRef);
    if (!updatedDoc.exists()) {
      return NextResponse.json(
        { error: "Failed to retrieve updated innovation" },
        { status: 500 }
      );
    }

    const data = updatedDoc.data();
    return NextResponse.json({
      id: updatedDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    });
  } catch (error) {
    console.error("Error updating innovation:", error);
    return NextResponse.json(
      { error: "Failed to update innovation" },
      { status: 500 }
    );
  }
}

// DELETE - Delete an innovation (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

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

    const innovationRef = doc(db, "innovations", id);

    // Check if innovation exists
    const innovationDoc = await getDoc(innovationRef);
    if (!innovationDoc.exists()) {
      return NextResponse.json(
        { error: "Innovation not found" },
        { status: 404 }
      );
    }

    await deleteDoc(innovationRef);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting innovation:", error);
    return NextResponse.json(
      { error: "Failed to delete innovation" },
      { status: 500 }
    );
  }
}
