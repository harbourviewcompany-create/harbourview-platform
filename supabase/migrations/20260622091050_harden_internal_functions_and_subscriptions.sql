-- Lock internal SECURITY DEFINER functions to their intended execution roles.
-- Historical deployments contain different subsets and overloads, so every
-- change is applied only when the exact routine signature exists.

do $internal_function_hardening$
declare
  signature text;
begin
  foreach signature in array array[
    'public.hv_search_artifacts(vector,vector,uuid,integer,text)',
    'public.hv_search_artifacts(vector,vector,uuid,integer,text,vector)',
    'public.acquire_crawl_targets(integer,text)',
    'public.hv_artifact_publish_to_feed()',
    'public.hv_staging_backfill_country_iso()',
    'public.sync_signal_to_ia_signals()',
    'public.auto_create_dashboard_preferences()'
  ]
  loop
    if to_regprocedure(signature) is not null then
      execute format(
        'revoke execute on function %s from public, anon, authenticated',
        signature
      );
      execute format(
        'grant execute on function %s to service_role',
        signature
      );
    end if;
  end loop;

  if to_regprocedure('public.get_platform_health()') is not null then
    execute 'revoke execute on function public.get_platform_health() from public, anon';
    execute 'grant execute on function public.get_platform_health() to authenticated, service_role';
  end if;

  foreach signature in array array[
    'public.set_jurisdiction_playbooks_updated_at()',
    'public.set_hv_professionals_updated_at()',
    'public.set_deal_rooms_updated_at()',
    'public.touch_updated_at()'
  ]
  loop
    if to_regprocedure(signature) is not null then
      execute format('alter function %s set search_path = public', signature);
    end if;
  end loop;
end
$internal_function_hardening$;

-- service_role bypasses RLS, so removing the historical permissive ALL policy
-- keeps Stripe webhook writes functional while closing browser-role writes.
do $subscription_policy_hardening$
begin
  if to_regclass('public.subscriptions') is not null then
    execute 'drop policy if exists "Service role manages subscriptions" on public.subscriptions';
  end if;
end
$subscription_policy_hardening$;
