import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { type UserSession, refreshTokens } from "./replitAuth";

export interface SessionData {
  user?: UserSession;
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

export async function getIronSessionData() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, SESSION_OPTIONS);
}

export async function setSession(userSession: UserSession): Promise<void> {
  const session = await getIronSessionData();
  session.user = userSession;
  await session.save();
}

export async function getSession(): Promise<UserSession | null> {
  const session = await getIronSessionData();
  
  if (!session.user) {
    return null;
  }

  const userSession = session.user;
  
  if (userSession.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    if (now > userSession.expires_at) {
      if (userSession.refresh_token) {
        const newSession = await refreshTokens(userSession.refresh_token);
        if (newSession) {
          session.user = newSession;
          await session.save();
          return newSession;
        }
      }
      await clearSession();
      return null;
    }
  }
  
  return userSession;
}

export async function clearSession(): Promise<void> {
  const session = await getIronSessionData();
  session.destroy();
}

export async function getCurrentUser(): Promise<{ id: string; email?: string; firstName?: string; lastName?: string; profileImageUrl?: string } | null> {
  const userSession = await getSession();
  if (!userSession) {
    return null;
  }
  
  return {
    id: userSession.claims.sub,
    email: userSession.claims.email,
    firstName: userSession.claims.first_name,
    lastName: userSession.claims.last_name,
    profileImageUrl: userSession.claims.profile_image_url,
  };
}
