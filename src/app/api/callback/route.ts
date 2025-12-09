import { NextRequest, NextResponse } from "next/server";
import { handleCallback } from "@/lib/auth/replitAuth";
import { setSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || request.nextUrl.host;
  const callbackUrl = `${protocol}://${host}/api/callback`;

  try {
    const session = await handleCallback(callbackUrl, request.nextUrl.searchParams);
    await setSession(session);
    
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(new URL("/login?error=callback_failed", request.url));
  }
}
