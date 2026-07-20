-- Stage 0 support: PostgREST on this project exposes ONLY the `api` schema
-- (lib/supabase/env.ts SUPABASE_DB_SCHEMA='api'). public.intel_eval_set is
-- therefore unreachable by the app's admin data client without an api-schema
-- surface. This migration adds a read VIEW and a write RPC, service_role-only.
-- Reason: the Stage 0 admin labeling page needs a reachable read/write path.
-- Additive + reversible. Rollback:
--   drop function if exists api.save_intel_eval_label(text,text,text,text,text,text,boolean);
--   drop view if exists api.intel_eval_labeling;

-- Converted to a no-op stub on 2026-07-20: re-running the CREATE VIEW
-- below fails ("relation already exists"). Confirmed live via pg_views/
-- pg_proc that api.intel_eval_labeling and api.save_intel_eval_label
-- already exist -- the real work was already applied to production under
-- the neighboring version 20260714225601 (same filename).
SELECT 1;
