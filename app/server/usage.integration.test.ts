import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { usageCounters, users } from "../drizzle/schema";
import { countActiveWatchedRecords, createWatchedRecord, incrementUsage, withServiceContext, withUserContext } from "./db";

const integration = process.env.DATABASE_URL ? describe : describe.skip;
const openIdA = `dropwatch-usage-a-${Date.now()}`;
const openIdB = `dropwatch-usage-b-${Date.now()}`;
let tenantA: number | undefined;
let tenantB: number | undefined;

integration("usage counters", () => {
  afterAll(async () => {
    await withServiceContext(async tx => {
      if (tenantA) await tx.delete(users).where(eq(users.id, tenantA));
      if (tenantB) await tx.delete(users).where(eq(users.id, tenantB));
    });
  });

  it("increments atomically per (user, kind, window)", async () => {
    const inserted = await withServiceContext(tx =>
      tx
        .insert(users)
        .values([
          { openId: openIdA, name: "Usage A", role: "user", lastSignedIn: new Date() },
          { openId: openIdB, name: "Usage B", role: "user", lastSignedIn: new Date() },
        ])
        .returning({ id: users.id }),
    );
    tenantA = inserted[0].id;
    tenantB = inserted[1].id;

    expect(await incrementUsage(tenantA, "llm", "2026-09-01")).toBe(1);
    expect(await incrementUsage(tenantA, "llm", "2026-09-01")).toBe(2);
    expect(await incrementUsage(tenantA, "llm", "2026-09-02")).toBe(1);
    expect(await incrementUsage(tenantA, "import_run", "2026-09-01T14")).toBe(1);
    // Another tenant's counter is independent.
    expect(await incrementUsage(tenantB, "llm", "2026-09-01")).toBe(1);
  });

  it("keeps counters tenant-isolated under RLS", async () => {
    const visibleToB = await withUserContext(tenantB!, tx =>
      tx.select({ userId: usageCounters.userId }).from(usageCounters),
    );
    expect(visibleToB.every(row => row.userId === tenantB)).toBe(true);
    expect(visibleToB).toHaveLength(1);
  });

  it("counts only non-deleted watches toward the cap", async () => {
    expect(await countActiveWatchedRecords(tenantA!)).toBe(0);
    await createWatchedRecord({ userId: tenantA!, originalRequest: "r", productName: "P", stores: [], thresholdCents: 100 });
    expect(await countActiveWatchedRecords(tenantA!)).toBe(1);
  });
});
