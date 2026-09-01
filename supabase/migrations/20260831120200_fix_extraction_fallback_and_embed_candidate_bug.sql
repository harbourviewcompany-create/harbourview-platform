-- Add Gemini fallback tier (with the same model/thinking-budget fix)
-- to run_signal_extraction and run_signal_counterparty_extraction,
-- plus fix a stale-column bug in hv_pipeline_tick's embed-candidate
-- selection. 2026-08-23/30.
--
-- run_signal_counterparty_extraction previously parsed ONLY
-- Anthropic's response shape ($.content[0].text) -- adding a Gemini
-- branch without also fixing the parser would have produced
-- unparseable responses that silently never got collected. Fixed
-- together with the multi-shape coalesce() pattern already used in
-- the digest functions.
--
-- hv_pipeline_tick bug (found 2026-08-30): its embed-candidate query
-- checked `embedding_1024 is null` (the old OpenAI column).
-- hv_embed_dispatch was repointed to embedding_gemini_1024 only (see
-- the embed-repoint migration) -- so embedding_1024 would never clear
-- again, and this query would have re-selected and re-embedded the
-- SAME ~100 signals every 30-minute tick forever, burning most of
-- the daily embed budget on pure waste and never reaching the
-- ~12,500-signal backlog. Fixed to check embedding_gemini_1024
-- instead.

CREATE OR REPLACE FUNCTION public.run_signal_extraction(p_fire_limit integer DEFAULT 25)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare
  v_anthropic_key text;
  v_openai_key text;
  v_gemini_key text;
  v_pre text := 'You are an intelligence analyst for a B2B cannabis market-intelligence platform. From the SOURCE (which may be only a news headline/snippet), extract concrete, commercially-relevant signals — specific developments in cannabis regulation, licensing, markets, trade, M&A, taxation, or industry that a B2B operator would act on. A clear headline about a real development IS a signal. Ignore pure opinion, navigation and boilerplate. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"title": string up to 120 chars, "type": one of "regulatory","market","commercial","legal","competitive", "market": full English country name or "Global", "confidence": integer 0-100, "commercial_impact": "high"|"medium"|"low", "summary": 2-4 factual sentences}. If there is no genuine signal, return [].';
  v_inserted int := 0; v_collected int := 0; v_fired int := 0;
  v_provider text := null;
  v_attempts int; v_failures int;
