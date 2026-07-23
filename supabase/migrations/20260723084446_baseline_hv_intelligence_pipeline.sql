-- ============================================================================
-- BASELINE CAPTURE: the hv_* intelligence pipeline (Pipeline B)
-- ============================================================================
-- Written 2026-07-22. This pipeline (10 functions + 4 job-tracking tables +
-- 2 cron jobs) was built live over the prior week via untracked execute_sql
-- calls -- ZERO migration file, doc, or HANDOFF entry existed for any of it
-- before this. That gap is why it caused two production incidents:
--
-- 1. It duplicated Stage 0-4 of docs/INTELLIGENCE_ARCHITECTURE_SPEC.md,
--    built independently and concurrently with a second implementation
--    (the intel_*/signal_classifications family) -- neither session aware
--    of the other, because neither had left anything the other could find.
-- 2. Its cron jobs (hv-quality-pipeline every 2 min, hv-quality-promote
--    every 10 min) burned this project's Nano-tier disk-IO budget and
--    degraded the live database for 2+ hours (2026-07-21/22). Both were
--    disabled to stop it. A separate, concurrent session then re-enabled
--    hv-quality-pipeline without knowing why it was off, causing a second,
--    near-identical outage the same day -- specifically BECAUSE there was
--    nothing written down to stop them.
--
-- See docs/INTELLIGENCE_ARCHITECTURE_SPEC.md Section 2.8 and Section 8 for
-- the full incident history and the consolidation plan. The short version:
--
--   *** DO NOT re-enable hv-quality-pipeline or hv-quality-promote crons ***
--   *** without first completing: Stage C (mechanical validation gate),  ***
--   *** Stage E (cadence redesign for the disk-IO budget), and Stage F   ***
--   *** (hard dispatch/cost ceilings). Re-enabling either without those  ***
--   *** three landing first WILL reproduce this exact incident.         ***
--
-- This migration is a baseline capture, not a functional change: every
-- statement below is idempotent (CREATE OR REPLACE / CREATE TABLE IF NOT
-- EXISTS) and matches exactly what has been running live. The two cron
-- jobs are intentionally NOT re-created here -- see the note at the bottom.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Job-tracking tables (async dispatch/harvest pattern -- one row per
-- outbound net.http_post, harvested by a matching *_harvest() function once
-- net._http_response has the result)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.hv_classify_jobs (
  request_id bigint NOT NULL PRIMARY KEY,
  signal_id text NOT NULL,
  harvested boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.hv_embed_jobs (
  request_id bigint NOT NULL PRIMARY KEY,
  signal_ids text[] NOT NULL,
  harvested boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.hv_translation_jobs (
  request_id bigint NOT NULL PRIMARY KEY,
  signal_id text NOT NULL,
  dispatched_at timestamptz NOT NULL DEFAULT now(),
  harvested boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.hv_entity_jobs (
  request_id bigint NOT NULL PRIMARY KEY,
  signal_id text NOT NULL,
  harvested boolean NOT NULL DEFAULT false
);

-- RLS + grants for these four tables are handled by the companion migration
-- 20260722203608_lock_down_hv_pipeline_job_tables_rls.sql (applied first,
-- same session) -- not repeated here to avoid ordering ambiguity.

-- ---------------------------------------------------------------------------
-- Translate stage
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.hv_translate_dispatch(p_limit integer DEFAULT 30, p_eval_only boolean DEFAULT false)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r record; v_rid bigint; v_key text; n int := 0;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name='openai_api_key';
  for r in
    select s.id, s.headline, s.summary
    from public.signals s
    where coalesce(s.lang,'en') not in ('en','EN')
      and s.title_en is null
      and s.headline is not null
      and (not p_eval_only or s.id in (select signal_id from public.intel_eval_set))
    order by s.created_at desc
    limit p_limit
  loop
    select net.http_post(
      url := 'https://api.openai.com/v1/chat/completions',
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key),
      body := jsonb_build_object(
        'model','gpt-4o-mini','temperature',0,
        'response_format', jsonb_build_object('type','json_object'),
        'messages', jsonb_build_array(
          jsonb_build_object('role','system','content','You translate cannabis-industry news to English for a B2B regulatory-intelligence pipeline. Detect the original language and translate the headline and summary into natural English. Return ONLY strict JSON: {"lang":"<ISO 639-1>","title_en":"...","summary_en":"..."}. If already English, echo it back with lang:"en".'),
          jsonb_build_object('role','user','content','HEADLINE: '||coalesce(r.headline,'')||E'\nSUMMARY: '||coalesce(left(r.summary,1000),''))
        )
      ),
      timeout_milliseconds := 30000
    ) into v_rid;
    insert into public.hv_translation_jobs(request_id, signal_id) values (v_rid, r.id)
      on conflict (request_id) do nothing;
    n := n + 1;
  end loop;
  return n;
end$function$;

CREATE OR REPLACE FUNCTION public.hv_translate_harvest()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r record; v_out jsonb; n int := 0;
begin
  for r in
    select j.request_id, j.signal_id, resp.status_code, resp.content
    from public.hv_translation_jobs j
    join net._http_response resp on resp.id = j.request_id
    where not j.harvested
  loop
    if r.status_code = 200 then
      begin
        v_out := (r.content::jsonb->'choices'->0->'message'->>'content')::jsonb;
        update public.signals s set
          title_en   = nullif(btrim(v_out->>'title_en'),''),
          summary_en = nullif(btrim(v_out->>'summary_en'),''),
          lang_detected = nullif(btrim(v_out->>'lang'),''),
          translated_at = now(),
          translation_model = 'gpt-4o-mini'
        where s.id = r.signal_id;
        n := n + 1;
      exception when others then null;
      end;
    end if;
    update public.hv_translation_jobs set harvested = true where request_id = r.request_id;
  end loop;
  return n;
end$function$;

-- ---------------------------------------------------------------------------
-- Classify stage -- calls the same hv-classify edge function hardened
-- 2026-07-21 (OpenAI-only, retry + 429 backoff). Writes DIRECTLY onto
-- signals columns, unlike Pipeline A's signal_classifications join table.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.hv_classify_corpus_dispatch(p_limit integer DEFAULT 100, p_scope_days integer DEFAULT 120)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r record; v_rid bigint; n int:=0;
begin
  for r in
    select s.id, coalesce(s.title_en, s.headline) as h, coalesce(s.summary_en, left(s.summary,1000), s.title_en, s.headline) as sm
    from public.signals s
    where s.quality_label is null
      and s.reviewed is distinct from true
      and s.headline is not null
      and s.created_at > now() - (p_scope_days||' days')::interval
      and not exists (select 1 from public.hv_classify_jobs j where j.signal_id=s.id and not j.harvested)
    order by s.created_at desc
    limit p_limit
  loop
    select net.http_post(
      url:='https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-classify',
      headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='hv_edge_anon_key' limit 1)),
      body:=jsonb_build_object('text', jsonb_build_object('headline', r.h, 'summary', r.sm)),
      timeout_milliseconds:=30000
    ) into v_rid;
    insert into public.hv_classify_jobs(request_id, signal_id) values (v_rid, r.id) on conflict do nothing;
    n:=n+1;
  end loop;
  return n;
