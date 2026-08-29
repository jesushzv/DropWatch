import { and, eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { users, watchEvents, watchedRecords } from "../drizzle/schema";
import {
  createWatchedRecord,
  getDb,
  getWatchedRecordDetail,
  listWatchedRecords,
  logPrice,
  setWatchedRecordStatus,
  softDeleteWatchedRecord,
} from "./db";

const integration = process.env.DATABASE_URL ? describe : describe.skip;
const openId = `dropwatch-integration-${Date.now()}`;
let userId: number | undefined;

integration("watched-record persistence", () => {
  afterAll(async () => {
    if (!userId) return;
    const database = await getDb();
    await database?.delete(users).where(eq(users.id, userId));
  });

  it("persists an alert, price history, threshold trigger, event history, and soft deletion", async () => {
    const database = await getDb();
    if (!database) throw new Error("Database is unavailable for integration testing.");

    const inserted = await database.insert(users).values({
      openId,
      name: "DropWatch Integration Test",
      role: "user",
      lastSignedIn: new Date(),
    });
    userId = Number(inserted[0].insertId);

    const created = await createWatchedRecord({
      userId,
      originalRequest: "Sony WH-1000XM5 under $250 at Amazon or Best Buy",
      productName: "Sony WH-1000XM5",
      stores: ["Amazon", "Best Buy"],
      thresholdCents: 25_000,
    });
    expect(created?.record.status).toBe("active");
    expect(created?.record.stores).toEqual(["Amazon", "Best Buy"]);

    const recordId = created?.record.id;
    if (!recordId) throw new Error("No watched record was created.");

    const logged = await logPrice({
      userId,
      recordId,
      productUrl: "https://www.bestbuy.com/site/sony-wh-1000xm5/6505727.p",
      store: "Best Buy",
      priceCents: 24_800,
      dealVerdict: "Lowest logged price so far and below your target.",
    });
    expect(logged?.record.status).toBe("triggered");
    expect(logged?.record.currentPriceCents).toBe(24_800);
    expect(logged?.prices).toHaveLength(1);
    expect(logged?.events.map(event => event.eventType)).toEqual(["threshold_met", "price_logged", "created"]);

    const paused = await setWatchedRecordStatus({ userId, recordId, status: "paused" });
    expect(paused?.record.status).toBe("paused");

    expect(await softDeleteWatchedRecord(userId, recordId)).toBe(true);
    expect(await listWatchedRecords(userId)).toEqual([]);

    const persisted = await database
      .select({ status: watchedRecords.status, deletedAt: watchedRecords.deletedAt })
      .from(watchedRecords)
      .where(and(eq(watchedRecords.id, recordId), eq(watchedRecords.userId, userId)));
    expect(persisted[0]?.status).toBe("deleted");
    expect(persisted[0]?.deletedAt).toBeInstanceOf(Date);

    const events = await database.select().from(watchEvents).where(eq(watchEvents.watchedRecordId, recordId));
    expect(events.map(event => event.eventType)).toEqual(expect.arrayContaining(["created", "price_logged", "threshold_met", "paused", "deleted"]));

    const hiddenDetail = await getWatchedRecordDetail(userId, recordId);
    expect(hiddenDetail).toBeUndefined();
  });
});
