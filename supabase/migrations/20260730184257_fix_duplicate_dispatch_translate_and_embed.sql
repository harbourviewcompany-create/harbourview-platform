-- Restored 2026-08-12 (repository audit following PR #1280). This version is
-- recorded in supabase_migrations.schema_migrations (confirmed via ledger query
-- and pg_get_functiondef against live production) but had no corresponding file
-- anywhere in this repository -- the CI auto-reconcile step
-- (.github/workflows/supabase-migrate.yml) had been silently writing a SELECT 1
-- stub for it. Consequence: public.hv_pipeline_tick() had NO creator in the repo
-- at all (20260730030414 schedules a cron job that calls it, but the function
-- itself never existed on a fresh replay), and hv_translate_dispatch() was stuck
-- on the pre-184257 body that still double-dispatches translation for a signal
-- with an unharvested in-flight job.
--
-- Body below is verbatim from the production ledger / live pg_get_functiondef,
-- unmodified. See docs/control/EVIDENCE_LOG.md for the audit that found this.
--
-- Original message, retained:
--
-- Fixes a bug flagged (but left as a documented, non-live-risk follow-up) during
-- PR #1125's review: hv_translate_dispatch and hv_pipeline_tick's embed-candidate
-- selection both excluded already-completed rows (title_en/embedding_1024 IS NULL)
-- but never excluded rows with an existing DISPATCHED-BUT-NOT-YET-HARVESTED job.
-- classify/entities dispatch already guard against this via
-- "not exists (... where ... and not harvested)" -- this applies the same pattern
-- here. This was flagged as non-urgent because hv-quality-pipeline/hv-quality-
-- promote were inactive at the time; PR #1215 just reactivated both, so this is
-- now a live risk (duplicate paid OpenAI calls on any slow upstream response)
-- rather than a documented future concern.

CREATE OR REPLACE FUNCTION public.hv_translate_dispatch(p_limit integer DEFAULT 30, p_eval_only boolean DEFAULT false)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r record; v_rid bigint; v_key text; n int := 0;
begin
  p_limit := least(greatest(coalesce(p_limit, 30), 1), 50);
  p_limit := public.hv_consume_dispatch_budget('translate', p_limit);
  if p_limit <= 0 then return 0; end if;
  select decrypted_secret into v_key from vault.decrypted_secrets where name='openai_api_key';
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
    select s.id from public.signals s
    where s.quality_label='signal' and s.embedding_1024 is null
      and not exists (select 1 from public.hv_embed_jobs j where s.id = any(j.signal_ids) and not j.harvested)
    order by s.created_at desc limit 100
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
end$function$;
