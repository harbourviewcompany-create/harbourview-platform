-- Extends the Anthropic -> OpenAI -> Gemini circuit-breaker fallback (see
-- 20260713213101_digest_llm_fallback_and_manual_review_queue.sql for the
-- digest port, and 20260709085504_signal_extraction_fix_gemini_thinking_and_parts.sql
-- for the original pattern) to the four remaining Anthropic-only, no-fallback
-- functions identified during that investigation:
--   - run_country_intel_enrichment
--   - run_counterparty_enrichment
--   - run_education_section_gen
--   - run_education_deep_regen
-- Each is functionally unchanged except: (1) key decryption for all three
-- providers, (2) response parsing generalized to accept any of the three
-- providers' JSON shapes, (3) the same per-provider circuit-breaker selection
-- already used elsewhere, (4) a provider-branched net.http_post at fire time,
-- and (5) a write to pipeline_manual_review_queue when every provider is
-- circuit-broken. Anthropic stays tier 1 with its original model; OpenAI
-- (gpt-4o-mini) and Gemini (gemini-flash-latest) fallback tiers match the
-- models already in use for run_signal_extraction and the digest functions.

alter table public._counterparty_enrich_jobs add column if not exists provider text;
alter table public._country_enrich_jobs add column if not exists provider text;
alter table public._education_regen_jobs add column if not exists provider text;
alter table public._education_gen_jobs add column if not exists provider text;

-- ── run_counterparty_enrichment ───────────────────────────────────────────────
create or replace function public.run_counterparty_enrichment()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
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
  -- COLLECT phase
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

  -- FIRE phase
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

  -- Tier 1: anthropic
  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _counterparty_enrich_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'anthropic'; end if;
  end if;
  -- Tier 2: openai
  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _counterparty_enrich_jobs where provider='openai' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'openai'; end if;
  end if;
  -- Tier 3: gemini
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
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type','application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text', E'COUNTERPARTIES:\n' || v_payload::text)))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',3000)
        ),
        timeout_milliseconds := 90000
      ), v_ids, 'gemini'
    );
  end if;

  return jsonb_build_object('ok', true, 'phase', 'fire', 'provider', v_provider, 'degraded', (v_provider <> 'anthropic'), 'counterparties_sent', jsonb_array_length(v_payload));
end;
$function$;

-- ── run_country_intel_enrichment ──────────────────────────────────────────────
create or replace function public.run_country_intel_enrichment()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
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
  -- COLLECT phase
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

  -- FIRE phase
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

  -- Tier 1: anthropic
  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _country_enrich_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'anthropic'; end if;
  end if;
  -- Tier 2: openai
  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _country_enrich_jobs where provider='openai' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'openai'; end if;
  end if;
  -- Tier 3: gemini
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
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type','application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text', E'COUNTRIES:\n' || v_payload::text)))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',4000)
        ),
        timeout_milliseconds := 90000
      ), v_countries, 'gemini'
    );
  end if;

  return jsonb_build_object('ok', true, 'phase', 'fire', 'provider', v_provider, 'degraded', (v_provider <> 'anthropic'), 'countries_sent', jsonb_array_length(v_payload));
end;
$function$;

-- ── run_education_section_gen ────────────────────────────────────────────────
create or replace function public.run_education_section_gen()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
declare
  v_anthropic_key text;
  v_openai_key text;
  v_gemini_key text;
  v_mod record;
  v_inserted int := 0;
  v_provider text := null;
  v_attempts int; v_failures int;
  v_pre text := 'You are writing a professional education module for Harbourview, a B2B cannabis market intelligence platform used by industry operators, importers, investors, and clinicians. Write in a measured, expert, non-hyped voice -- like a seasoned practitioner explaining hard-won knowledge to a competent peer. The module must follow EXACTLY this five-section structure, each section 1800-4000 characters of substantive prose (no bullet lists as the primary content, no headers within a section body): 1) "Why This Matters", 2) "The Core Framework", 3) "How This Plays Out in Practice", 4) "Common Pitfalls", 5) "Key Takeaways". Ground everything in established, generally-accepted professional practice for the topic. Do NOT invent specific statistics, market-size figures, named companies, dates, or citations -- speak at the level of durable professional principle rather than fabricated specifics. Return ONLY a JSON array of exactly 5 objects (no markdown, no prose outside JSON): [{"section_order": 1, "heading": "Why This Matters", "body": "..."}, ...].';