end$function$;

CREATE OR REPLACE FUNCTION public.hv_classify_corpus_harvest()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r record; v_c jsonb; n int:=0;
begin
  for r in
    select j.request_id, j.signal_id, resp.status_code, resp.content
    from public.hv_classify_jobs j join net._http_response resp on resp.id=j.request_id
    where not j.harvested
  loop
    if r.status_code=200 then
      begin
        v_c := (r.content::jsonb->'classification');
        if v_c is not null then
          update public.signals s set
            quality_label = v_c->>'quality_label',
            content_type = v_c->>'content_type',
            impact = v_c->>'impact',
            quality_confidence = (v_c->>'confidence')::numeric,
            classifier_version = 'hv-classify/openai/v1'
          where s.id = r.signal_id;
          n:=n+1;
        end if;
      exception when others then null;
      end;
    end if;
    update public.hv_classify_jobs set harvested=true where request_id=r.request_id;
  end loop;
  return n;
end$function$;

-- ---------------------------------------------------------------------------
-- Embed stage
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.hv_embed_dispatch(p_signal_ids text[])
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_rid bigint; v_inputs jsonb;
begin
  select jsonb_agg(coalesce(s.title_en, s.headline) || '. ' || coalesce(s.summary_en, left(s.summary,300), '') order by ord)
    into v_inputs
  from unnest(p_signal_ids) with ordinality as u(sid, ord)
  join public.signals s on s.id = u.sid;

  select net.http_post(
    url := 'https://api.openai.com/v1/embeddings',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='openai_api_key')),
    body := jsonb_build_object('model','text-embedding-3-small','dimensions',1024,'input', v_inputs),
    timeout_milliseconds := 45000
  ) into v_rid;

  insert into public.hv_embed_jobs(request_id, signal_ids) values (v_rid, p_signal_ids);
  return v_rid;
