import { describe, expect, it } from "vitest";

describe.skipIf(process.env.RUN_LIVE_PROVIDER_TESTS !== "1")("Price API configuration", () => {
  it("authenticates the configured token without creating a data job", async () => {
    const token = process.env.PRICE_API_TOKEN;
    expect(token).toBeTruthy();

    const endpoint = new URL("https://priceapi.metoda.com/v2/jobs");
    endpoint.searchParams.set("token", token ?? "");
    endpoint.searchParams.set("per_page", "1");
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`Price API token verification failed with HTTP ${response.status}.`);
    }

    const payload = (await response.json()) as { data?: unknown[] };
    expect(Array.isArray(payload.data)).toBe(true);
  }, 15000);
});
