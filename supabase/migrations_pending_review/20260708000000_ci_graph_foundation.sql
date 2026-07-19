-- MOVED OUT OF supabase/migrations/ on 2026-07-18 -- targets a schema
-- that does not exist and, per available evidence, was never built.
--
-- This file's INSERT/RLS/graph-log statements all target a
-- `cannabis_intelligence` schema. Live schema check confirmed this schema
-- does not exist anywhere in the database. The one live table that could
-- plausibly be the intended target -- public.jurisdictions -- has a
-- fundamentally different, incompatible column set (identity_verification_status,
-- data_release_status, un_region_name, etc.) vs. what this file expects
-- (confidence_score, evidence_status, review_status, exposure_level,
-- universe_import_status, iso_alpha2) -- not a naming mismatch fixable by
-- a schema-prefix correction, a genuinely different table design.
--
-- Only one other migration references cannabis_intelligence at all
-- (20260607140000_cannabis_data_contract_v1_p0_p1.sql, already applied to
-- remote), so this file's dependency was apparently never fully realized
-- even by its own predecessor.
--
-- Needs a decision, not a mechanical fix: either rewrite these seeds/RLS/
-- graph-log statements against the public.jurisdictions design that
-- actually shipped, or formally retire this file if the cannabis_intelligence
-- schema concept was abandoned in favor of the public schema approach.
-- Blocked `supabase db push` for every migration after it in timestamp
-- order until moved here.

-- =============================================================================
-- cannabis_intelligence graph foundation
-- =============================================================================
-- 1. Seed Phase 1 jurisdictions (CA, DE, AU, GB, NZ)
-- 2. Add RLS read policies for intel/operator tier
-- 3. ia_signal_graph_log — tracks which signals have been written to CI schema
-- =============================================================================

-- ── 1. Phase 1 jurisdiction seeds ────────────────────────────────────────────
INSERT INTO cannabis_intelligence.jurisdictions (
  slug, display_name, official_name,
  iso_alpha2, iso_alpha3,
  jurisdiction_type, sovereignty_status,
  universe_import_status, confidence_score,
  evidence_status, review_status, exposure_level
) VALUES
  ('canada',         'Canada',         'Canada',
   'CA', 'CAN', 'sovereign_country', 'sovereign',
   'in_progress', 80, 'partially_verified', 'in_review', 'restricted_internal'),
  ('germany',        'Germany',        'Federal Republic of Germany',
   'DE', 'DEU', 'sovereign_country', 'sovereign',
   'in_progress', 80, 'partially_verified', 'in_review', 'restricted_internal'),
  ('australia',      'Australia',      'Commonwealth of Australia',
   'AU', 'AUS', 'sovereign_country', 'sovereign',
   'in_progress', 75, 'partially_verified', 'in_review', 'restricted_internal'),
  ('united_kingdom', 'United Kingdom', 'United Kingdom of Great Britain and Northern Ireland',
   'GB', 'GBR', 'sovereign_country', 'sovereign',
   'in_progress', 75, 'partially_verified', 'in_review', 'restricted_internal'),
  ('new_zealand',    'New Zealand',    'New Zealand',
   'NZ', 'NZL', 'sovereign_country', 'sovereign',
   'in_progress', 70, 'partially_verified', 'in_review', 'restricted_internal'),
  ('netherlands',    'Netherlands',    'Kingdom of the Netherlands',
   'NL', 'NLD', 'sovereign_country', 'sovereign',
   'in_progress', 65, 'machine_extracted_unreviewed', 'unreviewed', 'restricted_internal'),
  ('israel',         'Israel',         'State of Israel',
   'IL', 'ISR', 'sovereign_country', 'sovereign',
   'in_progress', 65, 'machine_extracted_unreviewed', 'unreviewed', 'restricted_internal'),
  ('united_states',  'United States',  'United States of America',
   'US', 'USA', 'sovereign_country', 'sovereign',
   'in_progress', 70, 'machine_extracted_unreviewed', 'unreviewed', 'restricted_internal'),
  ('portugal',       'Portugal',       'Portuguese Republic',
   'PT', 'PRT', 'sovereign_country', 'sovereign',
   'not_started', 50, 'human_review_required', 'unreviewed', 'restricted_internal'),
  ('switzerland',    'Switzerland',    'Swiss Confederation',
   'CH', 'CHE', 'sovereign_country', 'sovereign',
   'not_started', 50, 'human_review_required', 'unreviewed', 'restricted_internal'),
  ('czech_republic', 'Czech Republic', 'Czech Republic',
   'CZ', 'CZE', 'sovereign_country', 'sovereign',
   'not_started', 50, 'human_review_required', 'unreviewed', 'restricted_internal'),
  ('south_africa',   'South Africa',   'Republic of South Africa',
   'ZA', 'ZAF', 'sovereign_country', 'sovereign',
   'not_started', 50, 'human_review_required', 'unreviewed', 'restricted_internal'),
  ('colombia',       'Colombia',       'Republic of Colombia',
   'CO', 'COL', 'sovereign_country', 'sovereign',
   'not_started', 45, 'human_review_required', 'unreviewed', 'restricted_internal'),
  ('thailand',       'Thailand',       'Kingdom of Thailand',
   'TH', 'THA', 'sovereign_country', 'sovereign',
   'not_started', 45, 'human_review_required', 'unreviewed', 'restricted_internal'),
  ('malta',          'Malta',          'Republic of Malta',
   'MT', 'MLT', 'sovereign_country', 'sovereign',
   'not_started', 45, 'human_review_required', 'unreviewed', 'restricted_internal')
