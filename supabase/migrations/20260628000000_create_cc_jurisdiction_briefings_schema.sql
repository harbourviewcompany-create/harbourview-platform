-- ============================================================
-- supabase/migrations/20260628000000_create_cc_jurisdiction_briefings_schema.sql
--
-- Full DDL for cc_jurisdiction_briefings.
-- Replaces the June 13 stub (20260613210556) which was a SELECT 1
-- applied directly to production; this file satisfies the migration
-- ledger with the actual schema.
--
-- Columns derived from:
--   - All seed migrations (20260621–20260623 batch inserts)
--   - lib/dashboard/dashboardLiveData.ts → getCountryIntelProfile()
--   - app/actions/getJurisdictionBriefing.ts
--   - components/globe/MarketOverviewSheet.tsx
--   - lib/command-centre/jurisdictionBriefingData.ts
--
-- RLS write policy matches 20260618190000_fix_jurisdiction_briefings_write_policy.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cc_jurisdiction_briefings (

  -- ── Identity ────────────────────────────────────────────────
  id                   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Human-readable URL slug, unique per jurisdiction.
  -- e.g. 'germany', 'ontario', 'bavaria', 'us-virgin-islands'
  jurisdiction_slug    text          NOT NULL,

  -- 'country' → sovereign nation row  (queried by all app consumers)
  -- 'state'   → subnational row (province, Bundesland, territory, overseas dept)
  jurisdiction_type    text          NOT NULL
                         CHECK (jurisdiction_type IN ('country', 'state')),

  -- ISO 3166-1 alpha-2. Always uppercase. Required on every row.
  country_iso2         text          NOT NULL,

  -- ISO 3166-2 subdivision code. NULL on country-type rows.
  -- e.g. 'CA-ON', 'DE-BY', 'AU-ACT', 'US-GU', 'FR-MQ'
  state_iso2           text          NULL,

  -- ── Program Status ──────────────────────────────────────────
  -- One-line status label shown in badges and map tooltips.
  -- e.g. 'Adult-Use Legal; Medical Legal'
  --      'Medical Legal (Limited); CBD Available'
  --      'Prohibited; Death Penalty for Trafficking'
  program_status       text          NOT NULL,

  -- ── Editorial Content ────────────────────────────────────────
  -- Full narrative country/region summary (prose, may contain markdown).
  -- Shown in MarketOverviewSheet and country detail pages.
  public_summary       text          NULL,

  -- Patient access pathway narrative.
  patient_access       text          NULL,

  -- Physician prescribing / access narrative.
  physician_access     text          NULL,

  -- Commercial and investment market dynamics.
  market_dynamics      text          NULL,

  -- Regulatory trajectory and near-term outlook.
  regulatory_outlook   text          NULL,

  -- Governing regulatory body/bodies (prose description).
  regulatory_body      text          NULL,

  -- ── Sourcing & Verification ──────────────────────────────────
  -- Source documents and data origins (comma-separated prose).
  data_source_summary  text          NULL,

  -- Recency and verification statement.
  -- e.g. 'Current as of Q2 2026; verified against ANMAT official guidance'
  verification_summary text          NULL,

  -- Review cadence: 'Annual', 'Quarterly', 'Bi-Annual', etc.
  update_cadence       text          NULL,

  -- Short coverage scope note used in admin/review tooling.
  coverage_summary     text          NULL,

  -- Date content was last manually reviewed and confirmed accurate.
  last_reviewed_date   date          NULL,

  -- ── Operational Metadata ─────────────────────────────────────
  -- Structured watch region tags. Seed default: '[]'::jsonb.
  watch_regions        jsonb         NOT NULL DEFAULT '[]'::jsonb,

  -- Structured change log entries. Seed default: '[]'::jsonb.
  change_notes         jsonb         NOT NULL DEFAULT '[]'::jsonb,

  -- Editorial workflow state gate.
  -- 'draft'     → not yet shown to authenticated users
  -- 'reviewed'  → live; returned by authenticated_read RLS policy
  -- 'published' → reserved for future explicit publish step
  -- 'archived'  → soft-deleted; excluded from all reads
  review_state         text          NOT NULL DEFAULT 'draft'
                         CHECK (review_state IN ('draft', 'reviewed', 'published', 'archived')),

  -- ── Timestamps ───────────────────────────────────────────────
  created_at           timestamptz   NOT NULL DEFAULT now(),
  updated_at           timestamptz   NOT NULL DEFAULT now(),

  -- ── Uniqueness ───────────────────────────────────────────────
  -- One slug per jurisdiction (used as URL key in app/countries/[slug]).
  CONSTRAINT uq_ccjb_jurisdiction_slug
    UNIQUE (jurisdiction_slug),

  -- One country-level row per ISO2. One state row per (country, state) pair.
  -- NOTE: state_iso2 is nullable; NULL values do not conflict in unique indexes,
  -- which is correct — country-type rows never set state_iso2.
  CONSTRAINT uq_ccjb_country_jurisdiction
    UNIQUE (country_iso2, jurisdiction_type, state_iso2)

);

-- ── Indexes ──────────────────────────────────────────────────────
-- Hot path: all app queries filter on (country_iso2, jurisdiction_type).
CREATE INDEX IF NOT EXISTS idx_ccjb_country_type
  ON public.cc_jurisdiction_briefings (country_iso2, jurisdiction_type);

-- Subnational lookups (Canadian provinces, German Länder, US territories, etc.)
CREATE INDEX IF NOT EXISTS idx_ccjb_state_iso2
  ON public.cc_jurisdiction_briefings (state_iso2)
  WHERE state_iso2 IS NOT NULL;

-- Admin panel: filter to rows needing review (review_state = 'draft')
CREATE INDEX IF NOT EXISTS idx_ccjb_review_state
  ON public.cc_jurisdiction_briefings (review_state);

-- ── updated_at trigger ───────────────────────────────────────────
-- Uses CREATE OR REPLACE — safe to run even if set_updated_at() already
-- exists from signal_engine, network_persistence, or other migrations.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_ccjb_updated_at
  BEFORE UPDATE ON public.cc_jurisdiction_briefings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Row Level Security ───────────────────────────────────────────
ALTER TABLE public.cc_jurisdiction_briefings ENABLE ROW LEVEL SECURITY;

-- Authenticated users may read rows where review_state = 'reviewed'.
-- Drafts, archived rows, and unpublished content are not exposed.
CREATE POLICY "authenticated_read"
  ON public.cc_jurisdiction_briefings
  FOR SELECT
  TO authenticated
  USING (review_state = 'reviewed');

-- service_role has unrestricted write access.
-- Matches the patched policy from 20260618190000_fix_jurisdiction_briefings_write_policy.sql
-- (that migration dropped the broken public-role policy; this recreates it correctly).
DROP POLICY IF EXISTS "service_write" ON public.cc_jurisdiction_briefings;
CREATE POLICY "service_write"
  ON public.cc_jurisdiction_briefings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
