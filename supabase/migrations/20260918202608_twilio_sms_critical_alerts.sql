-- hv_get_twilio_creds: vault reader for Twilio SMS delivery, same pattern
-- as hv_get_llm_keys / hv_get_github_pat. Returns null (not an error) if
-- any of the 4 required secrets aren't set yet, so callers can gracefully
-- no-op rather than fail -- this stays inert until twilio_account_sid,
-- twilio_auth_token, twilio_from_number, alert_sms_to are all present.
create or replace function public.hv_get_twilio_creds()
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'vault'
as $function$
declare
  v_sid text; v_token text; v_from text; v_to text;
begin
  select decrypted_secret into v_sid from vault.decrypted_secrets where name = 'twilio_account_sid' limit 1;
  select decrypted_secret into v_token from vault.decrypted_secrets where name = 'twilio_auth_token' limit 1;
  select decrypted_secret into v_from from vault.decrypted_secrets where name = 'twilio_from_number' limit 1;
  select decrypted_secret into v_to from vault.decrypted_secrets where name = 'alert_sms_to' limit 1;

  if v_sid is null or v_token is null or v_from is null or v_to is null then
    return null;
  end if;

  return jsonb_build_object('account_sid', v_sid, 'auth_token', v_token, 'from_number', v_from, 'to_number', v_to);
end;
$function$;

revoke all on function public.hv_get_twilio_creds() from public, anon, authenticated;
grant execute on function public.hv_get_twilio_creds() to service_role;

-- hv_alert_tick: additive change only. The upsert CTE's RETURNING clause is
-- widened to also expose alert_key/severity/value so we can build a summary
-- of alerts that are BOTH newly-inserted AND critical-severity in the same
-- pass (no new query, no schema change to hv_alert_log). If any exist, fire
-- hv-send-sms with a short summary. SMS is deliberately best-effort/fire-
-- and-forget -- no retry/reconciliation state machine like the email path
-- has, since it's a supplementary channel, not the primary one. The edge
-- function itself no-ops cleanly if Twilio creds aren't configured, so this
-- is safe to ship before those secrets exist.
create or replace function public.hv_alert_tick()
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'net', 'vault'
as $function$
declare
  v_open               int := 0;
  v_new                int := 0;
  v_resolved           int := 0;
  v_delivered          int := 0;
  v_failed             int := 0;
  v_timed_out          int := 0;
  v_queued             int := 0;
  v_permanently_failed int := 0;
  v_key                text;
  v_to                 text;
  v_body               text;
  v_rid                bigint;
  v_alert_ids          bigint[] := '{}'::bigint[];
  v_critical_new_body  text;
  v_sms_rid            bigint;
