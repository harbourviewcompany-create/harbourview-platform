-- Reconstructed from production. Verbatim statements for version 20260831021727.
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
$function$;
