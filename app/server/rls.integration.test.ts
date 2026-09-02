import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { users, watchEvents, watchedRecords } from "../drizzle/schema";
import { getDb, withServiceContext, withUserContext } from "./db";

/**
 * Proves that row-level security actually binds for the role the app connects
 * as — not merely that policies exist. Every assertion here bypasses the app
 * layer's WHERE clauses on purpose: the database itself must refuse
 * cross-tenant access. These tests only mean something when DATABASE_URL
 * connects as the non-owner `dropwatch_app` role (as CI and local dev do);
 * a table-owner connection would silently skip RLS and the unfiltered
 * assertions below would fail, which is the desired alarm.
 */
const integration = process.env.DATABASE_URL ? describe : describe.skip;
const openIdA = `dropwatch-rls-a-${Date.now()}`;
const openIdB = `dropwatch-rls-b-${Date.now()}`;
let tenantA: number | undefined;
let tenantB: number | undefined;
let watchA: number | undefined;
let watchB: number | undefined;

/** Drizzle wraps driver errors ("Failed query: ..."); match anywhere in the cause chain. */
async function expectRejectionMatching(run: () => Promise<unknown>, pattern: RegExp) {
  let caught: unknown;
  try {
    await run();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeDefined();
  const messages: string[] = [];
  for (let err = caught; err instanceof Error; err = err.cause) {
    messages.push(err.message);
  }
  expect(messages.join(" | ")).toMatch(pattern);
}

integration("row-level security enforcement", () => {
  afterAll(async () => {
    await withServiceContext(async tx => {
      if (tenantA) await tx.delete(users).where(eq(users.id, tenantA));
      if (tenantB) await tx.delete(users).where(eq(users.id, tenantB));
    });
  });

  it("seeds two tenants through the service context", async () => {
    const inserted = await withServiceContext(tx =>
      tx
        .insert(users)
        .values([
          { openId: openIdA, name: "RLS Tenant A", role: "user", lastSignedIn: new Date() },
          { openId: openIdB, name: "RLS Tenant B", role: "user", lastSignedIn: new Date() },
        ])
        .returning({ id: users.id }),
    );
    tenantA = inserted[0].id;
    tenantB = inserted[1].id;
    const records = await withServiceContext(tx =>
      tx
        .insert(watchedRecords)
        .values([
          { userId: tenantA!, originalRequest: "a", productName: "Watch of A", stores: "[]", thresholdCents: 100 },
          { userId: tenantB!, originalRequest: "b", productName: "Watch of B", stores: "[]", thresholdCents: 200 },
        ])
        .returning({ id: watchedRecords.id }),
    );
    watchA = records[0].id;
    watchB = records[1].id;
    expect(tenantA).toBeGreaterThan(0);
    expect(watchB).toBeGreaterThan(0);
  });

  it("shows a user only their own rows even with no WHERE clause at all", async () => {
    const visible = await withUserContext(tenantA!, tx => tx.select({ id: watchedRecords.id }).from(watchedRecords));
    expect(visible.map(row => row.id)).toContain(watchA);
    expect(visible.map(row => row.id)).not.toContain(watchB);

    const visibleUsers = await withUserContext(tenantA!, tx => tx.select({ id: users.id }).from(users));
    expect(visibleUsers.map(row => row.id)).toEqual([tenantA]);
  });

  it("returns nothing for a query that runs without any identity context", async () => {
    const database = await getDb();
    if (!database) throw new Error("Database is unavailable for integration testing.");
    const rows = await database.select({ id: watchedRecords.id }).from(watchedRecords);
    expect(rows).toEqual([]);
    const userRows = await database.select({ id: users.id }).from(users);
    expect(userRows).toEqual([]);
  });

  it("makes another tenant's rows unreadable and unwritable by id", async () => {
    const read = await withUserContext(tenantA!, tx =>
      tx.select({ id: watchedRecords.id }).from(watchedRecords).where(eq(watchedRecords.id, watchB!)),
    );
    expect(read).toEqual([]);

    const updated = await withUserContext(tenantA!, tx =>
      tx.update(watchedRecords).set({ thresholdCents: 1 }).where(eq(watchedRecords.id, watchB!)).returning({ id: watchedRecords.id }),
    );
    expect(updated).toEqual([]);

    const untouched = await withServiceContext(tx =>
      tx.select({ thresholdCents: watchedRecords.thresholdCents }).from(watchedRecords).where(eq(watchedRecords.id, watchB!)),
    );
    expect(untouched[0]?.thresholdCents).toBe(200);
  });

  it("rejects inserting a row owned by another tenant", async () => {
    await expectRejectionMatching(
      () =>
        withUserContext(tenantA!, tx =>
          tx.insert(watchedRecords).values({ userId: tenantB!, originalRequest: "x", productName: "x", stores: "[]", thresholdCents: 1 }),
        ),
      /row-level security/,
    );
  });

  it("keeps the audit trail immutable even for the service context", async () => {
    await withServiceContext(tx =>
      tx.insert(watchEvents).values({ watchedRecordId: watchA!, eventType: "created", message: "audit row" }),
    );
    await expectRejectionMatching(
      () => withServiceContext(tx => tx.update(watchEvents).set({ message: "tampered" }).where(eq(watchEvents.watchedRecordId, watchA!))),
      /permission denied/,
    );
    await expectRejectionMatching(
      () => withServiceContext(tx => tx.delete(watchEvents).where(eq(watchEvents.watchedRecordId, watchA!))),
      /permission denied/,
    );
  });
});
