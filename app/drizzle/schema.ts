import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing the existing Manus OAuth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const watchedRecordStatus = ["active", "paused", "triggered", "deleted"] as const;
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

export const watchedRecords = mysqlTable(
  "watchedRecords",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    originalRequest: text("originalRequest").notNull(),
    productName: varchar("productName", { length: 255 }).notNull(),
    stores: text("stores").notNull(),
    sources: varchar("sources", { length: 512 }).notNull().default('["google_shopping"]'),
    thresholdCents: int("thresholdCents").notNull(),
    status: mysqlEnum("status", watchedRecordStatus).default("active").notNull(),
    currentPriceCents: int("currentPriceCents"),
    currentStore: varchar("currentStore", { length: 120 }),
    dealVerdict: text("dealVerdict"),
    alertBasis: varchar("alertBasis", { length: 32 }).notNull().default("item_price"),
    destinationPostalCode: varchar("destinationPostalCode", { length: 10 }),
    observationMode: boolean("observationMode").notNull().default(false),
    lastAlertedAt: timestamp("lastAlertedAt"),
    deletedAt: timestamp("deletedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("watched_records_user_status_idx").on(table.userId, table.status),
    index("watched_records_user_updated_idx").on(table.userId, table.updatedAt),
  ],
);

export const priceEntries = mysqlTable(
  "priceEntries",
  {
    id: int("id").autoincrement().primaryKey(),
    watchedRecordId: int("watchedRecordId").notNull().references(() => watchedRecords.id, { onDelete: "cascade" }),
    productUrl: varchar("productUrl", { length: 2048 }).notNull(),
    store: varchar("store", { length: 120 }).notNull(),
    priceCents: int("priceCents").notNull(),
    shippingCents: int("shippingCents"),
    taxCents: int("taxCents"),
    estimatedTotalCents: int("estimatedTotalCents"),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    condition: varchar("condition", { length: 32 }),
    fulfillment: varchar("fulfillment", { length: 80 }),
    availability: varchar("availability", { length: 32 }),
    seller: varchar("seller", { length: 160 }),
    destinationPostalCode: varchar("destinationPostalCode", { length: 10 }),
    costConfidence: varchar("costConfidence", { length: 24 }).notNull().default("unknown"),
    freshnessState: varchar("freshnessState", { length: 24 }).notNull().default("fresh"),
    observedAt: timestamp("observedAt").defaultNow().notNull(),
    evidenceJson: text("evidenceJson"),
    priceImportJobId: varchar("priceImportJobId", { length: 80 }).unique(),
    recordedAt: timestamp("recordedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("price_entries_recorded_idx").on(table.watchedRecordId, table.recordedAt)],
);

export const watchEvents = mysqlTable(
  "watchEvents",
  {
    id: int("id").autoincrement().primaryKey(),
    watchedRecordId: int("watchedRecordId").notNull().references(() => watchedRecords.id, { onDelete: "cascade" }),
    eventType: mysqlEnum("eventType", watchEventTypes).notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("watch_events_recorded_idx").on(table.watchedRecordId, table.createdAt)],
);

export const priceImportSchedules = mysqlTable(
  "priceImportSchedules",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }).unique(),
    cronExpression: varchar("cronExpression", { length: 120 }).notNull(),
    market: varchar("market", { length: 2 }).notNull().default("us"),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("price_import_schedule_owner_idx").on(table.ownerId)],
);

export const priceImportJobStatus = ["queued", "completed", "failed"] as const;

export const notificationPreferences = mysqlTable(
  "notificationPreferences",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    priceAlertEmails: boolean("priceAlertEmails").notNull().default(true),
    unsubscribeToken: varchar("unsubscribeToken", { length: 64 }).unique(),
    unsubscribedAt: timestamp("unsubscribedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("notification_preferences_user_idx").on(table.userId)],
);

export const priceImportJobs = mysqlTable(
  "priceImportJobs",
  {
    id: int("id").autoincrement().primaryKey(),
    watchedRecordId: int("watchedRecordId").notNull().references(() => watchedRecords.id, { onDelete: "cascade" }),
    providerJobId: varchar("providerJobId", { length: 80 }).notNull().unique(),
    source: varchar("source", { length: 80 }).notNull().default("google_shopping"),
    country: varchar("country", { length: 2 }).notNull().default("us"),
    status: mysqlEnum("status", priceImportJobStatus).notNull().default("queued"),
    resultUrl: varchar("resultUrl", { length: 2048 }),
    errorMessage: text("errorMessage"),
    resultReason: varchar("resultReason", { length: 120 }),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("price_import_jobs_record_status_idx").on(table.watchedRecordId, table.status)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type WatchedRecord = typeof watchedRecords.$inferSelect;
export type PriceEntry = typeof priceEntries.$inferSelect;
export type WatchEvent = typeof watchEvents.$inferSelect;
export type PriceImportSchedule = typeof priceImportSchedules.$inferSelect;
export type PriceImportJob = typeof priceImportJobs.$inferSelect;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
