import express from "express";
import type { AddressInfo } from "node:net";
import { describe, expect, it, vi } from "vitest";
import { registerUnsubscribeRoute } from "./unsubscribeRoute";

const TOKEN = "opaque-unsubscribe-token";

async function withServer(run: (baseUrl: string) => Promise<void>) {
  const unsubscribePriceAlertEmails = vi.fn(async () => true);
  const app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  registerUnsubscribeRoute(app, { unsubscribePriceAlertEmails });
  const server = app.listen(0);
  await new Promise<void>(resolve => server.once("listening", () => resolve()));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
  return unsubscribePriceAlertEmails;
}

describe("unsubscribe endpoint", () => {
  it("does not change anything on GET, so link scanners cannot unsubscribe a user", async () => {
    let status = 0;
    let body = "";
    const unsubscribe = await withServer(async baseUrl => {
      const response = await fetch(`${baseUrl}/api/unsubscribe?token=${TOKEN}`);
      status = response.status;
      body = await response.text();
    });

    expect(status).toBe(200);
    expect(unsubscribe).not.toHaveBeenCalled();
    // It must offer an explicit POST confirmation instead.
    expect(body).toContain('method="POST"');
    expect(body).toContain(TOKEN);
  });

  it("applies the change on POST", async () => {
    let status = 0;
    const unsubscribe = await withServer(async baseUrl => {
      const response = await fetch(`${baseUrl}/api/unsubscribe?token=${TOKEN}`, { method: "POST" });
      status = response.status;
    });

    expect(status).toBe(200);
    expect(unsubscribe).toHaveBeenCalledWith(TOKEN);
  });

  it("accepts the token from a form body, as RFC 8058 one-click sends it", async () => {
    const unsubscribe = await withServer(async baseUrl => {
      await fetch(`${baseUrl}/api/unsubscribe`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: TOKEN }).toString(),
      });
    });

    expect(unsubscribe).toHaveBeenCalledWith(TOKEN);
  });

  it("rejects a missing or oversized token without touching the database", async () => {
    let missing = 0;
    let oversized = 0;
    const unsubscribe = await withServer(async baseUrl => {
      missing = (await fetch(`${baseUrl}/api/unsubscribe`, { method: "POST" })).status;
      oversized = (await fetch(`${baseUrl}/api/unsubscribe?token=${"x".repeat(65)}`, { method: "POST" })).status;
    });

    expect(missing).toBe(400);
    expect(oversized).toBe(400);
    expect(unsubscribe).not.toHaveBeenCalled();
  });

  it("escapes the token it reflects into the confirmation form", async () => {
    let body = "";
    await withServer(async baseUrl => {
      const injected = encodeURIComponent('"><script>alert(1)</script>');
      body = await (await fetch(`${baseUrl}/api/unsubscribe?token=${injected}`)).text();
    });

    expect(body).not.toContain("<script>alert(1)</script>");
    expect(body).toContain("&lt;script&gt;");
  });
});
