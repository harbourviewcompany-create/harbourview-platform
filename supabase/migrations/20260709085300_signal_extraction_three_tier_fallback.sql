
-- Extends the 2-tier (anthropic -> openai) circuit breaker to 3 tiers:
-- anthropic -> openai -> gemini. Replaces the old "last 20 jobs regardless
-- of provider, match Anthropic-specific error text" health check with a
-- per-provider, time-windowed, status-code-based check (works for any
-- provider's failure mode, not just Anthropic's specific error string).
--
-- Provider selection: walk anthropic -> openai -> gemini in order, pick the
-- first one that is configured (key present) and not degraded. "Degraded"
-- = that provider's own last 10 attempts in the last 2 hours have >=50%
-- non-200 responses. A provider with zero recent attempts (never tried, or
-- its last attempt aged out of the 2h window because we've been running on
-- a lower-priority fallback) counts as available -- this is what lets a
-- higher-priority provider get automatically re-probed once its bad streak
-- is old enough, without permanently pinning to whichever provider we
-- first failed over to.
create or replace function public.run_signal_extraction(p_fire_limit integer default 25)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
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

  -- Tier 1: anthropic
  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _sig_extract_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'anthropic';
    end if;
  end if;

  -- Tier 2: openai
  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _sig_extract_jobs where provider='openai' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'openai';
    end if;
  end if;

  -- Tier 3: gemini
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
      url:='https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
      headers:=jsonb_build_object('x-goog-api-key',v_gemini_key,'content-type','application/json'),
      body:=jsonb_build_object(
        'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
        'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text',
          E'SOURCE: '||coalesce(sr.source_name,s.captured_title,'Source crawl')
          || E'\nTITLE: '||coalesce(s.captured_title,'') || E'\nTEXT:\n'||left(coalesce(s.captured_text,''),8000))))),
        'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',1500)
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
end $function$;
