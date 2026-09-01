import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser,
  notificationPreferences,
  NotificationPreference,
  priceEntries,
  priceImportJobs,
  priceImportSchedules,
  PriceEntry,
  PriceImportJob,
  PriceImportSchedule,
  User,
  users,
  WatchedRecord,
  watchedRecords,
  watchEvents,
  WatchEvent,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { effectivePriceSources, parseSelectedSources, PriceSourceId, sourceLabel } from "./priceSources";

type Database = PostgresJsDatabase<Record<string, never>>;
type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

let _client: ReturnType<typeof postgres> | null = null;
let _db: Database | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // prepare:false keeps the driver compatible with transaction-mode
      // connection pooling (Supabase Supavisor port 6543), where prepared
      // statements cannot outlive the transaction that made them.
      _client = postgres(process.env.DATABASE_URL, {
        prepare: false,
        max: Number(process.env.DATABASE_POOL_MAX ?? 10),
        idle_timeout: 20,
      });
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _client = null;
      _db = null;
    }
  }
  return _db;
}

/** Closes the connection pool. Test teardown only; the app never calls it. */
export async function closeDb() {
  if (_client) {
    await _client.end({ timeout: 5 });
    _client = null;
    _db = null;
  }
}

async function databaseOrThrow() {
  const database = await getDb();
  if (!database) throw new Error("Database is unavailable.");
  return database;
}

/**
 * Row-level security context. The app connects as the non-owner role
 * `dropwatch_app`, whose policies read these transaction-local settings —
 * so every statement here runs inside a transaction that first asserts who
 * is acting. A query that escapes these wrappers (or forgets a WHERE clause)
 * sees zero rows instead of every tenant's rows.
 *
 * - user context: acting as the app user whose id is `userId`
 * - identity context: login path, before a users row is known to exist;
 *   scoped to the external identity (`openId`) being authenticated
 * - service context: trusted server-only paths with no acting user
 *   (provider webhooks, scheduled imports, unsubscribe-by-token)
 */
type RlsClaims = { userId?: number; openId?: string; service?: boolean };

async function withContext<T>(claims: RlsClaims, fn: (tx: Tx) => Promise<T>): Promise<T> {
  const database = await databaseOrThrow();
  return database.transaction(async tx => {
    if (claims.service) await tx.execute(sql`select set_config('app.role', 'service', true)`);
    if (claims.userId !== undefined) await tx.execute(sql`select set_config('app.user_id', ${String(claims.userId)}, true)`);
    if (claims.openId !== undefined) await tx.execute(sql`select set_config('app.open_id', ${claims.openId}, true)`);
    return fn(tx);
  });
}

export function withUserContext<T>(userId: number, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return withContext({ userId }, fn);
}

export function withServiceContext<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return withContext({ service: true }, fn);
}

function withIdentityContext<T>(openId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return withContext({ openId }, fn);
}

function toStoredStores(stores: string[]) {
  return JSON.stringify(Array.from(new Set(stores.map(store => store.trim()).filter(Boolean))));
}

function toStoredSources(sources: PriceSourceId[]) {
  return JSON.stringify(Array.from(new Set(sources)));
}

export function parseStoredStores(stores: string): string[] {
  try {
    const parsed = JSON.parse(stores);
    return Array.isArray(parsed) ? parsed.filter((store): store is string => typeof store === "string") : [];
  } catch {
    return [];
  }
}

export type WatchRecordStatus = "active" | "paused" | "triggered" | "deleted";
export type SerializedWatchedRecord = Omit<WatchedRecord, "stores" | "sources" | "status"> & {
  stores: string[];
  sources: PriceSourceId[];
  status: WatchRecordStatus;
};

