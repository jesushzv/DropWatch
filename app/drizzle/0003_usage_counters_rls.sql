-- RLS + grants for the usageCounters abuse/spend table, same model as
-- 0001_rls_policies.sql: the non-owner dropwatch_app role, scoped by the
-- transaction-local identity claims. No DELETE for the user context — counters
-- are server bookkeeping; rows go away with the user via FK cascade.
GRANT SELECT, INSERT, UPDATE ON "usageCounters" TO "dropwatch_app";
--> statement-breakpoint
GRANT USAGE, SELECT ON SEQUENCE "usageCounters_id_seq" TO "dropwatch_app";
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON "usageCounters" FROM "anon";
  END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "usageCounters" FROM "authenticated";
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "usageCounters" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "usage_counters_select" ON "usageCounters" FOR SELECT TO "dropwatch_app"
  USING ("app_is_service"() OR "userId" = "app_current_user_id"());
--> statement-breakpoint
CREATE POLICY "usage_counters_insert" ON "usageCounters" FOR INSERT TO "dropwatch_app"
  WITH CHECK ("app_is_service"() OR "userId" = "app_current_user_id"());
--> statement-breakpoint
CREATE POLICY "usage_counters_update" ON "usageCounters" FOR UPDATE TO "dropwatch_app"
  USING ("app_is_service"() OR "userId" = "app_current_user_id"())
  WITH CHECK ("app_is_service"() OR "userId" = "app_current_user_id"());
