-- Reconstructed from production. Verbatim statements for version 20260901024429.
-- Bug 1: harvest was marking harvested=true unconditionally, even on non-200
-- responses or per-signal parse failures, permanently losing the embedding.
-- Fix: only retire a job once every signal in the batch actually got a value.
-- Failed/partial batches stay unharvested and retry on the next tick (cheap:
-- Gemini re-embed of an already-succeeded signal just overwrites with the
-- same vector).
create or replace function public.hv_embed_harvest()
 returns integer
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare j record; i int; n int:=0; v_emb text; v_batch_ok boolean;
begin
  for j in select hj.request_id, hj.signal_ids, resp.status_code, resp.content
           from public.hv_embed_jobs hj join net._http_response resp on resp.id=hj.request_id
           where not hj.harvested
  loop
    v_batch_ok := (j.status_code = 200);
    if v_batch_ok then
      for i in 1 .. array_length(j.signal_ids,1) loop
        begin
          v_emb := replace(((j.content::jsonb)->'embeddings'->(i-1)->'values')::text, ' ', '');
          if v_emb is not null and v_emb <> 'null' then
            update public.signals set embedding_gemini_1024 = v_emb::vector, embedded_at=now()
            where id = j.signal_ids[i];
            n := n+1;
          else
            v_batch_ok := false;
          end if;
        exception when others then
          v_batch_ok := false;
        end;
      end loop;
    end if;
    if v_batch_ok then
      update public.hv_embed_jobs set harvested=true where request_id=j.request_id;
    end if;
  end loop;
  return n;
end
$function$;

-- Bug 2: dispatch selection ordered newest-first, so a steady stream of new
-- signals perpetually starved the backlog of old never-embedded ones.
-- Fix: oldest-first, so the backlog actually drains.
create or replace function public.hv_pipeline_tick()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
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
$function$;