begin
  with responses as (
    select l.id, r.status_code
      from public.hv_alert_log l
      join net._http_response r on r.id = l.delivery_request_id
     where l.delivery_status = 'queued'
  ), reconciled as (
    update public.hv_alert_log l
       set delivery_status = case when r.status_code between 200 and 299 then 'delivered' else 'failed' end,
           notified_at = case when r.status_code between 200 and 299 then now() else l.notified_at end,
           delivery_attempts = case when r.status_code between 200 and 299 then 0 else l.delivery_attempts end,
           delivery_queued_at = null,
           last_delivery_error = case
             when r.status_code between 200 and 299 then null
             else 'provider_rejected:http_' || coalesce(r.status_code::text, 'unknown')
           end,
           next_delivery_attempt_at = case
             when r.status_code between 200 and 299 then null
             else now() + least(
               interval '6 hours',
               interval '15 minutes' * power(2.0, greatest(l.delivery_attempts - 1, 0))::double precision
             )
           end
      from responses r
     where l.id = r.id
    returning delivery_status
  )
  select count(*) filter (where delivery_status = 'delivered'),
         count(*) filter (where delivery_status = 'failed')
    into v_delivered, v_failed
    from reconciled;

  update public.hv_alert_log
     set delivery_status = 'failed',
         last_delivery_error = 'provider_timeout:no_pg_net_response_after_2h',
         delivery_queued_at = null,
         next_delivery_attempt_at = now() + least(
           interval '6 hours',
           interval '15 minutes' * power(2.0, greatest(delivery_attempts - 1, 0))::double precision
         )
   where delivery_status = 'queued'
     and delivery_queued_at < now() - interval '2 hours';
  get diagnostics v_timed_out = row_count;
  v_failed := v_failed + v_timed_out;

  with cur as (
    select * from public.hv_pipeline_alerts() where severity <> 'ok'
  ), upsert as (
    insert into public.hv_alert_log (alert_key, severity, value, detail)
    select c.alert_key, c.severity, c.value, c.detail from cur c
    on conflict (alert_key) where resolved_at is null
    do update set severity = excluded.severity,
                  value = excluded.value,
                  detail = excluded.detail,
                  last_seen_at = now()
    returning alert_key, severity, value, (xmax = 0) as inserted
  )
  select
    count(*) filter (where inserted),
    count(*),
    string_agg('[' || upper(severity) || '] ' || alert_key || ' = ' || coalesce(value, ''), E'\n' order by alert_key)
      filter (where inserted and severity = 'critical')
    into v_new, v_open, v_critical_new_body
    from upsert;

  update public.hv_alert_log l set resolved_at = now()
   where l.resolved_at is null
     and not exists (
       select 1 from public.hv_pipeline_alerts() a
        where a.alert_key = l.alert_key and a.severity <> 'ok');
  get diagnostics v_resolved = row_count;

  select count(*)
    into v_permanently_failed
    from public.hv_alert_log
   where resolved_at is null
     and delivery_status = 'failed'
     and delivery_attempts >= 5;

  if v_critical_new_body is not null then
    select net.http_post(
      url := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-send-sms',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'hv_edge_anon_key' limit 1)
      ),
      body := jsonb_build_object('body', 'Harbourview CRITICAL alert(s):' || E'\n' || v_critical_new_body),
      timeout_milliseconds := 15000
    ) into v_sms_rid;
  end if;

  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key' limit 1;
  select decrypted_secret into v_to from vault.decrypted_secrets where name = 'alert_email_to' limit 1;

  if v_key is null or v_to is null then
    return jsonb_build_object('ok', true, 'open', v_open, 'new', v_new,
      'resolved', v_resolved, 'delivered', v_delivered, 'failed', v_failed,
      'permanently_failed', v_permanently_failed, 'queued', 0,
      'delivery', 'skipped: vault needs resend_api_key and alert_email_to',
      'sms_request_id', v_sms_rid);
  end if;

  select coalesce(array_agg(e.id order by e.id), '{}'::bigint[])
    into v_alert_ids
    from (
      select l.id
        from public.hv_alert_log l
       where l.resolved_at is null
         and l.delivery_status <> 'queued'
         and l.delivery_attempts < 5
         and coalesce(l.next_delivery_attempt_at, '-infinity'::timestamptz) <= now()
         and (l.notified_at is null or l.notified_at < now() - interval '6 hours')
       order by l.id
       for update skip locked
    ) e;

  if coalesce(array_length(v_alert_ids, 1), 0) = 0 then
    return jsonb_build_object('ok', true, 'open', v_open, 'new', v_new,
      'resolved', v_resolved, 'delivered', v_delivered, 'failed', v_failed,
      'permanently_failed', v_permanently_failed, 'queued', 0,
      'delivery', 'nothing eligible to queue',
      'sms_request_id', v_sms_rid);
  end if;

  select string_agg(
           '[' || upper(severity) || '] ' || alert_key || ' = ' || coalesce(value, '') ||
           E'\n    ' || coalesce(detail, ''), E'\n' order by id)
    into v_body
    from public.hv_alert_log
   where id = any (v_alert_ids);

  select net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body := jsonb_build_object(
      'from', 'Harbourview Pipeline <alerts@harbourview.company>',
      'to', jsonb_build_array(v_to),
      'subject', 'Harbourview pipeline: ' || v_open || ' open alert(s)',
      'text', 'Pipeline assertions failing as of ' || now()::text || E'\n\n' || v_body
    ),
    timeout_milliseconds := 20000
  ) into v_rid;

  update public.hv_alert_log
     set delivery_request_id = v_rid,
         delivery_status = 'queued',
         delivery_attempts = delivery_attempts + 1,
         delivery_queued_at = now(),
         last_delivery_error = null,
         next_delivery_attempt_at = null
   where id = any (v_alert_ids);
  get diagnostics v_queued = row_count;

  return jsonb_build_object('ok', true, 'open', v_open, 'new', v_new,
    'resolved', v_resolved, 'delivered', v_delivered, 'failed', v_failed,
    'permanently_failed', v_permanently_failed, 'queued', v_queued,
    'delivery', 'queued', 'request_id', v_rid, 'sms_request_id', v_sms_rid);
end
$function$;
