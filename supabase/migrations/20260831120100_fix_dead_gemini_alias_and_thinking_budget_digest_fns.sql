-- Fix dead Gemini model alias (gemini-flash-latest -> gemini-3.6-flash)
-- and add thinkingConfig to avoid MAX_TOKENS burnout on the digest and
-- enrichment functions' Gemini fallback tier. 2026-08-22/23.
--
-- Root cause: gemini-flash-latest was a dead alias that HUNG instead
-- of failing cleanly (discovered via live testing, not a doc). Once
-- fixed to gemini-3.6-flash, a second bug surfaced: that model
-- defaults to spending its output-token budget on hidden "thinking"
-- before writing the actual answer -- one test burned 2685 of 2800
-- tokens thinking, leaving 111 for the real JSON, truncating output.
-- Fixed with thinkingConfig.thinkingLevel: "low" plus a generous
-- maxOutputTokens margin.

CREATE OR REPLACE FUNCTION public.run_daily_digest()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare
  v_openai_key text;
  v_anthropic_key text;
  v_gemini_key text;
  v_signals jsonb;
  v_signal_ids text[];
  v_provider text := null;
  v_attempts int;
  v_failures int;
  v_manual jsonb;
  v_pre text := $prompt$
You are the senior editor of Harbourview Daily, a B2B cannabis market-intelligence briefing for licensed operators, importers, investors, and compliance officers.

Below is a JSON array of QUALITY-GATED intelligence signals. Each already passed a validated classifier (precision ~ 1.0). Prefer signals that are:
- commercially actionable (licensing, import/export, taxation, market access, M&A, capacity)
- geographically diverse (do not fill the brief with only US/CA/DE/UK)
- corroborated (higher corroboration_count = multiple independent sources)
- high impact / high confidence

Select up to 10 of the most important items (fewer if fewer qualify). For each:
- Rewrite a sharp headline (max 110 chars, your own words -- do not copy boilerplate)
- Write ONE "why_it_matters" sentence a commercial operator would act on
- Keep the market as the country name from the input (or "Global")
- Echo signal_id exactly from the input

