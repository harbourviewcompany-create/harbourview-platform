-- Harden inbound authentication for production Edge Functions invoked by pg_cron.
-- No secret values are stored in this migration. Each helper reads its high-entropy
-- caller secret from Supabase Vault at execution time and fails closed when absent.
--
-- Required Vault secret names before production activation:
--   job_refresh_cron_secret
--   schema_drift_cron_secret
--   hv_source_pull_runner_secret
--
-- HV_PRIVATE_PIPELINE_RUNNER_SECRET is intentionally not wired here because the
-- production caller for hv-private-pipeline-runner is not yet verified.

create or replace function public.invoke_job_refresh()
returns bigint
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'job_refresh_cron_secret';

  if v_secret is null or length(v_secret) = 0 then
    raise exception 'job_refresh_cron_secret is not configured';
  end if;

  return net.http_post(
    url := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/job-refresh',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-harbourview-cron-secret', v_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
end;
$fn$;

create or replace function public.invoke_schema_drift_monitor()
returns bigint
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'schema_drift_cron_secret';

  if v_secret is null or length(v_secret) = 0 then
    raise exception 'schema_drift_cron_secret is not configured';
  end if;

  return net.http_post(
    url := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/schema-drift-monitor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-harbourview-cron-secret', v_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
end;
$fn$;

create or replace function public.hv_trigger_source_pull_runner()
returns bigint
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'hv_source_pull_runner_secret';

  if v_secret is null or length(v_secret) = 0 then
    raise exception 'hv_source_pull_runner_secret is not configured';
  end if;

  return net.http_post(
    url := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-source-pull-runner',
    params := jsonb_build_object('tier', '2', 'adapter', 'rss', 'limit', '3'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-harbourview-cron-secret', v_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
end;
$fn$;

revoke all on function public.invoke_job_refresh() from public, anon, authenticated;
revoke all on function public.invoke_schema_drift_monitor() from public, anon, authenticated;
revoke all on function public.hv_trigger_source_pull_runner() from public, anon, authenticated;
grant execute on function public.invoke_job_refresh() to service_role;
grant execute on function public.invoke_schema_drift_monitor() to service_role;
grant execute on function public.hv_trigger_source_pull_runner() to service_role;

comment on function public.invoke_job_refresh() is
  'Vault-backed authenticated pg_cron caller for the job-refresh Edge Function.';
comment on function public.invoke_schema_drift_monitor() is
  'Vault-backed authenticated pg_cron caller for the schema-drift-monitor Edge Function.';
comment on function public.hv_trigger_source_pull_runner() is
  'Vault-backed authenticated pg_cron caller for the hv-source-pull-runner Edge Function.';

-- Preserve current production schedules and job identities where possible by
-- changing only their command text. If a named job is absent, leave it absent;
-- this migration does not create new schedules implicitly.
do $cron_auth$
begin
  if to_regclass('cron.job') is null then
    raise notice 'cron.job unavailable; caller helpers installed but schedules not rewired';
    return;
  end if;

  update cron.job
  set command = 'select public.invoke_job_refresh();'
  where jobname = 'job-refresh-daily';

  update cron.job
  set command = 'select public.invoke_schema_drift_monitor();'
  where jobname = 'schema-drift-monitor';

  update cron.job
  set command = 'select public.hv_trigger_source_pull_runner();'
  where jobname = 'hv-source-pull-runner-safe-rss';
end
$cron_auth$;
