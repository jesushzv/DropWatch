import { boolean, index, integer, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["user", "admin"]);

export const watchedRecordStatus = ["active", "paused", "triggered", "deleted"] as const;
export const watchedRecordStatusEnum = pgEnum("watched_record_status", watchedRecordStatus);

export const watchEventTypes = [
  "created",
  "updated",
  "paused",
  "resumed",
  "price_logged",
  "threshold_met",
  "import_requested",
  "import_completed",
  "import_failed",
  "email_sent",
  "email_failed",
  "email_skipped",
  "deleted",
] as const;
export const watchEventTypeEnum = pgEnum("watch_event_type", watchEventTypes);

export const priceImportJobStatus = ["queued", "completed", "failed"] as const;
export const priceImportJobStatusEnum = pgEnum("price_import_job_status", priceImportJobStatus);

/**
 * Core user table. `openId` is the external-identity seam: it held a Manus
 * identifier before the Supabase Auth migration and holds the Supabase
 * `auth.users.id` UUID after it (ADR-3).
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRole("role").default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});

export const watchedRecords = pgTable(
  "watchedRecords",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    originalRequest: text("originalRequest").notNull(),
    productName: varchar("productName", { length: 255 }).notNull(),
    stores: text("stores").notNull(),
    sources: varchar("sources", { length: 512 }).notNull().default('["google_shopping"]'),
    thresholdCents: integer("thresholdCents").notNull(),
    status: watchedRecordStatusEnum("status").default("active").notNull(),
    currentPriceCents: integer("currentPriceCents"),
    currentStore: varchar("currentStore", { length: 120 }),
    dealVerdict: text("dealVerdict"),
    alertBasis: varchar("alertBasis", { length: 32 }).notNull().default("item_price"),
    destinationPostalCode: varchar("destinationPostalCode", { length: 10 }),
    observationMode: boolean("observationMode").notNull().default(false),
    lastAlertedAt: timestamp("lastAlertedAt", { withTimezone: true }),
    deletedAt: timestamp("deletedAt", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  },
  table => [
    index("watched_records_user_status_idx").on(table.userId, table.status),
    index("watched_records_user_updated_idx").on(table.userId, table.updatedAt),
  ],
);

export const priceEntries = pgTable(
  "priceEntries",
  {
    id: serial("id").primaryKey(),
    watchedRecordId: integer("watchedRecordId").notNull().references(() => watchedRecords.id, { onDelete: "cascade" }),
    productUrl: varchar("productUrl", { length: 2048 }).notNull(),
    store: varchar("store", { length: 120 }).notNull(),
    priceCents: integer("priceCents").notNull(),
    shippingCents: integer("shippingCents"),
    taxCents: integer("taxCents"),
    estimatedTotalCents: integer("estimatedTotalCents"),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    condition: varchar("condition", { length: 32 }),
    fulfillment: varchar("fulfillment", { length: 80 }),
    availability: varchar("availability", { length: 32 }),
    seller: varchar("seller", { length: 160 }),
    destinationPostalCode: varchar("destinationPostalCode", { length: 10 }),
    costConfidence: varchar("costConfidence", { length: 24 }).notNull().default("unknown"),
    freshnessState: varchar("freshnessState", { length: 24 }).notNull().default("fresh"),
    observedAt: timestamp("observedAt", { withTimezone: true }).defaultNow().notNull(),
    evidenceJson: text("evidenceJson"),
    priceImportJobId: varchar("priceImportJobId", { length: 80 }).unique(),
    recordedAt: timestamp("recordedAt", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  },
  table => [index("price_entries_recorded_idx").on(table.watchedRecordId, table.recordedAt)],
);

export const watchEvents = pgTable(
  "watchEvents",
  {
    id: serial("id").primaryKey(),
    watchedRecordId: integer("watchedRecordId").notNull().references(() => watchedRecords.id, { onDelete: "cascade" }),
    eventType: watchEventTypeEnum("eventType").notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  },
  table => [index("watch_events_recorded_idx").on(table.watchedRecordId, table.createdAt)],
);

export const priceImportSchedules = pgTable(
  "priceImportSchedules",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }).unique(),
    cronExpression: varchar("cronExpression", { length: 120 }).notNull(),
    market: varchar("market", { length: 2 }).notNull().default("us"),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  },
  table => [uniqueIndex("price_import_schedule_owner_idx").on(table.ownerId)],
);

export const notificationPreferences = pgTable(
  "notificationPreferences",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    priceAlertEmails: boolean("priceAlertEmails").notNull().default(true),
    unsubscribeToken: varchar("unsubscribeToken", { length: 64 }).unique(),
    unsubscribedAt: timestamp("unsubscribedAt", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  },
  table => [uniqueIndex("notification_preferences_user_idx").on(table.userId)],
);

export const priceImportJobs = pgTable(
  "priceImportJobs",
  {
    id: serial("id").primaryKey(),
    watchedRecordId: integer("watchedRecordId").notNull().references(() => watchedRecords.id, { onDelete: "cascade" }),
    providerJobId: varchar("providerJobId", { length: 80 }).notNull().unique(),
    source: varchar("source", { length: 80 }).notNull().default("google_shopping"),
    country: varchar("country", { length: 2 }).notNull().default("us"),
    status: priceImportJobStatusEnum("status").notNull().default("queued"),
    resultUrl: varchar("resultUrl", { length: 2048 }),
    errorMessage: text("errorMessage"),
    resultReason: varchar("resultReason", { length: 120 }),
    completedAt: timestamp("completedAt", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  },
  table => [index("price_import_jobs_record_status_idx").on(table.watchedRecordId, table.status)],
);

/**
 * Per-user abuse/spend counters (security gate 2026-09-01). One row per
 * (user, kind, window); the window is a UTC day ("2026-09-01") or hour
 * ("2026-09-01T14") prefix depending on the limit being enforced.
 */
export const usageCounters = pgTable(
  "usageCounters",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: varchar("kind", { length: 32 }).notNull(),
    window: varchar("window", { length: 16 }).notNull(),
    count: integer("count").notNull().default(0),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  },
  table => [uniqueIndex("usage_counters_user_kind_window_idx").on(table.userId, table.kind, table.window)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type WatchedRecord = typeof watchedRecords.$inferSelect;
export type PriceEntry = typeof priceEntries.$inferSelect;
export type WatchEvent = typeof watchEvents.$inferSelect;
export type PriceImportSchedule = typeof priceImportSchedules.$inferSelect;
export type PriceImportJob = typeof priceImportJobs.$inferSelect;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type UsageCounter = typeof usageCounters.$inferSelect;
