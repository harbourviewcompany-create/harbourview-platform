-- Country/module-specific education overlay. Falls back to the existing
-- generic MODULE_TOPICS lookup in MobileCommandCentre.tsx whenever no
-- published row exists for a given country_iso2 + module_key. Reuses the
-- review-status vocabulary from lib/education/types.ts so this plugs into
-- the existing claim-review gate rather than inventing a parallel one.
--
-- Restored in this branch (2026-07-10): this table already exists live on the
-- shared Supabase project (applied out-of-band via PR #984,
-- "feat(education): country_education_overlay table + wiring"), but that
-- PR's own migration was never merged into `main` or into this branch, so
-- `supabase db reset` on this branch previously failed with
-- "relation country_education_overlay does not exist" before the
-- supabase/seed.sql insert for it could even run. `create table if not
-- exists` keeps this safe to apply locally regardless of remote state; see
-- docs/control/EVIDENCE_LOG.md for the coordination note with PR #984 about
-- avoiding a double-apply conflict against the live project.

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

do $$ begin
  create policy "public read published country overlays"
    on country_education_overlay for select
    using (review_status in ('verified_primary_source','verified_professional_body','verified_peer_reviewed','verified_secondary_source'));
exception when duplicate_object then
  null;
end $$;
