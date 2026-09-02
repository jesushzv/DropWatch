CREATE TYPE "public"."price_import_job_status" AS ENUM('queued', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."watch_event_type" AS ENUM('created', 'updated', 'paused', 'resumed', 'price_logged', 'threshold_met', 'import_requested', 'import_completed', 'import_failed', 'email_sent', 'email_failed', 'email_skipped', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."watched_record_status" AS ENUM('active', 'paused', 'triggered', 'deleted');--> statement-breakpoint
CREATE TABLE "notificationPreferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"priceAlertEmails" boolean DEFAULT true NOT NULL,
	"unsubscribeToken" varchar(64),
	"unsubscribedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notificationPreferences_unsubscribeToken_unique" UNIQUE("unsubscribeToken")
);
--> statement-breakpoint
CREATE TABLE "priceEntries" (
	"id" serial PRIMARY KEY NOT NULL,
	"watchedRecordId" integer NOT NULL,
	"productUrl" varchar(2048) NOT NULL,
	"store" varchar(120) NOT NULL,
	"priceCents" integer NOT NULL,
	"shippingCents" integer,
	"taxCents" integer,
	"estimatedTotalCents" integer,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"condition" varchar(32),
	"fulfillment" varchar(80),
	"availability" varchar(32),
	"seller" varchar(160),
	"destinationPostalCode" varchar(10),
	"costConfidence" varchar(24) DEFAULT 'unknown' NOT NULL,
	"freshnessState" varchar(24) DEFAULT 'fresh' NOT NULL,
	"observedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"evidenceJson" text,
	"priceImportJobId" varchar(80),
	"recordedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "priceEntries_priceImportJobId_unique" UNIQUE("priceImportJobId")
);
--> statement-breakpoint
CREATE TABLE "priceImportJobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"watchedRecordId" integer NOT NULL,
	"providerJobId" varchar(80) NOT NULL,
	"source" varchar(80) DEFAULT 'google_shopping' NOT NULL,
	"country" varchar(2) DEFAULT 'us' NOT NULL,
	"status" "price_import_job_status" DEFAULT 'queued' NOT NULL,
	"resultUrl" varchar(2048),
	"errorMessage" text,
	"resultReason" varchar(120),
	"completedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "priceImportJobs_providerJobId_unique" UNIQUE("providerJobId")
);
--> statement-breakpoint
CREATE TABLE "priceImportSchedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerId" integer NOT NULL,
	"scheduleCronTaskUid" varchar(65),
	"cronExpression" varchar(120) NOT NULL,
	"market" varchar(2) DEFAULT 'us' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "priceImportSchedules_scheduleCronTaskUid_unique" UNIQUE("scheduleCronTaskUid")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "watchEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"watchedRecordId" integer NOT NULL,
	"eventType" "watch_event_type" NOT NULL,
	"message" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchedRecords" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"originalRequest" text NOT NULL,
	"productName" varchar(255) NOT NULL,
	"stores" text NOT NULL,
	"sources" varchar(512) DEFAULT '["google_shopping"]' NOT NULL,
	"thresholdCents" integer NOT NULL,
	"status" "watched_record_status" DEFAULT 'active' NOT NULL,
	"currentPriceCents" integer,
	"currentStore" varchar(120),
	"dealVerdict" text,
	"alertBasis" varchar(32) DEFAULT 'item_price' NOT NULL,
	"destinationPostalCode" varchar(10),
	"observationMode" boolean DEFAULT false NOT NULL,
	"lastAlertedAt" timestamp with time zone,
	"deletedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notificationPreferences" ADD CONSTRAINT "notificationPreferences_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "priceEntries" ADD CONSTRAINT "priceEntries_watchedRecordId_watchedRecords_id_fk" FOREIGN KEY ("watchedRecordId") REFERENCES "public"."watchedRecords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "priceImportJobs" ADD CONSTRAINT "priceImportJobs_watchedRecordId_watchedRecords_id_fk" FOREIGN KEY ("watchedRecordId") REFERENCES "public"."watchedRecords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "priceImportSchedules" ADD CONSTRAINT "priceImportSchedules_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchEvents" ADD CONSTRAINT "watchEvents_watchedRecordId_watchedRecords_id_fk" FOREIGN KEY ("watchedRecordId") REFERENCES "public"."watchedRecords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchedRecords" ADD CONSTRAINT "watchedRecords_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_preferences_user_idx" ON "notificationPreferences" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "price_entries_recorded_idx" ON "priceEntries" USING btree ("watchedRecordId","recordedAt");--> statement-breakpoint
CREATE INDEX "price_import_jobs_record_status_idx" ON "priceImportJobs" USING btree ("watchedRecordId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "price_import_schedule_owner_idx" ON "priceImportSchedules" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "watch_events_recorded_idx" ON "watchEvents" USING btree ("watchedRecordId","createdAt");--> statement-breakpoint
CREATE INDEX "watched_records_user_status_idx" ON "watchedRecords" USING btree ("userId","status");--> statement-breakpoint
CREATE INDEX "watched_records_user_updated_idx" ON "watchedRecords" USING btree ("userId","updatedAt");