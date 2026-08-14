-- CodeRabbit (trivial, PR #1095): v_tr_h, v_cl_h, v_em_h, v_tr_d were computed
-- but dropped from the returned JSON, leaving translate/classify/embed harvest
-- and translate dispatch invisible to monitoring even though this tick is the
-- natural observability point for the whole pipeline. Now returns all eight.
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