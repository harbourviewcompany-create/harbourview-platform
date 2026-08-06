-- Restore the exact production-owned body for migration 20260626110925
-- (create_api_schema_admin_views). The previous stub omitted the api.* proxy
-- views that later migrations expect to exist, including api.source_snapshots,
-- which 20260713070355 hardens.

-- Admin panel proxy views in the api schema
-- The Supabase project exposes only the `api` schema in PostgREST.
-- All admin data fetches use SUPABASE_SERVICE_ROLE_KEY and default to the api
-- schema. These views proxy to the underlying public/regulatory_signals tables
-- so that admin queries work without requiring Accept-Profile headers or
-- PostgREST config changes.

-- ── Public schema: marketplace ────────────────────────────────────────────
CREATE OR REPLACE VIEW api.marketplace_candidates AS
  SELECT * FROM public.marketplace_candidates;

CREATE OR REPLACE VIEW api.marketplace_inquiries AS
  SELECT * FROM public.marketplace_inquiries;

CREATE OR REPLACE VIEW api.marketplace_public_listings_v1 AS
  SELECT * FROM public.marketplace_public_listings_v1;

-- ── Public schema: signals and intelligence ───────────────────────────────
CREATE OR REPLACE VIEW api.signals AS
  SELECT * FROM public.signals;

CREATE OR REPLACE VIEW api.source_registry AS
  SELECT * FROM public.source_registry;

CREATE OR REPLACE VIEW api.source_snapshots AS
  SELECT * FROM public.source_snapshots;

CREATE OR REPLACE VIEW api.ia_counterparties AS
  SELECT * FROM public.ia_counterparties;

CREATE OR REPLACE VIEW api.ia_signals AS
  SELECT * FROM public.ia_signals;

CREATE OR REPLACE VIEW api.candidate_review_events AS
  SELECT * FROM public.candidate_review_events;

-- ── Public schema: genetics / cultivar ───────────────────────────────────
CREATE OR REPLACE VIEW api.cultivar_country_opportunities AS
  SELECT * FROM public.cultivar_country_opportunities;

CREATE OR REPLACE VIEW api.cultivar_passports AS
  SELECT * FROM public.cultivar_passports;

CREATE OR REPLACE VIEW api.genetics_routing_events AS
  SELECT * FROM public.genetics_routing_events;

CREATE OR REPLACE VIEW api.genetics_routing_records AS
  SELECT * FROM public.genetics_routing_records;

-- ── Public schema: professionals and operators ────────────────────────────
CREATE OR REPLACE VIEW api.hv_professionals AS
  SELECT * FROM public.hv_professionals;

CREATE OR REPLACE VIEW api.supplier_profiles AS
  SELECT * FROM public.supplier_profiles;

CREATE OR REPLACE VIEW api.canadian_operator_conflicts AS
  SELECT * FROM public.canadian_operator_conflicts;

CREATE OR REPLACE VIEW api.canadian_operator_exclusions AS
  SELECT * FROM public.canadian_operator_exclusions;

CREATE OR REPLACE VIEW api.canadian_operator_individual_holds AS
  SELECT * FROM public.canadian_operator_individual_holds;

CREATE OR REPLACE VIEW api.canadian_operator_licence_sites AS
  SELECT * FROM public.canadian_operator_licence_sites;

CREATE OR REPLACE VIEW api.canadian_operator_outreach_queue AS
  SELECT * FROM public.canadian_operator_outreach_queue;

-- ── Regulatory signals schema: dot-notation routing ──────────────────────
-- fetchAdminSupabaseJson uses paths like /rest/v1/regulatory_signals.signals
-- PostgREST looks for a table named "regulatory_signals.signals" (with the
-- literal dot) in the api schema. These quoted-identifier views satisfy that.
-- Deviation from the recorded body, and the only one in this file. The
-- recorded statement is "SELECT * FROM regulatory_signals.signals". That is
-- column-set dependent, and production's regulatory_signals.signals is not the
-- shape this repository builds -- see
-- 20260713223056_reconcile_regulatory_signals_signals_columns.sql. In
-- production SELECT * resolved to the column list below; in zero-state replay
-- it resolves to that list plus seven repository-only columns
-- (captured_at, compliance_relevance, expires_at, next_review_due_at,
-- primary_evidence_id, rejection_reason, uncertainty_note).
--
-- 20260713223057 later issues CREATE OR REPLACE VIEW on this view with exactly
-- the explicit list below. CREATE OR REPLACE cannot remove columns, so the
-- wider replay-only shape fails there with "cannot drop columns from view".
-- Dropping and recreating the view instead is not an option: that migration
-- documents that it relies on CREATE OR REPLACE preserving the accumulated
-- privileges, which a drop would discard.
--
-- Pinning the list here makes the later replace an exact match, so it succeeds
-- and privileges are preserved. Net schema is unchanged.
CREATE OR REPLACE VIEW api."regulatory_signals.signals" AS
  SELECT
    id,
    slug,
    source_id,
    headline,
    signal_type,
    confidence,
    impact_level,
    country_code,
    country_name,
    region,
    jurisdiction,
    regulator_name,
    signal_date,
    source_tier,
    source_type,
    canonical_source_url,
    raw_excerpt,
    analyst_notes,
    public_summary,
    public_implication,
    review_status,
    public_safe,
    publish_to_public,
    internal_only,
    requires_diligence,
    commercial_relevance,
    linked_country_slug,
    linked_product_category,
    reviewer_id,
    reviewed_at,
    published_at,
    last_reviewed_at,
    created_by,
    updated_by,
    created_at,
    updated_at,
    source_url,
    source_published_at,
    private_summary,
    private_notes,
    reviewed_by,
    approved_by,
    published_by
  FROM regulatory_signals.signals;

CREATE OR REPLACE VIEW api."regulatory_signals.sources" AS
  SELECT * FROM regulatory_signals.sources;

CREATE OR REPLACE VIEW api."regulatory_signals.source_snapshots" AS
  SELECT * FROM regulatory_signals.source_snapshots;

CREATE OR REPLACE VIEW api."regulatory_signals.source_check_runs" AS
  SELECT * FROM regulatory_signals.source_check_runs;

CREATE OR REPLACE VIEW api."regulatory_signals.review_events" AS
  SELECT * FROM regulatory_signals.review_events;

CREATE OR REPLACE VIEW api."regulatory_signals.signal_evidence_links" AS
  SELECT * FROM regulatory_signals.signal_evidence_links;

CREATE OR REPLACE VIEW api."regulatory_signals.publication_events" AS
  SELECT * FROM regulatory_signals.publication_events;

CREATE OR REPLACE VIEW api."regulatory_signals.evidence" AS
  SELECT * FROM regulatory_signals.evidence;

-- ── Permissions ───────────────────────────────────────────────────────────
-- service_role is used by all admin panel queries (SUPABASE_SERVICE_ROLE_KEY)
GRANT ALL ON ALL TABLES IN SCHEMA api TO service_role;
-- authenticated gets read-only access (underlying table RLS still applies)
GRANT SELECT ON ALL TABLES IN SCHEMA api TO authenticated;