end$function$;

CREATE OR REPLACE FUNCTION public.hv_embed_harvest()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare j record; i int; n int:=0; v_emb text;
begin
  for j in select hj.request_id, hj.signal_ids, resp.status_code, resp.content
           from public.hv_embed_jobs hj join net._http_response resp on resp.id=hj.request_id
           where not hj.harvested
  loop
    if j.status_code = 200 then
      for i in 1 .. array_length(j.signal_ids,1) loop
        begin
          v_emb := replace(((j.content::jsonb)->'data'->(i-1)->'embedding')::text, ' ', '');
          if v_emb is not null and v_emb <> 'null' then
            update public.signals set embedding_1024 = v_emb::vector, embedding_model='text-embedding-3-small', embedded_at=now()
            where id = j.signal_ids[i];
            n := n+1;
          end if;
        exception when others then null;
        end;
      end loop;
    end if;
    update public.hv_embed_jobs set harvested=true where request_id=j.request_id;
  end loop;
  return n;
end$function$;

-- ---------------------------------------------------------------------------
-- Entity extraction stage -- runs AFTER promotion (gated on
-- reviewed_by='auto:v1'), so it only processes already-published signals.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.hv_entities_dispatch(p_limit integer DEFAULT 60)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r record; v_rid bigint; n int:=0;
begin
  for r in
    select s.id, coalesce(s.title_en,s.headline) as h, coalesce(s.summary_en,left(s.summary,900),'') as sm
    from public.signals s
    where s.reviewed_by='auto:v1'
      and not exists (select 1 from public.signal_entities se where se.signal_id=s.id)
      and not exists (select 1 from public.hv_entity_jobs j where j.signal_id=s.id and not j.harvested)
    order by s.created_at desc
    limit p_limit
  loop
    select net.http_post(
      url:='https://api.openai.com/v1/chat/completions',
      headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='openai_api_key')),
      body:=jsonb_build_object('model','gpt-4o-mini','temperature',0,'response_format',jsonb_build_object('type','json_object'),
        'messages',jsonb_build_array(
          jsonb_build_object('role','system','content','Extract NAMED organizations from this cannabis-industry news item. Include licensed operators/companies, regulators/government bodies, and investors/financial firms. Return ONLY JSON {"entities":[{"name":"...","type":"operator|regulator|investor|other"}]}. Named entities only — no generic terms, no country names alone. Empty array if none.'),
          jsonb_build_object('role','user','content','HEADLINE: '||r.h||E'\nSUMMARY: '||r.sm)
        )),
      timeout_milliseconds:=30000
    ) into v_rid;
    insert into public.hv_entity_jobs(request_id, signal_id) values (v_rid, r.id) on conflict do nothing;
    n:=n+1;
  end loop;
  return n;
end$function$;

CREATE OR REPLACE FUNCTION public.hv_entities_harvest()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r record; ent jsonb; v_name text; v_type text; v_eid text; n int:=0;
begin
  for r in
    select j.request_id, j.signal_id, resp.status_code, resp.content
    from public.hv_entity_jobs j join net._http_response resp on resp.id=j.request_id
    where not j.harvested
  loop
    if r.status_code=200 then
      begin
        for ent in select * from jsonb_array_elements(((r.content::jsonb->'choices'->0->'message'->>'content')::jsonb)->'entities')
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
    end if;
    update public.hv_entity_jobs set harvested=true where request_id=r.request_id;
  end loop;
  return n;
