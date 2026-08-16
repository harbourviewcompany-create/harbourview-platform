-- Reconstructed from the live production catalog for zero-state migration replay.
--
-- This version was originally recorded after the corridor tables were created
-- directly in production and the repository file was left as SELECT 1. The
-- production migration ledger therefore does not retain the original CREATE
-- TABLE statements. The DDL below is reconstructed from fresh read-only
-- pg_catalog / information_schema evidence and restores only the structural
-- foundation required by later recorded migrations; production row contents
-- and historical seed rows are intentionally not copied into repository history.
--
-- Production already records version 20260701230000, so this is a
-- repository-only replay-fidelity repair and is not a production migration.

create table if not exists public.corridor_processing_times (
  id uuid primary key default gen_random_uuid(),
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
  id uuid primary key default gen_random_uuid(),
  corridor_key text not null,
  alert_date date not null,
  severity text not null,
  summary text not null,
  detail text,
  source text,
  created_at timestamptz default now(),
  constraint corridor_regulatory_alerts_severity_check
    check (severity = any (array['major'::text, 'minor'::text, 'watch'::text]))
);

create index if not exists idx_cra_key_date
  on public.corridor_regulatory_alerts (corridor_key, alert_date desc);
