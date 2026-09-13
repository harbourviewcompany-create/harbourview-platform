-- Forward-fix classifier learning-loop authorization and asynchronous alert delivery.
--
-- The ground-truth eval-set mutation is service-role-only. Authenticated
-- admin/operator users retain a narrowly authorized wrapper whose audit identity
-- is derived from auth.uid(), not supplied by the caller.
--
-- pg_net request ids mean queued, not delivered. Alert rows become delivered
-- only after a harvested 2xx response. Failures are retried with bounded
-- backoff, provider response bodies are never persisted, and concurrent ticks
-- operate on one locked set of alert ids.

revoke execute on function api.add_signal_to_eval_set(text,text,text,text,text,text)
  from public, anon, authenticated;
grant execute on function api.add_signal_to_eval_set(text,text,text,text,text,text)
  to service_role;

create or replace function api.admin_add_signal_to_eval_set(
  p_signal_id text,
  p_quality_label text,
  p_content_type text,
  p_impact text,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'api', 'auth', 'pg_temp'
as $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null or not exists (
    select 1
      from public.user_roles ur
     where ur.user_id = v_user_id
       and ur.role in ('admin', 'operator')
  ) then
    raise exception 'insufficient privileges: admin/operator role required'
      using errcode = '42501';
  end if;

  return api.add_signal_to_eval_set(
    p_signal_id,
    p_quality_label,
    p_content_type,
    p_impact,
    p_notes,
    'user:' || v_user_id::text
  );
end
$function$;

comment on function api.admin_add_signal_to_eval_set(text,text,text,text,text) is
  'Admin/operator learning-loop wrapper. The underlying mutation remains service-role-only and labeled_by is derived from auth.uid().';

revoke execute on function api.admin_add_signal_to_eval_set(text,text,text,text,text)
  from public, anon;
grant execute on function api.admin_add_signal_to_eval_set(text,text,text,text,text)
  to authenticated, service_role;

alter table public.hv_alert_log
  add column if not exists delivery_request_id bigint,
  add column if not exists delivery_status text not null default 'pending',
  add column if not exists delivery_attempts integer not null default 0,
  add column if not exists last_delivery_error text,
  add column if not exists delivery_queued_at timestamptz,
  add column if not exists next_delivery_attempt_at timestamptz;

alter table public.hv_alert_log
  drop constraint if exists hv_alert_log_delivery_status_check;
alter table public.hv_alert_log
  add constraint hv_alert_log_delivery_status_check
  check (delivery_status in ('pending', 'queued', 'delivered', 'failed')) not valid;
alter table public.hv_alert_log
  validate constraint hv_alert_log_delivery_status_check;

comment on column public.hv_alert_log.delivery_status is
  'Email lifecycle. queued is not delivery; only a harvested 2xx response becomes delivered.';
comment on column public.hv_alert_log.last_delivery_error is
  'Sanitized operational category and HTTP status only. Provider response bodies, recipients, headers, and credentials are never persisted.';

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
begin
  -- Harvest prior asynchronous requests before considering another attempt.
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

  -- A queued request with no response after two hours becomes retryable.
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
    returning (xmax = 0) as inserted
  )
  select count(*) filter (where inserted), count(*) into v_new, v_open from upsert;

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

  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key' limit 1;
  select decrypted_secret into v_to from vault.decrypted_secrets where name = 'alert_email_to' limit 1;

  if v_key is null or v_to is null then
    return jsonb_build_object('ok', true, 'open', v_open, 'new', v_new,
      'resolved', v_resolved, 'delivered', v_delivered, 'failed', v_failed,
      'permanently_failed', v_permanently_failed, 'queued', 0,
      'delivery', 'skipped: vault needs resend_api_key and alert_email_to');
  end if;

  -- Lock one exact eligible set. Concurrent ticks skip these rows and cannot
  -- construct an email body from a different snapshot than the queued update.
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
      'delivery', 'nothing eligible to queue');
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
      'text', 'Pipeline assertions failing as of ' || now()::text || E':\n\n' || v_body
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
    'delivery', 'queued', 'request_id', v_rid);
end
$function$;

comment on function public.hv_alert_tick() is
  'Records pipeline assertion breaches, reconciles async pg_net delivery, retries failures with bounded exponential backoff, reports permanently failed rows, and queues one concurrency-safe locked alert set. notified_at means confirmed 2xx delivery.';

revoke execute on function public.hv_alert_tick() from public, anon, authenticated;
grant execute on function public.hv_alert_tick() to service_role;