end$function$;

-- ---------------------------------------------------------------------------
-- Dedup / clustering (cosine similarity on embedding_1024, threshold 0.90)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.hv_dedup_assign(p_tau double precision DEFAULT 0.90, p_scope_days integer DEFAULT 120)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare n int;
begin
  update public.signals a
  set is_representative = not exists (
        select 1 from public.signals b
        where b.id <> a.id and b.embedding_1024 is not null
          and b.created_at > now() - (p_scope_days||' days')::interval
          and ( coalesce(b.score,0) > coalesce(a.score,0)
             or (coalesce(b.score,0) = coalesce(a.score,0) and b.created_at < a.created_at)
             or (coalesce(b.score,0) = coalesce(a.score,0) and b.created_at = a.created_at and b.id < a.id) )
          and (1 - (a.embedding_1024 <=> b.embedding_1024)) >= p_tau
      ),
      cluster_rep_id = coalesce((
        select b.id from public.signals b
        where b.id <> a.id and b.embedding_1024 is not null
          and b.created_at > now() - (p_scope_days||' days')::interval
          and (1 - (a.embedding_1024 <=> b.embedding_1024)) >= p_tau
          and ( coalesce(b.score,0) > coalesce(a.score,0)
             or (coalesce(b.score,0) = coalesce(a.score,0) and b.created_at < a.created_at)
             or (coalesce(b.score,0) = coalesce(a.score,0) and b.created_at = a.created_at and b.id < a.id) )
        order by (1 - (a.embedding_1024 <=> b.embedding_1024)) desc
        limit 1
      ), a.id)
  where a.embedding_1024 is not null
    and a.created_at > now() - (p_scope_days||' days')::interval;
  get diagnostics n = row_count;
  return n;
end$function$;

-- ---------------------------------------------------------------------------
-- Promotion. Structural invariant preserved through this baseline capture:
-- only ever flips reviewed false->true, never touches human-reviewed rows.
-- GAP (Stage C, not yet fixed): does not check any validation gate before
-- promoting -- see docs/INTELLIGENCE_ARCHITECTURE_SPEC.md Section 6.2/6.3.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.hv_promote_signals(p_min_conf numeric DEFAULT 0.65)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare n int;
begin
  update public.signals s set
    reviewed = true, reviewed_by = 'auto:v1', reviewed_at = now()
  where s.quality_label = 'signal'
    and coalesce(s.is_representative, true) = true
    and s.quality_confidence is not null
    and s.quality_confidence >= greatest(coalesce(p_min_conf, 0.65), 0.65)
    and s.reviewed is distinct from true
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%')
    and regexp_replace(coalesce(s.url,''), '^https?://(www\.)?([^/]+).*', '\2')
        not in (select domain from public.excluded_source_domains);
  get diagnostics n = row_count;
  return n;
end$function$;

-- ---------------------------------------------------------------------------
-- Orchestration entry points. NOT scheduled by this migration -- see the
-- warning at the top. Both were live crons (hv-quality-pipeline */2 min,
-- hv-quality-promote */10 min) prior to 2026-07-21; both are currently
-- unscheduled. Re-adding via cron.schedule(...) is Stage J, gated on
-- Stages C/E/F landing first, and requires explicit sign-off.
-- ---------------------------------------------------------------------------

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

  select array_agg(id) into v_ids from (
    select s.id from public.signals s where s.quality_label='signal' and s.embedding_1024 is null order by s.created_at desc limit 100
  ) q;
  if v_ids is not null then perform public.hv_embed_dispatch(v_ids); v_em_d := array_length(v_ids,1); end if;

  return jsonb_build_object('classify_dispatched',v_cl_d,'entities_harvested',v_ent_h,'entities_dispatched',v_ent_d,'embed_dispatched',v_em_d);
end$function$;

CREATE OR REPLACE FUNCTION public.hv_quality_promote_tick()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_dd int; v_pr int;
begin
  v_dd := public.hv_dedup_assign(0.90, 400);
  v_pr := public.hv_promote_signals(0.65);
  return jsonb_build_object('deduped',v_dd,'promoted',v_pr);
end$function$;
