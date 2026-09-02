import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app";

/**
 * Assembly test for the shared HTTP app that both the local server and the
 * Vercel function (api/index.ts) serve: every dynamic route family must be
 * mounted and closed by default.
 */
let baseUrl = "";
let server: ReturnType<ReturnType<typeof createApp>["listen"]>;

beforeAll(async () => {
  const app = createApp();
  server = app.listen(0);
  await new Promise<void>(resolve => server.once("listening", () => resolve()));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

describe("serverless app assembly", () => {
  it("mounts the session exchange and rejects an empty body", async () => {
    const response = await fetch(`${baseUrl}/api/auth/session`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    expect(response.status).toBe(400);
  });

  it("rejects an unsigned price webhook", async () => {
    const response = await fetch(`${baseUrl}/api/webhooks/price-api`, { method: "POST" });
    expect(response.status).toBe(401);
  });

  it("refuses the scheduled route on GET and POST without the cron secret", async () => {
    for (const method of ["GET", "POST"]) {
      const response = await fetch(`${baseUrl}/api/scheduled/price-imports`, { method });
      expect(response.status).toBe(401);
    }
  });

  it("answers tRPC requests (unauthenticated auth.me resolves to null)", async () => {
    const response = await fetch(`${baseUrl}/api/trpc/auth.me`);
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(JSON.stringify(payload)).toContain('"data"');
  });
});
