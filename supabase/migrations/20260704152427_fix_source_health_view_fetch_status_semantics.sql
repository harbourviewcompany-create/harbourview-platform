-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260704152427.
--
-- Rewriting this file cannot affect production: 20260704152427 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Bug fix: source_registry_health treated fetch_status='success' as the
-- only successful outcome. Real data has 4 values: success, extracted,
-- extract_failed, error. Verified directly: 'extracted' (1379 rows) and
-- 'extract_failed' (10 rows) both have real captured_text in the large
-- majority of cases -- the HTTP fetch worked; only 'error' means it didn't.
-- Without this fix, sources whose recent snapshots happen to be in
-- 'extracted' state were wrongly flagged as failing (found via Hemp
-- Benchmarks RSS testing as a false positive).

CREATE OR REPLACE VIEW public.source_registry_health
WITH (security_invoker = true) AS
WITH ranked_snapshots AS (
  SELECT
    ss.source_id,
    ss.fetch_status,
    ss.error_message,
    ss.captured_at,
    (ss.fetch_status IN ('success','extracted','extract_failed')) AS fetch_ok,
    ROW_NUMBER() OVER (PARTITION BY ss.source_id ORDER BY ss.captured_at DESC) AS rn
  FROM public.source_snapshots ss
  WHERE ss.captured_at > now() - interval '30 days'
),
first_success AS (
  SELECT source_id, MIN(rn) AS first_success_rn
  FROM ranked_snapshots
  WHERE fetch_ok
  GROUP BY source_id
),
recent_stats AS (
  SELECT
    source_id,
    COUNT(*) AS attempts_30d,
    COUNT(*) FILTER (WHERE fetch_ok) AS successes_30d,
    COUNT(*) FILTER (WHERE NOT fetch_ok) AS errors_30d,
    MAX(captured_at) AS last_attempt_at,
    MAX(captured_at) FILTER (WHERE fetch_ok) AS last_success_at
  FROM ranked_snapshots
  GROUP BY source_id
),
last_error AS (
  SELECT DISTINCT ON (source_id) source_id, error_message AS last_error_message, captured_at AS last_error_at
  FROM ranked_snapshots
  WHERE NOT fetch_ok
  ORDER BY source_id, captured_at DESC
)
SELECT
  sr.id,
  sr.source_name,
  sr.source_url,
  sr.country,
  sr.region,
  sr.tier,
  COALESCE(rs.attempts_30d, 0) AS attempts_30d,
  COALESCE(rs.successes_30d, 0) AS successes_30d,
  CASE WHEN COALESCE(rs.attempts_30d,0) > 0
       THEN ROUND(100.0 * COALESCE(rs.successes_30d,0) / rs.attempts_30d, 1)
       ELSE NULL END AS success_rate_pct,
  COALESCE(fs.first_success_rn - 1, rs.attempts_30d, 0) AS consecutive_failures,
  CASE WHEN rs.attempts_30d IS NULL OR rs.attempts_30d = 0 THEN 'not_crawled_30d' ELSE NULL END AS crawl_gap_flag,
  le.last_error_message,
  le.last_error_at,
  CASE
    WHEN le.last_error_message ILIKE '%404%' THEN 'verify_replacement_url'
    WHEN le.last_error_message ILIKE '%403%' OR le.last_error_message ILIKE '%forbidden%' THEN 'check_robots_or_find_alt_source'
    WHEN le.last_error_message ILIKE '%429%' OR le.last_error_message ILIKE '%too many requests%' THEN 'rate_limited_check_official_api'
    WHEN le.last_error_message ILIKE '%dns_blocked%' THEN 'investigate_dns_block'
    WHEN le.last_error_message ILIKE '%certificate%' OR le.last_error_message ILIKE '%tls%'
         OR le.last_error_message ILIKE '%unknownissuer%' OR le.last_error_message ILIKE '%notvalidforname%' THEN 'capture_worker_tls_issue_not_url'
    WHEN le.last_error_message ILIKE '%abort%' OR le.last_error_message ILIKE '%timeout%' THEN 'check_timeout_or_site_speed'
    WHEN le.last_error_message ILIKE '%503%' THEN 'check_if_transient_or_persistent'
    WHEN le.last_error_message ILIKE '%fetch failed%' THEN 'check_dns_or_connectivity'
    WHEN le.last_error_message IS NOT NULL THEN 'investigate'
    ELSE NULL
  END AS suggested_action,
  sr.verification_notes,
  sr.verification_checked_at,
  sr.is_active
FROM public.source_registry sr
LEFT JOIN recent_stats rs ON rs.source_id = sr.id
LEFT JOIN first_success fs ON fs.source_id = sr.id
LEFT JOIN last_error le ON le.source_id = sr.id
WHERE sr.is_active = true
ORDER BY consecutive_failures DESC NULLS LAST, sr.tier ASC NULLS LAST;

REVOKE ALL ON public.source_registry_health FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.source_registry_health TO service_role;
