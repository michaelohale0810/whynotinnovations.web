import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "wn_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ success: true });

    // Determine if we're in production (Firebase App Hosting is always HTTPS)
    const isProduction = process.env.NODE_ENV === "production" || 
                         process.env.VERCEL_ENV === "production" ||
                         !!process.env.FIREBASE_CONFIG;

    response.cookies.set(COOKIE_NAME, idToken, {
      httpOnly: true,
      secure: isProduction, // Always secure in production (HTTPS required)
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Session POST error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json({ success: true });

    // Determine if we're in production
    const isProduction = process.env.NODE_ENV === "production" || 
                         process.env.VERCEL_ENV === "production" ||
                         !!process.env.FIREBASE_CONFIG;

    response.cookies.set(COOKIE_NAME, "", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Session DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to clear session" },
      { status: 500 }
    );
  }
}

