-- Restore the exact production-owned body for migration 20260723085105.
-- The previous stub omitted public.hv_dispatch_budget, which later
-- migrations dereference.

-- Stage F, part 2 (docs/INTELLIGENCE_ARCHITECTURE_SPEC.md Section 8): the
-- per-call LEAST() clamps applied earlier (stage_f_hard_dispatch_ceilings)
-- bound a single invocation, but say nothing about how many times a
-- dispatch function can be called in a day -- which is the dimension that
-- actually caused the 2026-07-21/22 incidents (call frequency, not batch
-- size). This adds a real daily ceiling per pipeline stage: once exhausted,
-- dispatch functions clamp their effective limit to whatever budget remains
-- (0 once exhausted) instead of continuing to fire. Resets automatically
-- at the first call after UTC midnight.

create table if not exists public.hv_dispatch_budget (
  stage text primary key,
  budget_date date not null default current_date,
  calls_used integer not null default 0,
  daily_ceiling integer not null default 500
);

alter table public.hv_dispatch_budget enable row level security;
revoke all on public.hv_dispatch_budget from anon, authenticated, public;

insert into public.hv_dispatch_budget (stage, daily_ceiling) values
  ('classify', 500),
  ('translate', 200),
  ('embed', 300),
  ('entities', 200)
on conflict (stage) do nothing;

create or replace function public.hv_consume_dispatch_budget(p_stage text, p_requested integer)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v_remaining int; v_allowed int;
begin
  update public.hv_dispatch_budget
  set budget_date = current_date, calls_used = 0
  where stage = p_stage and budget_date <> current_date;

  select greatest(daily_ceiling - calls_used, 0) into v_remaining
  from public.hv_dispatch_budget where stage = p_stage;

  -- unknown stage name: fail closed rather than dispatch unbounded
  if v_remaining is null then
    return 0;
  end if;

  v_allowed := least(greatest(coalesce(p_requested,0), 0), v_remaining);

  update public.hv_dispatch_budget
  set calls_used = calls_used + v_allowed
  where stage = p_stage;

  return v_allowed;
end$function$;

revoke all on function public.hv_consume_dispatch_budget(text, integer) from anon, authenticated, public;

-- Wire the four dispatch functions to consume the budget before their
-- existing per-call LEAST() ceiling. Everything else about each function
-- (queries, http calls, job-table inserts) is unchanged.

create or replace function public.hv_translate_dispatch(p_limit integer default 30, p_eval_only boolean default false)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare r record; v_rid bigint; v_key text; n int := 0;
begin
  p_limit := least(greatest(coalesce(p_limit, 30), 1), 50);
  p_limit := public.hv_consume_dispatch_budget('translate', p_limit);
  if p_limit <= 0 then return 0; end if;
  select decrypted_secret into v_key from vault.decrypted_secrets where name='openai_api_key';
  for r in
    select s.id, s.headline, s.summary
    from public.signals s
    where coalesce(s.lang,'en') not in ('en','EN')
      and s.title_en is null
      and s.headline is not null
      and (not p_eval_only or s.id in (select signal_id from public.intel_eval_set))
    order by s.created_at desc
    limit p_limit
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

create or replace function public.hv_classify_corpus_dispatch(p_limit integer default 100, p_scope_days integer default 120)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare r record; v_rid bigint; n int:=0;
begin
  p_limit := least(greatest(coalesce(p_limit, 100), 1), 150);
  p_scope_days := least(greatest(coalesce(p_scope_days, 120), 1), 400);
  p_limit := public.hv_consume_dispatch_budget('classify', p_limit);
  if p_limit <= 0 then return 0; end if;
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
      headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='hv_edge_anon_key' limit 1)),
      body:=jsonb_build_object('text', jsonb_build_object('headline', r.h, 'summary', r.sm)),
      timeout_milliseconds:=30000
    ) into v_rid;
    insert into public.hv_classify_jobs(request_id, signal_id) values (v_rid, r.id) on conflict do nothing;
    n:=n+1;
  end loop;
  return n;
end$function$;

create or replace function public.hv_embed_dispatch(p_signal_ids text[])
 returns bigint
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v_rid bigint; v_inputs jsonb; v_ids text[]; v_allowed int;
begin
  v_allowed := public.hv_consume_dispatch_budget('embed', least(coalesce(array_length(p_signal_ids,1),0), 100));
  if v_allowed <= 0 then return null; end if;
  v_ids := p_signal_ids[1 : v_allowed];

  select jsonb_agg(coalesce(s.title_en, s.headline) || '. ' || coalesce(s.summary_en, left(s.summary,300), '') order by ord)
    into v_inputs
  from unnest(v_ids) with ordinality as u(sid, ord)
  join public.signals s on s.id = u.sid;

  select net.http_post(
    url := 'https://api.openai.com/v1/embeddings',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='openai_api_key')),
    body := jsonb_build_object('model','text-embedding-3-small','dimensions',1024,'input', v_inputs),
    timeout_milliseconds := 45000
  ) into v_rid;

  insert into public.hv_embed_jobs(request_id, signal_ids) values (v_rid, v_ids);
  return v_rid;
end$function$;

create or replace function public.hv_entities_dispatch(p_limit integer default 60)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare r record; v_rid bigint; n int:=0;
begin
  p_limit := least(greatest(coalesce(p_limit, 60), 1), 75);
  p_limit := public.hv_consume_dispatch_budget('entities', p_limit);
  if p_limit <= 0 then return 0; end if;
  for r in
    select s.id, coalesce(s.title_en,s.headline) as h, coalesce(s.summary_en,left(s.summary,900),'') as sm
    from public.signals s
    where s.reviewed_by='auto:v1'
      and not exists (select 1 from public.signal_entities se where se.signal_id=s.id)
      and not exists (select 1 from public.hv_entity_jobs j where j.signal_id=s.id and not j.harvested)
    order by s.created_at desc
    limit p_limit
  loop
    select net.http_post(
      url:='https://api.openai.com/v1/chat/completions',
      headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='openai_api_key')),
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