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
-- version 20260704152020.
--
-- Rewriting this file cannot affect production: 20260704152020 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Closes the loop from this session's manual remediation work: findings
-- like "gazettes.africa doesn't cover Benin" or "TGA blocks robots" have
-- only been living in git commit messages. This makes them queryable
-- directly on the row, and gives future sessions a ranked worklist instead
-- of re-deriving priority from scratch across 1,134 rows each time.

ALTER TABLE public.source_registry
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS verification_checked_at TIMESTAMPTZ;

COMMENT ON COLUMN public.source_registry.verification_notes IS
  'Freeform note from manual URL-health remediation sessions: why a source was fixed/deactivated, or why it could not be (robots-blocked, country never covered, worker-side TLS issue, etc). Keep this updated so future sessions don''t re-investigate the same dead end.';
COMMENT ON COLUMN public.source_registry.verification_checked_at IS
  'When verification_notes was last written. NULL means never manually investigated.';

-- Backfill notes for sources already investigated this session (Jul 3 2026)
UPDATE public.source_registry SET verification_notes = 'Fixed: old /cannabis path dead, replaced with verified live MinJusticia page.', verification_checked_at = now() WHERE id = 'fa6a6af4-b59a-4deb-83dd-f0866ca5675b';
UPDATE public.source_registry SET verification_notes = 'Fixed: old /assuntos/cannabis path dead, replaced with verified live ANVISA news index.', verification_checked_at = now() WHERE id = '705f7bc4-cfc0-47f3-81d9-1cee4fe41278';
UPDATE public.source_registry SET verification_notes = 'Deactivated: duplicate-topic row on a confirmed-dead path. Needs independent verification if reactivated.', verification_checked_at = now() WHERE id IN ('247e5443-c31d-4eee-a6a3-2b08dc114e64','3915abc4-ffbe-4f47-ba4e-8579c587a6ca','a736659c-fc73-46a7-8edf-3d283f951fe9','28f2df47-8224-4cf3-b02f-614e4d50bb4c');
UPDATE public.source_registry SET verification_notes = 'Fixed: /recent suffix never existed in real routing. Domain fully covers this country (907 gazettes on file).', verification_checked_at = now() WHERE id = 'fc559185-9db6-4b95-bf7b-78677131eeb4';
UPDATE public.source_registry SET verification_notes = 'Fixed: old ANMAT consultas path dead, replaced with the real Ministry of Health REPROCANN national program hub.', verification_checked_at = now() WHERE id = '8ef1b7b8-77d7-46a4-b483-f00892c5b35d';
UPDATE public.source_registry SET verification_notes = 'DEACTIVATED - NOT A DEAD LINK: gazettes.africa''s own live country index (verified directly) does not include this country and never has. Needs an entirely different source (own Journal Officiel or OHADA-adjacent aggregator), not a URL fix.', verification_checked_at = now() WHERE id IN ('61a7a6a2-6488-4a72-a146-c13172591cb5','bac97a7c-072d-46cb-b44e-e42ab8f786e8','3a35a5d4-fd8c-4d0c-93f8-f07767e3d843','f627ce91-aff5-44f7-8dab-f5faba9596d8','bf3e1c1a-51d1-42e3-ac1f-6c07c9ccf88f','9ab034c5-9481-4fa9-8fcd-631980eb7576');
UPDATE public.source_registry SET verification_notes = 'Fixed: old target was a single dead 2021 press release. Swapped to ABF''s live, continuously-updated newsroom index.', verification_checked_at = now() WHERE id = '193f8aeb-060f-461b-b98c-1c98724044c3';
UPDATE public.source_registry SET verification_notes = 'DEACTIVATED - robots.txt disallowed on the real, current, correct cannabis page (confirmed directly). Not a stale URL. Needs an official RSS/API endpoint or secondary-press proxy source instead.', verification_checked_at = now() WHERE id IN ('a24b3f00-b2d2-446d-a72d-049f703ccf79','b1219657-91b3-49f9-b5e7-c684fbfba915');
UPDATE public.source_registry SET verification_notes = 'Fixed: old path dead, replaced with current liquor-and-cannabis regulation hub.', verification_checked_at = now() WHERE id = 'fa4c6c14-3ab1-4dc6-a32c-36141c810abe';
UPDATE public.source_registry SET verification_notes = 'Fixed: Senado migrated from name-based slugs to numeric IDs. Old /comision-de-salud slug retired.', verification_checked_at = now() WHERE id = '3cd1bdd4-6b0d-47ae-9ce7-69636ec65594';
UPDATE public.source_registry SET verification_notes = 'Fixed: specific old page (51090.html) gone but domain healthy, replaced with current equivalent (50927.html). Original error was a TLS UnknownIssuer cert error, not 404 -- if it recurs on this new URL too, that confirms a worker-side cert-store issue, not a URL problem.', verification_checked_at = now() WHERE id = '1cb55697-e14c-4fa6-8dba-0e16a2010350';
UPDATE public.source_registry SET verification_notes = 'DEACTIVATED - registry had the wrong domain (ispch.cl) but even the correct current domain (ispch.gob.cl, verified directly) disallows automated access via robots.txt. Same class as Australia TGA/ODC.', verification_checked_at = now() WHERE id = '7f6b7e64-37a2-4063-b728-ddb065251cb2';
UPDATE public.source_registry SET verification_notes = 'DEACTIVATED - see companion ISP Chile row for reason (robots-blocked even on correct domain).', verification_checked_at = now() WHERE id = 'c4874bce-c4b0-446c-bfb4-e42bd1de59b8';

