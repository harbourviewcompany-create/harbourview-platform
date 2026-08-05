-- Replay-safe cron/pg_net housekeeping helpers.

create or replace function public.prune_net_http_response()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, net
as $function$
begin
  if to_regclass('net._http_response') is not null then
    execute 'delete from net._http_response where created < now() - interval ''24 hours''';
  end if;
end;
$function$;

create or replace function public.prune_cron_job_run_details()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, cron
as $function$
begin
  if to_regclass('cron.job_run_details') is not null then
    execute 'delete from cron.job_run_details where end_time < now() - interval ''7 days''';
  end if;
end;
$function$;

revoke execute on function public.prune_net_http_response() from public, anon, authenticated;
revoke execute on function public.prune_cron_job_run_details() from public, anon, authenticated;
grant execute on function public.prune_net_http_response() to service_role;
grant execute on function public.prune_cron_job_run_details() to service_role;

-- Live cron schedules remain environment state and are installed only where
-- pg_cron is available by the controlled operations runbook.