begin
  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_anthropic_key is null and v_openai_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no anthropic_api_key, openai_api_key or gemini_api_key in vault');
  end if;

  update source_snapshots s set processing_status='failed', processed_at=now()
  from _sig_extract_jobs j
  where s.id::text=j.snapshot_id and coalesce(j.collected,false)=false
    and j.created_at < now()-interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id=j.request_id)
    and s.processing_status='pending';
  update _sig_extract_jobs j set collected=true
  where coalesce(j.collected,false)=false and j.created_at < now()-interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id=j.request_id);

  with resp as (
    select j.request_id, j.snapshot_id, j.source_name, j.captured_url,
           coalesce(
             safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
             safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
             safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
           ) as claude_text
    from _sig_extract_jobs j join net._http_response r on r.id=j.request_id
    where coalesce(j.collected,false)=false and r.status_code=200
  ),
  arr as (select *, safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p from resp),
  arr2 as (select *, case when jsonb_typeof(p)='array' then p else '[]'::jsonb end as a from arr),
  cand as (
    select a.source_name, a.captured_url, a.snapshot_id, sig,
      left(coalesce(sig->>'title','Untitled signal'),300) as t,
      left(coalesce(sig->>'market','Global'),120) as mkt,
      least(100,greatest(0,coalesce((sig->>'confidence')::int,50))) as conf,
      row_number() over (partition by lower(coalesce(sig->>'title','')), lower(coalesce(sig->>'market','')) order by 1) as rn
    from arr2 a, jsonb_array_elements(a.a) as sig
    where jsonb_typeof(a.a)='array' and jsonb_array_length(a.a)>0
  ),
  ins as (
    insert into ia_signals (id,title,type,category,stage,market,confidence,commercial_impact,summary,source_id,source_name,notes)
    select 's-'||gen_random_uuid(), c.t,
      case when lower(coalesce(c.sig->>'type','')) in ('regulatory','market','commercial','legal','competitive') then lower(c.sig->>'type') else 'regulatory' end,
      case when lower(coalesce(c.sig->>'category',c.sig->>'type','')) in ('regulatory','market','commercial','legal','competitive') then lower(coalesce(c.sig->>'category',c.sig->>'type')) else 'regulatory' end,
      case when c.conf >= 80 then 'qualified' else 'new' end,
      c.mkt, c.conf,
      case when lower(coalesce(c.sig->>'commercial_impact','')) in ('high','medium','low') then lower(c.sig->>'commercial_impact') else 'medium' end,
      coalesce(c.sig->>'summary',''), null, c.source_name,
      'auto-extracted (claude-haiku-4-5) from snapshot '||c.snapshot_id||coalesce(' · '||c.captured_url,'')
    from cand c
    where c.rn = 1
      and not public.is_boilerplate_signal(c.sig->>'summary')
      and not exists (
        select 1 from ia_signals x
        where lower(x.title)=lower(c.t) and lower(x.market)=lower(c.mkt)
          and x.created_at > now() - interval '45 days'
      )
    returning 1
  )
  select count(*) into v_inserted from ins;

  update source_snapshots s set processing_status='extracted', processed_at=now()
  from _sig_extract_jobs j join net._http_response r on r.id=j.request_id
  where s.id::text=j.snapshot_id and coalesce(j.collected,false)=false and r.status_code=200 and s.processing_status<>'extracted';
  update source_snapshots s set processing_status='failed', processed_at=now()
  from _sig_extract_jobs j join net._http_response r on r.id=j.request_id
  where s.id::text=j.snapshot_id and coalesce(j.collected,false)=false and r.status_code<>200 and s.processing_status='pending';
  update _sig_extract_jobs j set collected=true
  from net._http_response r where r.id=j.request_id and coalesce(j.collected,false)=false;
  get diagnostics v_collected = row_count;

  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _sig_extract_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'anthropic';
    end if;
  end if;

  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _sig_extract_jobs where provider='openai' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'openai';
    end if;
  end if;

  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _sig_extract_jobs where provider='gemini' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'gemini';
    end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('signal_extraction', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('inserted', v_inserted, 'collected', v_collected))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded',
      'inserted', v_inserted, 'collected', v_collected, 'fired', 0, 'ran_at', now());
  end if;

  if v_provider = 'anthropic' then
    insert into _sig_extract_jobs (request_id, snapshot_id, source_name, captured_url, provider)
    select net.http_post(
      url:='https://api.anthropic.com/v1/messages',
      headers:=jsonb_build_object('x-api-key',v_anthropic_key,'anthropic-version','2023-06-01','content-type','application/json'),
      body:=jsonb_build_object('model','claude-haiku-4-5-20251001','max_tokens',1500,
        'messages',jsonb_build_array(jsonb_build_object('role','user','content',
          v_pre || E'\n\nSOURCE: '||coalesce(sr.source_name,s.captured_title,'Source crawl')
          || E'\nTITLE: '||coalesce(s.captured_title,'') || E'\nTEXT:\n'||left(coalesce(s.captured_text,''),8000)))),
      timeout_milliseconds:=60000
    ), s.id::text, coalesce(sr.source_name,s.captured_title,'Source crawl'), s.captured_url, 'anthropic'
    from source_snapshots s
    left join source_registry sr on sr.id=s.source_id
    where s.processing_status='pending' and s.fetch_status='success'
      and s.id::text not in (select snapshot_id from _sig_extract_jobs)
    order by s.created_at desc limit p_fire_limit;
    get diagnostics v_fired = row_count;
  elsif v_provider = 'openai' then
    insert into _sig_extract_jobs (request_id, snapshot_id, source_name, captured_url, provider)
    select net.http_post(
      url:='https://api.openai.com/v1/chat/completions',
      headers:=jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
      body:=jsonb_build_object('model','gpt-4o-mini','max_tokens',1500,'temperature',0,
        'messages',jsonb_build_array(
          jsonb_build_object('role','system','content',v_pre),
          jsonb_build_object('role','user','content',
            E'SOURCE: '||coalesce(sr.source_name,s.captured_title,'Source crawl')
            || E'\nTITLE: '||coalesce(s.captured_title,'') || E'\nTEXT:\n'||left(coalesce(s.captured_text,''),8000))
        )),
      timeout_milliseconds:=60000
    ), s.id::text, coalesce(sr.source_name,s.captured_title,'Source crawl'), s.captured_url, 'openai'
    from source_snapshots s
    left join source_registry sr on sr.id=s.source_id
    where s.processing_status='pending' and s.fetch_status='success'
      and s.id::text not in (select snapshot_id from _sig_extract_jobs)
    order by s.created_at desc limit p_fire_limit;
    get diagnostics v_fired = row_count;
  else
    insert into _sig_extract_jobs (request_id, snapshot_id, source_name, captured_url, provider)
    select net.http_post(
      url:='https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
      headers:=jsonb_build_object('x-goog-api-key',v_gemini_key,'content-type','application/json'),
      body:=jsonb_build_object(
        'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
        'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text',
          E'SOURCE: '||coalesce(sr.source_name,s.captured_title,'Source crawl')
          || E'\nTITLE: '||coalesce(s.captured_title,'') || E'\nTEXT:\n'||left(coalesce(s.captured_text,''),8000))))),
        'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',4000,'thinkingConfig', jsonb_build_object('thinkingLevel','low'))
      ),
      timeout_milliseconds:=60000
    ), s.id::text, coalesce(sr.source_name,s.captured_title,'Source crawl'), s.captured_url, 'gemini'
    from source_snapshots s
    left join source_registry sr on sr.id=s.source_id
    where s.processing_status='pending' and s.fetch_status='success'
      and s.id::text not in (select snapshot_id from _sig_extract_jobs)
    order by s.created_at desc limit p_fire_limit;
    get diagnostics v_fired = row_count;
  end if;

  return jsonb_build_object('ok',true,'degraded',(v_provider <> 'anthropic'),'provider',v_provider,'inserted',v_inserted,'collected',v_collected,'fired',v_fired,'ran_at',now());
