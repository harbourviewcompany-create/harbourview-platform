-- Lock internal SECURITY DEFINER functions to service_role (no anon/authenticated RPC),
-- pin search_path on trigger helpers, and remove the always-true write policy on billing.
-- Applied to prod via Supabase MCP; backfilled here for repo/prod parity. All idempotent.

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

revoke execute on function public.get_platform_health() from public, anon;
grant  execute on function public.get_platform_health() to authenticated, service_role;

alter function public.set_jurisdiction_playbooks_updated_at() set search_path = public;
alter function public.set_hv_professionals_updated_at()       set search_path = public;
alter function public.set_deal_rooms_updated_at()             set search_path = public;
alter function public.touch_updated_at()                      set search_path = public;

drop policy if exists "Service role manages subscriptions" on public.subscriptions;
