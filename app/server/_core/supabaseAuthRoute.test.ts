import express from "express";
import { SignJWT } from "jose";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db", () => ({
  upsertUser: vi.fn(async () => undefined),
}));

import * as db from "../db";
import { registerSupabaseAuthRoutes } from "./supabaseAuthRoute";
import { sdk } from "./sdk";

const SUPABASE_URL = "https://project-ref.supabase.test.invalid";
const SUPABASE_JWT_SECRET = "test-supabase-jwt-secret";
const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.SUPABASE_URL = SUPABASE_URL;
  process.env.SUPABASE_JWT_SECRET = SUPABASE_JWT_SECRET;
  vi.mocked(db.upsertUser).mockClear();
});

afterEach(() => {
  process.env = { ...originalEnv };
});

async function signAccessToken(overrides: Record<string, unknown> = {}) {
  return new SignJWT({
    sub: "6f9619ff-8b86-4d01-b42d-00cf4fc964ff",
    aud: "authenticated",
    iss: `${SUPABASE_URL}/auth/v1`,
    email: "person@example.com",
    user_metadata: { name: "Person Example" },
    app_metadata: { provider: "email" },
    ...overrides,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
    .sign(new TextEncoder().encode(SUPABASE_JWT_SECRET));
}

async function withServer(run: (baseUrl: string) => Promise<void>) {
  const app = express();
  app.use(express.json());
  registerSupabaseAuthRoutes(app);
  const server = app.listen(0);
  await new Promise<void>(resolve => server.once("listening", () => resolve()));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}

describe("Supabase session exchange", () => {
  it("requires an access token", async () => {
    await withServer(async baseUrl => {
      const response = await fetch(`${baseUrl}/api/auth/session`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(response.status).toBe(400);
    });
    expect(db.upsertUser).not.toHaveBeenCalled();
  });

  it("rejects an unverifiable token without creating a user", async () => {
    await withServer(async baseUrl => {
      const response = await fetch(`${baseUrl}/api/auth/session`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ access_token: "not-a-jwt" }),
      });
      expect(response.status).toBe(401);
    });
    expect(db.upsertUser).not.toHaveBeenCalled();
  });

  it("exchanges a valid token for a first-party session cookie", async () => {
    const token = await signAccessToken();
    let setCookie = "";
    await withServer(async baseUrl => {
      const response = await fetch(`${baseUrl}/api/auth/session`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ access_token: token }),
      });
      expect(response.status).toBe(200);
      setCookie = response.headers.get("set-cookie") ?? "";
    });

    expect(db.upsertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        openId: "6f9619ff-8b86-4d01-b42d-00cf4fc964ff",
        email: "person@example.com",
        name: "Person Example",
        loginMethod: "email",
      }),
    );

    expect(setCookie).toContain("app_session_id=");
    expect(setCookie).toContain("HttpOnly");
    const cookieValue = setCookie.split("app_session_id=")[1]?.split(";")[0];
    // The minted cookie must be a session this app itself accepts.
    await expect(sdk.verifySession(cookieValue)).resolves.toMatchObject({
      openId: "6f9619ff-8b86-4d01-b42d-00cf4fc964ff",
    });
  });

  it("still mints a verifiable session when the account has no name metadata", async () => {
    const token = await signAccessToken({ user_metadata: {} });
    let setCookie = "";
    await withServer(async baseUrl => {
      const response = await fetch(`${baseUrl}/api/auth/session`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ access_token: token }),
      });
      expect(response.status).toBe(200);
      setCookie = response.headers.get("set-cookie") ?? "";
    });
    const cookieValue = setCookie.split("app_session_id=")[1]?.split(";")[0];
    // verifySession rejects empty name claims, so the fallback chain matters.
    await expect(sdk.verifySession(cookieValue)).resolves.not.toBeNull();
  });
});
