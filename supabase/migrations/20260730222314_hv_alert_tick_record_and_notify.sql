-- Persist and notify on the assertions from hv_pipeline_alerts().
--
-- hv_pipeline_alerts() is a point-in-time board: it says what is breaching now
-- and forgets. That is not enough to catch the failure mode this whole review
-- was about -- hv-classify was 401ing for eight days and nobody was looking at
-- a board. This adds the two things a board cannot provide on its own:
--
--   1. History. hv_alert_log records when a breach was first seen, when it was
--      last seen, and when it cleared, so "how long was this broken" is
--      answerable after the fact.
--   2. Push. Breaches are emailed rather than waiting to be noticed.
--
-- Deliberately degrades rather than fails: if the Vault secrets are absent the
-- tick still records detection and history and reports delivery as skipped.
-- Detection is the part that must never depend on email being configured.
--
-- ACTIVATION
-- ----------
-- Delivery stays dormant until both Vault secrets exist:
--   resend_api_key   -- Resend API key scoped to sending only
--   alert_email_to   -- recipient address
-- Neither is created here; secrets are not written from migrations.

create table if not exists public.hv_alert_log (
  id            bigserial primary key,
  alert_key     text        not null,
  severity      text        not null check (severity in ('critical','warning','ok')),
  value         text,
  detail        text,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  notified_at   timestamptz,
  resolved_at   timestamptz
);

-- One open row per alert_key; a re-breach after resolution opens a new row so
-- the history of distinct incidents is preserved rather than overwritten.
create unique index if not exists idx_hv_alert_log_open
  on public.hv_alert_log (alert_key) where resolved_at is null;

comment on table public.hv_alert_log is
  'Incident history for hv_pipeline_alerts(). One open row per breaching alert_key; '
  'resolved_at set when the assertion passes again. Answers "how long was this broken".';

create or replace function public.hv_alert_tick()
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'net', 'vault'
as $function$
declare
  v_open      int := 0;
  v_new       int := 0;
  v_resolved  int := 0;
  v_notify    int := 0;
  v_key       text;
  v_to        text;
  v_body      text;
  v_rid       bigint;
begin
  -- Upsert current breaches (anything not 'ok') into the open set.
  with cur as (
    select * from public.hv_pipeline_alerts() where severity <> 'ok'
  ),
  upsert as (
    insert into public.hv_alert_log (alert_key, severity, value, detail)
    select c.alert_key, c.severity, c.value, c.detail from cur c
    on conflict (alert_key) where resolved_at is null
    do update set severity = excluded.severity,
                  value    = excluded.value,
                  detail   = excluded.detail,
                  last_seen_at = now()
    returning (xmax = 0) as inserted
  )
  select count(*) filter (where inserted), count(*) into v_new, v_open from upsert;

  -- Resolve anything no longer breaching.
  update public.hv_alert_log l set resolved_at = now()
   where l.resolved_at is null
     and not exists (
       select 1 from public.hv_pipeline_alerts() a
        where a.alert_key = l.alert_key and a.severity <> 'ok');
  get diagnostics v_resolved = row_count;

  -- Notify: first sighting, or at most once per 6h while still open.
  select decrypted_secret into v_key from vault.decrypted_secrets where name='resend_api_key' limit 1;
  select decrypted_secret into v_to  from vault.decrypted_secrets where name='alert_email_to'  limit 1;

  if v_key is null or v_to is null then
    return jsonb_build_object('ok', true, 'open', v_open, 'new', v_new, 'resolved', v_resolved,
      'notified', 0,
      'delivery', 'skipped: vault needs resend_api_key and alert_email_to (detection and history are unaffected)');
  end if;

  select string_agg('[' || upper(severity) || '] ' || alert_key || ' = ' || coalesce(value,'') || E'\n    ' || coalesce(detail,''), E'\n')
    into v_body
    from public.hv_alert_log
   where resolved_at is null
     and (notified_at is null or notified_at < now() - interval '6 hours');

  if v_body is null then
    return jsonb_build_object('ok', true, 'open', v_open, 'new', v_new, 'resolved', v_resolved,
      'notified', 0, 'delivery', 'nothing new to send');
  end if;

  select net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key),
    body := jsonb_build_object(
      'from', 'Harbourview Pipeline <alerts@harbourview.company>',
      'to',   jsonb_build_array(v_to),
      'subject', 'Harbourview pipeline: ' || v_open || ' open alert(s)',
      'text', 'Pipeline assertions failing as of ' || now()::text || E':\n\n' || v_body ||
              E'\n\nThese assert on outcomes, not job exit codes. Run select * from hv_pipeline_alerts(); for the full board.'
    ),
    timeout_milliseconds := 20000
  ) into v_rid;

  update public.hv_alert_log set notified_at = now()
   where resolved_at is null
     and (notified_at is null or notified_at < now() - interval '6 hours');
  get diagnostics v_notify = row_count;

  return jsonb_build_object('ok', true, 'open', v_open, 'new', v_new, 'resolved', v_resolved,
    'notified', v_notify, 'delivery', 'sent', 'request_id', v_rid);
end$function$;

comment on function public.hv_alert_tick() is
  'Records hv_pipeline_alerts() breaches into hv_alert_log and emails open ones (max once per 6h each). '
  'Degrades to detection-only when the vault secrets resend_api_key / alert_email_to are absent.';

-- Operator-plane only: SECURITY DEFINER, reads vault secrets and sends email.
-- pg_cron is unaffected -- jobs execute as their owner, not as anon/authenticated.
revoke execute on function public.hv_alert_tick() from public, anon, authenticated;
grant  execute on function public.hv_alert_tick() to service_role;

-- Hourly, off the :00 rush shared by the other hv-* jobs.
select cron.schedule('hv-pipeline-alerts', '47 * * * *', 'select public.hv_alert_tick();')
where not exists (select 1 from cron.job where jobname = 'hv-pipeline-alerts');
