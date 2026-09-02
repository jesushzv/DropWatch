import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { verifySupabaseAccessToken } from "./supabaseAuth";

/**
 * Exchanges a verified Supabase Auth access token for DropWatch's own session
 * cookie. The client calls this exactly once after completing a Supabase
 * login (magic link today); everything afterwards runs on the first-party
 * cookie, so Supabase Auth is only on the login path.
 */
export function registerSupabaseAuthRoutes(app: Express) {
  app.post("/api/auth/session", async (req: Request, res: Response) => {
    const accessToken = typeof req.body?.access_token === "string" ? req.body.access_token : undefined;
    if (!accessToken) {
      res.status(400).json({ error: "access_token is required" });
      return;
    }

    const identity = await verifySupabaseAccessToken(accessToken);
    if (!identity) {
      res.status(401).json({ error: "invalid access token" });
      return;
    }

    try {
      await db.upsertUser({
        openId: identity.openId,
        name: identity.name,
        email: identity.email,
        loginMethod: identity.loginMethod,
        lastSignedIn: new Date(),
      });

      // verifySession requires a non-empty name claim; fall back through the
      // identity fields so an email-only signup still gets a valid session.
      const sessionToken = await sdk.createSessionToken(identity.openId, {
        name: identity.name ?? identity.email ?? identity.openId,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ ok: true });
    } catch (error) {
      console.error("[Auth] Session exchange failed", error);
      res.status(500).json({ error: "session exchange failed" });
    }
  });
}
