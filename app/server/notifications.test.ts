import { afterEach, describe, expect, it, vi } from "vitest";
import { sendThresholdEmail } from "./notifications";

describe("threshold email notifications", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("sends the configured sender and a concise target-met message through Postmark", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ MessageID: "message-123" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    // Postmark rejects a literal \u003c…\u003e sender, so the display-name form
    // is unescaped on the way out. Set it here rather than depending on
    // whatever POSTMARK_FROM_EMAIL the machine happens to export.
    vi.stubEnv("POSTMARK_FROM_EMAIL", "DropWatch \\u003cnotifications@usedropwatch.com\\u003e");

    const result = await sendThresholdEmail({
      recipient: "member@example.com",
      productName: "Noise-cancelling headphones",
      store: "Best Buy",
      priceCents: 19999,
      thresholdCents: 22500,
    });

    expect(result).toEqual({ status: "sent", providerMessageId: "message-123" });
    const request = fetchMock.mock.calls[0];
    expect(request?.[0]).toBe("https://api.postmarkapp.com/email");
    const payload = JSON.parse(String(request?.[1]?.body));
    expect(payload.TextBody).not.toMatch(/selected|trusted/i);
    expect(payload.HtmlBody).not.toMatch(/selected|trusted/i);
    expect(payload).toMatchObject({
      From: "DropWatch <notifications@usedropwatch.com>",
      To: "member@example.com",
      Subject: "Price target met: Noise-cancelling headphones",
      Tag: "dropwatch-threshold-alert",
    });
  });

  it("does not call the provider when no authenticated-user email is available", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendThresholdEmail({
      recipient: null,
      productName: "Headphones",
      store: "Best Buy",
      priceCents: 19999,
      thresholdCents: 22500,
    });

    expect(result).toEqual({ status: "skipped", reason: "No email address is associated with this account." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("includes a user-specific unsubscribe link in the delivered email", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ MessageID: "message-456" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await sendThresholdEmail({
      recipient: "member@example.com",
      productName: "Headphones",
      store: "Amazon",
      priceCents: 19999,
      thresholdCents: 22500,
      unsubscribeUrl: "https://dropwatch.example/api/unsubscribe?token=opaque-token",
    });

    const payload = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(payload.TextBody).toContain("token=opaque-token");
    expect(payload.HtmlBody).toContain("Unsubscribe");
  });
});
