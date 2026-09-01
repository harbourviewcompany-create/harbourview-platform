-- Add provider tracking columns, wire Gemini fallback into
-- entities/translate dispatch, and fix a real bug found in the
-- process: hv_entities_dispatch and hv_translate_dispatch both
-- reused the PL/pgSQL variable name `r` as both the FOR-loop record
-- and a table alias inside an earlier failure-tracking query in the
-- same function -- PL/pgSQL resolved the alias as the not-yet-
-- assigned loop variable, throwing "record r is not assigned yet".
-- This masked itself during initial testing (the daily dispatch
-- budget was already exhausted, so the buggy code path never ran)
-- and only surfaced once the budget reset -- at which point it
-- crashed hv_pipeline_tick entirely for roughly 2 days, since
-- translate runs before classify/entities in that function and an
-- unhandled exception aborts everything after it. Fixed by renaming
-- the query alias from `r` to `resp`. 2026-08-23 (fallback added),
-- 2026-08-26 (bug found and fixed).

alter table public.hv_entity_jobs add column if not exists provider text;
alter table public.hv_translation_jobs add column if not exists provider text;
alter table public._counterparty_jobs add column if not exists provider text;

CREATE OR REPLACE FUNCTION public.hv_entities_dispatch(p_limit integer DEFAULT 60)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare r record; v_rid bigint; v_openai_key text; v_gemini_key text; n int:=0;
  v_provider text; v_attempts int; v_failures int;
  v_sys text := 'Extract NAMED organizations from this cannabis-industry news item. Include licensed operators/companies, regulators/government bodies, and investors/financial firms. Return ONLY JSON {"entities":[{"name":"...","type":"operator|regulator|investor|other"}]}. Named entities only — no generic terms, no country names alone. Empty array if none.';
begin
  p_limit := least(greatest(coalesce(p_limit, 60), 1), 75);
  p_limit := public.hv_consume_dispatch_budget('entities', p_limit);
  if p_limit <= 0 then return 0; end if;

  update public.hv_entity_jobs j set harvested = true
   where not j.harvested
     and not exists (select 1 from net._http_response resp where resp.id = j.request_id);

  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key';
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key';

  if v_openai_key is not null then
    select count(*), count(*) filter (where resp.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from hv_entity_jobs where provider='openai' and request_id is not null order by request_id desc limit 10) recent
    join net._http_response resp on resp.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'openai'; end if;
  end if;
  if v_provider is null and v_gemini_key is not null then v_provider := 'gemini'; end if;
  if v_provider is null then return 0; end if;

  for r in
    select s.id,
           coalesce(s.title_en, s.headline) as h,
           coalesce(s.summary_en, left(s.summary,900), '') as sm
    from public.signals s
    where s.quality_label = 'signal'
      and s.entities_extracted_at is null
      and s.headline is not null
      and not exists (select 1 from public.hv_entity_jobs j where j.signal_id=s.id and not j.harvested)
    order by s.created_at desc
    limit p_limit
  loop
    if v_provider = 'openai' then
      select net.http_post(
        url:='https://api.openai.com/v1/chat/completions',
        headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_openai_key),
        body:=jsonb_build_object('model','gpt-4o-mini','temperature',0,'response_format',jsonb_build_object('type','json_object'),
          'messages',jsonb_build_array(
            jsonb_build_object('role','system','content',v_sys),
            jsonb_build_object('role','user','content','HEADLINE: '||r.h||E'\nSUMMARY: '||r.sm)
          )),
        timeout_milliseconds:=30000
      ) into v_rid;
    else
      select net.http_post(
        url:='https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
        headers:=jsonb_build_object('Content-Type','application/json','x-goog-api-key',v_gemini_key),
        body:=jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_sys))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text','HEADLINE: '||r.h||E'\nSUMMARY: '||r.sm)))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',1200,'responseMimeType','application/json','thinkingConfig', jsonb_build_object('thinkingLevel','low'))
        ),
        timeout_milliseconds:=30000
      ) into v_rid;
    end if;
    insert into public.hv_entity_jobs(request_id, signal_id, provider) values (v_rid, r.id, v_provider) on conflict do nothing;
    n:=n+1;
  end loop;
  return n;
end
$function$
;

CREATE OR REPLACE FUNCTION public.hv_entities_harvest()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare r record; ent jsonb; v_name text; v_type text; v_eid text; v_raw text; v_entities jsonb; n int:=0;
begin
  for r in
    select j.request_id, j.signal_id, resp.status_code, resp.content
    from public.hv_entity_jobs j join net._http_response resp on resp.id=j.request_id
    where not j.harvested
  loop
    if r.status_code=200 then
      begin
        v_raw := coalesce(
          r.content::jsonb->'choices'->0->'message'->>'content',
          r.content::jsonb->'candidates'->0->'content'->'parts'->0->>'text'
        );
        v_entities := (v_raw::jsonb)->'entities';
        for ent in select * from jsonb_array_elements(coalesce(v_entities, '[]'::jsonb))
        loop
          v_name := btrim(ent->>'name');
          v_type := coalesce(nullif(btrim(ent->>'type'),''),'other');
          if v_name is null or length(v_name) < 2 then continue; end if;
          select id into v_eid from public.ia_graph_entities where lower(label)=lower(v_name) limit 1;
          if v_eid is null then
            v_eid := 'ent:'||substr(md5(lower(v_name)),1,20);
            insert into public.ia_graph_entities(id,type,label,signal_count,last_activity,created_at,updated_at)
            values (v_eid, v_type, v_name, 0, now(), now(), now())
            on conflict (id) do nothing;
          end if;
          insert into public.signal_entities(signal_id, entity_id, mention_text, entity_type, confidence)
          values (r.signal_id, v_eid, v_name, v_type, 0.8)
          on conflict (signal_id, entity_id) do nothing;
          update public.ia_graph_entities set signal_count=coalesce(signal_count,0)+1, last_activity=now() where id=v_eid;
          n:=n+1;
        end loop;
      exception when others then null;
      end;
      update public.signals set entities_extracted_at = now()
       where id = r.signal_id and entities_extracted_at is null;
    end if;
    update public.hv_entity_jobs set harvested=true where request_id=r.request_id;
  end loop;
  return n;
