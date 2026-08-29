import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it, vi } from "vitest";
import { users } from "../drizzle/schema";
import { createPriceImportJob, createWatchedRecord, getDb, getWatchedRecordDetail, logPrice } from "./db";
import { processPriceApiWebhook } from "./priceImport";

const integration = process.env.DATABASE_URL ? describe : describe.skip;
const openId = `dropwatch-trust-${Date.now()}`;
let userId: number | undefined;

integration("persisted trust layer", () => {
  afterAll(async () => {
    if (!userId) return;
    const database = await getDb();
    await database?.delete(users).where(eq(users.id, userId));
  });

  it("persists observation mode, ZIP context, alert basis, and normalized evidence", async () => {
    const database = await getDb();
    if (!database) throw new Error("Database is unavailable for integration testing.");
    const inserted = await database.insert(users).values({ openId, name: "DropWatch Trust Test", role: "user", lastSignedIn: new Date() });
    userId = Number(inserted[0].insertId);
    const detail = await createWatchedRecord({ userId, originalRequest: "Headphones under $200", productName: "Headphones", stores: [], thresholdCents: 20_000, alertBasis: "verified_total", destinationPostalCode: "94105", observationMode: true });
    if (!detail) throw new Error("Expected test watch to be created.");
    await logPrice({ userId, recordId: detail.record.id, productUrl: "https://example.com/headphones", store: "Example", priceCents: 18_000, dealVerdict: "Within target.", shippingCents: 1500, taxCents: 1755, estimatedTotalCents: 20255, currency: "USD", condition: "new", fulfillment: "retailer", availability: "in_stock", seller: "Example", destinationPostalCode: "94105", costConfidence: "verified", freshnessState: "fresh", observedAt: new Date(), evidenceJson: JSON.stringify({ shippingKnown: true, taxKnown: true }) });
    const persisted = await getWatchedRecordDetail(userId, detail.record.id);
    expect(persisted?.record.alertBasis).toBe("verified_total");
    expect(persisted?.record.destinationPostalCode).toBe("94105");
    expect(persisted?.record.observationMode).toBe(true);
    expect(persisted?.prices[0]).toMatchObject({ shippingCents: 1500, taxCents: 1755, estimatedTotalCents: 20255, costConfidence: "verified", freshnessState: "fresh" });
  });

  it("persists an observation event and suppresses stale and unverified alert paths", async () => {
    const database = await getDb();
    if (!database) throw new Error("Database is unavailable for integration testing.");
    const inserted = await database.insert(users).values({ openId: `${openId}-pipeline`, name: "DropWatch Pipeline Test", role: "user", lastSignedIn: new Date() });
    const pipelineUserId = Number(inserted[0].insertId);
    const observation = await createWatchedRecord({ userId: pipelineUserId, originalRequest: "Headphones under $200", productName: "Observation headphones", stores: [], thresholdCents: 20_000, alertBasis: "item_price", observationMode: true });
    const stale = await createWatchedRecord({ userId: pipelineUserId, originalRequest: "Camera under $500", productName: "Stale camera", stores: [], thresholdCents: 50_000, alertBasis: "item_price" });
    if (!observation || !stale) throw new Error("Expected pipeline watches to be created.");
    const observationJobId = `trust-observation-${Date.now()}`;
    const staleJobId = `trust-stale-${Date.now()}`;
    await createPriceImportJob({ watchedRecordId: observation.record.id, providerJobId: observationJobId, source: "amazon" });
    await createPriceImportJob({ watchedRecordId: stale.record.id, providerJobId: staleJobId, source: "amazon" });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ offers: [{ merchant: "Amazon", price: "$199.99", url: "https://amazon.example/observation", condition: "new", availability: "in stock" }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ offers: [{ merchant: "Amazon", price: "$399.99", url: "https://amazon.example/stale", condition: "new", availability: "in stock", observed_at: "2020-01-01T00:00:00Z" }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await processPriceApiWebhook({ job_id: observationJobId }, "https://dropwatch.example");
    await processPriceApiWebhook({ job_id: staleJobId }, "https://dropwatch.example");
    const observationDetail = await getWatchedRecordDetail(pipelineUserId, observation.record.id);
    const staleDetail = await getWatchedRecordDetail(pipelineUserId, stale.record.id);
    expect(observationDetail?.events.some(event => event.eventType === "email_skipped")).toBe(true);
    expect(staleDetail?.prices).toHaveLength(0);
    await database.delete(users).where(eq(users.id, pipelineUserId));
  });

  it("applies item, estimated, and verified alert bases differently for partial landed cost", async () => {
    const database = await getDb();
    if (!database) throw new Error("Database is unavailable for integration testing.");
    const inserted = await database.insert(users).values({ openId: `${openId}-basis`, name: "DropWatch Basis Test", role: "user", lastSignedIn: new Date() });
    const basisUserId = Number(inserted[0].insertId);
    const item = await createWatchedRecord({ userId: basisUserId, originalRequest: "Item price", productName: "Item basis", stores: [], thresholdCents: 20_000, alertBasis: "item_price" });
    const estimated = await createWatchedRecord({ userId: basisUserId, originalRequest: "Estimated total", productName: "Estimated basis", stores: [], thresholdCents: 20_000, alertBasis: "estimated_total" });
    const verified = await createWatchedRecord({ userId: basisUserId, originalRequest: "Verified total", productName: "Verified basis", stores: [], thresholdCents: 20_000, alertBasis: "verified_total" });
    if (!item || !estimated || !verified) throw new Error("Expected basis watches to be created.");
    const jobIds = [`basis-item-${Date.now()}`, `basis-estimated-${Date.now()}`, `basis-verified-${Date.now()}`];
    await createPriceImportJob({ watchedRecordId: item.record.id, providerJobId: jobIds[0], source: "amazon" });
    await createPriceImportJob({ watchedRecordId: estimated.record.id, providerJobId: jobIds[1], source: "amazon" });
    await createPriceImportJob({ watchedRecordId: verified.record.id, providerJobId: jobIds[2], source: "amazon" });
    const offer = { merchant: "Amazon", price: "$199.99", url: "https://amazon.example/basis", condition: "new", availability: "in stock", shipping: 10 };
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ offers: [offer] }), { status: 200 }))));
    for (const jobId of jobIds) await processPriceApiWebhook({ job_id: jobId }, "https://dropwatch.example");
    const [itemDetail, estimatedDetail, verifiedDetail] = await Promise.all([getWatchedRecordDetail(basisUserId, item.record.id), getWatchedRecordDetail(basisUserId, estimated.record.id), getWatchedRecordDetail(basisUserId, verified.record.id)]);
    expect(itemDetail?.prices).toHaveLength(1);
    expect(estimatedDetail?.prices).toHaveLength(1);
    expect(verifiedDetail?.prices).toHaveLength(1);
    expect(verifiedDetail?.record.status).toBe("active");
    expect(verifiedDetail?.events.some(event => event.eventType === "threshold_met")).toBe(false);
    await database.delete(users).where(eq(users.id, basisUserId));
  });

  it("qualifies all alert bases when provider supplies complete landed-cost evidence", async () => {
    const database = await getDb();
    if (!database) throw new Error("Database is unavailable for integration testing.");
    const inserted = await database.insert(users).values({ openId: `${openId}-complete`, name: "DropWatch Complete Basis Test", role: "user", lastSignedIn: new Date() });
    const completeUserId = Number(inserted[0].insertId);
    const bases = await Promise.all(["item_price", "estimated_total", "verified_total"].map((alertBasis, index) => createWatchedRecord({ userId: completeUserId, originalRequest: alertBasis, productName: `Complete basis ${index}`, stores: [], thresholdCents: 23_000, alertBasis: alertBasis as "item_price" | "estimated_total" | "verified_total" })));
    if (bases.some(record => !record)) throw new Error("Expected complete-basis watches to be created.");
    const jobIds = bases.map((_, index) => `complete-basis-${index}-${Date.now()}`);
    for (let index = 0; index < bases.length; index += 1) await createPriceImportJob({ watchedRecordId: bases[index]!.record.id, providerJobId: jobIds[index], source: "amazon" });
    const offer = { merchant: "Amazon", price: "$199.99", url: "https://amazon.example/complete", condition: "new", availability: "in stock", shipping: 10, tax_amount: 2.5 };
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ offers: [offer] }), { status: 200 }))));
    for (const jobId of jobIds) await processPriceApiWebhook({ job_id: jobId }, "https://dropwatch.example");
    for (const record of bases) {
      const detail = await getWatchedRecordDetail(completeUserId, record!.record.id);
      expect(detail?.record.status).toBe("triggered");
      expect(detail?.events.some(event => event.eventType === "threshold_met")).toBe(true);
      expect(detail?.prices[0]).toMatchObject({ estimatedTotalCents: 21249, costConfidence: "verified" });
    }
    await database.delete(users).where(eq(users.id, completeUserId));
  });
});
