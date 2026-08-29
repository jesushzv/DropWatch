import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { hasValidTestAuthSecret, isTestAuthEnabled, TEST_AUTH_EMAIL, TEST_AUTH_NAME, TEST_AUTH_OPEN_ID } from "./testAuth";

type TestAuthDependencies = {
  upsertUser: (input: { openId: string; name: string; email: string; loginMethod: string; lastSignedIn: Date }) => Promise<unknown>;
  createSessionToken: (openId: string, options: { name: string; expiresInMs: number }) => Promise<string>;
};

export function registerTestAuthRoute(app: Express, dependencies: TestAuthDependencies) {
  app.get("/__test__/session", async (req: Request, res: Response) => {
    if (!isTestAuthEnabled()) return res.status(404).json({ error: "not found" });
    const candidate = typeof req.headers["x-dropwatch-test-secret"] === "string" ? req.headers["x-dropwatch-test-secret"] : undefined;
    if (!hasValidTestAuthSecret(candidate)) return res.status(401).json({ error: "invalid test-auth secret" });
    await dependencies.upsertUser({
      openId: TEST_AUTH_OPEN_ID,
      name: TEST_AUTH_NAME,
      email: TEST_AUTH_EMAIL,
      loginMethod: "development-test",
      lastSignedIn: new Date(),
    });
    const sessionToken = await dependencies.createSessionToken(TEST_AUTH_OPEN_ID, { name: TEST_AUTH_NAME, expiresInMs: ONE_YEAR_MS });
    res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
    return res.json({ ok: true, user: TEST_AUTH_EMAIL });
  });
}
