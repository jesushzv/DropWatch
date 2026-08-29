import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  listActiveWatchedRecords: vi.fn(),
  createPriceImportJob: vi.fn(),
  getPriceImportJobWithRecord: vi.fn(),
  markPriceImportJobCompleted: vi.fn(),
  markPriceImportJobFailed: vi.fn(),
  getWatchedRecordDetail: vi.fn(),
  logPrice: vi.fn(),
  appendWatchEvent: vi.fn(),
  getNotificationPreferences: vi.fn(),
}));

vi.mock("./notifications", () => ({ sendThresholdEmail: vi.fn() }));
vi.mock("./watchAi", () => ({ writeDealVerdict: vi.fn() }));

import * as db from "./db";
import { sendThresholdEmail } from "./notifications";
import { writeDealVerdict } from "./watchAi";
import { buildPriceWebhookUrl, findLowestTrustedOffer, isValidPriceWebhookSignature, priceWebhookSignature, processPriceApiWebhook, requestPriceImports } from "./priceImport";

describe("Price API import helpers", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });
  it("selects the lowest offer only from the user’s trusted stores", () => {
    const payload = {
      results: [{
        content: {
          product: { offers: [
            { merchant: "Unknown Shop", price: "$89.00", url: "https://unknown.example/product" },
            { merchant: "Amazon", price: "$99.99", url: "https://amazon.example/product" },
            { merchant: "Best Buy", price: "$94.50", url: "https://bestbuy.example/product" },
          ] },
        },
      }],
    };

    expect(findLowestTrustedOffer(payload, ["Amazon", "Best Buy"], "https://fallback.example/product")).toEqual({
      store: "Best Buy",
      priceCents: 9450,
      productUrl: "https://bestbuy.example/product",
    });
  });

  it("requires a valid signed callback URL before accepting a provider webhook", () => {
    const expires = Math.floor(Date.now() / 1000) + 3600;
    expect(isValidPriceWebhookSignature(priceWebhookSignature(expires), String(expires))).toBe(true);
    expect(isValidPriceWebhookSignature("invalid-signature", String(expires))).toBe(false);
    expect(isValidPriceWebhookSignature(priceWebhookSignature(expires), undefined)).toBe(false);
  });

  it("rejects a callback signature once it has expired", () => {
    const expires = Math.floor(Date.now() / 1000) + 3600;
    const signature = priceWebhookSignature(expires);
    expect(isValidPriceWebhookSignature(signature, String(expires))).toBe(true);
    // One second past the stamped expiry the same URL stops working, so a
    // callback URL captured from provider or proxy logs does not last forever.
    expect(isValidPriceWebhookSignature(signature, String(expires), (expires + 1) * 1000)).toBe(false);
  });

  it("will not accept a signature bound to a different expiry", () => {
    const expires = Math.floor(Date.now() / 1000) + 3600;
    expect(isValidPriceWebhookSignature(priceWebhookSignature(expires), String(expires + 60))).toBe(false);
  });

  it("stamps the callback URL it hands the provider with a matching expiry", () => {
    const url = new URL(buildPriceWebhookUrl("https://app.example"));
    const expires = url.searchParams.get("expires");
    const signature = url.searchParams.get("signature");
    expect(isValidPriceWebhookSignature(signature ?? undefined, expires ?? undefined)).toBe(true);
  });

  it("chooses the lowest offer across supported retailers when no store list is supplied", () => {
    const payload = { offers: [
      { merchant: "Amazon", price: "$249.99", url: "https://amazon.example/product" },
      { merchant: "Best Buy", price: "$219.99", url: "https://bestbuy.example/product" },
    ] };

    expect(findLowestTrustedOffer(payload, [], "https://fallback.example/product")).toEqual({
      store: "Best Buy",
      priceCents: 21999,
      productUrl: "https://bestbuy.example/product",
    });
  });

  it("queues one provider job per selected watch source", async () => {
    vi.mocked(db.listActiveWatchedRecords).mockResolvedValue([
      { id: 31, productName: "Noise-cancelling headphones", sources: ["amazon", "ebay"] },
    ] as never);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ job_id: "amazon-job" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ job_id: "ebay-job" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await requestPriceImports({ ownerId: 2, publicBaseUrl: "https://dropwatch.example" });

    expect(result).toMatchObject({ queued: 2, skipped: 0, failures: [] });
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)).source).toBe("amazon");
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body)).source).toBe("ebay");
    expect(db.createPriceImportJob).toHaveBeenNthCalledWith(1, { watchedRecordId: 31, providerJobId: "amazon-job", source: "amazon" });
    expect(db.createPriceImportJob).toHaveBeenNthCalledWith(2, { watchedRecordId: 31, providerJobId: "ebay-job", source: "ebay" });
  });

  it("records an in-app skip and does not call Postmark when price-alert email is disabled", async () => {
    const pending = {
      job: { status: "queued", source: "amazon" },
      record: { id: 5, userId: 7, stores: ["Amazon"], originalRequest: "Headphones under $200 at Amazon", productName: "Headphones", status: "active", thresholdCents: 20_000 },
      owner: { email: "member@example.com" },
    };
    vi.mocked(db.getPriceImportJobWithRecord).mockResolvedValue(pending as never);
    vi.mocked(db.markPriceImportJobCompleted).mockResolvedValue(pending as never);
    vi.mocked(db.getWatchedRecordDetail).mockResolvedValue({ prices: [] } as never);
    vi.mocked(db.getNotificationPreferences).mockResolvedValue({ priceAlertEmails: false, unsubscribeToken: "opaque-token" } as never);
    vi.mocked(db.logPrice).mockResolvedValue({ record: { id: 5 } } as never);
    vi.mocked(writeDealVerdict).mockResolvedValue("Within target.");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ offers: [{ merchant: "Amazon", price: "$199.99", url: "https://amazon.example/product" }] }), { status: 200 })));

    await processPriceApiWebhook({ job_id: "disabled-email-job" }, "https://dropwatch.example");

    expect(sendThresholdEmail).not.toHaveBeenCalled();
    expect(db.appendWatchEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: "email_skipped", message: expect.stringContaining("disabled") }));
  });
});

  it("records observation-mode matches without requesting notification preferences or sending email", async () => {
    const pending = {
      job: { status: "queued", source: "amazon" },
      record: { id: 8, userId: 7, stores: [], originalRequest: "Headphones under $200", productName: "Headphones", status: "active", thresholdCents: 20_000, observationMode: true, alertBasis: "item_price", destinationPostalCode: null },
      owner: { email: "member@example.com" },
    };
    vi.mocked(db.getPriceImportJobWithRecord).mockResolvedValue(pending as never);
    vi.mocked(db.markPriceImportJobCompleted).mockResolvedValue(pending as never);
    vi.mocked(db.getWatchedRecordDetail).mockResolvedValue({ prices: [] } as never);
    vi.mocked(db.logPrice).mockResolvedValue({ record: { id: 8 } } as never);
    vi.mocked(writeDealVerdict).mockResolvedValue("Within target.");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ offers: [{ merchant: "Amazon", price: "$199.99", url: "https://amazon.example/product", condition: "new", availability: "in stock" }] }), { status: 200 })));

    await processPriceApiWebhook({ job_id: "observation-job" }, "https://dropwatch.example");

    expect(db.getNotificationPreferences).not.toHaveBeenCalled();
    expect(sendThresholdEmail).not.toHaveBeenCalled();
    expect(db.appendWatchEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: "email_skipped", message: expect.stringContaining("Observation mode") }));
  });
