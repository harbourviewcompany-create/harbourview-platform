-- Replay repair for production migration 20260701180751 (corridor_intelligence_tables).
--
-- Fresh read-only production migration-ledger evidence proves this historical
-- version created the two corridor tables, their indexes and public
-- get_corridor_stats(text) in that order. The repository previously reconstructed
-- the tables only in the later 20260701230000 parity-stub repair, which makes a
-- zero-state replay fail while PostgreSQL binds the SQL-language function body.
--
-- Restore the structural prerequisites here at their true historical origin.
-- Historical seed rows are intentionally not copied because later migrations do
-- not require them for schema replay and synthesizing production data is outside
-- this replay-fidelity repair. The later 20260701230000 CREATE IF NOT EXISTS
-- reconstruction remains harmless idempotent redundancy.
--
-- Fresh live catalog metadata also proves the API wrapper
-- api.get_corridor_stats(text) exists in production, although its creation is not
-- represented by any recorded migration statement. Later July 13 migrations
-- revoke EXECUTE from both signatures, so zero-state replay reconstructs both
-- function contracts here after the required tables exist.
--
-- Production is unaffected because version 20260701180751 is already recorded
-- remotely.

create table if not exists public.corridor_processing_times (
  id uuid default gen_random_uuid() primary key,
  corridor_key text not null,
  permit_type text,
  days_taken integer not null,
  submitter_role text,
  verified boolean default false,
  submitted_at timestamptz default now(),
  constraint corridor_processing_times_days_taken_check
    check (days_taken > 0 and days_taken < 1000)
);

create index if not exists idx_cpt_key
  on public.corridor_processing_times (corridor_key);

create table if not exists public.corridor_regulatory_alerts (
  id uuid default gen_random_uuid() primary key,
  corridor_key text not null,
  alert_date date not null,
  severity text not null,
  summary text not null,
  detail text,
  source text,
  created_at timestamptz default now(),
  constraint corridor_regulatory_alerts_severity_check
    check (severity in ('major', 'minor', 'watch'))
);

create index if not exists idx_cra_key_date
  on public.corridor_regulatory_alerts (corridor_key, alert_date desc);

-- Original production-ledger function body.
CREATE OR REPLACE FUNCTION public.get_corridor_stats(p_key text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(json_build_object(
    'count',       COUNT(*),
    'avg_days',    ROUND(AVG(days_taken))::int,
    'median_days', PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_taken)::int,
    'min_days',    MIN(days_taken),
    'max_days',    MAX(days_taken),
    'p90_days',    PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY days_taken)::int
  ), '{}'::json)
  FROM public.corridor_processing_times
  WHERE corridor_key = p_key;
$$;

-- Current production API wrapper, reconstructed from pg_get_functiondef().
CREATE OR REPLACE FUNCTION api.get_corridor_stats(p_key text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO pg_catalog, api, public, signals, regulatory_signals, auth, storage, vault, extensions, net, cron
AS $$
  SELECT public.get_corridor_stats(p_key);
$$;
