import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId?: string;
  email?: string;
}

const SESSION_OPTIONS: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "auth_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, SESSION_OPTIONS);
}

export async function setSession(userId: string, email: string): Promise<void> {
  const session = await getSession();
  session.userId = userId;
  session.email = email;
  await session.save();
}

export async function clearSession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

export async function getCurrentUser(): Promise<{ userId: string; email: string } | null> {
  const session = await getSession();
  if (!session.userId || !session.email) {
    return null;
  }
  return {
    userId: session.userId,
    email: session.email,
  };
}
