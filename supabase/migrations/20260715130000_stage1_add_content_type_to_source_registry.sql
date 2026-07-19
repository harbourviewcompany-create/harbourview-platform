-- Stage 1 (INTELLIGENCE_ARCHITECTURE_SPEC.md): unified source registry.
-- Owner-approved decision: EXTEND existing live source_registry (1,471 rows, already
-- has language/tier/country/cadence) rather than create a new intel_sources table —
-- avoids a 3rd parallel estate, honoring the spec's "one registry" principle.
-- Adds only the missing routing dimension. Reversible: drop column content_type.
alter table public.source_registry add column if not exists content_type text[];
comment on column public.source_registry.content_type is
  'Stage 1 routing dimension: regulatory|market|story|equipment|research (spec 4.3). NULL = unclassified.';
