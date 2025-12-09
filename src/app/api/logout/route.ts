import { NextRequest, NextResponse } from "next/server";
import { getLogoutUrl } from "@/lib/auth/replitAuth";
import { clearSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || request.nextUrl.host;
  const postLogoutRedirectUri = `${protocol}://${host}/`;

  try {
    await clearSession();
    const logoutUrl = await getLogoutUrl(postLogoutRedirectUri);
    return NextResponse.redirect(logoutUrl);
  } catch (error) {
    console.error("Logout error:", error);
    await clearSession();
    return NextResponse.redirect(new URL("/", request.url));
  }
}
