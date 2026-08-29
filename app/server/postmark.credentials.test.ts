import { describe, expect, it } from "vitest";

describe.skipIf(process.env.RUN_LIVE_PROVIDER_TESTS !== "1")("Postmark configuration", () => {
  it("authenticates the configured server token without sending an email", async () => {
    const serverToken = process.env.POSTMARK_SERVER_TOKEN;
    expect(serverToken).toBeTruthy();

    const response = await fetch("https://api.postmarkapp.com/server", {
      headers: {
        Accept: "application/json",
        "X-Postmark-Server-Token": serverToken ?? "",
      },
    });

    if (!response.ok) {
      throw new Error(`Postmark server-token verification failed with HTTP ${response.status}.`);
    }

    const server = (await response.json()) as { ID?: number; Name?: string };
    expect(server.ID).toBeTypeOf("number");
    expect(server.Name).toBeTypeOf("string");
  }, 15000);
});
