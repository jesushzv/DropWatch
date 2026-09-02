import { createRemoteJWKSet, jwtVerify } from "jose";
import { ENV } from "./env";

export type SupabaseIdentity = {
  /** The Supabase `auth.users.id` UUID — stored in `users.openId`. */
  openId: string;
  email: string | null;
  name: string | null;
  loginMethod: string | null;
};

let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let cachedJwksUrl = "";

function remoteJwks(supabaseUrl: string) {
  const url = `${supabaseUrl.replace(/\/$/, "")}/auth/v1/.well-known/jwks.json`;
  if (!cachedJwks || cachedJwksUrl !== url) {
    cachedJwks = createRemoteJWKSet(new URL(url));
    cachedJwksUrl = url;
  }
  return cachedJwks;
}

function readString(source: Record<string, unknown>, key: string): string | null {
  const value = source[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Verifies a Supabase Auth access token and extracts the identity DropWatch
 * cares about. Projects with asymmetric signing keys (the current default)
 * verify against the project's JWKS endpoint; setting SUPABASE_JWT_SECRET
 * switches to legacy HS256 verification instead. Both paths pin the issuer to
 * this project's auth server and require the `authenticated` audience, so a
 * token minted by any other Supabase project — or an anonymous sign-in — is
 * rejected.
 */
export async function verifySupabaseAccessToken(accessToken: string): Promise<SupabaseIdentity | null> {
  const supabaseUrl = ENV.supabaseUrl;
  if (!supabaseUrl || !accessToken) return null;
  const issuer = `${supabaseUrl.replace(/\/$/, "")}/auth/v1`;

  try {
    const { payload } = ENV.supabaseJwtSecret
      ? await jwtVerify(accessToken, new TextEncoder().encode(ENV.supabaseJwtSecret), { issuer, audience: "authenticated" })
      : await jwtVerify(accessToken, remoteJwks(supabaseUrl), { issuer, audience: "authenticated" });

    const openId = typeof payload.sub === "string" && payload.sub.length > 0 ? payload.sub : null;
    if (!openId) return null;
    if (payload.is_anonymous === true) return null;

    const userMetadata = (payload.user_metadata ?? {}) as Record<string, unknown>;
    const appMetadata = (payload.app_metadata ?? {}) as Record<string, unknown>;
    return {
      openId,
      email: typeof payload.email === "string" && payload.email.length > 0 ? payload.email : null,
      name: readString(userMetadata, "name") ?? readString(userMetadata, "full_name"),
      loginMethod: readString(appMetadata, "provider"),
    };
  } catch (error) {
    console.warn("[Auth] Supabase token verification failed", String(error));
    return null;
  }
}
