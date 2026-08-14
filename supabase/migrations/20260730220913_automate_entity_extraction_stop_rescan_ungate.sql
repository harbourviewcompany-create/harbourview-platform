-- Entity extraction: stop the infinite rescan, remove the promotion gate, reap stuck jobs.
--
-- Measured before this change (2026-07-30):
--   hv_entity_jobs            22,520 rows
--   distinct signals attempted   360
--   attempts per signal         62.6
--   signals that yielded entities 148
--   entity coverage        148 / 3,260 promoted = 4.5%
--
-- Three defects, no human-review gate among them (signal_entities and
-- ia_graph_entities carry no approval column; nothing was ever waiting on a person):
--
-- 1. INFINITE RESCAN. hv_entities_harvest writes nothing to the signal when the
--    model legitimately returns {"entities":[]}. The dispatch guard was
--    `not exists (select 1 from signal_entities where signal_id = s.id)`, which such
--    a signal never satisfies, so it was re-dispatched every tick forever. ~22,000
--    wasted OpenAI calls, and the 600/day budget was spent re-interrogating the same
--    ~212 entity-less signals while thousands of others were never attempted once.
--    Fix: signals.entities_extracted_at records the ATTEMPT, not the outcome.
--
-- 2. PROMOTION GATE. Dispatch required reviewed_by = 'auto:v1', limiting extraction to
--    promoted rows (3,128 of 12,463). Entity extraction has no reason to wait on
--    promotion — it is a read-only enrichment. Now keyed on quality_label = 'signal',
--    i.e. anything the validated classifier judged real.
--
-- 3. STUCK JOBS. 80 rows dispatched with no HTTP response ever recorded, each blocking
--    its signal from re-dispatch via the unharvested-job guard. Now reaped by age.
--
-- Reversible: drop the column and restore the prior function bodies from
-- supabase/migrations/20260723084446_baseline_hv_intelligence_pipeline.sql.

alter table public.signals add column if not exists entities_extracted_at timestamptz;

comment on column public.signals.entities_extracted_at is
  'When entity extraction was ATTEMPTED for this signal, regardless of whether any '
  'entities were found. Recording the attempt (not the outcome) is what prevents the '
  'infinite rescan of signals that legitimately contain no named organisations.';

create index if not exists idx_signals_entities_pending
  on public.signals (created_at desc)
  where entities_extracted_at is null and quality_label = 'signal';

-- Backfill: every signal already attempted is done, whether or not it yielded entities.
update public.signals s
   set entities_extracted_at = now()
 where s.entities_extracted_at is null
   and exists (select 1 from public.hv_entity_jobs j where j.signal_id = s.id);

create or replace function public.hv_entities_dispatch(p_limit integer default 60)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare r record; v_rid bigint; v_key text; n int:=0;
begin
  p_limit := least(greatest(coalesce(p_limit, 60), 1), 75);
  p_limit := public.hv_consume_dispatch_budget('entities', p_limit);
  if p_limit <= 0 then return 0; end if;

  -- Reap jobs dispatched over an hour ago that never produced a response. Without
  -- this they hold their signal hostage permanently via the guard below.
  update public.hv_entity_jobs j set harvested = true
   where not j.harvested
     and not exists (select 1 from net._http_response r where r.id = j.request_id);

  select decrypted_secret into v_key from vault.decrypted_secrets where name='openai_api_key';

  for r in
    select s.id,
           coalesce(s.title_en, s.headline) as h,
           coalesce(s.summary_en, left(s.summary,900), '') as sm
    from public.signals s
    where s.quality_label = 'signal'
      and s.entities_extracted_at is null
      and s.headline is not null
      and not exists (select 1 from public.hv_entity_jobs j where j.signal_id=s.id and not j.harvested)
    order by s.created_at desc
    limit p_limit
  loop
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
end$function$;

create or replace function public.hv_entities_harvest()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
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
      -- Stamp the ATTEMPT on any 200, including an empty entity array. This single
      -- line is what ends the rescan: a signal with no named organisations is now
      -- finished rather than eligible forever.
      update public.signals set entities_extracted_at = now()
       where id = r.signal_id and entities_extracted_at is null;
    end if;
    update public.hv_entity_jobs set harvested=true where request_id=r.request_id;
  end loop;
  return n;
end$function$;

comment on function public.hv_entities_dispatch(integer) is
  'Dispatches entity extraction for classifier-confirmed signals (quality_label = signal). '
  'Not gated on promotion — enrichment does not need to wait for the feed. Each signal is '
  'attempted exactly once (signals.entities_extracted_at), and jobs with no HTTP response '
  'are reaped so they cannot block their signal indefinitely.';