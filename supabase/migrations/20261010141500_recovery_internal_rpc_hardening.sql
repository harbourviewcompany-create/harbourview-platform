-- Recovery-only security hardening for internal maintenance functions.
alter function cannabis_intelligence.set_updated_at()
  set search_path = cannabis_intelligence, pg_temp;

revoke execute on function public.capture_one_source_sync(uuid) from anon, authenticated;
revoke execute on function public.capture_source_snapshot_batch_v2(integer) from anon, authenticated;
revoke execute on function public.hv_title_dispatch_tick(integer) from anon, authenticated;
revoke execute on function public.reconcile_source_snapshot_depth() from anon, authenticated;

grant execute on function public.capture_one_source_sync(uuid) to service_role;
grant execute on function public.capture_source_snapshot_batch_v2(integer) to service_role;
grant execute on function public.hv_title_dispatch_tick(integer) to service_role;
grant execute on function public.reconcile_source_snapshot_depth() to service_role;