Return ONLY a JSON array (no markdown fences, no prose). Each element:
{"headline": string, "why_it_matters": string, "market": string, "signal_id": string}
Order by commercial importance descending.
$prompt$;
begin
  if exists (
    select 1 from daily_digest
    where digest_date = current_date
      and headlines is not null and jsonb_array_length(headlines) > 0
  ) then
    return jsonb_build_object('ok',true,'skipped','digest exists for today');
  end if;

  update _digest_jobs j set collected = true, status_code = coalesce(j.status_code, -1)
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
             ) as llm_text
      from _digest_jobs j join net._http_response r on r.id = j.request_id
      where j.digest_date = current_date and not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, signal_ids, provider, status_code,
             safe_to_jsonb(trim(both from regexp_replace(llm_text,'```(?:json)?','','g'))) as p
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
    published_signal_ids as (
      select distinct h ->> 'signal_id' as signal_id
      from ok o
      cross join lateral jsonb_array_elements(o.p) h
      where jsonb_typeof(h) = 'object'
        and nullif(h ->> 'signal_id', '') is not null
        and (h ->> 'signal_id') = any(o.signal_ids)
    ),
    mark_used as (
      update public.signals s set used_in_digest_at = now()
      from published_signal_ids p
      where s.id = p.signal_id
        and exists (select 1 from ins)
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
      'signals_marked', (select count(*) from mark_used),
      'source', 'pipeline_b')
    into v_signals;

    return coalesce(v_signals, jsonb_build_object('ok',true,'phase','collect','published',false,'reason','response not ready or unparseable'));
  end if;

  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_openai_key is null and v_anthropic_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no openai_api_key, anthropic_api_key or gemini_api_key in vault');
  end if;

  with base as (
    select
      s.id,
      coalesce(nullif(trim(s.title_en), ''), nullif(trim(s.headline), ''), 'Untitled') as title,
      coalesce(nullif(trim(s.summary_en), ''), nullif(trim(s.summary), ''), '') as summary,
      coalesce(nullif(trim(s.country), ''), 'Global') as market,
      coalesce(s.content_type, 'regulatory') as content_type,
      coalesce(s.impact, 'medium') as impact,
      coalesce(s.quality_confidence, 0)::numeric as qc,
      coalesce(s.is_representative, true) as is_rep,
      s.cluster_rep_id,
      s.lang_detected,
      coalesce(s.date, s.created_at::date) as signal_date,
      s.created_at
    from public.signals s
    where s.reviewed is true
      and s.used_in_digest_at is null
      and coalesce(s.date, s.created_at::date) > current_date - 14
      and (
        s.quality_label is null
        or lower(s.quality_label) not in ('spam','boilerplate','nav','duplicate')
      )
      and (
        lower(coalesce(s.content_type, '')) in ('story','research','market')
        or (
          lower(coalesce(s.content_type, 'regulatory')) = 'regulatory'
          and lower(coalesce(s.impact, '')) = 'high'
          and coalesce(s.quality_confidence, 0) >= 0.70
        )
      )
      and coalesce(s.is_representative, true) is true
  ),
  scored as (
    select
      b.*,
      public._digest_cluster_size(b.cluster_rep_id) as corroboration_count,
      public._digest_rank_score(
        b.qc,
        b.impact,
        b.content_type,
        public._digest_cluster_size(b.cluster_rep_id),
        b.id
      ) as rank_score
    from base b
  ),
  diversified as (
    select *
    from (
      select
        sc.*,
        row_number() over (
          partition by lower(sc.market)
          order by sc.rank_score desc, sc.signal_date desc
        ) as country_rn
      from scored sc
    ) x
    where country_rn <= 3
  ),
  top_n as (
    select *
    from diversified
    order by rank_score desc, signal_date desc
    limit 24
  )
  select
    jsonb_agg(
      jsonb_build_object(
        'id', t.id,
        'title', left(t.title, 200),
        'market', t.market,
        'type', t.content_type,
        'confidence', least(100, greatest(0, round(t.qc * 100)::int)),
        'commercial_impact', t.impact,
        'summary', left(t.summary, 600),
        'corroboration_count', t.corroboration_count,
        'lang_detected', t.lang_detected,
        'detected_at', t.signal_date
      )
      order by t.rank_score desc
    ),
    array_agg(t.id order by t.rank_score desc)
  into v_signals, v_signal_ids
  from top_n t;

  if v_signals is null or jsonb_array_length(v_signals) < 3 then
    return jsonb_build_object(
      'ok', true,
      'skipped', 'fewer than 3 unused Pipeline B digest candidates in last 14 days',
      'available', coalesce(jsonb_array_length(v_signals), 0),
      'source', 'pipeline_b'
    );
  end if;

  if v_openai_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _digest_jobs
      where provider = 'openai' and created_at > now() - interval '2 hours'
        and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts, 0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'openai';
    end if;
  end if;

  if v_provider is null and v_anthropic_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _digest_jobs
      where provider = 'anthropic' and created_at > now() - interval '2 hours'
        and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts, 0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'anthropic';
    end if;
  end if;

  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _digest_jobs
      where provider = 'gemini' and created_at > now() - interval '2 hours'
        and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts, 0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'gemini';
    end if;
  end if;

  -- All providers degraded: deterministic "manual pass" fallback. Headline
  -- and why_it_matters are built with _digest_smart_truncate /
  -- _digest_manual_why (word-boundary truncation, and a templated
  -- why_it_matters when the signal's summary is empty or just duplicates
  -- the title) rather than raw left(text, N), which used to cut mid-word
  -- and could produce a why_it_matters identical to the headline.
  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values (
      'daily_digest',
      current_date,
      'all_configured_llm_providers_degraded',
      jsonb_build_object('available_signals', jsonb_array_length(v_signals), 'source', 'pipeline_b')
    )
    on conflict (pipeline, reference_date) do nothing;

    with cand as (
      select elem, ord
      from jsonb_array_elements(v_signals) with ordinality as t(elem, ord)
      where ord <= 10
    ),
    manual_headlines as (
      select jsonb_agg(
        jsonb_build_object(
          'headline', public._digest_smart_truncate(coalesce(nullif(elem->>'title',''), 'Untitled'), 110),
          'why_it_matters', public._digest_manual_why(
            elem->>'summary', elem->>'title', elem->>'commercial_impact', elem->>'type', elem->>'market'
          ),
          'market', coalesce(elem->>'market','Global'),
          'signal_id', elem->>'id'
        ) order by ord
      ) as headlines
      from cand
    ),
    ins as (
      insert into daily_digest (digest_date, headlines, markets, status, generated_at)
      select current_date, mh.headlines,
        (select coalesce(array_agg(distinct h->>'market'), '{}') from jsonb_array_elements(mh.headlines) h),
        'published_manual', now()
      from manual_headlines mh
      on conflict (digest_date) do update
        set headlines = excluded.headlines,
            markets = excluded.markets,
            status = 'published_manual',
            updated_at = now()
      returning id
    ),
    mark_used as (
      update public.signals s set used_in_digest_at = now()
      from cand c
      where s.id = (c.elem->>'id')
        and exists (select 1 from ins)
      returning s.id
    )
    select jsonb_build_object(
      'ok', true,
      'phase', 'manual_fallback',
      'reason', 'all_configured_llm_providers_degraded',
      'published', exists(select 1 from ins),
      'signals_marked', (select count(*) from mark_used),
      'source', 'pipeline_b'
    ) into v_manual;

    return v_manual;
  end if;

  if v_provider = 'openai' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization', 'Bearer ' || v_openai_key, 'content-type', 'application/json'),
        body := jsonb_build_object(
          'model', 'gpt-4o-mini',
          'max_tokens', 2800,
          'temperature', 0.2,
          'messages', jsonb_build_array(
            jsonb_build_object('role', 'system', 'content', v_pre),
            jsonb_build_object('role', 'user', 'content', E'SIGNALS:\n' || v_signals::text)
          )
        ),
        timeout_milliseconds := 60000
      ),
      current_date,
      v_signal_ids,
      'openai'
    );
  elsif v_provider = 'anthropic' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object(
          'x-api-key', v_anthropic_key,
          'anthropic-version', '2023-06-01',
          'content-type', 'application/json'
        ),
        body := jsonb_build_object(
          'model', 'claude-haiku-4-5-20251001',
          'max_tokens', 2800,
          'messages', jsonb_build_array(
            jsonb_build_object('role', 'user', 'content', v_pre || E'\n\nSIGNALS:\n' || v_signals::text)
          )
        ),
        timeout_milliseconds := 60000
      ),
      current_date,
      v_signal_ids,
      'anthropic'
    );
  else
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type', 'application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object(
            'parts', jsonb_build_array(jsonb_build_object('text', v_pre))
          ),
          'contents', jsonb_build_array(
            jsonb_build_object(
              'role', 'user',
              'parts', jsonb_build_array(
                jsonb_build_object('text', E'SIGNALS:\n' || v_signals::text)
              )
            )
          ),
          'generationConfig', jsonb_build_object('temperature', 0.2, 'maxOutputTokens', 8000, 'thinkingConfig', jsonb_build_object('thinkingLevel', 'low'))
        ),
        timeout_milliseconds := 60000
      ),
      current_date,
      v_signal_ids,
      'gemini'
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'phase', 'fire',
    'provider', v_provider,
    'degraded', (v_provider <> 'openai'),
    'signals_sent', jsonb_array_length(v_signals),
    'source', 'pipeline_b',
    'ranking', 'feedback_aware'
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.run_editorial_digest()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
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
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type','application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text', E'ITEMS:\n' || v_items::text)))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',16000,'thinkingConfig', jsonb_build_object('thinkingLevel','low'))
        ),
        timeout_milliseconds := 90000
      ), current_date, v_item_ids, 'gemini'
    );
  end if;

  return jsonb_build_object('ok',true,'phase','fire','provider',v_provider,'degraded',(v_provider <> 'anthropic'),'items_sent',jsonb_array_length(v_items));
