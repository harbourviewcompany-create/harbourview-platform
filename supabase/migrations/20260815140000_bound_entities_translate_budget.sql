-- Charge the entities and translate dispatch budgets for work actually done.
--
-- THE DEFECT
--
-- This is the same defect as `classify` Defect 1, fixed in
-- `20260814180000_bound_classify_retries.sql` and since proven in production.
-- That migration's header recorded the other two stages as out of scope:
--
--   "translate and entities share defect 1 in their own dispatch functions"
--
-- This closes them. Both functions charge the full requested limit before they
-- know whether any row qualifies:
--
--   p_limit := least(greatest(coalesce(p_limit, 60), 1), 75);
--   p_limit := public.hv_consume_dispatch_budget('entities', p_limit);  -- charged
--   if p_limit <= 0 then return 0; end if;
--   for r in select ... limit p_limit loop                              -- may be empty
--
-- `hv_pipeline_tick` passes 40 to each, every 30 minutes. A tick that dispatches
-- nothing still spends 40. entities has a 600/day ceiling and translate 800, so
-- 15 and 20 empty ticks respectively exhaust a full day of budget having done no
-- work at all.
--
-- MEASURED AGAINST PRODUCTION 2026-08-15, not inferred:
--
--   stage      calls_used / daily_ceiling
--   entities         600 / 600     (pinned at ceiling)
--   translate        800 / 800     (pinned at ceiling)
--   classify        1005 / 3000    (fixed 2026-08-14; stopped climbing)
--
-- classify is the control. Before its fix it sat at 3000/3000 on the same
-- pattern; after it, it froze at 1005 once its pool drained, while entities and
-- translate continued to ceiling. The difference between them is exactly this
-- change.
--
-- WHAT IS NOT CHANGED
--
-- `hv_embed_dispatch` was checked and is NOT defective. It charges
-- `least(array_length(p_signal_ids,1), 100)` -- the real size of the array it
-- was handed -- and then slices `v_ids := p_signal_ids[1 : v_allowed]` so it
-- processes exactly what it paid for. It is deliberately left alone; "fix the
-- other dispatchers too" would have broken a correct function.
--
-- `hv_consume_dispatch_budget` itself is untouched, as are both ceilings, both
-- clamps, both candidate queries, both request bodies and both job-table
-- inserts. The reap step in the entities function keeps running before the
-- budget is consulted: releasing a job whose response never arrived must not be
-- rationed, or a saturated budget would keep its signal hostage forever.
--
-- Only the order of "select the batch" and "charge the budget" changes, plus
-- charging the measured batch size instead of the requested limit.

create or replace function public.hv_entities_dispatch(p_limit integer DEFAULT 60)
 returns integer
 language plpgsql
 security definer
 set search_path to 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
as $function$
declare r record; v_rid bigint; v_key text; n int:=0; v_ids text[];
begin
  p_limit := least(greatest(coalesce(p_limit, 60), 1), 75);

  -- Reap jobs that never produced a response; without this they hold their signal
  -- hostage permanently via the unharvested-job guard below. Unrationed on
  -- purpose -- see the header.
  update public.hv_entity_jobs j set harvested = true
   where not j.harvested
     and not exists (select 1 from net._http_response resp where resp.id = j.request_id);

  -- Select the batch BEFORE consuming budget, then charge for exactly the rows
  -- that will actually be dispatched.
  select array_agg(s.id order by s.created_at desc) into v_ids
  from (
    select s.id, s.created_at
    from public.signals s
    where s.quality_label = 'signal'
      and s.entities_extracted_at is null
      and s.headline is not null
      and not exists (select 1 from public.hv_entity_jobs j where j.signal_id=s.id and not j.harvested)
    order by s.created_at desc
    limit p_limit
  ) s;

  if v_ids is null then return 0; end if;

  p_limit := public.hv_consume_dispatch_budget('entities', array_length(v_ids,1));
  if p_limit <= 0 then return 0; end if;
  v_ids := v_ids[1:p_limit];

  select decrypted_secret into v_key from vault.decrypted_secrets where name='openai_api_key';

  for r in
    select s.id,
           coalesce(s.title_en, s.headline) as h,
           coalesce(s.summary_en, left(s.summary,900), '') as sm
    from public.signals s
    where s.id = any(v_ids)
    order by s.created_at desc
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

create or replace function public.hv_translate_dispatch(p_limit integer DEFAULT 30, p_eval_only boolean DEFAULT false)
 returns integer
 language plpgsql
 security definer
 set search_path to 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
as $function$
declare r record; v_rid bigint; v_key text; n int := 0; v_ids text[];
begin
  p_limit := least(greatest(coalesce(p_limit, 30), 1), 50);

  -- Select the batch BEFORE consuming budget, then charge for exactly the rows
  -- that will actually be dispatched. p_eval_only is part of the candidate
  -- predicate and so is applied here, before the charge, exactly as it was
  -- applied before inside the loop's query.
  select array_agg(s.id order by s.created_at desc) into v_ids
  from (
    select s.id, s.created_at
    from public.signals s
    where coalesce(s.lang,'en') not in ('en','EN')
      and s.title_en is null
      and s.headline is not null
      and (not p_eval_only or s.id in (select signal_id from public.intel_eval_set))
      and not exists (select 1 from public.hv_translation_jobs j where j.signal_id = s.id and not j.harvested)
    order by s.created_at desc
    limit p_limit
  ) s;

  if v_ids is null then return 0; end if;

  p_limit := public.hv_consume_dispatch_budget('translate', array_length(v_ids,1));
  if p_limit <= 0 then return 0; end if;
  v_ids := v_ids[1:p_limit];

  select decrypted_secret into v_key from vault.decrypted_secrets where name='openai_api_key';

  for r in
    select s.id, s.headline, s.summary
    from public.signals s
    where s.id = any(v_ids)
    order by s.created_at desc
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
