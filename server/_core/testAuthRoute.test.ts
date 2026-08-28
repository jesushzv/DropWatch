import express from "express";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { registerTestAuthRoute } from "./testAuthRoute";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

async function requestTestSession(secret?: string) {
  const app = express();
  const upsertUser = vi.fn(async () => undefined);
  const createSessionToken = vi.fn(async () => "signed-test-session");
  registerTestAuthRoute(app, { upsertUser, createSessionToken });
  const server = app.listen(0);
  await new Promise<void>(resolve => server.once("listening", () => resolve()));
  const address = server.address() as AddressInfo;
  const response = await fetch(`http://127.0.0.1:${address.port}/__test__/session`, {
    headers: secret ? { "x-dropwatch-test-secret": secret } : undefined,
  });
  const body = await response.json();
  await new Promise<void>(resolve => server.close(() => resolve()));
  return { response, body, upsertUser, createSessionToken };
}

describe("registered development test-auth route", () => {
  it("is unreachable in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.DROPWATCH_TEST_AUTH_ENABLED = "true";
    process.env.DROPWATCH_TEST_AUTH_SECRET = "local-secret";
    const result = await requestTestSession("local-secret");
    expect(result.response.status).toBe(404);
    expect(result.upsertUser).not.toHaveBeenCalled();
  });

  it("rejects missing development configuration and invalid secrets", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.DROPWATCH_TEST_AUTH_ENABLED;
    process.env.DROPWATCH_TEST_AUTH_SECRET = "local-secret";
    const disabled = await requestTestSession("local-secret");
    expect(disabled.response.status).toBe(404);

    process.env.DROPWATCH_TEST_AUTH_ENABLED = "true";
    const invalid = await requestTestSession("wrong-secret");
    expect(invalid.response.status).toBe(401);
  });

  it("issues a normal session cookie only with the configured development secret", async () => {
    process.env.NODE_ENV = "development";
    process.env.DROPWATCH_TEST_AUTH_ENABLED = "true";
    process.env.DROPWATCH_TEST_AUTH_SECRET = "local-secret";
    const result = await requestTestSession("local-secret");
    expect(result.response.status).toBe(200);
    expect(result.body).toEqual({ ok: true, user: "dropwatch-dev-test@example.invalid" });
    expect(result.response.headers.get("set-cookie")).toContain("app_session_id=signed-test-session");
    expect(result.upsertUser).toHaveBeenCalledOnce();
    expect(result.createSessionToken).toHaveBeenCalledOnce();
  });
});