ON CONFLICT (slug) DO NOTHING;

-- ── 2. RLS read policies for intel/operator tier ──────────────────────────────
-- Reads from cannabis_intelligence are gated on user_profiles.tier.
-- Writes remain admin/operator via user_roles (internal provenance only).

-- Helper: reusable tier check (inline — no separate function needed)
-- Applied to the tables that intel subscribers most need to read:
--   jurisdictions, legal_regimes, regulatory_authorities, import_export_rules,
--   licensed_entities, licence_types, licence_registers, source_documents,
--   evidence_claims, laws_regulations, medical_access_pathways

DO $$
DECLARE
  t text;
  policy_name text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'jurisdictions',
    'legal_regimes',
    'regulatory_authorities',
    'import_export_rules',
    'licensed_entities',
    'entity_licences',
    'licence_types',
    'licence_registers',
    'source_documents',
    'evidence_claims',
    'laws_regulations',
    'medical_access_pathways',
    'legal_thresholds',
    'plant_product_categories',
    'product_forms'
  ] LOOP
    policy_name := 'ci_' || t || '_intel_tier_read';
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON cannabis_intelligence.%I',
      policy_name, t
    );
    EXECUTE format(
      $policy$
        CREATE POLICY %I
          ON cannabis_intelligence.%I
          FOR SELECT
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.user_profiles up
              WHERE up.id = auth.uid()
                AND up.tier IN (''intel'', ''operator'')
            )
          )
      $policy$,
      policy_name, t
    );
  END LOOP;
END $$;

-- ── 3. ia_signal_graph_log ────────────────────────────────────────────────────
-- Tracks which ia_signals have been promoted into cannabis_intelligence tables.
-- UNIQUE(signal_id) makes the graph cron fully idempotent.

CREATE TABLE IF NOT EXISTS public.ia_signal_graph_log (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id       text        NOT NULL UNIQUE,
  jurisdiction_id uuid        REFERENCES cannabis_intelligence.jurisdictions(id) ON DELETE SET NULL,
  claims_written  integer     NOT NULL DEFAULT 0,
  entities_written integer    NOT NULL DEFAULT 0,
  sources_written integer     NOT NULL DEFAULT 0,
  processed_at    timestamptz NOT NULL DEFAULT now(),
  error           text
);

CREATE INDEX IF NOT EXISTS idx_ia_signal_graph_log_signal
  ON public.ia_signal_graph_log (signal_id);

ALTER TABLE public.ia_signal_graph_log ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.ia_signal_graph_log TO service_role;

-- ── 4. ISO lookup helper ──────────────────────────────────────────────────────
-- Used by graph-writer to resolve country ISO → jurisdiction UUID without
-- a round-trip for every claim row.
CREATE OR REPLACE FUNCTION public.ci_jurisdiction_id_for_iso(p_iso text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = cannabis_intelligence, public
AS $$
  SELECT id FROM cannabis_intelligence.jurisdictions
  WHERE iso_alpha2 = upper(p_iso)
     OR iso_alpha3 = upper(p_iso)
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.ci_jurisdiction_id_for_iso(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.ci_jurisdiction_id_for_iso(text) TO service_role;

-- ── 5. Missing unique index on regulatory_authorities ─────────────────────────
-- Required for the graph-writer upsert onConflict: 'jurisdiction_id,name'.
-- The original data contract DDL omitted this.
CREATE UNIQUE INDEX IF NOT EXISTS uq_ci_regulatory_authorities_jurisdiction_name
  ON cannabis_intelligence.regulatory_authorities (jurisdiction_id, name);

-- ── 6. Grant authenticated SELECT on ci_jurisdiction_id_for_iso ───────────────
-- Cron uses service_role (already granted). Dashboard queries may use
-- authenticated role to resolve ISO codes client-side.
GRANT EXECUTE ON FUNCTION public.ci_jurisdiction_id_for_iso(text) TO authenticated;
