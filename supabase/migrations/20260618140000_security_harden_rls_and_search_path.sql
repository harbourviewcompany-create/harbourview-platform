-- Gate 9: Security hardening from RLS advisor

-- 1. Enable RLS on _push_staging (ERROR: rls_disabled_in_public)
--    Service role bypasses RLS so migration tooling is unaffected.
ALTER TABLE public._push_staging ENABLE ROW LEVEL SECURITY;

-- 2. Revoke anon execute on internal cron/worker functions.
--    acquire_crawl_targets and hv_staging_backfill_country_iso are internal
--    data-pipeline utilities and must not be callable without authentication.
REVOKE EXECUTE ON FUNCTION public.acquire_crawl_targets(integer, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.hv_staging_backfill_country_iso() FROM anon;

-- 3. Pin search_path on all flagged functions to prevent search_path injection.
--    Uses pg_proc to resolve exact signatures — no function body rewrite needed.
DO $$
DECLARE
  func record;
BEGIN
  FOR func IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN (
      'set_updated_at',
      'hv_set_updated_at',
      'hv_audit_review_decision',
      'hv_audit_publication',
      'hv_extract_signals_from_captured_text',
      'hv_promote_staging_to_artifacts',
      'hv_requeue_failed_embed_jobs',
      'hv_search_artifacts',
      'countries_set_updated_at',
      'hv_normalize_source_url',
      'hv_source_import_adapter',
      'hv_source_import_fetch_method',
      'hv_source_import_crawl_cadence',
      'hv_source_import_authority_level',
      'hv_source_import_region',
      'hv_source_import_signal_keywords',
      'update_updated_at',
      'sync_opportunity_score',
      'promote_inquiry_to_candidate',
      'handle_new_user',
      'sync_subscription_tier',
      'get_command_centre_metrics',
      'get_country_status',
      'set_cc_briefings_updated_at',
      'cc_set_updated_at',
      'acquire_crawl_targets',
      'stage_file_chunk',
      'hv_staging_backfill_country_iso',
      'hv_is_org_member',
      'hv_is_platform_staff',
      'ia_search_signals',
      'search_signals_semantic',
      'get_watchlist_items',
      'get_watchlist_notification_summary'
    )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION public.%I(%s) SET search_path = public',
      func.proname, func.args
    );
  END LOOP;
END $$;
