-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260704020617.
--
-- Rewriting this file cannot affect production: 20260704020617 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

create or replace function public.run_daily_digest()
returns jsonb
language plpgsql
security definer
set search_path to 'public','net','vault','extensions'
as $function$
declare
  v_key text;
  v_signals jsonb;
  v_signal_ids text[];
  v_req bigint;
  v_pre text := 'You are the editor of a daily B2B cannabis industry intelligence briefing. Below is a JSON array of qualified intelligence signals. Select the ~8 most commercially important (fewer if fewer are given), rewrite each as a sharp headline (max 110 chars) plus ONE editorial "why_it_matters" sentence a cannabis operator/investor would value. Group logically by market. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"headline": string, "why_it_matters": string, "market": string, "signal_id": string (the id field from the input signal you used)}. Order by importance.';
begin
  -- already published today: no-op
  if exists (select 1 from daily_digest where digest_date = current_date) then
    return jsonb_build_object('ok',true,'skipped','digest exists for today');
  end if;

  -- COLLECT phase: pending job for today with a response?
  perform 1 from _digest_jobs j where j.digest_date = current_date and not j.collected;
  if found then
    -- expire stale (>1h, no response)
    update _digest_jobs j set collected = true
    where j.digest_date = current_date and not j.collected
      and j.created_at < now() - interval '1 hour'
      and not exists (select 1 from net._http_response r where r.id = j.request_id);

    with resp as (
      select j.request_id, j.signal_ids,
             (r.content::jsonb -> 'content' -> 0 ->> 'text') as claude_text,
             r.status_code
      from _digest_jobs j join net._http_response r on r.id = j.request_id
      where j.digest_date = current_date and not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, signal_ids, status_code,
             safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, signal_ids, p
      from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    ins as (
      insert into daily_digest (digest_date, headlines, markets)
      select current_date, o.p,
        (select coalesce(array_agg(distinct h->>'market'), '{}') from jsonb_array_elements(o.p) h)
      from ok o
      returning id
    ),
    mark_used as (
      update ia_signals s set used_in_digest_at = now()
      from ok o
      where s.id = any(o.signal_ids) and exists (select 1 from ins)
      returning s.id
    ),
    done as (
      update _digest_jobs j set collected = true
      from parsed p
      where j.request_id = p.request_id
      returning j.request_id
    )
    select jsonb_build_object('ok',true,'phase','collect',
      'published', exists(select 1 from ins),
      'signals_marked', (select count(*) from mark_used))
    into v_signals;

    return coalesce(v_signals, jsonb_build_object('ok',true,'phase','collect','published',false,'reason','response not ready or unparseable'));
  end if;

  -- FIRE phase
  select decrypted_secret into v_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  if v_key is null then return jsonb_build_object('ok',false,'reason','anthropic_api_key not in vault'); end if;

  select jsonb_agg(jsonb_build_object(
           'id', s.id, 'title', s.title, 'market', s.market, 'type', s.type,
           'confidence', s.confidence, 'commercial_impact', s.commercial_impact,
           'summary', s.summary, 'detected_at', s.detected_at)),
         array_agg(s.id)
  into v_signals, v_signal_ids
  from (
    select * from ia_signals
    where stage = 'qualified' and used_in_digest_at is null
      and created_at > now() - interval '7 days'
    order by (commercial_impact = 'high') desc, confidence desc, created_at desc
    limit 20
  ) s;

  if v_signals is null or jsonb_array_length(v_signals) < 3 then
    return jsonb_build_object('ok',true,'skipped','fewer than 3 unused qualified signals in last 7 days',
      'available', coalesce(jsonb_array_length(v_signals),0));
  end if;

  v_req := net.http_post(
    url := 'https://api.anthropic.com/v1/messages',
    headers := jsonb_build_object('x-api-key', v_key, 'anthropic-version','2023-06-01','content-type','application/json'),
    body := jsonb_build_object('model','claude-haiku-4-5-20251001','max_tokens',2500,
      'messages', jsonb_build_array(jsonb_build_object('role','user','content',
        v_pre || E'\n\nSIGNALS:\n' || v_signals::text))),
    timeout_milliseconds := 60000
  );

  insert into _digest_jobs (request_id, digest_date, signal_ids)
  values (v_req, current_date, v_signal_ids);

  return jsonb_build_object('ok',true,'phase','fire','request_id',v_req,'signals_sent',jsonb_array_length(v_signals));
end $function$;
