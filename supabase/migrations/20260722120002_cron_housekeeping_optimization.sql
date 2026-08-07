-- Replay-safe cron/pg_net housekeeping helpers.
--
-- Renumbered 2026-08-05 from 20260722120000 to 20260722120002. Contents are
-- unchanged. This file was committed under a version the production ledger
-- already owns: supabase_migrations.schema_migrations records 20260722120000 as
-- `revoke_public_grant_bulk_approve_engine_queue_retry`, which is also present
-- in this directory under that exact version. Two files cannot share one
-- version -- the CLI applies both, then fails inserting the second ledger row:
--   duplicate key value violates unique constraint "schema_migrations_pkey"
--   (SQLSTATE 23505), Key (version)=(20260722120000) already exists
-- The production-recorded file keeps 20260722120000; this repository-only file
-- takes the next free slot, which is unused in both the repository and the live
-- ledger. 20260722120001 is likewise production-recorded, so 120002 is the
-- first available second and keeps this migration chronologically adjacent.
--
-- Nothing depends on ordering here: both neighbours only REVOKE grants on
-- unrelated api.* review RPCs, and the two functions below are created with
-- CREATE OR REPLACE behind to_regclass guards, with no other definition
-- anywhere in the repository.
--
-- Not retired as obsolete, because it is not a no-op against production: both
-- functions exist live but were created outside the recorded ledger as
-- SECURITY INVOKER with the PUBLIC execute grant still in place. This migration
-- is the forward change that makes them SECURITY DEFINER and removes that
-- grant.

create or replace function public.prune_net_http_response()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, net
as $function$
begin
  if to_regclass('net._http_response') is not null then
    execute 'delete from net._http_response where created < now() - interval ''24 hours''';
  end if;
end;
$function$;

create or replace function public.prune_cron_job_run_details()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, cron
as $function$
begin
  if to_regclass('cron.job_run_details') is not null then
    execute 'delete from cron.job_run_details where end_time < now() - interval ''7 days''';
  end if;
end;
$function$;

revoke execute on function public.prune_net_http_response() from public, anon, authenticated;
revoke execute on function public.prune_cron_job_run_details() from public, anon, authenticated;
grant execute on function public.prune_net_http_response() to service_role;
grant execute on function public.prune_cron_job_run_details() to service_role;

-- Live cron schedules remain environment state and are installed only where
-- pg_cron is available by the controlled operations runbook.
