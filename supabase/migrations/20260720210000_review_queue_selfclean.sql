-- Self-clean the classifier dead-letter queue. intel_classify_review_queue rows
-- that later recover (get classified) or publish were lingering as unresolved,
-- causing an ever-growing "backlog". The tick now resolves them each cycle.
-- (In-scope failures auto-retry via api.pool_rows_needing_classification, which is
--  independent of this queue; out-of-scope/stale rows are resolved separately.)
-- Live version uses the project's public anon key as bearer; placeholder here.
CREATE OR REPLACE FUNCTION public.intel_pipeline_tick()
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
declare hdr jsonb := jsonb_build_object('content-type','application/json',
  'Authorization','Bearer __SUPABASE_ANON_KEY__');
    url text := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-classify';
begin
  -- self-clean the dead-letter: anything now classified or published is resolved
  update public.intel_classify_review_queue r set resolved=true
  where not coalesce(r.resolved,false)
    and (exists (select 1 from public.signal_classifications c where c.signal_id=r.signal_id)
         or exists (select 1 from public.signals s where s.id=r.signal_id and s.reviewed=true));
  perform api.promote_classified_signals(0.65, false);
  perform public.dedup_promoted_feed();
  perform net.http_post(url, jsonb_build_object('mode','titles','limit',12), '{}'::jsonb, hdr, 150000);
  perform net.http_post(url, jsonb_build_object('mode','pool','limit',15), '{}'::jsonb, hdr, 150000);
end$function$;
