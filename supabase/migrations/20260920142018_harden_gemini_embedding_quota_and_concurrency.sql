create or replace function public.hv_embed_harvest()
returns integer
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare j record; i int; n int := 0; v_emb text; v_batch_ok boolean;
begin
  update public.hv_embed_jobs hj set harvested = true
  where not hj.harvested
    and not exists (select 1 from net._http_response resp where resp.id = hj.request_id);
  for j in
    select hj.request_id, hj.signal_ids, resp.status_code, resp.content
    from public.hv_embed_jobs hj join net._http_response resp on resp.id=hj.request_id
    where not hj.harvested
  loop
    v_batch_ok := (j.status_code=200);
    if v_batch_ok then
      for i in 1..array_length(j.signal_ids,1) loop
        begin
          v_emb := replace(((j.content::jsonb)->'embeddings'->(i-1)->'values')::text,' ','');
          if v_emb is not null and v_emb <> 'null' then
            update public.signals set embedding_gemini_1024=v_emb::vector, embedded_at=now() where id=j.signal_ids[i];
            n := n+1;
          else v_batch_ok := false;
          end if;
        exception when others then v_batch_ok := false;
        end;
      end loop;
    end if;
    if v_batch_ok or j.status_code <> 200 then
      update public.hv_embed_jobs set harvested=true where request_id=j.request_id;
    end if;
  end loop;
  return n;
end
$function$;

create or replace function public.hv_embed_dispatch(p_signal_ids text[])
returns bigint
language plpgsql
security definer
set search_path to 'pg_catalog','public','public','api','signals','regulatory_signals','auth','storage','vault','extensions','net','cron'
as $function$
declare v_rid bigint; v_texts text[]; v_ids text[]; v_allowed int; v_requests jsonb; v_gemini_key text;
begin
  if not pg_try_advisory_xact_lock(hashtextextended('harbourview:gemini-embed-dispatch',0)) then return null; end if;
  if exists (select 1 from net._http_response where status_code=429 and created>now()-interval '65 seconds' and content::text like '%embed_content%') then return null; end if;
  if exists (select 1 from public.hv_embed_jobs where not harvested) then return null; end if;
  v_allowed := public.hv_consume_dispatch_budget('embed',least(coalesce(array_length(p_signal_ids,1),0),100));
  if v_allowed<=0 then return null; end if;
  v_ids := p_signal_ids[1:v_allowed];
  select array_agg(coalesce(s.title_en,s.headline)||'. '||coalesce(s.summary_en,left(s.summary,300),'') order by ord) into v_texts
  from unnest(v_ids) with ordinality as u(sid,ord) join public.signals s on s.id=u.sid;
  select jsonb_agg(jsonb_build_object('model','models/gemini-embedding-001','content',jsonb_build_object('parts',jsonb_build_array(jsonb_build_object('text',left(t,4000)))),'outputDimensionality',1024)) into v_requests from unnest(v_texts) t;
  v_gemini_key := public.hv_get_gemini_key();
  select net.http_post(url:='https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key='||v_gemini_key,headers:='{"Content-Type":"application/json"}'::jsonb,body:=jsonb_build_object('requests',v_requests),timeout_milliseconds:=45000) into v_rid;
  insert into public.hv_embed_jobs(request_id,signal_ids) values(v_rid,v_ids);
  return v_rid;
end
$function$;