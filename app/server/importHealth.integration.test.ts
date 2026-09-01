import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { priceImportJobs, users } from "../drizzle/schema";
import { createWatchedRecord, getDb, listImportHealth } from "./db";

const integration = process.env.DATABASE_URL ? describe : describe.skip;
const openId = `dropwatch-health-${Date.now()}`;
let userId: number | undefined;

integration("per-watch import health", () => {
  afterAll(async () => {
    if (!userId) return;
    const database = await getDb();
    await database?.delete(users).where(eq(users.id, userId));
  });

  it("surfaces every watch once and selects the latest provider job for each", async () => {
    const database = await getDb();
    if (!database) throw new Error("Database is unavailable for integration testing.");
    const inserted = await database.insert(users).values({ openId, name: "DropWatch Health Test", role: "user", lastSignedIn: new Date() });
    userId = Number(inserted[0].insertId);
    const noJob = await createWatchedRecord({ userId, originalRequest: "Camera under $500 at Amazon", productName: "Camera", stores: ["Amazon"], thresholdCents: 50_000 });
    const withJobs = await createWatchedRecord({ userId, originalRequest: "Headphones under $200 at Amazon", productName: "Headphones", stores: ["Amazon"], thresholdCents: 20_000, sources: ["amazon", "ebay"] });
    if (!noJob || !withJobs) throw new Error("Expected test watches to be created.");
    const earlier = new Date(Date.now() - 10_000);
    const latest = new Date();
    const latestEbay = new Date(latest.getTime() + 1000);
    await database.insert(priceImportJobs).values([
      { watchedRecordId: withJobs.record.id, providerJobId: `health-old-${Date.now()}`, source: "amazon", status: "completed", createdAt: earlier, completedAt: earlier },
      { watchedRecordId: withJobs.record.id, providerJobId: `health-latest-amazon-${Date.now()}`, source: "amazon", status: "completed", resultReason: "no_qualifying_offer", createdAt: latest, completedAt: latest },
      { watchedRecordId: withJobs.record.id, providerJobId: `health-latest-ebay-${Date.now()}`, source: "ebay", status: "failed", errorMessage: "Provider timeout", createdAt: latestEbay, completedAt: latestEbay },
    ]);

    const health = await listImportHealth(userId);

    expect(health).toEqual(expect.arrayContaining([
      expect.objectContaining({ recordId: noJob.record.id, latestJob: null }),
      expect.objectContaining({
        recordId: withJobs.record.id,
        latestJob: expect.objectContaining({ source: "ebay", status: "failed", errorMessage: "Provider timeout" }),
        jobs: expect.arrayContaining([
          expect.objectContaining({ source: "amazon", resultReason: "no_qualifying_offer" }),
          expect.objectContaining({ source: "ebay", status: "failed" }),
        ]),
      }),
    ]));
    expect(health).toHaveLength(2);
    const sourceJobs = health.find(item => item.recordId === withJobs.record.id)?.jobs ?? [];
    expect(sourceJobs.filter(job => job.source === "amazon")).toHaveLength(1);
  });
});
