-- Optimization: reclassify score/confidence columns from numeric -> double precision.
-- Scope: only columns with ZERO dependent views in ANY schema (verified via pg_depend,
-- including a same-named api.* view layer that a naive same-schema check would miss).
--
-- Excluded (view dependency -- would require dropping/recreating views this session hasn't
-- inspected, in a schema with a documented RLS-sensitivity history -- deliberately not
-- attempted blind): listings.average_rating, cc_jurisdiction_briefings.confidence_score,
-- hv_import_staging.duplicate_confidence, marketplace_candidates.confidence,
-- signal_candidates.* (13 columns).
--
-- Excluded (money/quantity -- keep numeric for exact decimal precision): commissions.*,
-- engagements.*, opportunities.value_num, listings.price_amount, listings.quantity,
-- market_metrics.metric_value.

ALTER TABLE coverage_gaps
  ALTER COLUMN severity_score TYPE double precision USING severity_score::double precision,
  ALTER COLUMN strategic_score TYPE double precision USING strategic_score::double precision;

ALTER TABLE discovery_sources
  ALTER COLUMN commercial_relevance_score TYPE double precision USING commercial_relevance_score::double precision,
  ALTER COLUMN freshness_score TYPE double precision USING freshness_score::double precision,
  ALTER COLUMN priority_score TYPE double precision USING priority_score::double precision,
  ALTER COLUMN trust_score TYPE double precision USING trust_score::double precision;

ALTER TABLE extracted_citations
  ALTER COLUMN confidence TYPE double precision USING confidence::double precision;

ALTER TABLE extracted_entities
  ALTER COLUMN confidence TYPE double precision USING confidence::double precision;

ALTER TABLE extracted_events
  ALTER COLUMN confidence TYPE double precision USING confidence::double precision,
  ALTER COLUMN significance_score TYPE double precision USING significance_score::double precision;

ALTER TABLE extraction_contradictions
  ALTER COLUMN contradiction_score TYPE double precision USING contradiction_score::double precision;

ALTER TABLE hv_passport_scores
  ALTER COLUMN max_score TYPE double precision USING max_score::double precision,
  ALTER COLUMN score TYPE double precision USING score::double precision;

ALTER TABLE hv_passports
  ALTER COLUMN completeness_score TYPE double precision USING completeness_score::double precision,
  ALTER COLUMN deal_readiness_score TYPE double precision USING deal_readiness_score::double precision,
  ALTER COLUMN export_readiness_score TYPE double precision USING export_readiness_score::double precision,
  ALTER COLUMN import_readiness_score TYPE double precision USING import_readiness_score::double precision;

ALTER TABLE hv_relations
  ALTER COLUMN confidence TYPE double precision USING confidence::double precision;

ALTER TABLE signal_duplicate_groups
  ALTER COLUMN similarity_score TYPE double precision USING similarity_score::double precision;

ALTER TABLE source_candidates
  ALTER COLUMN aggregate_score TYPE double precision USING aggregate_score::double precision,
  ALTER COLUMN authority_score TYPE double precision USING authority_score::double precision,
  ALTER COLUMN commercial_relevance_score TYPE double precision USING commercial_relevance_score::double precision,
  ALTER COLUMN novelty_score TYPE double precision USING novelty_score::double precision,
  ALTER COLUMN parseability_score TYPE double precision USING parseability_score::double precision,
  ALTER COLUMN recurrence_score TYPE double precision USING recurrence_score::double precision;
