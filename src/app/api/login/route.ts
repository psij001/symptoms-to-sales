import { NextRequest, NextResponse } from "next/server";
import { getAuthorizationUrl } from "@/lib/auth/replitAuth";

export async function GET(request: NextRequest) {
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || request.nextUrl.host;
  const callbackUrl = `${protocol}://${host}/api/callback`;

  try {
    const authUrl = await getAuthorizationUrl(callbackUrl);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
  }
}
