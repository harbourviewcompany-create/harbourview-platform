-- Stamp rows classified by hv-classify v14 with the version whose
-- classifier_validation row records the measured v2 numbers
-- (n=181, precision 1.000, recall 0.903, gate_passed=true).
-- The v1 validation row is retained so rollback (redeploy v13 + revert this
-- constant) restores a gated, promotable state with no gap.
create or replace function public.hv_classify_corpus_harvest()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
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
            classifier_version = 'hv-classify/openai/v2-summary-fix'
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