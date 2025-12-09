import { getCurrentUser } from "./session";

export async function getServerSession(): Promise<{ userId: string; email: string } | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return {
    userId: user.userId,
    email: user.email,
  };
}