begin
  -- COLLECT phase
  perform 1 from _education_gen_jobs j where not j.collected;
  if found then
    for v_mod in
      select j.request_id, j.module_id, r.status_code,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as claude_text
      from _education_gen_jobs j join net._http_response r on r.id = j.request_id
      where not j.collected
    loop
      if v_mod.status_code = 200 then
        with p as (select safe_to_jsonb(trim(both from regexp_replace(v_mod.claude_text,'```(?:json)?','','g'))) as arr),
        ins as (
          insert into education_module_sections (module_id, section_order, heading, body, block_type)
          select v_mod.module_id::uuid,
                 (s->>'section_order')::int,
                 s->>'heading',
                 s->>'body',
                 'text'
          from p, jsonb_array_elements(p.arr) s
          where jsonb_typeof(p.arr)='array'
            and not exists (select 1 from education_module_sections es where es.module_id = v_mod.module_id::uuid)
          returning 1
        )
        select count(*) from ins into v_inserted;
      end if;
      update _education_gen_jobs set collected = true where request_id = v_mod.request_id;
    end loop;
    return jsonb_build_object('ok', true, 'phase','collect','sections_inserted', v_inserted);
  end if;

  -- FIRE phase: one module per call
  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_anthropic_key is null and v_openai_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no anthropic_api_key, openai_api_key or gemini_api_key in vault');
  end if;

  select m.id, m.slug, m.title, m.description, t.title as track
  into v_mod
  from education_modules m
  left join education_tracks t on t.id::text = m.track_id
  where m.publication_state='published'
    and not exists (select 1 from education_module_sections s where s.module_id = m.id)
    and not exists (select 1 from _education_gen_jobs j where j.module_id = m.id::text and not j.collected)
  order by m.slug limit 1;

  if v_mod.id is null then return jsonb_build_object('ok',true,'skipped','no empty published modules remaining'); end if;

  -- Tier 1: anthropic
  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _education_gen_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'anthropic'; end if;
  end if;
  -- Tier 2: openai
  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _education_gen_jobs where provider='openai' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'openai'; end if;
  end if;
  -- Tier 3: gemini
  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _education_gen_jobs where provider='gemini' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'gemini'; end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('education_section_gen', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('module', v_mod.slug))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded', 'module', v_mod.slug);
  end if;

  if v_provider = 'anthropic' then
    insert into _education_gen_jobs (request_id, module_id, module_slug, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object('x-api-key', v_anthropic_key, 'anthropic-version','2023-06-01','content-type','application/json'),
        body := jsonb_build_object('model','claude-sonnet-4-6','max_tokens',8000,
          'messages', jsonb_build_array(jsonb_build_object('role','user','content',
            v_pre || E'\n\nMODULE TITLE: ' || v_mod.title
                  || E'\nTRACK: ' || coalesce(v_mod.track,'')
                  || E'\nMODULE DESCRIPTION: ' || coalesce(v_mod.description,'')))),
        timeout_milliseconds := 120000
      ), v_mod.id::text, v_mod.slug, 'anthropic'
    );
  elsif v_provider = 'openai' then
    insert into _education_gen_jobs (request_id, module_id, module_slug, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
        body := jsonb_build_object('model','gpt-4o-mini','max_tokens',8000,'temperature',0,
          'messages', jsonb_build_array(
            jsonb_build_object('role','system','content',v_pre),
            jsonb_build_object('role','user','content',
              E'MODULE TITLE: ' || v_mod.title
              || E'\nTRACK: ' || coalesce(v_mod.track,'')
              || E'\nMODULE DESCRIPTION: ' || coalesce(v_mod.description,''))
          )),
        timeout_milliseconds := 120000
      ), v_mod.id::text, v_mod.slug, 'openai'
    );
  else
    insert into _education_gen_jobs (request_id, module_id, module_slug, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type','application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text',
            E'MODULE TITLE: ' || v_mod.title
            || E'\nTRACK: ' || coalesce(v_mod.track,'')
            || E'\nMODULE DESCRIPTION: ' || coalesce(v_mod.description,''))))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',8000)
        ),
        timeout_milliseconds := 120000
      ), v_mod.id::text, v_mod.slug, 'gemini'
    );
  end if;

  return jsonb_build_object('ok',true,'phase','fire','provider',v_provider,'degraded',(v_provider <> 'anthropic'),'module',v_mod.slug);
end;
$function$;

-- ── run_education_deep_regen ─────────────────────────────────────────────────
create or replace function public.run_education_deep_regen()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
declare
  v_anthropic_key text;
  v_openai_key text;
  v_gemini_key text;
  v_mod record;
  v_done int := 0;
  v_provider text := null;
  v_attempts int; v_failures int;
  v_pre text := 'You are writing an in-depth professional education module for Harbourview, a B2B cannabis market intelligence platform used by industry operators, importers, investors, and clinicians. Write in a measured, expert, non-hyped voice -- a seasoned practitioner explaining hard-won knowledge to a competent peer who wants genuine depth, not an overview.

Follow EXACTLY this five-section structure, each section 3500-6000 characters of substantive prose: 1) "Why This Matters", 2) "The Core Framework", 3) "How This Plays Out in Practice", 4) "Common Pitfalls", 5) "Key Takeaways".

DEPTH REQUIREMENTS: Use concrete, illustrative specifics to teach -- worked numeric examples, realistic scenarios, specific decision criteria a practitioner actually applies, and step-by-step reasoning. For example, walk through an actual calculation, describe a representative timeline with rough durations, or trace a specific decision path. This makes the content genuinely useful rather than abstract.