function serializeRecord(record: WatchedRecord): SerializedWatchedRecord {
  return {
    ...record,
    stores: parseStoredStores(record.stores),
    sources: effectivePriceSources(record.sources),
    status: record.status as WatchRecordStatus,
  };
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const database = await getDb();
  if (!database) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach(field => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;

  await withIdentityContext(user.openId, async tx => {
    await tx.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
  });
}

export async function getUserByOpenId(openId: string) {
  const database = await getDb();
  if (!database) return undefined;
  return withIdentityContext(openId, async tx => {
    const result = await tx.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result[0];
  });
}

export async function getUserById(userId: number) {
  return withUserContext(userId, async tx => {
    const result = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
    return result[0];
  });
}

async function getRecordForUser(tx: Tx, userId: number, recordId: number, includeDeleted = false) {
  const condition = includeDeleted
    ? and(eq(watchedRecords.id, recordId), eq(watchedRecords.userId, userId))
    : and(eq(watchedRecords.id, recordId), eq(watchedRecords.userId, userId), ne(watchedRecords.status, "deleted"));
  const records = await tx.select().from(watchedRecords).where(condition).limit(1);
  return records[0] ? serializeRecord(records[0]) : undefined;
}

async function getRecordDetail(tx: Tx, userId: number, recordId: number) {
  const record = await getRecordForUser(tx, userId, recordId);
  if (!record) return undefined;
  const [prices, events] = await Promise.all([
    tx.select().from(priceEntries).where(eq(priceEntries.watchedRecordId, recordId)).orderBy(asc(priceEntries.recordedAt), asc(priceEntries.id)),
    tx.select().from(watchEvents).where(eq(watchEvents.watchedRecordId, recordId)).orderBy(desc(watchEvents.createdAt), desc(watchEvents.id)),
  ]);
  return { record, prices, events };
}

export async function listWatchedRecords(userId: number, includeDeleted = false) {
  return withUserContext(userId, async tx => {
    const condition = includeDeleted
      ? eq(watchedRecords.userId, userId)
      : and(eq(watchedRecords.userId, userId), ne(watchedRecords.status, "deleted"));
    const records = await tx.select().from(watchedRecords).where(condition).orderBy(desc(watchedRecords.updatedAt));
    return records.map(serializeRecord);
  });
}

export async function listActiveWatchedRecords(userId: number) {
  return withUserContext(userId, async tx => {
    const records = await tx
      .select()
      .from(watchedRecords)
      .where(and(eq(watchedRecords.userId, userId), eq(watchedRecords.status, "active")))
      .orderBy(desc(watchedRecords.updatedAt));
    return records.map(serializeRecord);
  });
}

export async function getWatchedRecordForUser(userId: number, recordId: number, includeDeleted = false) {
  return withUserContext(userId, tx => getRecordForUser(tx, userId, recordId, includeDeleted));
}

export async function getWatchedRecordDetail(userId: number, recordId: number) {
  return withUserContext(userId, tx => getRecordDetail(tx, userId, recordId));
}

export async function createWatchedRecord(input: {
  userId: number;
  originalRequest: string;
  productName: string;
  stores: string[];
  sources?: PriceSourceId[];
  thresholdCents: number;
  alertBasis?: "item_price" | "estimated_total" | "verified_total";
  destinationPostalCode?: string;
  observationMode?: boolean;
}) {
  return withUserContext(input.userId, async tx => {
    const inserted = await tx
      .insert(watchedRecords)
      .values({
        userId: input.userId,
        originalRequest: input.originalRequest,
        productName: input.productName,
        stores: toStoredStores(input.stores),
        sources: toStoredSources(input.sources ?? ["google_shopping"]),
        thresholdCents: input.thresholdCents,
        alertBasis: input.alertBasis ?? "item_price",
        destinationPostalCode: input.destinationPostalCode ?? null,
        observationMode: input.observationMode ?? false,
      })
      .returning({ id: watchedRecords.id });
    const recordId = inserted[0].id;
    await tx.insert(watchEvents).values({
      watchedRecordId: recordId,
      eventType: "created",
      message: `Watching ${input.productName} below ${(input.thresholdCents / 100).toFixed(2)}.`,
    });
    return getRecordDetail(tx, input.userId, recordId);
  });
}

export async function updateWatchedRecord(input: {
  userId: number;
  recordId: number;
  originalRequest: string;
  productName: string;
  stores: string[];
  sources: PriceSourceId[];
  thresholdCents: number;
  alertBasis?: "item_price" | "estimated_total" | "verified_total";
  destinationPostalCode?: string;
  observationMode?: boolean;
}) {
  return withUserContext(input.userId, async tx => {
    const existing = await getRecordForUser(tx, input.userId, input.recordId);
    if (!existing) return undefined;
    await tx
      .update(watchedRecords)
      .set({
        originalRequest: input.originalRequest,
        productName: input.productName,
        stores: toStoredStores(input.stores),
        sources: toStoredSources(input.sources),
        thresholdCents: input.thresholdCents,
        alertBasis: input.alertBasis ?? "item_price",
        destinationPostalCode: input.destinationPostalCode ?? null,
        observationMode: input.observationMode ?? false,
      })
      .where(and(eq(watchedRecords.id, input.recordId), eq(watchedRecords.userId, input.userId)));
    await tx.insert(watchEvents).values({
      watchedRecordId: input.recordId,
      eventType: "updated",
      message: `Updated watch details for ${input.productName}.`,
    });
    return getRecordDetail(tx, input.userId, input.recordId);
  });
}

export async function setWatchedRecordStatus(input: {
  userId: number;
  recordId: number;
  status: "active" | "paused";
}) {
  return withUserContext(input.userId, async tx => {
    const existing = await getRecordForUser(tx, input.userId, input.recordId);
    if (!existing) return undefined;
    await tx
      .update(watchedRecords)
      .set({ status: input.status })
      .where(and(eq(watchedRecords.id, input.recordId), eq(watchedRecords.userId, input.userId)));
    await tx.insert(watchEvents).values({
      watchedRecordId: input.recordId,
      eventType: input.status === "paused" ? "paused" : "resumed",
      message: input.status === "paused" ? "Paused price-drop notifications." : "Resumed price-drop notifications.",
    });
    return getRecordDetail(tx, input.userId, input.recordId);
  });
}

export async function softDeleteWatchedRecord(userId: number, recordId: number) {
  return withUserContext(userId, async tx => {
    const existing = await getRecordForUser(tx, userId, recordId);
    if (!existing) return false;
    await tx
      .update(watchedRecords)
      .set({ status: "deleted", deletedAt: new Date() })
      .where(and(eq(watchedRecords.id, recordId), eq(watchedRecords.userId, userId)));
    await tx.insert(watchEvents).values({
      watchedRecordId: recordId,
      eventType: "deleted",
      message: "Removed this watch from the dashboard.",
    });
    return true;
  });
}

export function statusAfterPrice(input: {
  currentStatus: WatchRecordStatus;
  currentPriceCents: number;
  thresholdCents: number;
}): WatchRecordStatus {
  return input.currentStatus === "active" && input.currentPriceCents <= input.thresholdCents
    ? "triggered"
    : input.currentStatus;
}

export async function logPrice(input: {
  userId: number;
  recordId: number;
  productUrl: string;
  store: string;
  priceCents: number;
  dealVerdict: string;
  priceImportJobId?: string;
  shippingCents?: number;
  taxCents?: number;
  estimatedTotalCents?: number;
  currency?: string;
  condition?: string;
  fulfillment?: string;
  availability?: string;
  seller?: string;
  destinationPostalCode?: string;
  costConfidence?: string;
  freshnessState?: string;
  observedAt?: Date;
  evidenceJson?: string;
  qualifiesForAlert?: boolean;
}) {
  return withUserContext(input.userId, async tx => {
    const existing = await getRecordForUser(tx, input.userId, input.recordId);
    if (!existing) return undefined;
    await tx.insert(priceEntries).values({
      watchedRecordId: input.recordId,
      productUrl: input.productUrl,
      store: input.store,
      priceCents: input.priceCents,
      priceImportJobId: input.priceImportJobId,
      shippingCents: input.shippingCents ?? null,
      taxCents: input.taxCents ?? null,
      estimatedTotalCents: input.estimatedTotalCents ?? input.priceCents,
      currency: input.currency ?? "USD",
      condition: input.condition ?? null,
      fulfillment: input.fulfillment ?? null,
      availability: input.availability ?? null,
      seller: input.seller ?? null,
      destinationPostalCode: input.destinationPostalCode ?? null,
      costConfidence: input.costConfidence ?? "unknown",
      freshnessState: input.freshnessState ?? "fresh",
      observedAt: input.observedAt ?? new Date(),
      evidenceJson: input.evidenceJson ?? null,
    });
    await tx.insert(watchEvents).values({
      watchedRecordId: input.recordId,
      eventType: "price_logged",
      message: input.priceImportJobId
        ? `$${(input.priceCents / 100).toFixed(2)} imported from ${input.store}.`
        : `$${(input.priceCents / 100).toFixed(2)} logged at ${input.store}.`,
    });

    const nextStatus = statusAfterPrice({
      currentStatus: existing.status,
      currentPriceCents: input.priceCents,
      thresholdCents: existing.thresholdCents,
    });
    const thresholdMet = (input.qualifiesForAlert ?? input.priceCents <= existing.thresholdCents) && existing.status !== "triggered";
    await tx
      .update(watchedRecords)
      .set({
        currentPriceCents: input.priceCents,
        currentStore: input.store,
        dealVerdict: input.dealVerdict,
        status: thresholdMet ? nextStatus : existing.status,
        lastAlertedAt: thresholdMet ? new Date() : existing.lastAlertedAt,
      })
      .where(and(eq(watchedRecords.id, input.recordId), eq(watchedRecords.userId, input.userId)));

    if (thresholdMet) {
      await tx.insert(watchEvents).values({
        watchedRecordId: input.recordId,
        eventType: "threshold_met",
        message: `Target met: $${(input.priceCents / 100).toFixed(2)} at ${input.store} is within your target.`,
      });
    }
    return getRecordDetail(tx, input.userId, input.recordId);
  });
}

export async function getPriceEntriesForRecord(recordId: number): Promise<PriceEntry[]> {
  return withServiceContext(tx =>
    tx.select().from(priceEntries).where(eq(priceEntries.watchedRecordId, recordId)).orderBy(asc(priceEntries.recordedAt), asc(priceEntries.id)),
  );
}

export async function createPriceImportJob(input: { watchedRecordId: number; providerJobId: string; source: PriceSourceId }) {
  await withServiceContext(async tx => {
    await tx.insert(priceImportJobs).values({
      watchedRecordId: input.watchedRecordId,
      providerJobId: input.providerJobId,
      source: input.source,
    });
    await tx.insert(watchEvents).values({
      watchedRecordId: input.watchedRecordId,
      eventType: "import_requested",
      message: `Requested a fresh US price check from ${sourceLabel(input.source)}.`,
    });
  });
}

export async function getPriceImportJobWithRecord(providerJobId: string) {
  return withServiceContext(async tx => {
    const jobs = await tx.select().from(priceImportJobs).where(eq(priceImportJobs.providerJobId, providerJobId)).limit(1);
    const job = jobs[0];
    if (!job) return undefined;
    const records = await tx
      .select()
      .from(watchedRecords)
      .where(and(eq(watchedRecords.id, job.watchedRecordId), ne(watchedRecords.status, "deleted")))
      .limit(1);
    const record = records[0];
    if (!record) return undefined;
    const owners = await tx.select().from(users).where(eq(users.id, record.userId)).limit(1);
    return { job, record: serializeRecord(record), owner: owners[0] };
  });
}

export async function markPriceImportJobFailed(providerJobId: string, reason: string) {
  const current = await getPriceImportJobWithRecord(providerJobId);
  if (!current || current.job.status !== "queued") return false;
  return withServiceContext(async tx => {
    const updated = await tx
      .update(priceImportJobs)
      .set({ status: "failed", errorMessage: reason.slice(0, 1000), completedAt: new Date() })
      .where(and(eq(priceImportJobs.providerJobId, providerJobId), eq(priceImportJobs.status, "queued")))
      .returning({ id: priceImportJobs.id });
    if (updated.length !== 1) return false;
    await tx.insert(watchEvents).values({
      watchedRecordId: current.record.id,
      eventType: "import_failed",
      message: `Automated price check could not be completed: ${reason.slice(0, 240)}`,
    });
    return true;
  });
}

export async function markPriceImportJobCompleted(providerJobId: string, resultUrl?: string, resultReason?: string) {
  const current = await getPriceImportJobWithRecord(providerJobId);
  if (!current || current.job.status !== "queued") return undefined;
  return withServiceContext(async tx => {
    const updated = await tx
      .update(priceImportJobs)
      .set({ status: "completed", resultUrl: resultUrl ?? null, resultReason: resultReason ?? null, completedAt: new Date() })
      .where(and(eq(priceImportJobs.providerJobId, providerJobId), eq(priceImportJobs.status, "queued")))
      .returning({ id: priceImportJobs.id });
    if (updated.length !== 1) return undefined;
    return current;
  });
}

export async function appendWatchEvent(input: {
  watchedRecordId: number;
  eventType: "import_completed" | "email_sent" | "email_failed" | "email_skipped";
  message: string;
}) {
  await withServiceContext(async tx => {
    await tx.insert(watchEvents).values(input);
  });
}

async function readPriceImportSchedule(tx: Tx, ownerId: number): Promise<PriceImportSchedule | undefined> {
  const schedules = await tx.select().from(priceImportSchedules).where(eq(priceImportSchedules.ownerId, ownerId)).limit(1);
  return schedules[0];
}

export async function getPriceImportSchedule(ownerId: number): Promise<PriceImportSchedule | undefined> {
  return withUserContext(ownerId, tx => readPriceImportSchedule(tx, ownerId));
}

export async function getPriceImportScheduleByTaskUid(taskUid: string): Promise<PriceImportSchedule | undefined> {
  return withServiceContext(async tx => {
    const schedules = await tx.select().from(priceImportSchedules).where(eq(priceImportSchedules.scheduleCronTaskUid, taskUid)).limit(1);
    return schedules[0];
  });
}

export async function createPriceImportSchedule(input: { ownerId: number; taskUid: string; cronExpression: string }) {
  return withUserContext(input.ownerId, async tx => {
    await tx.insert(priceImportSchedules).values({
      ownerId: input.ownerId,
      scheduleCronTaskUid: input.taskUid,
      cronExpression: input.cronExpression,
      market: "us",
      enabled: true,
    });
    return readPriceImportSchedule(tx, input.ownerId);
  });
}

export async function setPriceImportScheduleEnabled(ownerId: number, enabled: boolean) {
  return withUserContext(ownerId, async tx => {
    await tx.update(priceImportSchedules).set({ enabled }).where(eq(priceImportSchedules.ownerId, ownerId));
    return readPriceImportSchedule(tx, ownerId);
  });
}

function newUnsubscribeToken() {
  return randomBytes(24).toString("base64url");
}

export async function getNotificationPreferences(userId: number): Promise<NotificationPreference> {
  return withUserContext(userId, async tx => {
    const preferences = await tx.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
    const existing = preferences[0];
    if (!existing) {
      const token = newUnsubscribeToken();
      const created = await tx.insert(notificationPreferences).values({ userId, unsubscribeToken: token }).returning();
      if (!created[0]) throw new Error("Notification preferences could not be created.");
      return created[0];
    }
    if (!existing.unsubscribeToken) {
      const token = newUnsubscribeToken();
      await tx.update(notificationPreferences).set({ unsubscribeToken: token }).where(eq(notificationPreferences.id, existing.id));
      return { ...existing, unsubscribeToken: token };
    }
    return existing;
  });
}

export async function setPriceAlertEmailPreference(userId: number, priceAlertEmails: boolean) {
  const existing = await getNotificationPreferences(userId);
  return withUserContext(userId, async tx => {
    const updated = await tx
      .update(notificationPreferences)
      .set({ priceAlertEmails, unsubscribedAt: priceAlertEmails ? null : new Date() })
      .where(eq(notificationPreferences.id, existing.id))
      .returning();
    if (!updated[0]) throw new Error("Notification preferences could not be updated.");
    return updated[0];
  });
}

export async function unsubscribePriceAlertEmails(token: string) {
  return withServiceContext(async tx => {
    const preferences = await tx.select().from(notificationPreferences).where(eq(notificationPreferences.unsubscribeToken, token)).limit(1);
    const preference = preferences[0];
    if (!preference) return false;
    await tx.update(notificationPreferences).set({ priceAlertEmails: false, unsubscribedAt: new Date() }).where(eq(notificationPreferences.id, preference.id));
    return true;
  });
}

export type ImportHealthJob = {
  providerJobId: string;
  source: PriceSourceId;
  status: string;
  errorMessage: string | null;
  resultReason: string | null;
  createdAt: Date;
  completedAt: Date | null;
};

export type ImportHealthItem = {
  recordId: number;
  productName: string;
  watchStatus: string;
  latestJob: ImportHealthJob | null;
  jobs: ImportHealthJob[];
};

export async function getPilotMetrics(userId: number) {
  return withUserContext(userId, async tx => {
    const records = await tx.select({ observationMode: watchedRecords.observationMode }).from(watchedRecords).where(and(eq(watchedRecords.userId, userId), ne(watchedRecords.status, "deleted")));
    const matches = await tx.select({ id: watchEvents.id }).from(watchEvents).innerJoin(watchedRecords, eq(watchedRecords.id, watchEvents.watchedRecordId)).where(and(eq(watchedRecords.userId, userId), eq(watchEvents.eventType, "email_skipped")));
    return { observationWatches: records.filter(record => record.observationMode).length, recordedMatches: matches.length };
  });
}

export async function listImportHealth(userId: number): Promise<ImportHealthItem[]> {
  return withUserContext(userId, async tx => {
    const rows = await tx
      .select({
        recordId: watchedRecords.id,
        productName: watchedRecords.productName,
        watchStatus: watchedRecords.status,
        providerJobId: priceImportJobs.providerJobId,
        source: priceImportJobs.source,
        jobStatus: priceImportJobs.status,
        errorMessage: priceImportJobs.errorMessage,
        resultReason: priceImportJobs.resultReason,
        createdAt: priceImportJobs.createdAt,
        completedAt: priceImportJobs.completedAt,
      })
      .from(watchedRecords)
      .leftJoin(priceImportJobs, eq(priceImportJobs.watchedRecordId, watchedRecords.id))
      .where(and(eq(watchedRecords.userId, userId), ne(watchedRecords.status, "deleted")))
      .orderBy(desc(priceImportJobs.createdAt));
    const latestByRecord = new Map<number, ImportHealthItem>();
    for (const row of rows) {
      const item = latestByRecord.get(row.recordId) ?? { recordId: row.recordId, productName: row.productName, watchStatus: row.watchStatus, latestJob: null, jobs: [] };
      if (row.providerJobId && row.source && row.jobStatus && row.createdAt && !item.jobs.some(job => job.source === row.source)) {
        const job: ImportHealthJob = { providerJobId: row.providerJobId, source: row.source as PriceSourceId, status: row.jobStatus, errorMessage: row.errorMessage, resultReason: row.resultReason, createdAt: row.createdAt, completedAt: row.completedAt };
        item.jobs.push(job);
        if (!item.latestJob) item.latestJob = job;
      }
      latestByRecord.set(row.recordId, item);
    }
    return Array.from(latestByRecord.values());
  });
}

export type WatchedRecordDetail = {
  record: SerializedWatchedRecord;
  prices: PriceEntry[];
  events: WatchEvent[];
};

export type PriceImportJobWithRecord = {
  job: PriceImportJob;
  record: SerializedWatchedRecord;
  owner: User | undefined;
};