-- The health view itself. security_invoker=true so it respects whatever
-- RLS applies to the underlying tables (consistent with the api-schema
-- fix earlier this session) rather than running with view-owner privilege.
CREATE OR REPLACE VIEW public.source_registry_health
WITH (security_invoker = true) AS
WITH ranked_snapshots AS (
  SELECT
    ss.source_id,
    ss.fetch_status,
    ss.error_message,
    ss.captured_at,
    ROW_NUMBER() OVER (PARTITION BY ss.source_id ORDER BY ss.captured_at DESC) AS rn
  FROM public.source_snapshots ss
  WHERE ss.captured_at > now() - interval '30 days'
),
first_success AS (
  SELECT source_id, MIN(rn) AS first_success_rn
  FROM ranked_snapshots
  WHERE fetch_status = 'success'
  GROUP BY source_id
),
recent_stats AS (
  SELECT
    source_id,
    COUNT(*) AS attempts_30d,
    COUNT(*) FILTER (WHERE fetch_status = 'success') AS successes_30d,
    COUNT(*) FILTER (WHERE fetch_status = 'error') AS errors_30d,
    MAX(captured_at) AS last_attempt_at,
    MAX(captured_at) FILTER (WHERE fetch_status = 'success') AS last_success_at
  FROM ranked_snapshots
  GROUP BY source_id
),
last_error AS (
  SELECT DISTINCT ON (source_id) source_id, error_message AS last_error_message, captured_at AS last_error_at
  FROM ranked_snapshots
  WHERE fetch_status = 'error'
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
    WHEN le.last_error_message ILIKE '%dns_blocked%' THEN 'investigate_dns_block'
    WHEN le.last_error_message ILIKE '%certificate%' OR le.last_error_message ILIKE '%tls%'
         OR le.last_error_message ILIKE '%unknownissuer%' OR le.last_error_message ILIKE '%notvalidforname%' THEN 'capture_worker_tls_issue_not_url'
    WHEN le.last_error_message ILIKE '%abort%' OR le.last_error_message ILIKE '%timeout%' THEN 'check_timeout_or_site_speed'
    WHEN le.last_error_message ILIKE '%503%' THEN 'check_if_transient_or_persistent'
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

-- Internal/operational view: not for the public API surface.
REVOKE ALL ON public.source_registry_health FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.source_registry_health TO service_role;
