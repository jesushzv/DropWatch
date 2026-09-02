import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { users } from "../drizzle/schema";
import { getNotificationPreferences, setPriceAlertEmailPreference, unsubscribePriceAlertEmails, withServiceContext } from "./db";

const integration = process.env.DATABASE_URL ? describe : describe.skip;
const openId = `dropwatch-preferences-${Date.now()}`;
let userId: number | undefined;

integration("notification preference persistence", () => {
  afterAll(async () => {
    const uid = userId;
    if (!uid) return;
    await withServiceContext(async tx => {
      await tx.delete(users).where(eq(users.id, uid));
    });
  });

  it("defaults to opt-in and persists preference updates through an opaque unsubscribe token", async () => {
    const inserted = await withServiceContext(tx =>
      tx.insert(users).values({ openId, name: "DropWatch Preference Test", role: "user", lastSignedIn: new Date() }).returning({ id: users.id }),
    );
    userId = inserted[0].id;

    const initial = await getNotificationPreferences(userId);
    expect(initial.priceAlertEmails).toBe(true);
    expect(initial.unsubscribeToken).toMatch(/^[A-Za-z0-9_-]{30,}$/);

    const paused = await setPriceAlertEmailPreference(userId, false);
    expect(paused.priceAlertEmails).toBe(false);
    expect(paused.unsubscribedAt).toBeInstanceOf(Date);

    await setPriceAlertEmailPreference(userId, true);
    expect(await unsubscribePriceAlertEmails(initial.unsubscribeToken!)).toBe(true);
    expect((await getNotificationPreferences(userId)).priceAlertEmails).toBe(false);
    expect(await unsubscribePriceAlertEmails("not-a-valid-token")).toBe(false);
  });
});
