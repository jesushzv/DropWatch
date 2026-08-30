import express from "express";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { registerScheduledImportsRoute } from "./scheduledImportsRoute";

afterEach(() => vi.unstubAllEnvs());

async function callEndpoint() {
  const authenticateRequest = vi.fn(async () => ({ isCron: true, taskUid: "task-1" }));
  const getPriceImportScheduleByTaskUid = vi.fn(async () => ({ ownerId: 42, enabled: true }));
  const requestPriceImports = vi.fn(async () => ({ queued: 3 }));

  const app = express();
  app.use(express.json());
  registerScheduledImportsRoute(app, { authenticateRequest, getPriceImportScheduleByTaskUid, requestPriceImports });
  const server = app.listen(0);
  await new Promise<void>(resolve => server.once("listening", () => resolve()));
  const { port } = server.address() as AddressInfo;
  const response = await fetch(`http://127.0.0.1:${port}/api/scheduled/price-imports`, { method: "POST" });
  const body = await response.json();
  await new Promise<void>(resolve => server.close(() => resolve()));
  return { response, body, authenticateRequest, requestPriceImports };
}

describe("scheduled price imports callback", () => {
  it("refuses while imports are disabled, without even authenticating", async () => {
    vi.stubEnv("PRICE_IMPORTS_ENABLED", "");

    const { response, authenticateRequest, requestPriceImports } = await callEndpoint();

    expect(response.status).toBe(503);
    // Refusing before authentication is the point: a schedule left over from an
    // earlier deployment must not be able to spend money by presenting a valid
    // cron session.
    expect(authenticateRequest).not.toHaveBeenCalled();
    expect(requestPriceImports).not.toHaveBeenCalled();
  });

  it("stays refused when the flag is present but not exactly \"true\"", async () => {
    vi.stubEnv("PRICE_IMPORTS_ENABLED", "1");

    const { response, requestPriceImports } = await callEndpoint();

    expect(response.status).toBe(503);
    expect(requestPriceImports).not.toHaveBeenCalled();
  });

  it("runs the import once explicitly enabled", async () => {
    vi.stubEnv("PRICE_IMPORTS_ENABLED", "true");

    const { response, body, requestPriceImports } = await callEndpoint();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, queued: 3 });
    expect(requestPriceImports).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 42 }));
  });
});
