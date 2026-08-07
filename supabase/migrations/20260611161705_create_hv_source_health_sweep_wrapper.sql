-- create_hv_source_health_sweep_wrapper: calls quarantine check on optional cron schedule

create or replace function public.hv_source_health_sweep()
returns bigint
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  affected bigint := 0;
begin
  select count(*) into affected
  from public.hv_quarantine_repeated_source_failures();
  return affected;
end;
$$;

revoke execute on function public.hv_source_health_sweep() from public, anon, authenticated;
grant execute on function public.hv_source_health_sweep() to service_role;

do $source_health_schedule$
declare
  job_exists boolean;
begin
  if to_regclass('cron.job') is null
    or to_regprocedure('cron.schedule(text,text,text)') is null
  then
    raise notice 'pg_cron unavailable; hv-source-health-sweep schedule not installed';
    return;
  end if;

  execute 'select exists (select 1 from cron.job where jobname = $1)'
    into job_exists
    using 'hv-source-health-sweep';

  if not job_exists then
    perform cron.schedule(
      'hv-source-health-sweep',
      '5 * * * *',
      'select public.hv_source_health_sweep();'
    );
  end if;
end
$source_health_schedule$;
