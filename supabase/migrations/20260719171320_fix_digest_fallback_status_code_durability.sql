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
-- version 20260719171320.
--
-- Rewriting this file cannot affect production: 20260719171320 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


-- Fixes a bug in the Anthropic -> OpenAI -> Gemini fallback chain added by
-- 20260713213101_digest_llm_fallback_and_manual_review_queue.sql: every tier
-- check joined directly against net._http_response to count recent failures.
-- pg_net prunes that table automatically (observed retention: well under an
-- hour, ~150 rows at any given time), so by the next cron tick the evidence
-- of the previous failure was usually already gone, v_attempts stayed 0, and
-- the chain kept retrying anthropic indefinitely instead of falling through.
--
-- Fix: persist status_code directly on _digest_jobs / _editorial_digest_jobs
-- at collection time -- durable, survives net._http_response pruning -- and
-- have the tier checks read that column instead of re-joining the ephemeral
-- response log.

alter table public._digest_jobs add column if not exists status_code int;
alter table public._editorial_digest_jobs add column if not exists status_code int;

comment on column public._digest_jobs.status_code is
  'HTTP status of the collected LLM response, persisted at collection time so tier-degradation checks survive net._http_response pruning. 0 = no response ever arrived (timed out / lost).';
comment on column public._editorial_digest_jobs.status_code is
  'HTTP status of the collected LLM response, persisted at collection time so tier-degradation checks survive net._http_response pruning. 0 = no response ever arrived (timed out / lost).';

CREATE OR REPLACE FUNCTION public.run_daily_digest()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'net', 'vault', 'extensions'
AS $function$
declare
  v_anthropic_key text;
  v_openai_key text;
  v_gemini_key text;
  v_signals jsonb;
  v_signal_ids text[];
  v_provider text := null;
  v_attempts int;
  v_failures int;
  v_pre text := 'You are the editor of a daily B2B cannabis industry intelligence briefing. Below is a JSON array of qualified intelligence signals. Select the ~8 most commercially important (fewer if fewer are given), rewrite each as a sharp headline (max 110 chars) plus ONE editorial "why_it_matters" sentence a cannabis operator/investor would value. Group logically by market. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"headline": string, "why_it_matters": string, "market": string, "signal_id": string (the id field from the input signal you used)}. Order by importance.';
begin
  if exists (
    select 1 from daily_digest
    where digest_date = current_date
      and headlines is not null and jsonb_array_length(headlines) > 0
  ) then
    return jsonb_build_object('ok',true,'skipped','digest exists for today');
  end if;

  update _digest_jobs j set collected = true, status_code = 0
  where j.digest_date = current_date and not j.collected
    and j.created_at < now() - interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id = j.request_id);

  perform 1 from _digest_jobs j where j.digest_date = current_date and not j.collected;
  if found then
    with resp as (
      select j.request_id, j.signal_ids, j.provider, r.status_code,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as claude_text
      from _digest_jobs j join net._http_response r on r.id = j.request_id
      where j.digest_date = current_date and not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, signal_ids, provider, status_code,
             safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, signal_ids, p
      from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    ins as (
      insert into daily_digest (digest_date, headlines, markets, status, generated_at)
      select current_date, o.p,
        (select coalesce(array_agg(distinct h->>'market'), '{}') from jsonb_array_elements(o.p) h),
        'published', now()
      from ok o
      on conflict (digest_date) do update
        set headlines = excluded.headlines,
            markets = (select coalesce(array_agg(distinct m), '{}') from unnest(daily_digest.markets || excluded.markets) m),
            status = 'published',
            updated_at = now()
      returning id
    ),
    mark_used as (
      update ia_signals s set used_in_digest_at = now()
      from ok o where s.id = any(o.signal_ids) and exists (select 1 from ins)
      returning s.id
    ),
    mark_collected as (
      update _digest_jobs j set collected = true, status_code = p.status_code
      from parsed p where j.request_id = p.request_id
      returning j.request_id
    )
    select jsonb_build_object('ok',true,'phase','collect',
      'provider', (select provider from parsed),
      'published', exists(select 1 from ins),
      'signals_marked', (select count(*) from mark_used))
    into v_signals;

    return coalesce(v_signals, jsonb_build_object('ok',true,'phase','collect','published',false,'reason','response not ready or unparseable'));
  end if;

  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_anthropic_key is null and v_openai_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no anthropic_api_key, openai_api_key or gemini_api_key in vault');
  end if;

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

  if v_anthropic_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _digest_jobs
      where provider='anthropic' and created_at > now() - interval '2 hours' and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'anthropic';
    end if;
  end if;

  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _digest_jobs
      where provider='openai' and created_at > now() - interval '2 hours' and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'openai';
    end if;
  end if;

  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _digest_jobs
      where provider='gemini' and created_at > now() - interval '2 hours' and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'gemini';
    end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('daily_digest', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('available_signals', jsonb_array_length(v_signals)))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded',
      'available', jsonb_array_length(v_signals));
  end if;

  if v_provider = 'anthropic' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object('x-api-key', v_anthropic_key, 'anthropic-version','2023-06-01','content-type','application/json'),
        body := jsonb_build_object('model','claude-haiku-4-5-20251001','max_tokens',2500,
          'messages', jsonb_build_array(jsonb_build_object('role','user','content',
            v_pre || E'\n\nSIGNALS:\n' || v_signals::text))),
        timeout_milliseconds := 60000
      ), current_date, v_signal_ids, 'anthropic'
    );
  elsif v_provider = 'openai' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
        body := jsonb_build_object('model','gpt-4o-mini','max_tokens',2500,'temperature',0,
          'messages', jsonb_build_array(
            jsonb_build_object('role','system','content',v_pre),
            jsonb_build_object('role','user','content', E'SIGNALS:\n' || v_signals::text)
          )),
        timeout_milliseconds := 60000
      ), current_date, v_signal_ids, 'openai'
    );
  else
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type','application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text', E'SIGNALS:\n' || v_signals::text)))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',2500)
        ),
        timeout_milliseconds := 60000
      ), current_date, v_signal_ids, 'gemini'
    );
  end if;

  return jsonb_build_object('ok',true,'phase','fire','provider',v_provider,'degraded',(v_provider <> 'anthropic'),'signals_sent',jsonb_array_length(v_signals));
end $function$;