end
$function$
;

CREATE OR REPLACE FUNCTION public.run_signal_counterparty_extraction()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare
  v_anthropic_key text;
  v_gemini_key text;
  v_signals jsonb;
  v_signal_ids text[];
  v_req bigint;
  v_inserted int := 0;
  v_provider text; v_attempts int; v_failures int;
  v_collect_provider text;
  v_pre text := 'You extract named commercial counterparties from cannabis industry intelligence signals for a B2B relationship-memory system. Below is a JSON array of qualified signals. For each signal that names a SPECIFIC company, brand, or named regulator/agency (not a generic unnamed reference), extract one counterparty record. Classify role as exactly one of: buyer, seller, importer, distributor, supplier, consultant, equipment_vendor, packaging_supplier, logistics_provider, market_access_partner (use market_access_partner for named regulators/agencies). Skip signals with no clearly named entity — most signals should be skipped. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"name": string, "role": string, "market": string, "category": string (short tag e.g. licensing, enforcement, market_entry, supply), "signal_id": string}. If none qualify, return [].';
begin
  perform 1 from _counterparty_jobs j where not j.collected;
  if found then
    update _counterparty_jobs j set collected = true
    where not j.collected and j.created_at < now() - interval '1 hour'
      and not exists (select 1 from net._http_response r where r.id = j.request_id);

    with resp as (
      select j.request_id, j.signal_ids, j.provider,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as llm_text,
             r.status_code
      from _counterparty_jobs j join net._http_response r on r.id = j.request_id
      where not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, signal_ids, provider, status_code,
             safe_to_jsonb(trim(both from regexp_replace(llm_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, signal_ids, p from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array'
    ),
    extracted as (
      select
        'rm-' || md5(lower(trim(h->>'name'))) as id,
        trim(h->>'name') as name,
        coalesce(h->>'role','buyer') as role,
        coalesce(h->>'market','Global') as market,
        coalesce(h->>'category','general') as category
      from ok, jsonb_array_elements(ok.p) h
      where coalesce(h->>'name','') <> ''
    ),
    ins as (
      insert into ia_counterparties (id, name, role, markets, categories, interaction_count, introduction_count, documentation_status, last_interaction, notes)
      select id, name, role, array[market], array[category], 1, 0, 'missing', current_date,
             'Auto-extracted from a qualified intelligence signal — review and enrich.'
      from extracted
      on conflict (id) do update set
        markets           = (select array_agg(distinct m) from unnest(ia_counterparties.markets || excluded.markets) m),
        categories        = (select array_agg(distinct c) from unnest(ia_counterparties.categories || excluded.categories) c),
        interaction_count = ia_counterparties.interaction_count + 1,
        last_interaction  = greatest(ia_counterparties.last_interaction, excluded.last_interaction),
        updated_at        = now()
      returning 1
    ),
    mark_used as (
      update ia_signals s set counterparty_extracted_at = now()
      from ok o where s.id = any(o.signal_ids)
      returning 1
    ),
    done as (
      update _counterparty_jobs j set collected = true
      from parsed p where j.request_id = p.request_id
      returning 1
    )
    select (select count(*) from ins), (select provider from parsed)
      into v_inserted, v_collect_provider;

    return jsonb_build_object('ok', true, 'phase', 'collect', 'provider', v_collect_provider, 'counterparties_touched', coalesce(v_inserted,0));
  end if;

  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name = 'anthropic_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name = 'gemini_api_key' limit 1;
  if v_anthropic_key is null and v_gemini_key is null then
    return jsonb_build_object('ok', false, 'reason', 'no anthropic_api_key or gemini_api_key in vault');
  end if;

  select jsonb_agg(jsonb_build_object('id', s.id, 'title', s.title, 'market', s.market, 'category', s.category, 'summary', s.summary)),
         array_agg(s.id)
  into v_signals, v_signal_ids
  from (
    select * from ia_signals
    where stage in ('qualified','converted_to_opportunity') and counterparty_extracted_at is null
    order by created_at desc
    limit 25
  ) s;

  if v_signals is null then
    return jsonb_build_object('ok', true, 'skipped', 'no unprocessed qualified signals');
  end if;

  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _counterparty_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'anthropic'; end if;
  end if;
  if v_provider is null and v_gemini_key is not null then v_provider := 'gemini'; end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('counterparty_extraction', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('available_signals', jsonb_array_length(v_signals)))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded');
  end if;

  if v_provider = 'anthropic' then
    v_req := net.http_post(
      url := 'https://api.anthropic.com/v1/messages',
      headers := jsonb_build_object('x-api-key', v_anthropic_key, 'anthropic-version','2023-06-01','content-type','application/json'),
      body := jsonb_build_object('model','claude-haiku-4-5-20251001','max_tokens',2000,
        'messages', jsonb_build_array(jsonb_build_object('role','user','content', v_pre || E'\n\nSIGNALS:\n' || v_signals::text))),
      timeout_milliseconds := 60000
    );
  else
    v_req := net.http_post(
      url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
      headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type','application/json'),
      body := jsonb_build_object(
        'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
        'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text', E'SIGNALS:\n' || v_signals::text)))),
        'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',5000,'thinkingConfig', jsonb_build_object('thinkingLevel','low'))
      ),
      timeout_milliseconds := 60000
    );
  end if;

  insert into _counterparty_jobs (request_id, signal_ids, provider) values (v_req, v_signal_ids, v_provider);
  return jsonb_build_object('ok', true, 'phase', 'fire', 'provider', v_provider, 'request_id', v_req, 'signals_sent', jsonb_array_length(v_signals));
