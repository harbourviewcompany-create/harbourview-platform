-- create_hv_source_health_sweep_wrapper: calls quarantine check on cron schedule
-- Applied: 2026-06-11; stub created to reconcile supabase migration history

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

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'hv-source-health-sweep') then
    perform cron.schedule(
      'hv-source-health-sweep',
      '5 * * * *',
      'select public.hv_source_health_sweep();'
    );
  end if;
end;
$$;
