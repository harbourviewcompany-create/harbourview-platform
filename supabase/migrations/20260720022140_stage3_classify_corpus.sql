create table if not exists public.hv_classify_jobs (
  request_id bigint primary key,
  signal_id text not null,
  harvested boolean not null default false
);
create index if not exists hv_classify_jobs_unharvested on public.hv_classify_jobs (harvested) where not harvested;

-- Dispatch classification for recent, unreviewed, unclassified signals (prefer English-normalized text).
create or replace function public.hv_classify_corpus_dispatch(p_limit int default 100, p_scope_days int default 120)
returns int language plpgsql security definer set search_path to 'public' as $fn$
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
      headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eGRnZGt1a2pycndhbWRwcXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDMxNzUsImV4cCI6MjA5MjgxOTE3NX0.MEGWEsDpJO3964Ef2G2Cbo-Q5JKT46WB1xtlXE-ue5M'),
      body:=jsonb_build_object('text', jsonb_build_object('headline', r.h, 'summary', r.sm)),
      timeout_milliseconds:=30000
    ) into v_rid;
    insert into public.hv_classify_jobs(request_id, signal_id) values (v_rid, r.id) on conflict do nothing;
    n:=n+1;
  end loop;
  return n;
end$fn$;

create or replace function public.hv_classify_corpus_harvest()
returns int language plpgsql security definer set search_path to 'public' as $fn$
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
end$fn$;