end $function$
;

CREATE OR REPLACE FUNCTION public.run_country_intel_enrichment()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare
  v_anthropic_key text;
  v_openai_key text;
  v_gemini_key text;
  v_payload jsonb;
  v_countries text[];
  v_updated int := 0;
  v_provider text := null;
  v_attempts int; v_failures int;
  v_pre text := 'You are a cannabis regulatory intelligence editor for Harbourview, a B2B market intelligence platform. Below is a JSON array of countries, each with its current briefing and REAL source material: recently-captured intelligence signals and/or a researched market-entry playbook (legal framework, licensing steps, regulators, timeline, cost). Using ONLY the facts in the provided material (never invent facts, names, dates, or figures not present in the source material), write two things per country: (1) a richer "public_summary" (3-5 sentences, factual, no speculation, safe for a free public teaser page) and (2) a deeper "commercial_pathway_summary" (4-6 sentences, factual, covering licensing/market-entry/trade specifics found in the material) for a paid subscriber briefing. If the material does not support a claim, do not include it -- prefer being shorter and accurate over longer and speculative. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"country_code": string, "public_summary": string, "commercial_pathway_summary": string}.';
begin
  perform 1 from _country_enrich_jobs j where not j.collected;
  if found then
    update _country_enrich_jobs j set collected = true
    where not j.collected and j.created_at < now() - interval '2 hours'
      and not exists (select 1 from net._http_response r where r.id = j.request_id);

    with resp as (
      select j.request_id, j.country_codes,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as claude_text,
             r.status_code
      from _country_enrich_jobs j join net._http_response r on r.id = j.request_id
      where not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, country_codes, status_code,
             safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, country_codes, p from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    upd as (
      update country_intel ci set
        public_summary = coalesce(nullif(trim(h->>'public_summary'), ''), ci.public_summary),
        commercial_pathway_summary = coalesce(nullif(trim(h->>'commercial_pathway_summary'), ''), ci.commercial_pathway_summary),
        last_enriched_at = now(),
        updated_at = now()
      from ok, jsonb_array_elements(ok.p) h
      where ci.country_code = h->>'country_code'
      returning 1
    ),
    done as (
      update _country_enrich_jobs j set collected = true
      from parsed p where j.request_id = p.request_id
      returning 1
    )
    select count(*) from upd into v_updated;

    return jsonb_build_object('ok', true, 'phase', 'collect', 'countries_enriched', coalesce(v_updated, 0));
  end if;

  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_anthropic_key is null and v_openai_key is null and v_gemini_key is null then
    return jsonb_build_object('ok', false, 'reason', 'no anthropic_api_key, openai_api_key or gemini_api_key in vault');
  end if;

  with targets as (
    select ci.country_code, ci.country_name, ci.public_summary, ci.commercial_pathway_summary
    from country_intel ci
    where ci.last_enriched_at is null
      and (
        exists (select 1 from ia_signals s where s.market = ci.country_name and s.stage in ('qualified','converted_to_opportunity'))
        or exists (select 1 from signals sg where sg.country = ci.country_name)
        or exists (select 1 from jurisdiction_playbooks p where p.country_iso2 = ci.country_code and p.status = 'published')
      )
    limit 8
  ),
  material as (
    select t.country_code, t.country_name, t.public_summary, t.commercial_pathway_summary,
      (
        select jsonb_agg(jsonb_build_object('title', s.title, 'summary', s.summary, 'type', s.type, 'confidence', s.confidence))
        from (
          select title, summary, type, confidence from ia_signals
          where market = t.country_name and stage in ('qualified','converted_to_opportunity')
          order by confidence desc, created_at desc limit 6
        ) s
      ) as ia_material,
      (
        select jsonb_agg(jsonb_build_object('title', sg.headline, 'summary', sg.summary))
        from (
          select headline, summary from signals where country = t.country_name
          order by created_at desc limit 6
        ) sg
      ) as mature_material,
      (
        select jsonb_build_object(
                 'legal_framework', p.legal_framework_summary,
                 'difficulty', p.difficulty,
                 'typical_timeline_months', p.typical_timeline_months,
                 'estimated_cost_range', p.estimated_cost_range,
                 'steps', p.steps,
                 'key_regulators', p.key_regulators,
                 'common_pitfalls', p.common_pitfalls)
        from jurisdiction_playbooks p
        where p.country_iso2 = t.country_code and p.status = 'published'
        limit 1
      ) as playbook_material
    from targets t
  )
  select
    jsonb_agg(jsonb_build_object(
      'country_code', country_code, 'country_name', country_name,
      'current_public_summary', public_summary, 'current_commercial_pathway_summary', commercial_pathway_summary,
      'signals', coalesce(ia_material, '[]'::jsonb) || coalesce(mature_material, '[]'::jsonb),
      'playbook', playbook_material
    )),
    array_agg(country_code)
  into v_payload, v_countries
  from material;

  if v_payload is null or jsonb_array_length(v_payload) = 0 then
    return jsonb_build_object('ok', true, 'skipped', 'no unenriched countries with real source material');
  end if;

  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _country_enrich_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'anthropic'; end if;
  end if;
  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _country_enrich_jobs where provider='openai' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'openai'; end if;
  end if;
  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _country_enrich_jobs where provider='gemini' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'gemini'; end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('country_intel_enrichment', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('countries', jsonb_array_length(v_payload)))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded');
  end if;

  if v_provider = 'anthropic' then
    insert into _country_enrich_jobs (request_id, country_codes, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object('x-api-key', v_anthropic_key, 'anthropic-version','2023-06-01','content-type','application/json'),
        body := jsonb_build_object('model','claude-sonnet-4-6','max_tokens',4000,
          'messages', jsonb_build_array(jsonb_build_object('role','user','content',
            v_pre || E'\n\nCOUNTRIES:\n' || v_payload::text))),
        timeout_milliseconds := 90000
      ), v_countries, 'anthropic'
    );
  elsif v_provider = 'openai' then
    insert into _country_enrich_jobs (request_id, country_codes, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
        body := jsonb_build_object('model','gpt-4o-mini','max_tokens',4000,'temperature',0,
          'messages', jsonb_build_array(
            jsonb_build_object('role','system','content',v_pre),
            jsonb_build_object('role','user','content', E'COUNTRIES:\n' || v_payload::text)
          )),
        timeout_milliseconds := 90000
      ), v_countries, 'openai'
    );
  else
    insert into _country_enrich_jobs (request_id, country_codes, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type','application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text', E'COUNTRIES:\n' || v_payload::text)))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',10000,'thinkingConfig', jsonb_build_object('thinkingLevel','low'))
        ),
        timeout_milliseconds := 90000
      ), v_countries, 'gemini'
    );
  end if;

  return jsonb_build_object('ok', true, 'phase', 'fire', 'provider', v_provider, 'degraded', (v_provider <> 'anthropic'), 'countries_sent', jsonb_array_length(v_payload));
