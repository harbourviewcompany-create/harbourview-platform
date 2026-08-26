-- WIP schema, NOT applied to production, NOT wired to any UI yet.
--
-- Split out on 2026-08-22 from 20260821190000_clinical_framework_alignment_
-- optional.sql, which had been edited in place after it was already applied
-- to production and pinned in supabase/release-controls/migration-live-
-- version-equivalences.json (live_version 20260821220443, attested
-- production_statement_md5 52a1a07a704426c9663056063b34320c,
-- production_statement_chars 2442 -- confirmed by fetching the pinned Git
-- blob and matching that MD5 exactly). Editing an already-applied, already-
-- pinned migration in place breaks that attestation and is exactly the
-- chronology violation this repo's governance docs warn about elsewhere
-- (see MIGRATION_DRIFT_2026-08-08.md). 20260821190000 has been restored to
-- its original, actually-applied content; this file preserves the newer
-- work that had overwritten it, unapplied, so it isn't lost -- someone
-- should review it as new work with its own review and apply cycle rather
-- than as a silent edit to migration history.
--
-- Differences from the original 20260821190000, for whoever picks this up:
-- claim_map columns redesigned (claim_key/claim_kind/gap_owner/target_date
-- -> slug/condition_label/cannabinoid_focus/target_stage_gates/
-- target_imdrf_pillars/target_dta_domains), status values changed
-- ('complete'/'partial'/'gap' -> 'supported'/'partial'/'gap'/
-- 'not_applicable'), and RLS gets an authenticated-select-all policy where
-- the original deliberately shipped with none (see the original's own
-- comment on why: "nothing reads or writes this table yet ... deny-by-
-- default costs nothing today"). app/admin/(protected)/clinical-review/
-- claim-map/page.tsx already has a comment expecting to read this table
-- live once a migration lands, with fixture fallback -- so the intent
-- behind the newer policy looks real, just never went through its own
-- migration.

-- Optional commercial / regulatory framework alignment on clinical evidence spine.
-- Additive only. Does not change review_status, RLS, or clinical conclusions.
-- framework_alignment is jsonb; claim-map is a separate operator table.

alter table if exists public.clinical_evidence_records
  add column if not exists framework_alignment jsonb;

comment on column public.clinical_evidence_records.framework_alignment is
  'Optional FrameworkAlignment JSON (IMDRF N41, DTA domains, DTx RWE phases, commercial stage-gates, FDA RWE relevance/reliability, ALCOA+). Operator mapping only; never used for clinical inference.';

create table if not exists public.clinical_evidence_claim_map (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  claim_statement text not null,
  condition_label text not null,
  cannabinoid_focus text[] not null default '{}',
  -- Fixture ids (e.g. ev-dravet-cbd) or live record UUIDs as text; resolved at read time.
  evidence_record_ids text[] not null default '{}',
  target_stage_gates text[] not null default '{}',
  target_imdrf_pillars text[] not null default '{}',
  target_dta_domains text[] not null default '{}',
  status text not null default 'gap'
    check (status in ('supported', 'partial', 'gap', 'not_applicable')),
  gap_summary text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_by uuid
);

comment on table public.clinical_evidence_claim_map is
  'Operator claim-map linking commercial/clinical claim statements to evidence records and stage-gates. Not a clinical decision surface.';

alter table public.clinical_evidence_claim_map enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'clinical_evidence_claim_map'
      and policyname = 'claim_map_select_authenticated'
  ) then
    create policy claim_map_select_authenticated
      on public.clinical_evidence_claim_map
      for select
      to authenticated
      using (true);
  end if;
end $$;

-- Service role used by admin API for writes; no broad authenticated write policy.
