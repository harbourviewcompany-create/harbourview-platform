-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the production-ledger body for
-- version 20260709170348, with one replay-safety guard immediately before the
-- duplicated policy creation. Production also records 20260707120000 with the
-- same table and policy body, and no intervening recorded migration drops that
-- policy. Dropping the exact policy IF EXISTS before recreating it preserves the
-- same final schema while allowing both recorded versions to replay in order.
--
-- Production already records 20260709170348, so this is repository-only replay
-- fidelity and cannot be pushed as a new production migration.

-- Country/module-specific education overlay. Falls back to the existing
-- generic MODULE_TOPICS lookup in MobileCommandCentre.tsx whenever no
-- published row exists for a given country_iso2 + module_key. Reuses the
-- review-status vocabulary from lib/education/types.ts so this plugs into
-- the existing claim-review gate rather than inventing a parallel one.

create table if not exists country_education_overlay (
  id            uuid primary key default gen_random_uuid(),
  country_iso2  text not null,
  module_key    text not null,
  role_id       text,
  topics        jsonb not null,
  action_label  text not null,
  source_ids    uuid[] not null default '{}',
  review_status text not null default 'review_pending',
  reviewer      text,
  last_verified_at timestamptz,
  updated_at    timestamptz not null default now(),
  constraint country_education_overlay_review_status_check
    check (review_status in (
      'verified_primary_source','verified_professional_body','verified_peer_reviewed',
      'verified_secondary_source','conflicting_sources','stale_source','jurisdiction_unclear',
      'clinical_review_required','legal_review_required','review_pending','do_not_publish'
    )),
  unique (country_iso2, module_key, role_id)
);

alter table country_education_overlay enable row level security;

drop policy if exists "public read published country overlays" on country_education_overlay;

create policy "public read published country overlays"
  on country_education_overlay for select
  using (review_status in ('verified_primary_source','verified_professional_body','verified_peer_reviewed','verified_secondary_source'));
