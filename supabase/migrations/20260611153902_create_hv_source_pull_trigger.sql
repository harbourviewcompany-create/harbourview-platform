-- create_hv_source_pull_trigger: pg_net edge function trigger + optional cron schedule
-- The trigger function is always installed. The recurring schedule is installed only
-- where the Supabase pg_cron extension and cron.job catalog are available.

create or replace function public.hv_trigger_source_pull_runner()
returns bigint
language sql
security definer
set search_path = 'public', 'net'
as $$
  select net.http_post(
    url := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-source-pull-runner',
    params := jsonb_build_object('tier','2','adapter','rss','limit','3'),
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-harbourview-cron-caller','pg_cron_hv_source_pull_runner'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
$$;

revoke execute on function public.hv_trigger_source_pull_runner() from public, anon, authenticated;
grant execute on function public.hv_trigger_source_pull_runner() to service_role;

do $source_pull_schedule$
declare
  job_exists boolean;
begin
  if to_regclass('cron.job') is null
    or to_regprocedure('cron.schedule(text,text,text)') is null
  then
    raise notice 'pg_cron unavailable; hv-source-pull-runner schedule not installed in this environment';
    return;
  end if;

  execute 'select exists (select 1 from cron.job where jobname = $1)'
    into job_exists
    using 'hv-source-pull-runner-safe-rss';

  if not job_exists then
    perform cron.schedule(
      'hv-source-pull-runner-safe-rss',
      '*/30 * * * *',
      'select public.hv_trigger_source_pull_runner();'
    );
  end if;
end
$source_pull_schedule$;
