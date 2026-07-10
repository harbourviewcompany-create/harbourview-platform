-- ============================================================
-- PostgREST on this project only exposes the `api` schema (see
-- lib/supabase/env.ts). public.enqueue_regulatory_enrichment()
-- is therefore unreachable from the Vercel cron route as-is.
-- This adds a minimal api-schema wrapper so the Vercel cron can
-- call it via the standard supabase-js .rpc() path, matching the
-- SUPABASE_DB_SCHEMA='api' convention used everywhere else in
-- this codebase.
-- ============================================================

create or replace function api.enqueue_regulatory_enrichment()
returns integer
language sql
security definer
set search_path = ''
as $$
  select public.enqueue_regulatory_enrichment();
$$;

comment on function api.enqueue_regulatory_enrichment() is
  'PostgREST-exposed wrapper for public.enqueue_regulatory_enrichment(). '
  'Called by the Vercel cron at /api/cron/regulatory-enrichment. '
  'Enqueues prioritized public.intelligence_jobs rows (job_type = '
  'regulatory_format_enrichment) from v_regulatory_format_stale.';

-- service_role only: this is an internal admin/cron operation, not
-- something anon or authenticated end users should be able to trigger.
revoke all on function api.enqueue_regulatory_enrichment() from public;
grant execute on function api.enqueue_regulatory_enrichment() to service_role;
