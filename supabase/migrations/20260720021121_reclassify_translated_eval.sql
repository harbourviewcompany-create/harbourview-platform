create table if not exists public.hv_reclassify_jobs (
  request_id bigint primary key,
  signal_id text not null,
  run_id text not null,
  pred_quality_label text,
  pred_confidence numeric,
  harvested boolean not null default false
);

create or replace function public.hv_reclassify_dispatch(p_run text, p_limit int default 200)
returns int language plpgsql security definer set search_path to 'public' as $fn$
declare r record; v_rid bigint; n int:=0;
begin
  for r in
    select e.signal_id, s.title_en, coalesce(s.summary_en, s.title_en) as summ
    from public.intel_eval_set e join public.signals s on s.id=e.signal_id
    where e.quality_label is not null and s.title_en is not null
      and coalesce(e.lang_at_sample,'en')<>'en'
      and not exists (select 1 from public.hv_reclassify_jobs j where j.signal_id=e.signal_id and j.run_id=p_run)
    limit p_limit
  loop
    select net.http_post(
      url:='https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-classify',
      headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eGRnZGt1a2pycndhbWRwcXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDMxNzUsImV4cCI6MjA5MjgxOTE3NX0.MEGWEsDpJO3964Ef2G2Cbo-Q5JKT46WB1xtlXE-ue5M'),
      body:=jsonb_build_object('text', jsonb_build_object('headline', r.title_en, 'summary', r.summ)),
      timeout_milliseconds:=30000
    ) into v_rid;
    insert into public.hv_reclassify_jobs(request_id, signal_id, run_id) values (v_rid, r.signal_id, p_run) on conflict do nothing;
    n:=n+1;
  end loop;
  return n;
end$fn$;

create or replace function public.hv_reclassify_harvest(p_run text)
returns int language plpgsql security definer set search_path to 'public' as $fn$
declare r record; v_c jsonb; n int:=0;
begin
  for r in
    select j.request_id, resp.status_code, resp.content
    from public.hv_reclassify_jobs j join net._http_response resp on resp.id=j.request_id
    where j.run_id=p_run and not j.harvested
  loop
    if r.status_code=200 then
      begin
        v_c := (r.content::jsonb->'classification');
        update public.hv_reclassify_jobs set
          pred_quality_label = v_c->>'quality_label',
          pred_confidence = (v_c->>'confidence')::numeric,
          harvested = true
        where request_id = r.request_id;
        n:=n+1;
      exception when others then
        update public.hv_reclassify_jobs set harvested=true where request_id=r.request_id;
      end;
    else
      update public.hv_reclassify_jobs set harvested=true where request_id=r.request_id;
    end if;
  end loop;
  return n;
end$fn$;