end;
$function$
;

CREATE OR REPLACE FUNCTION public.hv_pipeline_tick()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_tr_h int; v_cl_h int; v_em_h int; v_ent_h int; v_cl_d int; v_tr_d int; v_em_d int := 0; v_ent_d int; v_ids text[];
begin
  v_tr_h := public.hv_translate_harvest();
  v_cl_h := public.hv_classify_corpus_harvest();
  v_em_h := public.hv_embed_harvest();
  v_ent_h := public.hv_entities_harvest();

  v_tr_d := public.hv_translate_dispatch(40, false);
  v_cl_d := public.hv_classify_corpus_dispatch(120, 400);
  v_ent_d := public.hv_entities_dispatch(40);

  -- 2026-08-31: was checking embedding_1024 is null (OpenAI column).
  -- hv_embed_dispatch now writes only to embedding_gemini_1024.
  -- 2026-09-01: was also ordering by created_at desc, so the backlog of
  -- older unembedded signals was perpetually starved behind new arrivals.
  -- Switched to oldest-first so the backlog actually drains.
  select array_agg(id) into v_ids from (
    select s.id from public.signals s
    where s.quality_label='signal' and s.embedding_gemini_1024 is null
      and not exists (select 1 from public.hv_embed_jobs j where s.id = any(j.signal_ids) and not j.harvested)
    order by s.created_at asc limit 100
  ) q;
  if v_ids is not null then perform public.hv_embed_dispatch(v_ids); v_em_d := array_length(v_ids,1); end if;

  return jsonb_build_object(
    'translate_harvested', v_tr_h,
    'classify_harvested',  v_cl_h,
    'embed_harvested',     v_em_h,
    'entities_harvested',  v_ent_h,
    'translate_dispatched', v_tr_d,
    'classify_dispatched', v_cl_d,
    'entities_dispatched', v_ent_d,
    'embed_dispatched',    v_em_d
  );
end
$function$
;
