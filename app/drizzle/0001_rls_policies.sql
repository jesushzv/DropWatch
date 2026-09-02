-- Row-level security for every DropWatch table (ADR-2).
--
-- The application connects as `dropwatch_app`, a role that does not own these
-- tables, so the policies below actually bind. Each request runs inside a
-- transaction that asserts who is acting via transaction-local settings
-- (see server/db.ts):
--   app.user_id  — the acting app user's id (tRPC request paths)
--   app.open_id  — the external identity being authenticated (login path,
--                  before a users row is known to exist)
--   app.role     — 'service' on trusted server-only paths with no acting user
--                  (provider webhooks, scheduled imports, unsubscribe-by-token)
-- A query that runs without any of these set sees zero rows.
--
-- The role is cluster-level and NOLOGIN here; deployment grants it LOGIN and a
-- password out-of-band (scripts/provision-app-role.mjs) so no secret lives in a
-- migration.
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'dropwatch_app') THEN
    CREATE ROLE "dropwatch_app" NOLOGIN;
  END IF;
END $$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION "app_current_user_id"() RETURNS integer LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT nullif(current_setting('app.user_id', true), '')::integer
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION "app_current_open_id"() RETURNS text LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT nullif(current_setting('app.open_id', true), '')
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION "app_is_service"() RETURNS boolean LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT current_setting('app.role', true) = 'service'
$$;
--> statement-breakpoint
GRANT USAGE ON SCHEMA "public" TO "dropwatch_app";
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "users", "watchedRecords", "priceEntries", "priceImportSchedules", "notificationPreferences", "priceImportJobs" TO "dropwatch_app";
--> statement-breakpoint
-- The audit trail is append-only: no UPDATE/DELETE grant, and no such policy
-- below, so immutability holds at the database. (FK cascade deletes still
-- clean up events when a user row is removed — referential actions run with
-- the table owner's rights.)
GRANT SELECT, INSERT ON "watchEvents" TO "dropwatch_app";
--> statement-breakpoint
GRANT USAGE, SELECT ON SEQUENCE "users_id_seq", "watchedRecords_id_seq", "priceEntries_id_seq", "watchEvents_id_seq", "priceImportSchedules_id_seq", "notificationPreferences_id_seq", "priceImportJobs_id_seq" TO "dropwatch_app";
--> statement-breakpoint
-- On Supabase, default privileges hand PostgREST's roles access to new public
-- tables. The app's tables are never served via PostgREST, so revoke outright
-- rather than rely on empty policy sets. Guarded so the migration also runs on
-- plain Postgres (local dev, CI), where these roles do not exist.
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON "users", "watchedRecords", "priceEntries", "watchEvents", "priceImportSchedules", "notificationPreferences", "priceImportJobs" FROM "anon";
  END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "users", "watchedRecords", "priceEntries", "watchEvents", "priceImportSchedules", "notificationPreferences", "priceImportJobs" FROM "authenticated";
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "watchedRecords" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "priceEntries" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "watchEvents" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "priceImportSchedules" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "notificationPreferences" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "priceImportJobs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "users_select" ON "users" FOR SELECT TO "dropwatch_app"
  USING ("app_is_service"() OR "id" = "app_current_user_id"() OR "openId" = "app_current_open_id"());
--> statement-breakpoint
CREATE POLICY "users_insert" ON "users" FOR INSERT TO "dropwatch_app"
  WITH CHECK ("app_is_service"() OR "openId" = "app_current_open_id"());
--> statement-breakpoint
CREATE POLICY "users_update" ON "users" FOR UPDATE TO "dropwatch_app"
  USING ("app_is_service"() OR "id" = "app_current_user_id"() OR "openId" = "app_current_open_id"())
  WITH CHECK ("app_is_service"() OR "id" = "app_current_user_id"() OR "openId" = "app_current_open_id"());
--> statement-breakpoint
CREATE POLICY "users_delete" ON "users" FOR DELETE TO "dropwatch_app"
  USING ("app_is_service"());
--> statement-breakpoint
CREATE POLICY "watched_records_all" ON "watchedRecords" FOR ALL TO "dropwatch_app"
  USING ("app_is_service"() OR "userId" = "app_current_user_id"())
  WITH CHECK ("app_is_service"() OR "userId" = "app_current_user_id"());
--> statement-breakpoint
-- Child tables reach ownership through watchedRecords. The EXISTS subquery is
-- itself filtered by the watchedRecords policy, which yields exactly the
-- intended visibility for both user and service contexts.
CREATE POLICY "price_entries_all" ON "priceEntries" FOR ALL TO "dropwatch_app"
  USING ("app_is_service"() OR EXISTS (SELECT 1 FROM "watchedRecords" w WHERE w."id" = "watchedRecordId" AND w."userId" = "app_current_user_id"()))
  WITH CHECK ("app_is_service"() OR EXISTS (SELECT 1 FROM "watchedRecords" w WHERE w."id" = "watchedRecordId" AND w."userId" = "app_current_user_id"()));
--> statement-breakpoint
CREATE POLICY "watch_events_select" ON "watchEvents" FOR SELECT TO "dropwatch_app"
  USING ("app_is_service"() OR EXISTS (SELECT 1 FROM "watchedRecords" w WHERE w."id" = "watchedRecordId" AND w."userId" = "app_current_user_id"()));
--> statement-breakpoint
CREATE POLICY "watch_events_insert" ON "watchEvents" FOR INSERT TO "dropwatch_app"
  WITH CHECK ("app_is_service"() OR EXISTS (SELECT 1 FROM "watchedRecords" w WHERE w."id" = "watchedRecordId" AND w."userId" = "app_current_user_id"()));
--> statement-breakpoint
CREATE POLICY "price_import_schedules_all" ON "priceImportSchedules" FOR ALL TO "dropwatch_app"
  USING ("app_is_service"() OR "ownerId" = "app_current_user_id"())
  WITH CHECK ("app_is_service"() OR "ownerId" = "app_current_user_id"());
--> statement-breakpoint
CREATE POLICY "notification_preferences_all" ON "notificationPreferences" FOR ALL TO "dropwatch_app"
  USING ("app_is_service"() OR "userId" = "app_current_user_id"())
  WITH CHECK ("app_is_service"() OR "userId" = "app_current_user_id"());
--> statement-breakpoint
CREATE POLICY "price_import_jobs_all" ON "priceImportJobs" FOR ALL TO "dropwatch_app"
  USING ("app_is_service"() OR EXISTS (SELECT 1 FROM "watchedRecords" w WHERE w."id" = "watchedRecordId" AND w."userId" = "app_current_user_id"()))
  WITH CHECK ("app_is_service"() OR EXISTS (SELECT 1 FROM "watchedRecords" w WHERE w."id" = "watchedRecordId" AND w."userId" = "app_current_user_id"()));
