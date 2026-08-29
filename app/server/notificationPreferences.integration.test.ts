import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { users } from "../drizzle/schema";
import { getDb, getNotificationPreferences, setPriceAlertEmailPreference, unsubscribePriceAlertEmails } from "./db";

const integration = process.env.DATABASE_URL ? describe : describe.skip;
const openId = `dropwatch-preferences-${Date.now()}`;
let userId: number | undefined;

integration("notification preference persistence", () => {
  afterAll(async () => {
    if (!userId) return;
    const database = await getDb();
    await database?.delete(users).where(eq(users.id, userId));
  });

  it("defaults to opt-in and persists preference updates through an opaque unsubscribe token", async () => {
    const database = await getDb();
    if (!database) throw new Error("Database is unavailable for integration testing.");
    const inserted = await database.insert(users).values({ openId, name: "DropWatch Preference Test", role: "user", lastSignedIn: new Date() });
    userId = Number(inserted[0].insertId);

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
