import * as client from "openid-client";
import memoize from "memoizee";
import { cookies } from "next/headers";
import { storage } from "@/lib/db/storage";

export interface UserSession {
  claims: {
    sub: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
    exp?: number;
  };
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export async function getAuthorizationUrl(callbackUrl: string): Promise<string> {
  const config = await getOidcConfig();
  
  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  const state = client.randomState();
  
  const cookieStore = await cookies();
  cookieStore.set("code_verifier", codeVerifier, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const authUrl = client.buildAuthorizationUrl(config, {
    redirect_uri: callbackUrl,
    scope: "openid email profile offline_access",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });

  return authUrl.href;
}

export async function handleCallback(
  callbackUrl: string,
  searchParams: URLSearchParams
): Promise<UserSession> {
  const config = await getOidcConfig();
  
  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get("code_verifier")?.value;
  const state = cookieStore.get("oauth_state")?.value;

  if (!codeVerifier || !state) {
    throw new Error("Missing OAuth state or code verifier");
  }

  cookieStore.delete("code_verifier");
  cookieStore.delete("oauth_state");

  const tokens = await client.authorizationCodeGrant(config, new URL(`${callbackUrl}?${searchParams.toString()}`), {
    pkceCodeVerifier: codeVerifier,
    expectedState: state,
  });

  const claims = tokens.claims();
  if (!claims) {
    throw new Error("No claims in token response");
  }

  await storage.upsertUser({
    id: claims.sub,
    email: claims.email as string | undefined,
    firstName: (claims as any).first_name,
    lastName: (claims as any).last_name,
    profileImageUrl: (claims as any).profile_image_url,
  });

  const userSession: UserSession = {
    claims: {
      sub: claims.sub,
      email: claims.email as string | undefined,
      first_name: (claims as any).first_name,
      last_name: (claims as any).last_name,
      profile_image_url: (claims as any).profile_image_url,
      exp: claims.exp,
    },
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: claims.exp,
  };

  return userSession;
}

export async function refreshTokens(refreshToken: string): Promise<UserSession | null> {
  try {
    const config = await getOidcConfig();
    const tokens = await client.refreshTokenGrant(config, refreshToken);
    const claims = tokens.claims();
    
    if (!claims) {
      return null;
    }

    return {
      claims: {
        sub: claims.sub,
        email: claims.email as string | undefined,
        first_name: (claims as any).first_name,
        last_name: (claims as any).last_name,
        profile_image_url: (claims as any).profile_image_url,
        exp: claims.exp,
      },
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: claims.exp,
    };
  } catch (error) {
    console.error("Failed to refresh tokens:", error);
    return null;
  }
}

export async function getLogoutUrl(postLogoutRedirectUri: string): Promise<string> {
  const config = await getOidcConfig();
  
  const logoutUrl = client.buildEndSessionUrl(config, {
    client_id: process.env.REPL_ID!,
    post_logout_redirect_uri: postLogoutRedirectUri,
  });

  return logoutUrl.href;
}
