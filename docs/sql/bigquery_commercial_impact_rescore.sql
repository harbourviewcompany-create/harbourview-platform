-- BigQuery commercial-impact re-scoring template
-- Purpose: recompute commercial_relevance_score / commercial_actionability_score
-- (and optionally final_signal_score) for signals that have recently arrived
-- or whose quality_label / content_type has been updated.
--
-- Assumptions:
--   - A mirrored table `harbourview.signals` (or federated view) exists in BQ
--     with columns matching public.signals (id, quality_label, content_type,
--     commercial_relevance_score, commercial_actionability_score, created_at,
--     reviewed, etc.)
--   - Optional enrichment tables (e.g. market_pricing, jurisdiction_risk)
--     can be joined.
--
-- Run as a scheduled query or via the BigQuery connector job.

DECLARE lookback_days INT64 DEFAULT 14;

CREATE TEMP TABLE scored AS
SELECT
  s.id AS signal_id,
  s.quality_label,
  s.content_type,
  -- Base commercial relevance from content type + quality
  CASE
    WHEN s.quality_label = 'signal' AND s.content_type IN ('regulatory', 'market') THEN 0.85
    WHEN s.quality_label = 'signal' AND s.content_type = 'story' THEN 0.65
    WHEN s.quality_label = 'signal' THEN 0.55
    ELSE 0.20
  END AS base_relevance,
  -- Actionability boost for market-entry / corridor relevant language
  CASE
    WHEN LOWER(COALESCE(s.title_en, s.title, '')) LIKE '%market entry%'
      OR LOWER(COALESCE(s.title_en, s.title, '')) LIKE '%licence%'
      OR LOWER(COALESCE(s.title_en, s.title, '')) LIKE '%license%'
      OR LOWER(COALESCE(s.summary_en, s.summary, '')) LIKE '%import%'
      OR LOWER(COALESCE(s.summary_en, s.summary, '')) LIKE '%export%'
      THEN 0.15
    ELSE 0.0
  END AS actionability_boost,
  -- Recency decay (newer = higher)
  GREATEST(0.0, 1.0 - DATE_DIFF(CURRENT_DATE(), DATE(s.created_at), DAY) / lookback_days) AS recency_factor
FROM `harbourview.signals` s
WHERE s.created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL lookback_days DAY)
  AND (s.commercial_relevance_score IS NULL
       OR s.commercial_actionability_score IS NULL
       OR s.updated_at < TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY));

-- Final scores
SELECT
  signal_id,
  ROUND(LEAST(1.0, base_relevance * recency_factor), 3) AS commercial_relevance_score,
  ROUND(LEAST(1.0, (base_relevance + actionability_boost) * recency_factor), 3) AS commercial_actionability_score,
  ROUND(
    LEAST(1.0,
      0.4 * base_relevance
      + 0.3 * (base_relevance + actionability_boost)
      + 0.3 * recency_factor
    ), 3) AS final_signal_score
FROM scored;

-- Write-back pattern (run after review):
-- UPDATE `harbourview.signals` t
-- SET
--   commercial_relevance_score = s.commercial_relevance_score,
--   commercial_actionability_score = s.commercial_actionability_score,
--   final_signal_score = s.final_signal_score,
--   updated_at = CURRENT_TIMESTAMP()
-- FROM scored_results s
-- WHERE t.id = s.signal_id;