end
$function$
;

CREATE OR REPLACE FUNCTION public.hv_translate_dispatch(p_limit integer DEFAULT 30, p_eval_only boolean DEFAULT false)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare r record; v_rid bigint; v_openai_key text; v_gemini_key text; n int := 0;
  v_provider text; v_attempts int; v_failures int;
  v_sys text := 'You translate cannabis-industry news to English for a B2B regulatory-intelligence pipeline. Detect the original language and translate the headline and summary into natural English. Return ONLY strict JSON: {"lang":"<ISO 639-1>","title_en":"...","summary_en":"..."}. If already English, echo it back with lang:"en".';
begin
  p_limit := least(greatest(coalesce(p_limit, 30), 1), 50);
  p_limit := public.hv_consume_dispatch_budget('translate', p_limit);
  if p_limit <= 0 then return 0; end if;

  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key';
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key';

  if v_openai_key is not null then
    select count(*), count(*) filter (where resp.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from hv_translation_jobs where provider='openai' and request_id is not null order by request_id desc limit 10) recent
    join net._http_response resp on resp.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'openai'; end if;
  end if;
  if v_provider is null and v_gemini_key is not null then v_provider := 'gemini'; end if;
  if v_provider is null then return 0; end if;

  for r in
    select s.id, s.headline, s.summary
    from public.signals s
    where coalesce(s.lang,'en') not in ('en','EN')
      and s.title_en is null
      and s.headline is not null
      and (not p_eval_only or s.id in (select signal_id from public.intel_eval_set))
      and not exists (select 1 from public.hv_translation_jobs j where j.signal_id = s.id and not j.harvested)
    order by s.created_at desc
    limit p_limit
  loop
    if v_provider = 'openai' then
      select net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_openai_key),
        body := jsonb_build_object(
          'model','gpt-4o-mini','temperature',0,
          'response_format', jsonb_build_object('type','json_object'),
          'messages', jsonb_build_array(
            jsonb_build_object('role','system','content',v_sys),
            jsonb_build_object('role','user','content','HEADLINE: '||coalesce(r.headline,'')||E'\nSUMMARY: '||coalesce(left(r.summary,1000),''))
          )
        ),
        timeout_milliseconds := 30000
      ) into v_rid;
    else
      select net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
        headers := jsonb_build_object('Content-Type','application/json','x-goog-api-key',v_gemini_key),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_sys))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text','HEADLINE: '||coalesce(r.headline,'')||E'\nSUMMARY: '||coalesce(left(r.summary,1000),''))))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',1200,'responseMimeType','application/json','thinkingConfig', jsonb_build_object('thinkingLevel','low'))
        ),
        timeout_milliseconds := 30000
      ) into v_rid;
    end if;
    insert into public.hv_translation_jobs(request_id, signal_id, provider) values (v_rid, r.id, v_provider)
      on conflict (request_id) do nothing;
    n := n + 1;
  end loop;
  return n;
end
$function$
;

CREATE OR REPLACE FUNCTION public.hv_translate_harvest()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare r record; v_out jsonb; v_raw text; v_model text; n int := 0;
begin
  for r in
    select j.request_id, j.signal_id, j.provider, resp.status_code, resp.content
    from public.hv_translation_jobs j
    join net._http_response resp on resp.id = j.request_id
    where not j.harvested
  loop
    if r.status_code = 200 then
      begin
        v_raw := coalesce(
          r.content::jsonb->'choices'->0->'message'->>'content',
          r.content::jsonb->'candidates'->0->'content'->'parts'->0->>'text'
        );
        v_out := v_raw::jsonb;
        v_model := case coalesce(r.provider,'openai') when 'gemini' then 'gemini-3.6-flash' else 'gpt-4o-mini' end;
        update public.signals s set
          title_en   = nullif(btrim(v_out->>'title_en'),''),
          summary_en = nullif(btrim(v_out->>'summary_en'),''),
          lang_detected = nullif(btrim(v_out->>'lang'),''),
          translated_at = now(),
          translation_model = v_model
        where s.id = r.signal_id;
        n := n + 1;
      exception when others then null;
      end;
    end if;
    update public.hv_translation_jobs set harvested = true where request_id = r.request_id;
  end loop;
  return n;
end
$function$
;
