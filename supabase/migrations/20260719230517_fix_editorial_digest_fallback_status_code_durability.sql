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
-- version 20260719230517.
--
-- Rewriting this file cannot affect production: 20260719230517 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


-- Companion to fix_digest_fallback_status_code_durability: same status_code
-- durability fix applied to run_editorial_digest(), which has the identical
-- net._http_response-join blind spot in its own tier-degradation checks.

CREATE OR REPLACE FUNCTION public.run_editorial_digest()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'net', 'vault', 'extensions'
AS $function$
declare
  v_anthropic_key text;
  v_openai_key text;
  v_gemini_key text;
  v_items jsonb;
  v_item_ids text[];
  v_provider text := null;
  v_attempts int;
  v_failures int;
  v_pre text := 'You are the editor of Harbourview''s Daily Wire, a global cannabis news digest for a general audience -- not a trade or industry briefing. Below is a JSON array of candidate items, each from a mainstream (non-cannabis-industry) news outlet or a government source, published within the last 7 days. Select up to 8 of the most interesting or globally significant items (fewer if fewer qualify) with a strong bias toward emerging and historically underreported cannabis markets -- small or unusual jurisdictions, not the usual US/Canada/Germany/UK/Australia stories. You may include at most ONE major-market story, and only if it is genuinely globally significant this week; omit it entirely if nothing meets that bar. For each selected item, rewrite it as an original short editorial of roughly 150-250 words in Harbourview''s voice: analytical, globally-minded, measured, no hype or cannabis-culture slang, no promotional language, and no direct quotes over a few words. Ground every claim in the source material provided -- do not invent facts, figures, or context not present in the input. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"headline": string (max 110 chars, your own words), "why_it_matters": string (the full ~150-250 word editorial body), "market": string (country name, or "Global"), "item_id": string (the id field from the input item you used)}. Order by editorial importance.';
begin
  if exists (select 1 from daily_digest where digest_date = current_date and editorial_headlines is not null and jsonb_array_length(editorial_headlines) > 0) then
    return jsonb_build_object('ok',true,'skipped','editorial digest exists for today');
  end if;

  update _editorial_digest_jobs j set collected = true, status_code = 0
  where j.digest_date = current_date and not j.collected
    and j.created_at < now() - interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id = j.request_id);

  perform 1 from _editorial_digest_jobs j where j.digest_date = current_date and not j.collected;
  if found then
    with resp as (
      select j.request_id, j.item_ids, j.provider, r.status_code,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as claude_text
      from _editorial_digest_jobs j join net._http_response r on r.id = j.request_id
      where j.digest_date = current_date and not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, item_ids, provider, status_code,
             safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, item_ids, p
      from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    enriched as (
      select o.request_id, o.item_ids,
        (select jsonb_agg(elem || jsonb_build_object(
                  'published_at', ei.published_at,
                  'source_url', ei.source_url,
                  'outlet_name', ei.outlet_name))
         from jsonb_array_elements(o.p) as elem
         left join editorial_items ei on ei.id::text = elem->>'item_id') as p
      from ok o
    ),
    upsert as (
      insert into daily_digest (digest_date, headlines, markets, editorial_headlines, status, generated_at)
      select current_date, '[]'::jsonb, '{}', e.p, 'published', now()
      from enriched e
      on conflict (digest_date) do update
        set editorial_headlines = excluded.editorial_headlines,
            status = 'published',
            updated_at = now()
      returning id
    ),
    mark_used as (
      update editorial_items e set used_in_digest_at = now()
      from ok o where e.id::text = any(o.item_ids) and exists (select 1 from upsert)
      returning e.id
    ),
    mark_collected as (
      update _editorial_digest_jobs j set collected = true, status_code = p.status_code
      from parsed p where j.request_id = p.request_id
      returning j.request_id
    )
    select jsonb_build_object('ok',true,'phase','collect',
      'provider', (select provider from parsed),
      'published', exists(select 1 from upsert),
      'items_marked', (select count(*) from mark_used))
    into v_items;

    return coalesce(v_items, jsonb_build_object('ok',true,'phase','collect','published',false,'reason','response not ready or unparseable'));
  end if;

  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_anthropic_key is null and v_openai_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no anthropic_api_key, openai_api_key or gemini_api_key in vault');
  end if;

  select jsonb_agg(jsonb_build_object(
           'id', e.id, 'headline', e.headline, 'summary', e.summary,
           'why_it_matters', e.why_it_matters, 'country', e.country,
           'outlet_name', e.outlet_name, 'tone', e.tone, 'published_at', e.published_at)),
         array_agg(e.id::text)
  into v_items, v_item_ids
  from (
    select * from editorial_items
    where stage = 'qualified' and used_in_digest_at is null
      and coalesce(published_at, created_at) > now() - interval '7 days'
    order by coalesce(published_at, created_at) desc
    limit 60
  ) e;

  if v_items is null or jsonb_array_length(v_items) < 3 then
    return jsonb_build_object('ok',true,'skipped','fewer than 3 unused editorial items published in the last 7 days',
      'available', coalesce(jsonb_array_length(v_items),0));
  end if;

  if v_anthropic_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _editorial_digest_jobs
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
      select status_code from _editorial_digest_jobs
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
      select status_code from _editorial_digest_jobs
      where provider='gemini' and created_at > now() - interval '2 hours' and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'gemini';
    end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('editorial_digest', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('available_items', jsonb_array_length(v_items)))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded',
      'available', jsonb_array_length(v_items));
  end if;

  if v_provider = 'anthropic' then
    insert into _editorial_digest_jobs (request_id, digest_date, item_ids, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object('x-api-key', v_anthropic_key, 'anthropic-version','2023-06-01','content-type','application/json'),
        body := jsonb_build_object('model','claude-haiku-4-5-20251001','max_tokens',6000,
          'messages', jsonb_build_array(jsonb_build_object('role','user','content',
            v_pre || E'\n\nITEMS:\n' || v_items::text))),
        timeout_milliseconds := 90000
      ), current_date, v_item_ids, 'anthropic'
    );
  elsif v_provider = 'openai' then
    insert into _editorial_digest_jobs (request_id, digest_date, item_ids, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
        body := jsonb_build_object('model','gpt-4o-mini','max_tokens',6000,'temperature',0,
          'messages', jsonb_build_array(
            jsonb_build_object('role','system','content',v_pre),
            jsonb_build_object('role','user','content', E'ITEMS:\n' || v_items::text)
          )),
        timeout_milliseconds := 90000
      ), current_date, v_item_ids, 'openai'
    );
  else
    insert into _editorial_digest_jobs (request_id, digest_date, item_ids, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type','application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text', E'ITEMS:\n' || v_items::text)))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',6000)
        ),
        timeout_milliseconds := 90000
      ), current_date, v_item_ids, 'gemini'
    );
  end if;

  return jsonb_build_object('ok',true,'phase','fire','provider',v_provider,'degraded',(v_provider <> 'anthropic'),'items_sent',jsonb_array_length(v_items));
end $function$;
