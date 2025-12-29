import { NextRequest, NextResponse } from "next/server";

/**
 * Debug endpoint to check if environment variables are loaded correctly
 * This helps diagnose issues with Firebase Secrets configuration
 * 
 * WARNING: This endpoint exposes environment variable names (not values)
 * Remove or protect this endpoint in production if needed
 */
export async function GET(request: NextRequest) {
  // Only allow in development or if explicitly enabled
  if (process.env.NODE_ENV === "production" && !process.env.ENABLE_DEBUG_ENV) {
    return NextResponse.json(
      { error: "Debug endpoint disabled in production" },
      { status: 403 }
    );
  }

  const requiredVars = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
    "FIREBASE_SERVICE_ACCOUNT",
  ];

  const envStatus = requiredVars.map((varName) => {
    const value = process.env[varName];
    return {
      name: varName,
      isSet: !!value,
      length: value?.length || 0,
      // Show first/last few chars for debugging (not full value for security)
      preview: value
        ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
        : null,
    };
  });

  const missingVars = envStatus.filter((v) => !v.isSet);

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    variables: envStatus,
    summary: {
      total: requiredVars.length,
      set: envStatus.filter((v) => v.isSet).length,
      missing: missingVars.length,
      missingNames: missingVars.map((v) => v.name),
    },
    note: "If variables are missing, check: 1) Secrets are created in Google Secret Manager, 2) Secret names match exactly in apphosting.yaml, 3) Secrets are available during BUILD phase for NEXT_PUBLIC_* variables",
  });
}

