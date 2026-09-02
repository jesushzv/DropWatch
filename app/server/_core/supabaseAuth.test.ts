import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { verifySupabaseAccessToken } from "./supabaseAuth";

const SUPABASE_URL = "https://project-ref.supabase.test.invalid";
const SUPABASE_JWT_SECRET = "test-supabase-jwt-secret";
const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.SUPABASE_URL = SUPABASE_URL;
  process.env.SUPABASE_JWT_SECRET = SUPABASE_JWT_SECRET;
});

afterEach(() => {
  process.env = { ...originalEnv };
});

/** Mints an access token shaped like Supabase Auth's, under our test secret. */
async function signAccessToken(overrides: Record<string, unknown> = {}, secret = SUPABASE_JWT_SECRET) {
  const claims: Record<string, unknown> = {
    sub: "6f9619ff-8b86-4d01-b42d-00cf4fc964ff",
    aud: "authenticated",
    iss: `${SUPABASE_URL}/auth/v1`,
    email: "person@example.com",
    user_metadata: { name: "Person Example" },
    app_metadata: { provider: "email" },
    ...overrides,
  };
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
    .sign(new TextEncoder().encode(secret));
}

describe("Supabase access-token verification", () => {
  it("accepts a valid token and extracts the identity", async () => {
    const token = await signAccessToken();
    await expect(verifySupabaseAccessToken(token)).resolves.toEqual({
      openId: "6f9619ff-8b86-4d01-b42d-00cf4fc964ff",
      email: "person@example.com",
      name: "Person Example",
      loginMethod: "email",
    });
  });

  it("rejects a token from a different Supabase project (wrong issuer)", async () => {
    const token = await signAccessToken({ iss: "https://other-project.supabase.test.invalid/auth/v1" });
    await expect(verifySupabaseAccessToken(token)).resolves.toBeNull();
  });

  it("rejects a token without the authenticated audience", async () => {
    const token = await signAccessToken({ aud: "anon" });
    await expect(verifySupabaseAccessToken(token)).resolves.toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signAccessToken({}, "some-other-secret");
    await expect(verifySupabaseAccessToken(token)).resolves.toBeNull();
  });

  it("rejects an anonymous sign-in", async () => {
    const token = await signAccessToken({ is_anonymous: true });
    await expect(verifySupabaseAccessToken(token)).resolves.toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = await new SignJWT({
      sub: "6f9619ff-8b86-4d01-b42d-00cf4fc964ff",
      aud: "authenticated",
      iss: `${SUPABASE_URL}/auth/v1`,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(new TextEncoder().encode(SUPABASE_JWT_SECRET));
    await expect(verifySupabaseAccessToken(token)).resolves.toBeNull();
  });

  it("falls back to null fields when optional identity metadata is missing", async () => {
    const token = await signAccessToken({ email: undefined, user_metadata: {}, app_metadata: {} });
    await expect(verifySupabaseAccessToken(token)).resolves.toEqual({
      openId: "6f9619ff-8b86-4d01-b42d-00cf4fc964ff",
      email: null,
      name: null,
      loginMethod: null,
    });
  });
});
