import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { storage } from "@/lib/db/storage";

export async function GET() {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await storage.getUser(session.claims.sub);
    
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ message: "Failed to fetch user" }, { status: 500 });
  }
}
