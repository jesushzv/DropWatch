import { and, asc, desc, eq, ne } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { drizzle } from "drizzle-orm/mysql2";
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

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
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

async function databaseOrThrow() {
  const database = await getDb();
  if (!database) throw new Error("Database is unavailable.");
  return database;
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

  await database.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const database = await getDb();
  if (!database) return undefined;
  const result = await database.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(userId: number) {
  const database = await databaseOrThrow();
  const result = await database.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}

export async function listWatchedRecords(userId: number, includeDeleted = false) {
  const database = await databaseOrThrow();
  const condition = includeDeleted
    ? eq(watchedRecords.userId, userId)
    : and(eq(watchedRecords.userId, userId), ne(watchedRecords.status, "deleted"));
  const records = await database.select().from(watchedRecords).where(condition).orderBy(desc(watchedRecords.updatedAt));
  return records.map(serializeRecord);
}

export async function listActiveWatchedRecords(userId: number) {
  const database = await databaseOrThrow();
  const records = await database
    .select()
    .from(watchedRecords)
    .where(and(eq(watchedRecords.userId, userId), eq(watchedRecords.status, "active")))
    .orderBy(desc(watchedRecords.updatedAt));
  return records.map(serializeRecord);
}

export async function getWatchedRecordForUser(userId: number, recordId: number, includeDeleted = false) {
  const database = await databaseOrThrow();
  const condition = includeDeleted
    ? and(eq(watchedRecords.id, recordId), eq(watchedRecords.userId, userId))
    : and(eq(watchedRecords.id, recordId), eq(watchedRecords.userId, userId), ne(watchedRecords.status, "deleted"));
  const records = await database.select().from(watchedRecords).where(condition).limit(1);
  return records[0] ? serializeRecord(records[0]) : undefined;
}

export async function getWatchedRecordDetail(userId: number, recordId: number) {
  const record = await getWatchedRecordForUser(userId, recordId);
  if (!record) return undefined;
  const database = await databaseOrThrow();
  const [prices, events] = await Promise.all([
    database.select().from(priceEntries).where(eq(priceEntries.watchedRecordId, recordId)).orderBy(asc(priceEntries.recordedAt)),
    database.select().from(watchEvents).where(eq(watchEvents.watchedRecordId, recordId)).orderBy(desc(watchEvents.createdAt)),
  ]);
  return { record, prices, events };
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
  const database = await databaseOrThrow();
  const result = await database.insert(watchedRecords).values({
    userId: input.userId,
    originalRequest: input.originalRequest,
    productName: input.productName,
    stores: toStoredStores(input.stores),
    sources: toStoredSources(input.sources ?? ["google_shopping"]),
    thresholdCents: input.thresholdCents,
    alertBasis: input.alertBasis ?? "item_price",
    destinationPostalCode: input.destinationPostalCode ?? null,
    observationMode: input.observationMode ?? false,
  });
  const recordId = Number(result[0].insertId);
  await database.insert(watchEvents).values({
    watchedRecordId: recordId,
    eventType: "created",
    message: `Watching ${input.productName} below ${(input.thresholdCents / 100).toFixed(2)}.`,
  });
  return getWatchedRecordDetail(input.userId, recordId);
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
  const existing = await getWatchedRecordForUser(input.userId, input.recordId);
  if (!existing) return undefined;
  const database = await databaseOrThrow();
  await database
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
  await database.insert(watchEvents).values({
    watchedRecordId: input.recordId,
    eventType: "updated",
    message: `Updated watch details for ${input.productName}.`,
  });
  return getWatchedRecordDetail(input.userId, input.recordId);
}

export async function setWatchedRecordStatus(input: {
  userId: number;
  recordId: number;
  status: "active" | "paused";
}) {
  const existing = await getWatchedRecordForUser(input.userId, input.recordId);
  if (!existing) return undefined;
  const database = await databaseOrThrow();
  await database
    .update(watchedRecords)
    .set({ status: input.status })
    .where(and(eq(watchedRecords.id, input.recordId), eq(watchedRecords.userId, input.userId)));
  await database.insert(watchEvents).values({
    watchedRecordId: input.recordId,
    eventType: input.status === "paused" ? "paused" : "resumed",
    message: input.status === "paused" ? "Paused price-drop notifications." : "Resumed price-drop notifications.",
  });
  return getWatchedRecordDetail(input.userId, input.recordId);
}

export async function softDeleteWatchedRecord(userId: number, recordId: number) {
  const existing = await getWatchedRecordForUser(userId, recordId);
  if (!existing) return false;
  const database = await databaseOrThrow();
  await database
    .update(watchedRecords)
    .set({ status: "deleted", deletedAt: new Date() })
    .where(and(eq(watchedRecords.id, recordId), eq(watchedRecords.userId, userId)));
  await database.insert(watchEvents).values({
    watchedRecordId: recordId,
    eventType: "deleted",
    message: "Removed this watch from the dashboard.",
  });
  return true;
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
  const existing = await getWatchedRecordForUser(input.userId, input.recordId);
  if (!existing) return undefined;
  const database = await databaseOrThrow();
  await database.insert(priceEntries).values({
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
  await database.insert(watchEvents).values({
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
  await database
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
    await database.insert(watchEvents).values({
      watchedRecordId: input.recordId,
      eventType: "threshold_met",
      message: `Target met: $${(input.priceCents / 100).toFixed(2)} at ${input.store} is within your target.`,
    });
  }
  return getWatchedRecordDetail(input.userId, input.recordId);
}

export async function getPriceEntriesForRecord(recordId: number): Promise<PriceEntry[]> {
  const database = await databaseOrThrow();
  return database.select().from(priceEntries).where(eq(priceEntries.watchedRecordId, recordId)).orderBy(asc(priceEntries.recordedAt));
}

export async function createPriceImportJob(input: { watchedRecordId: number; providerJobId: string; source: PriceSourceId }) {
  const database = await databaseOrThrow();
  await database.insert(priceImportJobs).values({
    watchedRecordId: input.watchedRecordId,
    providerJobId: input.providerJobId,
    source: input.source,
  });
  await database.insert(watchEvents).values({
    watchedRecordId: input.watchedRecordId,
    eventType: "import_requested",
    message: `Requested a fresh US price check from ${sourceLabel(input.source)}.`,
  });
}

export async function getPriceImportJobWithRecord(providerJobId: string) {
  const database = await databaseOrThrow();
  const jobs = await database.select().from(priceImportJobs).where(eq(priceImportJobs.providerJobId, providerJobId)).limit(1);
  const job = jobs[0];
  if (!job) return undefined;
  const records = await database
    .select()
    .from(watchedRecords)
    .where(and(eq(watchedRecords.id, job.watchedRecordId), ne(watchedRecords.status, "deleted")))
    .limit(1);
  const record = records[0];
  if (!record) return undefined;
  const owner = await getUserById(record.userId);
  return { job, record: serializeRecord(record), owner };
}

export async function markPriceImportJobFailed(providerJobId: string, reason: string) {
  const current = await getPriceImportJobWithRecord(providerJobId);
  if (!current || current.job.status !== "queued") return false;
  const database = await databaseOrThrow();
  const result = await database
    .update(priceImportJobs)
    .set({ status: "failed", errorMessage: reason.slice(0, 1000), completedAt: new Date() })
    .where(and(eq(priceImportJobs.providerJobId, providerJobId), eq(priceImportJobs.status, "queued")));
  if ((result[0]?.affectedRows ?? 0) !== 1) return false;
  await database.insert(watchEvents).values({
    watchedRecordId: current.record.id,
    eventType: "import_failed",
    message: `Automated price check could not be completed: ${reason.slice(0, 240)}`,
  });
  return true;
}

export async function markPriceImportJobCompleted(providerJobId: string, resultUrl?: string, resultReason?: string) {
  const current = await getPriceImportJobWithRecord(providerJobId);
  if (!current || current.job.status !== "queued") return undefined;
  const database = await databaseOrThrow();
  const result = await database
    .update(priceImportJobs)
    .set({ status: "completed", resultUrl: resultUrl ?? null, resultReason: resultReason ?? null, completedAt: new Date() })
    .where(and(eq(priceImportJobs.providerJobId, providerJobId), eq(priceImportJobs.status, "queued")));
  if ((result[0]?.affectedRows ?? 0) !== 1) return undefined;
  return current;
}

export async function appendWatchEvent(input: {
  watchedRecordId: number;
  eventType: "import_completed" | "email_sent" | "email_failed" | "email_skipped";
  message: string;
}) {
  const database = await databaseOrThrow();
  await database.insert(watchEvents).values(input);
}

export async function getPriceImportSchedule(ownerId: number): Promise<PriceImportSchedule | undefined> {
  const database = await databaseOrThrow();
  const schedules = await database.select().from(priceImportSchedules).where(eq(priceImportSchedules.ownerId, ownerId)).limit(1);
  return schedules[0];
}

export async function getPriceImportScheduleByTaskUid(taskUid: string): Promise<PriceImportSchedule | undefined> {
  const database = await databaseOrThrow();
  const schedules = await database.select().from(priceImportSchedules).where(eq(priceImportSchedules.scheduleCronTaskUid, taskUid)).limit(1);
  return schedules[0];
}

export async function createPriceImportSchedule(input: { ownerId: number; taskUid: string; cronExpression: string }) {
  const database = await databaseOrThrow();
  await database.insert(priceImportSchedules).values({
    ownerId: input.ownerId,
    scheduleCronTaskUid: input.taskUid,
    cronExpression: input.cronExpression,
    market: "us",
    enabled: true,
  });
  return getPriceImportSchedule(input.ownerId);
}

export async function setPriceImportScheduleEnabled(ownerId: number, enabled: boolean) {
  const database = await databaseOrThrow();
  await database.update(priceImportSchedules).set({ enabled }).where(eq(priceImportSchedules.ownerId, ownerId));
  return getPriceImportSchedule(ownerId);
}

function newUnsubscribeToken() {
  return randomBytes(24).toString("base64url");
}

export async function getNotificationPreferences(userId: number): Promise<NotificationPreference> {
  const database = await databaseOrThrow();
  const preferences = await database.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
  const existing = preferences[0];
  if (!existing) {
    const token = newUnsubscribeToken();
    await database.insert(notificationPreferences).values({ userId, unsubscribeToken: token });
    const created = await database.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
    if (!created[0]) throw new Error("Notification preferences could not be created.");
    return created[0];
  }
  if (!existing.unsubscribeToken) {
    const token = newUnsubscribeToken();
    await database.update(notificationPreferences).set({ unsubscribeToken: token }).where(eq(notificationPreferences.id, existing.id));
    return { ...existing, unsubscribeToken: token };
  }
  return existing;
}

export async function setPriceAlertEmailPreference(userId: number, priceAlertEmails: boolean) {
  const existing = await getNotificationPreferences(userId);
  const database = await databaseOrThrow();
  await database
    .update(notificationPreferences)
    .set({ priceAlertEmails, unsubscribedAt: priceAlertEmails ? null : new Date() })
    .where(eq(notificationPreferences.id, existing.id));
  return getNotificationPreferences(userId);
}

export async function unsubscribePriceAlertEmails(token: string) {
  const database = await databaseOrThrow();
  const preferences = await database.select().from(notificationPreferences).where(eq(notificationPreferences.unsubscribeToken, token)).limit(1);
  const preference = preferences[0];
  if (!preference) return false;
  await database.update(notificationPreferences).set({ priceAlertEmails: false, unsubscribedAt: new Date() }).where(eq(notificationPreferences.id, preference.id));
  return true;
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
  const database = await databaseOrThrow();
  const records = await database.select({ observationMode: watchedRecords.observationMode }).from(watchedRecords).where(and(eq(watchedRecords.userId, userId), ne(watchedRecords.status, "deleted")));
  const matches = await database.select({ id: watchEvents.id }).from(watchEvents).innerJoin(watchedRecords, eq(watchedRecords.id, watchEvents.watchedRecordId)).where(and(eq(watchedRecords.userId, userId), eq(watchEvents.eventType, "email_skipped")));
  return { observationWatches: records.filter(record => record.observationMode).length, recordedMatches: matches.length };
}

export async function listImportHealth(userId: number): Promise<ImportHealthItem[]> {
  const database = await databaseOrThrow();
  const rows = await database
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
