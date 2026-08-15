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
-- version 20260709211746.
--
-- Rewriting this file cannot affect production: 20260709211746 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


CREATE OR REPLACE FUNCTION public.get_platform_health()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_recent_attempts int := 0;
  v_recent_failures int := 0;
  v_editorial_recent_attempts int := 0;
  v_editorial_recent_failures int := 0;
begin
  select count(*),
         count(*) filter (where r.status_code <> 200 and (
           r.content::text ilike '%credit balance is too low%'
           or r.content::text ilike '%insufficient_quota%'
           or r.content::text ilike '%exceeded your current quota%'
         ))
    into v_recent_attempts, v_recent_failures
  from (select request_id from _sig_extract_jobs order by created_at desc limit 20) recent
  join net._http_response r on r.id = recent.request_id;

  -- Editorial digest pipeline shares the same Anthropic key and can fail
  -- independently of the trade-signal side (e.g. billing exhausted while
  -- run_daily_digest happens to have nothing new to fire on, or vice versa).
  -- _sig_extract_jobs above only covers the trade-signal side, so without
  -- this the editorial pipeline could be silently dead with no ops signal.
  select count(*),
         count(*) filter (where r.status_code <> 200 and (
           r.content::text ilike '%credit balance is too low%'
           or r.content::text ilike '%insufficient_quota%'
           or r.content::text ilike '%exceeded your current quota%'
         ))
    into v_editorial_recent_attempts, v_editorial_recent_failures
  from (select request_id from _editorial_digest_jobs order by created_at desc limit 20) recent
  join net._http_response r on r.id = recent.request_id;

  RETURN jsonb_build_object(
    'checked_at',                     NOW(),
    'listings_approved',              (SELECT COUNT(*) FROM listings WHERE status = 'approved' AND public_visibility = true),
    'signals_total',                  (SELECT COUNT(*) FROM signals),
    'signals_reviewed',               (SELECT COUNT(*) FROM signals WHERE reviewed = true),
    'ia_signals_qualified',           (SELECT COUNT(*) FROM ia_signals WHERE stage = 'qualified'),
    'source_registry_active',         (SELECT COUNT(*) FROM source_registry WHERE is_active = true AND crawl_allowed = true),
    'source_snapshots_pending',       (SELECT COUNT(*) FROM source_snapshots WHERE processing_status = 'pending'),
    'marketplace_candidates_pending', (SELECT COUNT(*) FROM marketplace_candidates WHERE status = 'needs_review'),
    'hv_public_feed_items',           (SELECT COUNT(*) FROM hv_public_feed WHERE status = 'published'),
    'countries_covered',              (SELECT COUNT(*) FROM countries),
    'jurisdiction_briefings_pub',     (SELECT COUNT(*) FROM jurisdiction_briefings WHERE status = 'published'),
    'opportunities_active',           (SELECT COUNT(*) FROM opportunities WHERE stage NOT IN ('closed', 'archived')),
    'processing_jobs_stuck',          (SELECT COUNT(*) FROM hv_processing_jobs WHERE status = 'pending' AND created_at < NOW() - INTERVAL '1 hour'),
    'extraction_llm_degraded',        (v_recent_attempts > 0 AND v_recent_failures::numeric / v_recent_attempts >= 0.5),
    'extraction_recent_attempts',     v_recent_attempts,
    'extraction_recent_failures',     v_recent_failures,
    'editorial_items_qualified',      (SELECT COUNT(*) FROM editorial_items WHERE stage = 'qualified'),
    'editorial_items_unused',         (SELECT COUNT(*) FROM editorial_items WHERE stage = 'qualified' AND used_in_digest_at IS NULL),
    'editorial_digest_llm_degraded',  (v_editorial_recent_attempts > 0 AND v_editorial_recent_failures::numeric / v_editorial_recent_attempts >= 0.5),
    'editorial_recent_attempts',      v_editorial_recent_attempts,
    'editorial_recent_failures',      v_editorial_recent_failures
  );
END;
$function$;