end;
$function$
;

CREATE OR REPLACE FUNCTION public.run_counterparty_enrichment()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare
  v_anthropic_key text;
  v_openai_key text;
  v_gemini_key text;
  v_payload jsonb;
  v_ids text[];
  v_updated int := 0;
  v_provider text := null;
  v_attempts int; v_failures int;
  v_pre text := 'You are a B2B cannabis market intelligence analyst for Harbourview. Below is a JSON array of trading counterparties (sellers, buyers, suppliers, distributors, importers, logistics providers). Each includes its role, markets, product categories, and REAL scored attributes derived from Harbourview''s relationship intelligence (certifications, market-access relevance, interaction history, score drivers). Using ONLY these provided facts (never invent company details, certifications, volumes, or relationships not present in the source material), write for each: (1) a "supply_profile" for sellers/suppliers/distributors/logistics (what they supply / their capabilities, 2-3 sentences) OR a "needs_profile" for buyers/importers (what they source / their requirements, 2-3 sentences). For a counterparty whose role is a seller-type, populate supply_profile and set needs_profile to null; for buyer-types, populate needs_profile and set supply_profile to null. Base every statement on the provided attributes -- if material is thin, write a shorter factual profile rather than embellishing. Return ONLY a JSON array (no markdown, no prose). Each element: {"id": string, "supply_profile": string|null, "needs_profile": string|null}.';