HONESTY RULE (critical): When you use a specific number, timeline, cost, or scenario as a teaching example, frame it explicitly as illustrative -- e.g. "consider a distributor moving roughly 500kg per quarter", "a typical EU-GMP readiness timeline might run 12-18 months", "suppose a jurisdiction reports 40,000 registered patients". Do NOT present illustrative figures as verified current market data, and do NOT invent named real companies, fake citations, specific dated events, or statistics attributed to real sources. Illustrative examples = yes and encouraged; fabricated verified facts = never.

Return ONLY a JSON array of exactly 5 objects (no markdown, no prose outside JSON): [{"section_order": 1, "heading": "Why This Matters", "body": "..."}, ...].';
begin
  -- COLLECT phase: process ALL ready responses
  perform 1 from _education_regen_jobs j where not j.collected;
  if found then
    for v_mod in
      select j.request_id, j.module_id, r.status_code,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as claude_text
      from _education_regen_jobs j join net._http_response r on r.id = j.request_id
      where not j.collected
    loop
      if v_mod.status_code = 200 then
        declare v_arr jsonb;
        begin
          v_arr := safe_to_jsonb(trim(both from regexp_replace(v_mod.claude_text,'```(?:json)?','','g')));
          if jsonb_typeof(v_arr)='array' and jsonb_array_length(v_arr) = 5 then
            delete from education_module_sections where module_id = v_mod.module_id::uuid;
            insert into education_module_sections (module_id, section_order, heading, body, block_type)
            select v_mod.module_id::uuid, (s->>'section_order')::int, s->>'heading', s->>'body', 'text'
            from jsonb_array_elements(v_arr) s;
            update education_modules set content_review_status='ai_generated_pending_review', updated_at=now()
            where id = v_mod.module_id::uuid;
            v_done := v_done + 1;
          end if;
        end;
      end if;
      update _education_regen_jobs set collected = true where request_id = v_mod.request_id;
    end loop;
    return jsonb_build_object('ok', true, 'phase','collect','modules_regenerated', v_done);
  end if;

  -- FIRE phase: next un-regenerated published module
  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_anthropic_key is null and v_openai_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no anthropic_api_key, openai_api_key or gemini_api_key in vault');
  end if;

  select m.id, m.slug, m.title, m.description, t.title as track
  into v_mod
  from education_modules m
  left join education_tracks t on t.id::text = m.track_id
  where m.publication_state='published'
    and m.content_review_status is distinct from 'ai_generated_pending_review'
    and not exists (select 1 from _education_regen_jobs j where j.module_id = m.id::text)
  order by m.slug limit 1;

  if v_mod.id is null then return jsonb_build_object('ok',true,'skipped','all published modules regenerated'); end if;

  -- Tier 1: anthropic
  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _education_regen_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'anthropic'; end if;
  end if;
  -- Tier 2: openai
  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _education_regen_jobs where provider='openai' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'openai'; end if;
  end if;
  -- Tier 3: gemini
  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _education_regen_jobs where provider='gemini' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'gemini'; end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('education_deep_regen', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('module', v_mod.slug))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded', 'module', v_mod.slug);
  end if;

  if v_provider = 'anthropic' then
    insert into _education_regen_jobs (request_id, module_id, module_slug, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object('x-api-key', v_anthropic_key, 'anthropic-version','2023-06-01','content-type','application/json'),
        body := jsonb_build_object('model','claude-sonnet-4-6','max_tokens',12000,
          'messages', jsonb_build_array(jsonb_build_object('role','user','content',
            v_pre || E'\n\nMODULE TITLE: ' || v_mod.title
                  || E'\nTRACK: ' || coalesce(v_mod.track,'')
                  || E'\nMODULE DESCRIPTION: ' || coalesce(v_mod.description,'')))),
        timeout_milliseconds := 150000
      ), v_mod.id::text, v_mod.slug, 'anthropic'
    );
  elsif v_provider = 'openai' then
    insert into _education_regen_jobs (request_id, module_id, module_slug, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
        body := jsonb_build_object('model','gpt-4o-mini','max_tokens',12000,'temperature',0,
          'messages', jsonb_build_array(
            jsonb_build_object('role','system','content',v_pre),
            jsonb_build_object('role','user','content',
              E'MODULE TITLE: ' || v_mod.title
              || E'\nTRACK: ' || coalesce(v_mod.track,'')
              || E'\nMODULE DESCRIPTION: ' || coalesce(v_mod.description,''))
          )),
        timeout_milliseconds := 150000
      ), v_mod.id::text, v_mod.slug, 'openai'
    );
  else
    insert into _education_regen_jobs (request_id, module_id, module_slug, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type','application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text',
            E'MODULE TITLE: ' || v_mod.title
            || E'\nTRACK: ' || coalesce(v_mod.track,'')
            || E'\nMODULE DESCRIPTION: ' || coalesce(v_mod.description,''))))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',12000)
        ),
        timeout_milliseconds := 150000
      ), v_mod.id::text, v_mod.slug, 'gemini'
    );
  end if;

  return jsonb_build_object('ok',true,'phase','fire','provider',v_provider,'degraded',(v_provider <> 'anthropic'),'module',v_mod.slug);
end;
$function$;
