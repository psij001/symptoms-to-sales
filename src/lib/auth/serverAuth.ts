import { getSession, type SessionData } from "./session";
import type { UserSession } from "./replitAuth";

export async function getServerSession(): Promise<{ userId: string; session: UserSession } | null> {
  const userSession = await getSession();

  if (!userSession) {
    return null;
  }

  return {
    userId: userSession.claims.sub,
    session: userSession,
  };
}
