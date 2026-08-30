import express from "express";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./sdk", () => ({ sdk: { authenticateRequest: vi.fn() } }));

import { registerStorageProxy } from "./storageProxy";
import { sdk } from "./sdk";

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.BUILT_IN_FORGE_API_URL = "https://forge.test.invalid";
  process.env.BUILT_IN_FORGE_API_KEY = "test-forge-key";
});

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllGlobals();
});

async function requestKey(key: string) {
  const app = express();
  registerStorageProxy(app);
  const server = app.listen(0);
  await new Promise<void>(resolve => server.once("listening", () => resolve()));
  const { port } = server.address() as AddressInfo;
  const response = await fetch(`http://127.0.0.1:${port}/manus-storage/${key}`, { redirect: "manual" });
  await new Promise<void>(resolve => server.close(() => resolve()));
  return response;
}

/**
 * Stubs global fetch with a passthrough that records calls to the storage
 * backend. A blanket stub cannot be used here because the test harness itself
 * reaches the express server over fetch.
 */
function spyOnForge() {
  const realFetch = globalThis.fetch;
  const forge = vi.fn();
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof URL ? input.href : input);
    if (url.startsWith("https://forge.test.invalid")) {
      forge(url);
      return new Response(JSON.stringify({ url: "https://signed.example/object.png" }), { status: 200 });
    }
    return realFetch(input as never, init);
  });
  return forge;
}

describe("object storage proxy", () => {
  it("refuses to mint a signed URL for an unauthenticated caller", async () => {
    vi.mocked(sdk.authenticateRequest).mockRejectedValue(new Error("no session"));
    const forge = spyOnForge();

    const response = await requestKey("some/object.png");

    expect(response.status).toBe(401);
    // The storage backend must never be contacted without a session.
    expect(forge).not.toHaveBeenCalled();
  });

  it("rejects a traversal key even for an authenticated caller", async () => {
    vi.mocked(sdk.authenticateRequest).mockResolvedValue({ id: 1 } as never);

    const response = await requestKey("..%2f..%2fetc%2fpasswd");

    expect(response.status).toBe(400);
  });

  it("redirects an authenticated caller to the signed URL", async () => {
    vi.mocked(sdk.authenticateRequest).mockResolvedValue({ id: 1 } as never);
    const forge = spyOnForge();

    const response = await requestKey("some/object.png");

    expect(forge).toHaveBeenCalledOnce();

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://signed.example/object.png");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
