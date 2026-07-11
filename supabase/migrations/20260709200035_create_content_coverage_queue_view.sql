-- Coordination view for cross-session content research work (jurisdiction
-- playbooks, market metrics, education overlays). Ranks countries by how
-- many of the three content types are missing, then by opportunity score,
-- so any research batch (regardless of which session runs it) can just
-- query this first and pick up the next highest-value gap instead of
-- guessing or duplicating another session's work.
--
-- Not exposed via PostgREST (public schema only) -- internal tooling, not
-- consumed by the live app.

CREATE OR REPLACE VIEW public.content_coverage_queue AS
SELECT
  c.iso_alpha2,
  c.country_name,
  c.region,
  c.opportunity_score,
  c.data_completeness,
  EXISTS (
    SELECT 1 FROM public.jurisdiction_playbooks jp
    WHERE jp.country_iso2 = c.iso_alpha2 AND jp.status = 'published'
  ) AS has_playbook,
  EXISTS (
    SELECT 1 FROM public.market_metrics mm
    WHERE mm.country_iso2 = c.iso_alpha2
  ) AS has_market_metrics,
  EXISTS (
    SELECT 1 FROM public.country_education_overlay ceo
    WHERE ceo.country_iso2 = c.iso_alpha2
  ) AS has_education_overlay,
  (
    (NOT EXISTS (SELECT 1 FROM public.jurisdiction_playbooks jp WHERE jp.country_iso2 = c.iso_alpha2 AND jp.status = 'published'))::int +
    (NOT EXISTS (SELECT 1 FROM public.market_metrics mm WHERE mm.country_iso2 = c.iso_alpha2))::int +
    (NOT EXISTS (SELECT 1 FROM public.country_education_overlay ceo WHERE ceo.country_iso2 = c.iso_alpha2))::int
  ) AS gap_count
FROM public.countries c
ORDER BY gap_count DESC, c.opportunity_score DESC NULLS LAST;

COMMENT ON VIEW public.content_coverage_queue IS
  'Coordination view for cross-session content research. Query this first before starting a research batch so concurrent sessions do not duplicate work. Not exposed via PostgREST -- internal tooling only.';
