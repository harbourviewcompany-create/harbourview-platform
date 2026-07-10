-- Adds an explicitly-reviewed regulatory access tier for globe colouring.
--
-- WHY A NEW COLUMN INSTEAD OF REUSING market_access_status / import_status /
-- export_status: those three columns are not sourced and contain demonstrably
-- false values. Audited 2026-07-10 against cc_jurisdiction_briefings:
--   * countries.import_status = 'active' AND export_status = 'active' for the
--     UNITED STATES, which is federally Schedule I with no lawful cross-border
--     commercial trade.
--   * market_access_status buckets the UNITED KINGDOM (lawful Schedule 2
--     medical prescription market) identically to SAUDI ARABIA (prohibited,
--     death penalty for trafficking) -- both 'restricted'.
--   * COLOMBIA, described in its own briefing as "Medical Legal - Export
--     Industry Leader", is graded 'limited', below Portugal.
--   * MALTA shows export_status = 'active'; it has personal-cultivation-only
--     legalisation and no commercial export regime.
-- 138 of 203 countries are dumped into a single 'restricted' bucket and two
-- buckets have exactly one member. Do not colour a public map from them, and
-- do not "fix" them in place -- other code may depend on their current values.
--
-- regulatory_tier is NULL by default. NULL means "not yet reviewed" and MUST
-- render as the neutral plate, never as a claim. Only rows with a non-null
-- tier make an assertion about law.
--
-- regulatory_tier_reviewed_at stays NULL until a human signs off. Nothing in
-- this migration sets it. The globe feature flag is off by default so no
-- unreviewed legal claim reaches the public before that happens.

alter table public.countries
  add column if not exists regulatory_tier text,
  add column if not exists regulatory_tier_rationale text,
  add column if not exists regulatory_tier_source text,
  add column if not exists regulatory_tier_reviewed_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'countries_regulatory_tier_check'
  ) then
    alter table public.countries
      add constraint countries_regulatory_tier_check
      check (regulatory_tier is null or regulatory_tier in (
        'legal_commercial_access',
        'medical_limited_trade',
        'domestic_only',
        'prohibited'
      ));
  end if;
end $$;

comment on column public.countries.regulatory_tier is
  'Reviewed regulatory access tier used for globe colouring. NULL = unreviewed, renders neutral. Never derive this from market_access_status/import_status/export_status - those are unsourced and contain false values (see migration 20260710_add_reviewed_regulatory_tier_to_countries).';
comment on column public.countries.regulatory_tier_reviewed_at is
  'NULL until a human has signed off on the tier. Tiers are public claims about law in a specific jurisdiction.';
