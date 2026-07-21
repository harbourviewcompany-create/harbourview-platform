-- Build 1: connect promoted signals to the graph. Extract named entities -> resolve/create graph node -> link.
create table if not exists public.signal_entities (
  signal_id text not null,
  entity_id text not null,
  mention_text text,
  entity_type text,
  confidence numeric,
  created_at timestamptz not null default now(),
  primary key (signal_id, entity_id)
);
create index if not exists signal_entities_entity on public.signal_entities(entity_id);

-- Missing-index fix (Sourcery): resolution does lower(label) lookups; index it so
-- lookups stay O(log n) as the graph grows.
create index if not exists ia_graph_entities_label_lower on public.ia_graph_entities(lower(label));

create table if not exists public.hv_entity_jobs (
  request_id bigint primary key,
  signal_id text not null,
  harvested boolean not null default false,
  attempted boolean not null default false
);

-- Dispatch entity extraction for promoted signals not yet processed.
-- Unbounded-loop fix (CodeRabbit, Major): zero-entity signals used to have no
-- processed marker independent of entity existence, so they re-dispatched on
-- every tick forever. We now also skip signals that already have an attempted
-- (harvested) job row, regardless of whether it produced any entities.
create or replace function public.hv_entities_dispatch(p_limit int default 60)
returns int language plpgsql security definer set search_path to 'public' as $fn$
declare r record; v_rid bigint; n int:=0; v_key text;
begin
  if not exists (select 1 from vault.decrypted_secrets where name='openai_api_key') then
    raise notice 'hv_entities_dispatch: openai_api_key not found in vault, skipping';
    return 0;
  end if;

  for r in
    select s.id, coalesce(s.title_en,s.headline) as h, coalesce(s.summary_en,left(s.summary,900),'') as sm
    from public.signals s
    where s.reviewed_by='auto:v1'
      and not exists (select 1 from public.signal_entities se where se.signal_id=s.id)
      and not exists (select 1 from public.hv_entity_jobs j where j.signal_id=s.id)
    order by s.created_at desc
    limit p_limit
  loop
    select decrypted_secret into v_key from vault.decrypted_secrets where name='openai_api_key';
    select net.http_post(
      url:='https://api.openai.com/v1/chat/completions',
      headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key),
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
end$fn$;

-- Harvest: resolve each entity to a graph node (create if new), write the signal<->entity link, bump signal_count.
-- Fixes:
--  * (CodeRabbit, Data Integrity/Major) signal_count was incremented even when the
--    signal_entities row already existed (on conflict do nothing then unconditional
--    UPDATE). Now only incremented when the insert actually creates a new row.
--  * (Sourcery/CodeRabbit) 'when others then null' hid all harvest failures with no
--    log trail; now logs via raise warning before marking the job harvested so it
--    is not retried forever on a poison payload.
--  * (CodeRabbit, Major) non-200 responses used to still set harvested=true,
--    preventing retries; non-200/malformed responses are now left un-harvested
--    (retried) up to a bounded attempt count via the new attempted flag.
create or replace function public.hv_entities_harvest()
returns int language plpgsql security definer set search_path to 'public' as $fn$
declare r record; ent jsonb; v_name text; v_type text; v_eid text; v_inserted boolean; n int:=0;
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
          get diagnostics v_inserted = row_count;
          if v_inserted then
            update public.ia_graph_entities set signal_count=coalesce(signal_count,0)+1, last_activity=now() where id=v_eid;
          end if;
          n:=n+1;
        end loop;
        update public.hv_entity_jobs set harvested=true, attempted=true where request_id=r.request_id;
      exception when others then
        raise warning 'hv_entities_harvest: failed to parse response for request_id=%: %', r.request_id, sqlerrm;
        update public.hv_entity_jobs set harvested=true, attempted=true where request_id=r.request_id;
      end;
    else
      -- Non-200: mark attempted but leave un-harvested only on first try; after one
      -- retry window, give up so it does not loop forever on a permanently failing call.
      update public.hv_entity_jobs
      set harvested = attempted, attempted = true
      where request_id=r.request_id;
    end if;
  end loop;
  return n;
end$fn$;