begin
  perform 1 from _counterparty_enrich_jobs j where not j.collected;
  if found then
    update _counterparty_enrich_jobs j set collected = true
    where not j.collected and j.created_at < now() - interval '2 hours'
      and not exists (select 1 from net._http_response r where r.id = j.request_id);

    with resp as (
      select j.request_id,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as claude_text,
             r.status_code
      from _counterparty_enrich_jobs j join net._http_response r on r.id = j.request_id
      where not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, status_code,
             safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, p from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    upd as (
      update ia_counterparties c set
        supply_profile = coalesce(nullif(trim(h->>'supply_profile'), ''), c.supply_profile),
        needs_profile  = coalesce(nullif(trim(h->>'needs_profile'), ''), c.needs_profile),
        last_profile_enriched_at = now(),
        updated_at = now()
      from ok, jsonb_array_elements(ok.p) h
      where c.id = h->>'id'
      returning 1
    ),
    done as (
      update _counterparty_enrich_jobs j set collected = true
      from parsed p where j.request_id = p.request_id
      returning 1
    )
    select count(*) from upd into v_updated;

    return jsonb_build_object('ok', true, 'phase', 'collect', 'counterparties_enriched', coalesce(v_updated, 0));
  end if;

  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_anthropic_key is null and v_openai_key is null and v_gemini_key is null then
    return jsonb_build_object('ok', false, 'reason', 'no anthropic_api_key, openai_api_key or gemini_api_key in vault');
  end if;

  with targets as (
    select c.id, c.name, c.role, c.markets, c.categories
    from ia_counterparties c
    where c.last_profile_enriched_at is null
      and c.needs_profile is null and c.supply_profile is null
      and c.role in ('seller','buyer','supplier','distributor','importer','logistics_provider','packaging_supplier','consultant')
    limit 10
  ),
  material as (
    select t.id, t.name, t.role, t.markets, t.categories,
      (
        select jsonb_agg(distinct d)
        from ia_scoring_records sr, unnest(coalesce(sr.score_drivers, array[]::text[])) d
        where sr.counterparty_id = t.id
      ) as drivers,
      (
        select jsonb_agg(distinct m)
        from ia_scoring_records sr, unnest(coalesce(sr.market_access_relevance, array[]::text[])) m
        where sr.counterparty_id = t.id
      ) as market_access
    from targets t
  )
  select
    jsonb_agg(jsonb_build_object(
      'id', id, 'name', name, 'role', role,
      'markets', to_jsonb(markets), 'categories', to_jsonb(categories),
      'score_drivers', coalesce(drivers, '[]'::jsonb),
      'market_access_relevance', coalesce(market_access, '[]'::jsonb)
    )),
    array_agg(id)
  into v_payload, v_ids
  from material;

  if v_payload is null or jsonb_array_length(v_payload) = 0 then
    return jsonb_build_object('ok', true, 'skipped', 'no unprofiled trading counterparties remaining');
  end if;

  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _counterparty_enrich_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'anthropic'; end if;
  end if;
  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _counterparty_enrich_jobs where provider='openai' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'openai'; end if;
  end if;
  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _counterparty_enrich_jobs where provider='gemini' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'gemini'; end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('counterparty_enrichment', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('candidates', jsonb_array_length(v_payload)))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded');
  end if;

  if v_provider = 'anthropic' then
    insert into _counterparty_enrich_jobs (request_id, counterparty_ids, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object('x-api-key', v_anthropic_key, 'anthropic-version','2023-06-01','content-type','application/json'),
        body := jsonb_build_object('model','claude-sonnet-4-6','max_tokens',3000,
          'messages', jsonb_build_array(jsonb_build_object('role','user','content',
            v_pre || E'\n\nCOUNTERPARTIES:\n' || v_payload::text))),
        timeout_milliseconds := 90000
      ), v_ids, 'anthropic'
    );
  elsif v_provider = 'openai' then
    insert into _counterparty_enrich_jobs (request_id, counterparty_ids, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
        body := jsonb_build_object('model','gpt-4o-mini','max_tokens',3000,'temperature',0,
          'messages', jsonb_build_array(
            jsonb_build_object('role','system','content',v_pre),
            jsonb_build_object('role','user','content', E'COUNTERPARTIES:\n' || v_payload::text)
          )),
        timeout_milliseconds := 90000
      ), v_ids, 'openai'
    );
  else
    insert into _counterparty_enrich_jobs (request_id, counterparty_ids, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type','application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text', E'COUNTERPARTIES:\n' || v_payload::text)))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',8000,'thinkingConfig', jsonb_build_object('thinkingLevel','low'))
        ),
        timeout_milliseconds := 90000
      ), v_ids, 'gemini'
    );
  end if;

  return jsonb_build_object('ok', true, 'phase', 'fire', 'provider', v_provider, 'degraded', (v_provider <> 'anthropic'), 'counterparties_sent', jsonb_array_length(v_payload));
end;
$function$
;
