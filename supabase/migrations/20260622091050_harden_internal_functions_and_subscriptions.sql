
-- ── 1. Lock internal SECURITY DEFINER functions to service_role only ──────────
-- (zero app .rpc() callers except service-role worker/cron; triggers fire regardless of EXECUTE grants)
do $$
declare sig text;
begin
  foreach sig in array array[
    'public.hv_search_artifacts(vector, vector, uuid, integer, text)',
    'public.hv_search_artifacts(vector, vector, uuid, integer, text, vector)',
    'public.acquire_crawl_targets(integer, text)',
    'public.hv_artifact_publish_to_feed()',
    'public.hv_staging_backfill_country_iso()',
    'public.sync_signal_to_ia_signals()',
    'public.auto_create_dashboard_preferences()'
  ]
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', sig);
    execute format('grant  execute on function %s to service_role', sig);
  end loop;
end $$;

-- get_platform_health: operational counts → signed-in + service only, no anon
revoke execute on function public.get_platform_health() from public, anon;
grant  execute on function public.get_platform_health() to authenticated, service_role;

-- ── 2. Pin search_path on the 4 trigger helper functions ─────────────────────
alter function public.set_jurisdiction_playbooks_updated_at() set search_path = public;
alter function public.set_hv_professionals_updated_at()       set search_path = public;
alter function public.set_deal_rooms_updated_at()             set search_path = public;
alter function public.touch_updated_at()                      set search_path = public;

-- ── 3. Close the always-true write hole on billing ───────────────────────────
-- service_role bypasses RLS, so dropping this permissive ALL policy keeps Stripe
-- webhooks working while removing anon/authenticated write access.
drop policy if exists "Service role manages subscriptions" on public.subscriptions;
