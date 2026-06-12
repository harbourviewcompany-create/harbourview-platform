-- create_hv_source_pull_trigger: pg_net edge function trigger + cron schedule
-- Applied: 2026-06-11; stub created to reconcile supabase migration history

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

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'hv-source-pull-runner-safe-rss') then
    perform cron.schedule(
      'hv-source-pull-runner-safe-rss',
      '*/30 * * * *',
      'select public.hv_trigger_source_pull_runner();'
    );
  end if;
end;
$$;
