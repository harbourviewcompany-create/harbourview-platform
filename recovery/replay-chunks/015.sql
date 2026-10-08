
-- RECOVERY BEGIN 20260723084746_stage_f_hard_dispatch_ceilings.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260723084746.
--
-- Rewriting this file cannot affect production: 20260723084746 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Stage F (docs/INTELLIGENCE_ARCHITECTURE_SPEC.md Section 8): hard,
-- mechanical ceilings on every hv_* dispatch function's batch size, so no
-- caller -- a cron, a manual execute_sql call, a future orchestrator -- can
-- fire an unbounded batch of net.http_post calls in one invocation. This is
-- defense in depth alongside Stage E's cadence redesign: even at a safe
-- cadence, an unbounded p_limit argument could still blow the disk-IO
-- budget in a single tick. Ceilings chosen conservatively above the
-- defaults already in use live (so this is a no-op for current callers,
-- not a behavior change) but below anything that could plausibly repeat
-- the 2026-07-21/22 incidents.

create or replace function public.hv_translate_dispatch(p_limit integer default 30, p_eval_only boolean default false)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare r record; v_rid bigint; v_key text; n int := 0;
begin
  p_limit := least(greatest(coalesce(p_limit, 30), 1), 50);
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
declare v_rid bigint; v_inputs jsonb; v_ids text[];
begin
  v_ids := p_signal_ids[1 : least(coalesce(array_length(p_signal_ids,1),0), 100)];

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

create or replace function public.hv_dedup_assign(p_tau double precision default 0.90, p_scope_days integer default 120)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare n int;
begin
  p_scope_days := least(greatest(coalesce(p_scope_days, 120), 1), 400);
  p_tau := least(greatest(coalesce(p_tau, 0.90), 0.5), 0.999);
  update public.signals a
  set is_representative = not exists (
        select 1 from public.signals b
        where b.id <> a.id and b.embedding_1024 is not null
          and b.created_at > now() - (p_scope_days||' days')::interval
          and ( coalesce(b.score,0) > coalesce(a.score,0)
             or (coalesce(b.score,0) = coalesce(a.score,0) and b.created_at < a.created_at)
             or (coalesce(b.score,0) = coalesce(a.score,0) and b.created_at = a.created_at and b.id < a.id) )
          and (1 - (a.embedding_1024 <=> b.embedding_1024)) >= p_tau
      ),
      cluster_rep_id = coalesce((
        select b.id from public.signals b
        where b.id <> a.id and b.embedding_1024 is not null
          and b.created_at > now() - (p_scope_days||' days')::interval
          and (1 - (a.embedding_1024 <=> b.embedding_1024)) >= p_tau
          and ( coalesce(b.score,0) > coalesce(a.score,0)
             or (coalesce(b.score,0) = coalesce(a.score,0) and b.created_at < a.created_at)
             or (coalesce(b.score,0) = coalesce(a.score,0) and b.created_at = a.created_at and b.id < a.id) )
        order by (1 - (a.embedding_1024 <=> b.embedding_1024)) desc
        limit 1
      ), a.id)
  where a.embedding_1024 is not null
    and a.created_at > now() - (p_scope_days||' days')::interval;
  get diagnostics n = row_count;
  return n;
end$function$;

-- hv_pipeline_tick's own internal batch sizes (120 classify, 40 translate,
-- 40 entities, up to 100 embed ids) were already within the new ceilings
-- above, so its body is unchanged -- included here only so this migration
-- is a complete, idempotent re-capture, consistent with the baseline.
create or replace function public.hv_pipeline_tick()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
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

  return jsonb_build_object('classify_dispatched',v_cl_d,'entities_harvested',v_ent_h,'entities_dispatched',v_ent_d,'embed_dispatched',v_em_d);
end$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260723084746','stage_f_hard_dispatch_ceilings','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260723084746_stage_f_hard_dispatch_ceilings.sql

-- RECOVERY BEGIN 20260723084824_stage_g_pipeline_health_check.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260723084824.
--
-- Rewriting this file cannot affect production: 20260723084824 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Stage G (docs/INTELLIGENCE_ARCHITECTURE_SPEC.md Section 8), partial: an
-- on-demand health-check function for the hv_* pipeline and the two
-- previously-dangerous crons. This is NOT a new cron -- it adds no
-- always-on automation, so it cannot reproduce the disk-IO incidents.
-- Deliberately scoped down from "active alerting" (push notification on
-- a schedule) to "checkable state" because true push alerting needs a
-- delivery channel decision (email vs Slack vs something else) that's
-- Tyler's to make, not mine to assume. Call this manually, or wire it to
-- a low-frequency cron (e.g. hourly) once that channel decision is made.

create or replace function public.hv_pipeline_health()
returns table(metric text, value text, note text)
language sql
security definer
set search_path to 'public'
as $function$
  select 'unharvested_classify_jobs', count(*)::text,
         case when count(*) > 200 then 'backlog building -- check hv_classify_corpus_harvest is running' else 'ok' end
  from public.hv_classify_jobs where not harvested
  union all
  select 'unharvested_embed_jobs', count(*)::text,
         case when count(*) > 200 then 'backlog building -- check hv_embed_harvest is running' else 'ok' end
  from public.hv_embed_jobs where not harvested
  union all
  select 'unharvested_translation_jobs', count(*)::text,
         case when count(*) > 200 then 'backlog building -- check hv_translate_harvest is running' else 'ok' end
  from public.hv_translation_jobs where not harvested
  union all
  select 'unharvested_entity_jobs', count(*)::text,
         case when count(*) > 200 then 'backlog building -- check hv_entities_harvest is running' else 'ok' end
  from public.hv_entity_jobs where not harvested
  union all
  select 'hv_quality_pipeline_cron', coalesce((select active::text from cron.job where jobname = 'hv-quality-pipeline'), 'unscheduled'),
         case when exists (select 1 from cron.job where jobname = 'hv-quality-pipeline' and active)
              then 'ACTIVE -- was this re-enabled intentionally? See 20260722210000_baseline_hv_intelligence_pipeline.sql warning.'
              else 'ok (unscheduled, expected until Stage E/J land)' end
  union all
  select 'hv_quality_promote_cron', coalesce((select active::text from cron.job where jobname = 'hv-quality-promote'), 'unscheduled'),
         case when exists (select 1 from cron.job where jobname = 'hv-quality-promote' and active)
              then 'ACTIVE -- promotion is gated on Stage J explicit sign-off, confirm this was intentional'
              else 'ok (inactive, expected until Stage J sign-off)' end
  union all
  select 'classifier_gate_hv_v1', coalesce((select gate_passed::text from public.classifier_validation where classifier_version = 'hv-classify/openai/v1'), 'no_row'),
         case when coalesce((select gate_passed from public.classifier_validation where classifier_version = 'hv-classify/openai/v1'), false)
              then 'ok' else 'gate closed -- expected until Tyler decides on the 0.559 recall question' end;
$function$;

revoke all on function public.hv_pipeline_health() from public, anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260723084824','stage_g_pipeline_health_check','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260723084824_stage_g_pipeline_health_check.sql

-- RECOVERY BEGIN 20260723085105_stage_f_daily_dispatch_budget_ceiling.sql
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

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260723085105','stage_f_daily_dispatch_budget_ceiling','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260723085105_stage_f_daily_dispatch_budget_ceiling.sql

-- RECOVERY BEGIN 20260723090554_stage_d_daily_digest_preserve_real_type_confidence.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260723090554.
--
-- Rewriting this file cannot affect production: 20260723090554 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Stage D (docs/INTELLIGENCE_ARCHITECTURE_SPEC.md Section 8): the published
-- Digest surface was rendering every single item as REGULATION/80%
-- confidence regardless of actual content, because run_daily_digest()'s
-- editor-LLM prompt only ever asked for {headline, why_it_matters, market,
-- signal_id} -- it never requested or preserved the source ia_signals row's
-- real `type`/`confidence`, even though both exist and vary per row
-- (verified live: 230 regulatory, 50 market, 36 commercial, 12 legal, etc.,
-- confidence ranging 71-100, not a flat value).
--
-- Fix: rather than trust the editor LLM to echo back type/confidence
-- accurately (risk: hallucinated confidence numbers), re-derive them from
-- the source of truth by joining each returned headline back to
-- ia_signals via the signal_id it already returns. ia_signals.id is plain
-- text (already 's-'-prefixed), so this is a simple equality join, no
-- casting/format risk. Rows with no match (stale/deleted signal_id --
-- confirmed this already happens in live data) fall back to
-- type='regulatory', confidence=50 rather than failing the whole batch.
--
-- Only affects NEW editions generated after this migration. Already-
-- published daily_digest rows are untouched (no backfill/rewrite of
-- historical editions).

create or replace function public.run_daily_digest()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
declare
  v_anthropic_key text;
  v_openai_key text;
  v_gemini_key text;
  v_signals jsonb;
  v_signal_ids text[];
  v_provider text := null;
  v_attempts int;
  v_failures int;
  v_pre text := 'You are the editor of a daily B2B cannabis industry intelligence briefing. Below is a JSON array of qualified intelligence signals. Select the ~8 most commercially important (fewer if fewer are given), rewrite each as a sharp headline (max 110 chars) plus ONE editorial "why_it_matters" sentence a cannabis operator/investor would value. Group logically by market. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"headline": string, "why_it_matters": string, "market": string, "signal_id": string (the id field from the input signal you used)}. Order by importance.';
begin
  if exists (
    select 1 from daily_digest
    where digest_date = current_date
      and headlines is not null and jsonb_array_length(headlines) > 0
  ) then
    return jsonb_build_object('ok',true,'skipped','digest exists for today');
  end if;

  update _digest_jobs j set collected = true, status_code = 0
  where j.digest_date = current_date and not j.collected
    and j.created_at < now() - interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id = j.request_id);

  perform 1 from _digest_jobs j where j.digest_date = current_date and not j.collected;
  if found then
    with resp as (
      select j.request_id, j.signal_ids, j.provider, r.status_code,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as claude_text
      from _digest_jobs j join net._http_response r on r.id = j.request_id
      where j.digest_date = current_date and not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, signal_ids, provider, status_code,
             safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, signal_ids, p
      from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    enriched as (
      select o.request_id, o.signal_ids,
        (
          select jsonb_agg(
                   h || jsonb_build_object(
                     'type', coalesce(s.type, 'regulatory'),
                     'confidence', coalesce(s.confidence, 50)
                   )
                   order by ord
                 )
          from jsonb_array_elements(o.p) with ordinality as u(h, ord)
          left join ia_signals s on s.id = (h->>'signal_id')
        ) as p
      from ok o
    ),
    ins as (
      insert into daily_digest (digest_date, headlines, markets, status, generated_at)
      select current_date, e.p,
        (select coalesce(array_agg(distinct h->>'market'), '{}') from jsonb_array_elements(e.p) h),
        'published', now()
      from enriched e
      where e.p is not null
      on conflict (digest_date) do update
        set headlines = excluded.headlines,
            markets = (select coalesce(array_agg(distinct m), '{}') from unnest(daily_digest.markets || excluded.markets) m),
            status = 'published',
            updated_at = now()
      returning id
    ),
    mark_used as (
      update ia_signals s set used_in_digest_at = now()
      from enriched e where s.id = any(e.signal_ids) and exists (select 1 from ins)
      returning s.id
    ),
    mark_collected as (
      update _digest_jobs j set collected = true, status_code = p.status_code
      from parsed p where j.request_id = p.request_id
      returning j.request_id
    )
    select jsonb_build_object('ok',true,'phase','collect',
      'provider', (select provider from parsed),
      'published', exists(select 1 from ins),
      'signals_marked', (select count(*) from mark_used))
    into v_signals;

    return coalesce(v_signals, jsonb_build_object('ok',true,'phase','collect','published',false,'reason','response not ready or unparseable'));
  end if;

  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_anthropic_key is null and v_openai_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no anthropic_api_key, openai_api_key or gemini_api_key in vault');
  end if;

  select jsonb_agg(jsonb_build_object(
           'id', s.id, 'title', s.title, 'market', s.market, 'type', s.type,
           'confidence', s.confidence, 'commercial_impact', s.commercial_impact,
           'summary', s.summary, 'detected_at', s.detected_at)),
         array_agg(s.id)
  into v_signals, v_signal_ids
  from (
    select * from ia_signals
    where stage = 'qualified' and used_in_digest_at is null
      and created_at > now() - interval '7 days'
    order by (commercial_impact = 'high') desc, confidence desc, created_at desc
    limit 20
  ) s;

  if v_signals is null or jsonb_array_length(v_signals) < 3 then
    return jsonb_build_object('ok',true,'skipped','fewer than 3 unused qualified signals in last 7 days',
      'available', coalesce(jsonb_array_length(v_signals),0));
  end if;

  if v_anthropic_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _digest_jobs
      where provider='anthropic' and created_at > now() - interval '2 hours' and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'anthropic';
    end if;
  end if;

  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _digest_jobs
      where provider='openai' and created_at > now() - interval '2 hours' and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'openai';
    end if;
  end if;

  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _digest_jobs
      where provider='gemini' and created_at > now() - interval '2 hours' and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'gemini';
    end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('daily_digest', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('available_signals', jsonb_array_length(v_signals)))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded',
      'available', jsonb_array_length(v_signals));
  end if;

  if v_provider = 'anthropic' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object('x-api-key', v_anthropic_key, 'anthropic-version','2023-06-01','content-type','application/json'),
        body := jsonb_build_object('model','claude-haiku-4-5-20251001','max_tokens',2500,
          'messages', jsonb_build_array(jsonb_build_object('role','user','content',
            v_pre || E'\n\nSIGNALS:\n' || v_signals::text))),
        timeout_milliseconds := 60000
      ), current_date, v_signal_ids, 'anthropic'
    );
  elsif v_provider = 'openai' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
        body := jsonb_build_object('model','gpt-4o-mini','max_tokens',2500,'temperature',0,
          'messages', jsonb_build_array(
            jsonb_build_object('role','system','content',v_pre),
            jsonb_build_object('role','user','content', E'SIGNALS:\n' || v_signals::text)
          )),
        timeout_milliseconds := 60000
      ), current_date, v_signal_ids, 'openai'
    );
  else
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type','application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text', E'SIGNALS:\n' || v_signals::text)))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',2500)
        ),
        timeout_milliseconds := 60000
      ), current_date, v_signal_ids, 'gemini'
    );
  end if;

  return jsonb_build_object('ok',true,'phase','fire','provider',v_provider,'degraded',(v_provider <> 'anthropic'),'signals_sent',jsonb_array_length(v_signals));
end $function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260723090554','stage_d_daily_digest_preserve_real_type_confidence','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260723090554_stage_d_daily_digest_preserve_real_type_confidence.sql

-- RECOVERY BEGIN 20260723090942_stage_d_backfill_todays_digest_type_confidence.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260723090942.
--
-- Rewriting this file cannot affect production: 20260723090942 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- One-time backfill for today's already-published daily_digest row, so the
-- REGULATION/80% display bug (see
-- ..._stage_d_daily_digest_preserve_real_type_confidence.sql, applied
-- immediately before this) is corrected on the live surface today rather
-- than only for tomorrow's freshly-generated edition. Same join logic as
-- the function fix. Only ADDS type/confidence keys to each headline
-- element -- headline/why_it_matters/market/signal_id are untouched.
-- Idempotent: guarded to only run if the first headline element doesn't
-- already have a 'type' key.

update public.daily_digest d
set headlines = (
  select jsonb_agg(
           h || jsonb_build_object(
             'type', coalesce(s.type, 'regulatory'),
             'confidence', coalesce(s.confidence, 50)
           )
           order by ord
         )
  from jsonb_array_elements(d.headlines) with ordinality as u(h, ord)
  left join public.ia_signals s on s.id = (h->>'signal_id')
)
where d.digest_date = current_date
  and d.headlines is not null
  and jsonb_array_length(d.headlines) > 0
  and not (d.headlines->0 ? 'type');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260723090942','stage_d_backfill_todays_digest_type_confidence','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260723090942_stage_d_backfill_todays_digest_type_confidence.sql

-- RECOVERY BEGIN 20260723104818_refine_status_says_prohibited_self_qualifying_exceptions.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260723104818.
--
-- Rewriting this file cannot affect production: 20260723104818 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- status_says_prohibited previously matched any "Prohibited%" prefix regardless of what
-- followed, so entries that already correctly self-qualify -- Japan's "Prohibited
-- (Recreational); Limited Pharmaceutical Access (2024)", and my own Sri Lanka correction
-- ("Prohibited; Ayurvedic Channel Formally Legal; New Export-Only Scheme (2025)") -- got flagged
-- as conflicts even though the briefing already agrees with the playbook, just phrased with
-- "Prohibited" leading before the real exception. Added a NOT clause: a "Prohibited%" status
-- only counts as a genuine blanket claim if it does NOT also contain exception language
-- (Legal/Licens/Channel/Scheme/Access/Established) elsewhere in the same string.
-- Deliberately did NOT add "Program"/"Programme" to that exception list: Albania's original
-- (confirmed wrong) entry read "Prohibited -- No Medical Programme" -- the word appears there
-- specifically to deny a program exists, not assert one, so including it would have hidden a
-- real error rather than filtered a false positive. Verified this distinction against all 8
-- confirmed corrections from this session before shipping -- none of them contain the six
-- exception words used here, only the two self-qualified entries do.
-- Known remaining risk, stated plainly rather than hidden: a future entry phrased as "No Legal
-- Pathway" (negating "Legal") would be wrongly excluded by this same logic. Substring matching
-- cannot fully solve negation detection -- every hit still needs a human or agent to read it.

CREATE OR REPLACE VIEW public.jurisdiction_cross_table_conflicts AS
WITH jp AS (
  SELECT
    country_iso2, country_name, difficulty, last_reviewed, estimated_cost_range,
    NOT (
      steps = '[]'::jsonb
      OR estimated_cost_range ILIKE 'Not applicable%'
      OR estimated_cost_range ILIKE '%no operating commercial%'
      OR estimated_cost_range ILIKE '%no established commercial%'
      OR steps::text ILIKE '%no licensing pathway%'
      OR steps::text ILIKE '%not currently registered%'
      OR steps::text ILIKE '%categorically prohibited%'
    ) AS has_market_pathway,
    (
      steps = '[]'::jsonb
      OR estimated_cost_range ILIKE 'Not applicable%'
      OR estimated_cost_range ILIKE '%no operating commercial%'
      OR estimated_cost_range ILIKE '%no established commercial%'
      OR steps::text ILIKE '%no licensing pathway%'
      OR steps::text ILIKE '%not currently registered%'
      OR steps::text ILIKE '%categorically prohibited%'
    ) AS looks_prohibited
  FROM public.jurisdiction_playbooks
  WHERE status = 'published'
),
mm AS (
  SELECT country_iso2, count(*) AS metric_count
  FROM public.market_metrics
  GROUP BY country_iso2
),
cc AS (
  SELECT
    country_iso2, program_status, last_reviewed_date,
    (
      program_status ILIKE 'Prohibited%'
      AND NOT (
        program_status ILIKE '%Legal%' OR program_status ILIKE '%Licens%' OR program_status ILIKE '%Channel%'
        OR program_status ILIKE '%Scheme%' OR program_status ILIKE '%Access%' OR program_status ILIKE '%Established%'
      )
    ) AS status_says_prohibited,
    (
      program_status ILIKE 'Medical%' OR program_status ILIKE 'Legal%' OR program_status ILIKE 'Adult-Use%'
      OR (program_status ILIKE 'Decriminalized%' AND (program_status ILIKE '%Authority%' OR program_status ILIKE '%Licens%'))
    ) AS status_says_reform,
    (program_status ILIKE '%no formal%' OR public_summary ILIKE '%no formal%program%' OR public_summary ILIKE '%expressed interest in developing%') AS status_understates_maturity
  FROM public.cc_jurisdiction_briefings
  WHERE state_iso2 IS NULL
)
SELECT
  jp.country_iso2,
  jp.country_name,
  jp.difficulty AS playbook_difficulty,
  jp.last_reviewed AS playbook_last_reviewed,
  cc.program_status AS briefing_program_status,
  cc.last_reviewed_date AS briefing_last_reviewed,
  coalesce(mm.metric_count, 0) AS playbook_metric_count,
  CASE
    WHEN jp.looks_prohibited AND cc.status_says_reform
      THEN 'polarity_conflict: playbook says prohibited, briefing implies reform/legal'
    WHEN jp.has_market_pathway AND cc.status_says_prohibited
      THEN 'polarity_conflict: playbook documents a real pathway, briefing says prohibited'
    WHEN jp.has_market_pathway AND coalesce(mm.metric_count, 0) >= 3 AND cc.status_understates_maturity
      THEN 'maturity_understated: briefing implies no program despite playbook + metrics documenting an operational one'
  END AS conflict_type,
  (cc.last_reviewed_date < jp.last_reviewed) AS briefing_predates_playbook
FROM jp
JOIN cc ON cc.country_iso2 = jp.country_iso2
LEFT JOIN mm ON mm.country_iso2 = jp.country_iso2
WHERE
  (jp.looks_prohibited AND cc.status_says_reform)
  OR (jp.has_market_pathway AND cc.status_says_prohibited)
  OR (jp.has_market_pathway AND coalesce(mm.metric_count, 0) >= 3 AND cc.status_understates_maturity)
ORDER BY jp.country_iso2;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260723104818','refine_status_says_prohibited_self_qualifying_exceptions','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260723104818_refine_status_says_prohibited_self_qualifying_exceptions.sql

-- RECOVERY BEGIN 20260723180000_revoke_legacy_jurisdiction_briefings_grants.sql
-- Applied directly to production via Supabase MCP under a different, correct
-- timestamp: see 20260727002735_revoke_legacy_jurisdiction_briefings_grants.sql
-- (see supabase_migrations.schema_migrations for the authoritative applied
-- version). This file is a no-op stub kept only so this timestamp does not
-- show up as ledger-vs-repo drift.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260723180000','revoke_legacy_jurisdiction_briefings_grants','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260723180000_revoke_legacy_jurisdiction_briefings_grants.sql

-- RECOVERY BEGIN 20260723183914_lock_down_21_anon_exposed_public_tables.sql
-- Reconstructed from production.
--
-- Repository-only replay-fidelity repair. Production already records version
-- 20260723183914, so changing this file cannot re-apply it to production.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    '_claude_push_staging', '_claude_scratch', '_counterparty_enrich_jobs',
    '_counterparty_jobs', '_country_enrich_jobs', '_digest_jobs',
    '_editorial_digest_jobs', '_education_gen_jobs', '_education_regen_jobs',
    '_hv_branch_audit', '_hv_file_stage', '_hv_file_stage2', '_hv_push_stage',
    '_sig_extract_jobs', 'country_name_aliases',
    'education_module_sections_backup_20260705', 'hv_reclassify_jobs',
    'jurisdiction_playbooks_research_queue', 'legislative_bills',
    'schema_drift_allowlist', 'signal_geo_labels'
  ]
  LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    END IF;
  END LOOP;
END $$;

INSERT INTO public.schema_drift_allowlist (table_name, reason) VALUES
  ('_claude_push_staging', 'internal staging table for github-bridge, RLS+grants locked 2026-07-23'),
  ('_hv_file_stage', 'internal staging table, RLS+grants locked 2026-07-23'),
  ('_hv_file_stage2', 'internal staging table, RLS+grants locked 2026-07-23'),
  ('_hv_push_stage', 'internal staging table, RLS+grants locked 2026-07-23'),
  ('_hv_branch_audit', 'internal audit trail, RLS+grants locked 2026-07-23'),
  ('country_name_aliases', 'read only by trg_signals_resolve_geo (SECURITY DEFINER trigger); no client read path; RLS+grants locked 2026-07-23'),
  ('signal_geo_labels', 'read only by trg_signals_resolve_geo (SECURITY DEFINER trigger); no client read path; RLS+grants locked 2026-07-23'),
  ('hv_reclassify_jobs', 'internal job queue, RLS+grants locked 2026-07-23'),
  ('jurisdiction_playbooks_research_queue', 'internal pipeline queue populated by migrations only, no client read path; RLS+grants locked 2026-07-23'),
  ('legislative_bills', 'no client read path yet, not wired into any feature; RLS+grants locked 2026-07-23'),
  ('schema_drift_allowlist', 'internal monitoring config table, RLS+grants locked 2026-07-23')
ON CONFLICT (table_name) DO NOTHING;

UPDATE public.schema_drift_alerts
SET resolved = true, resolved_at = now()
WHERE object_name IN (
  '_claude_push_staging', '_hv_file_stage', '_hv_file_stage2', '_hv_push_stage',
  '_hv_branch_audit', 'country_name_aliases', 'signal_geo_labels',
  'hv_reclassify_jobs', 'jurisdiction_playbooks_research_queue',
  'legislative_bills', 'schema_drift_allowlist'
) AND resolved = false;

NOTIFY pgrst, 'reload schema';

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260723183914','lock_down_21_anon_exposed_public_tables','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260723183914_lock_down_21_anon_exposed_public_tables.sql

-- RECOVERY BEGIN 20260723190000_lock_down_21_anon_exposed_public_tables.sql
-- Applied directly to production via Supabase MCP.
-- File added to satisfy local/remote migration history parity
-- (see supabase_migrations.schema_migrations for the original
-- application timestamp). No DDL executed by this file.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260723190000','lock_down_21_anon_exposed_public_tables','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260723190000_lock_down_21_anon_exposed_public_tables.sql

-- RECOVERY BEGIN 20260723211512_correct_cc_briefings_gh_la_pk.sql
-- Retroactive reconciliation: applied directly to production via Supabase MCP on 20260723211512.\n-- Committed here per the migration-drift protocol to keep supabase/migrations/ in sync with\n-- supabase_migrations.schema_migrations. Statement below is the exact DDL/DML that was executed.\n\n-- Final three corrections closing out the jurisdiction_cross_table_conflicts queue from this
-- audit cycle. GH independently re-verified via 9 sources including NACOC's own licensing portal
-- and a named-official direct quote -- highest confidence of the batch. LA/PK rely on the
-- existing professional-grade sourcing already in jurisdiction_playbooks (CMS Expert Guides,
-- Tilleke & Gibbins, CCRA's own official site), consistent with how the rest of this cluster
-- was handled.

UPDATE public.cc_jurisdiction_briefings SET
  program_status = 'Medical/Industrial Legal and Operational (Since Feb 2026); NACOC-Licensed',
  public_summary = 'Ghana''s Interior Minister formally launched the Medicinal and Industrial Cannabis Program on 26 February 2026, activating a licensing regime under the Narcotics Control Commission (NACOC) pursuant to the Narcotics Control Commission (Amendment) Act, 2023 (Act 1100) and the Cultivation and Management of Cannabis Regulation, 2023 (L.I. 2475). NACOC opened licence applications in April 2026 across 11 categories (cultivation, processing, distribution, transport, research, import, export). Licences are restricted to Ghanaian citizens/permanent residents aged 18+ (individuals) or companies with at least 50% Ghanaian ownership and majority-Ghanaian directors, explicitly favoring the Ghanaian diaspora over foreign investors. Cultivated material is capped at 0.3% THC dry-weight. A named NACOC official has publicly stated that qualifying applicants are guaranteed a licence. Recreational cannabis remains illegal.',
  regulatory_outlook = 'This is an actively operating program, not a proposal -- applications opened and licences were being processed as of April 2026. Near-term development is program scale-up and diaspora investment uptake, not further legislative change.',
  data_source_summary = 'Ghana Ministry of the Interior official announcement; NACOC official licensing portal (ncc.gov.gh); Graphic Online (named NACOC official quote); Pulse Ghana; CitiNewsRoom; NewsGhana.',
  confidence_score = 0.88, confidence_categories = '{"enforcement": 0.75, "market_access": 0.8, "regulatory_framework": 0.9}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry said reform is merely under discussion; Ghana launched an operational licensing program in Feb 2026 and NACOC opened applications across 11 categories in April 2026", "market": "Ghana", "timeAgo": "20 July 2026", "direction": "up", "sourceRef": "Ghana Ministry of the Interior; NACOC official portal; Graphic Online", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-20', updated_at = now()
WHERE country_iso2 = 'GH';

UPDATE public.cc_jurisdiction_briefings SET
  program_status = 'Industrial Hemp Legal (Narrow, Since 2022); General Cannabis Remains Category I Narcotic',
  public_summary = 'Laos legalized a narrow industrial hemp pathway via Ministry of Health Decision 3789/MOH (2022), permitting hemp with THC capped at 0.2% in raw material and 1% by weight in processed product, subject to authorized seed registration and traceable origin documentation. This carve-out is narrow and does not extend to cannabis broadly: any higher-THC material remains a Category I narcotic offense, with penalties up to death for large quantities. Multiple procedural elements (THC-testing methodology, reporting cadence, feasibility-study requirements) remain unclarified in public guidance; legal analysts expect gaps to be resolved through Ministry of Health administrative practice rather than further published rulemaking. No medical cannabis program exists; enforcement of the broader prohibition has historically been inconsistent, particularly in rural/tourism contexts, alongside documented traditional use in some hill-tribe communities.',
  regulatory_outlook = 'The hemp carve-out is real but operationally underspecified; specialized local legal counsel with direct Ministry relationships is a practical prerequisite given the ambiguity, not merely a formality. No broader medical or recreational reform is signaled.',
  data_source_summary = 'CMS Expert Guides; two Tilleke & Gibbins legal analyses (Laos/SE Asia-focused); WSR Law Group regulatory summary.',
  confidence_score = 0.78, confidence_categories = '{"enforcement": 0.55, "market_access": 0.35, "regulatory_framework": 0.75}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry said prohibited with no qualification; a narrow industrial hemp pathway (Decision 3789/MOH) has been legal since 2022, though general cannabis remains a Category I narcotic", "market": "Laos", "timeAgo": "20 July 2026", "direction": "up", "sourceRef": "CMS Expert Guides; Tilleke & Gibbins", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-20', updated_at = now()
WHERE country_iso2 = 'LA';

UPDATE public.cc_jurisdiction_briefings SET
  program_status = 'Regulatory Authority Established (CCRA); Building Toward Licensing, No Licences Confirmed Issued',
  public_summary = 'Pakistan established the Cannabis Control & Regulatory Authority (CCRA) and has been actively building licensing infrastructure, including an E-Licensing Portal (ccra.gov.pk) designed around tiered capacity management from small test plots to large commercial operations; CCRA was still finalizing its physical headquarters as of May 2026 and has issued explicit public fraud warnings against third parties falsely claiming to offer CCRA licensing services. Licences, once issued, run five-year terms subject to regular inspection, with severe penalty exposure for unauthorized activity (PKR 1,000,000-10,000,000 for individuals; up to PKR 200,000,000 for companies). No independent source as of mid-2026 confirms any licence has actually been issued or that operational cultivation has begun -- this is real regulatory infrastructure under active construction, not yet an operating market. Separately, bhang (a traditional cannabis-infused drink) occupies a longstanding cultural/religious grey area, technically prohibited under the Control of Narcotic Substances Act 1997 but tolerated at some festival contexts (Basant, Holi-linked celebrations).',
  regulatory_outlook = 'CCRA''s own institutional readiness -- not further legislation -- is the gating factor to watch; the regulator itself was still finalizing headquarters as of May 2026. Treat any claim of an already-operating Pakistani cannabis market with skepticism pending independent confirmation of actual issued licences.',
  data_source_summary = 'Cannabis Control & Regulatory Authority Pakistan (ccra.gov.pk, official); Wikipedia.',
  confidence_score = 0.78, confidence_categories = '{"enforcement": 0.55, "market_access": 0.3, "regulatory_framework": 0.75}'::jsonb,
  change_notes = change_notes || '[{"title": "Correction: prior entry omitted the CCRA entirely; a real regulatory authority exists and is actively building licensing infrastructure (E-Licensing Portal, headquarters buildout), though no licences are independently confirmed issued yet", "market": "Pakistan", "timeAgo": "20 July 2026", "direction": "up", "sourceRef": "CCRA official site; Wikipedia", "reviewState": "reviewed"}]'::jsonb,
  last_reviewed_date = '2026-07-20', updated_at = now()
WHERE country_iso2 = 'PK';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260723211512','correct_cc_briefings_gh_la_pk','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260723211512_correct_cc_briefings_gh_la_pk.sql

-- RECOVERY BEGIN 20260724000000_fix_entity_decode_blanking_bug_in_signal_extraction.sql
-- Applied directly to production via Supabase MCP.
-- File added to satisfy local/remote migration history parity
-- (see supabase_migrations.schema_migrations for the original
-- application timestamp). No DDL executed by this file.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260724000000','fix_entity_decode_blanking_bug_in_signal_extraction','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260724000000_fix_entity_decode_blanking_bug_in_signal_extraction.sql

-- RECOVERY BEGIN 20260724105120_fix_entity_decode_blanking_bug_in_signal_extraction.sql
-- Retroactive reconciliation: applied directly to production via Supabase MCP on 20260724105120.\n-- Committed here per the migration-drift protocol to keep supabase/migrations/ in sync with\n-- supabase_migrations.schema_migrations. Statement below is the exact DDL/DML that was executed.\n\n-- Fixes a real bug found via CodeRabbit review on PR #1125: the sanitize
-- step added 2026-07-21 claims to "decode" HTML entities but actually
-- replaces &amp;/&lt;/&gt;/&quot;/&#39; with a literal space each, same as
-- &nbsp;. So "A & B" -> "A  B" and "it's" -> "it s" -- degrading exactly the
-- headline/summary text this fix was meant to clean up, for every row
-- processed since. Replaces each entity with its actual decoded character
-- instead. &amp; is decoded last (standard order, avoids a literal '&'
-- from an earlier step being caught by a later entity pattern).

CREATE OR REPLACE FUNCTION public.hv_extract_signals_from_captured_text(p_batch_size integer DEFAULT 50)
 RETURNS TABLE(snapshot_id uuid, source_name text, country text, candidates_found integer, status_set text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_snap          RECORD;
  v_source        RECORD;
  v_sentences     TEXT[];
  v_sentence      TEXT;
  v_candidates    JSONB;
  v_candidate     JSONB;
  v_kw_count      INT;
  v_chunk_start   INT;
  v_chunk         TEXT;
  v_found         INT;
  v_text_lower    TEXT;

  v_kw_pattern CONSTANT TEXT :=
    '\m(cannabis|hemp|cannabinoid|cbd|thc|marijuana|marihuana|chanvre|'
    'ca[nñ]amo|ganja|kannabis|bhang|canabis|canapa|kif|haschisch|haschish|'
    'hashish|weed|narcotics|narcotic|stupefiant|estupefaciente|'
    'controlled substance|substance contr[oô]l[eé]|'
    'pharmaceutical|pharmaceutique|farmac[eé]utico|'
    'medicinal plant|plante m[eé]dicinale|planta medicinal|'
    'licence|licencia|autorisation|permiso|registro|'
    'import permit|export permit|clinical trial|essai clinique|'
    'ensayo cl[ií]nico|konopie|konopi|hennep|c[aâ]nhamo|maconha|'
    'psilocybin|psychotropic|narcotic drugs|'
    'dea|fda|ema|who|oms|bfarm|mhra|tga|sahpra|anvisa|cofepris|invima|'
    'okana|halmed|imca|cdsco|nafdac|infarmed|swissmedic|ansm|igj|gif|'
    'sukl|zva|vvkt|arcsa|anmat|dangerous drugs board|narcotics control|'
    'pharmacy and poisons board)\M';

  v_boilerplate CONSTANT TEXT[] := ARRAY[
    'opens new tab','creative commons','code of conduct',
    'hardware, software','cookie policy','privacy policy',
    'all rights reserved','javascript','please enable',
    'sign in','log in','subscribe','newsletter','follow us',
    'terms of use','terms of service','contact us','about us',
    'sitemap','search results','page not found','404',
    '403 forbidden','access denied'
  ];

BEGIN

  FOR v_snap IN
    SELECT ss.id, ss.source_id, ss.captured_url, ss.captured_title,
           ss.captured_text, ss.intelligence_pass, ss.language_detected,
           ss.word_count, ss.captured_at
    FROM source_snapshots ss
    WHERE ss.processing_status = 'pending'
      AND ss.signal_candidates IS NULL
      AND ss.fetch_status = 'success'
      AND ss.captured_text IS NOT NULL
      AND length(ss.captured_text) > 50
    ORDER BY ss.captured_at ASC
    LIMIT p_batch_size
  LOOP

    -- 2026-07-21: strip HTML tags. 2026-07-24: fixed entity handling --
    -- previously blanked &amp;/&lt;/&gt;/&quot;/&#39; to a space (same as
    -- &nbsp;) instead of decoding them, corrupting text like "A & B" ->
    -- "A  B". Now decodes each to its real character; &amp; last, since
    -- decoding it first could let a leftover literal "&" combine with
    -- trailing entity-shaped text and get wrongly re-decoded.
    v_snap.captured_text := regexp_replace(v_snap.captured_text, '<[^>]+>', ' ', 'g');
    v_snap.captured_text := regexp_replace(v_snap.captured_text, '&nbsp;', ' ', 'gi');
    v_snap.captured_text := regexp_replace(v_snap.captured_text, '&lt;', '<', 'gi');
    v_snap.captured_text := regexp_replace(v_snap.captured_text, '&gt;', '>', 'gi');
    v_snap.captured_text := regexp_replace(v_snap.captured_text, '&quot;', '"', 'gi');
    v_snap.captured_text := regexp_replace(v_snap.captured_text, '&#39;', '''', 'gi');
    v_snap.captured_text := regexp_replace(v_snap.captured_text, '&amp;', '&', 'gi');
    v_snap.captured_text := regexp_replace(v_snap.captured_text, '\s+', ' ', 'g');
    v_snap.captured_text := trim(v_snap.captured_text);

    -- 2026-07-06: added sr.source_type so downstream extraction (hv-extract
    -- edge function) can route mainstream_media snapshots to the editorial
    -- pipeline instead of the trade-signal pipeline. Previously this metadata
    -- was dropped here, so ALL snapshots (including mainstream news) fell
    -- through to trade-signal scoring regardless of source_registry.source_type.
    SELECT sr.source_name, sr.tier, sr.iso, sr.country, sr.region,
           sr.jurisdiction_code, sr.source_type,
           sr.signal_keywords, sr.source_url
    INTO v_source
    FROM source_registry sr WHERE sr.id = v_snap.source_id;

    UPDATE source_snapshots SET processing_status = 'processing' WHERE id = v_snap.id;

    v_candidates := '[]'::JSONB;
    v_found      := 0;
    v_text_lower := lower(v_snap.captured_text);

    IF v_text_lower !~ v_kw_pattern THEN
      UPDATE source_snapshots
        SET processing_status = 'skipped',
            signal_candidates = jsonb_build_object(
              'skip_reason',   'no_keywords_found',
              'source_name',   v_source.source_name,
              'source_country', v_source.country,
              'source_type',   v_source.source_type,
              'source_region', v_source.region,
              'tier',          v_source.tier,
              'item_kind',     'html_snapshot'
            )
      WHERE id = v_snap.id;

      snapshot_id      := v_snap.id;
      source_name      := v_source.source_name;
      country          := v_source.country;
      candidates_found := 0;
      status_set       := 'skipped';
      RETURN NEXT;
      CONTINUE;
    END IF;

    v_sentences := regexp_split_to_array(
      regexp_replace(v_snap.captured_text, E'\\r\\n|\\r', E'\\n', 'g'),
      E'(?<=[.!?।।]\\s)|\\n{2,}'
    );

    v_chunk       := '';
    v_chunk_start := 0;

    FOREACH v_sentence IN ARRAY v_sentences
    LOOP
      v_sentence := trim(v_sentence);
      CONTINUE WHEN length(v_sentence) < 15;

      IF length(v_chunk) + length(v_sentence) > 600 OR v_chunk = '' THEN
        IF length(v_chunk) >= 30 THEN
          DECLARE
            v_chunk_lower TEXT := lower(v_chunk);
            v_kc INT := 0;
            v_is_boilerplate BOOLEAN := FALSE;
            v_bp TEXT;
          BEGIN
            SELECT COUNT(*) INTO v_kc
            FROM regexp_matches(v_chunk_lower, v_kw_pattern, 'g') AS m;

            IF v_kc > 0 THEN
              FOREACH v_bp IN ARRAY v_boilerplate LOOP
                IF v_chunk_lower LIKE '%' || v_bp || '%' THEN
                  v_is_boilerplate := TRUE;
                  EXIT;
                END IF;
              END LOOP;

              IF NOT v_is_boilerplate AND length(trim(v_chunk)) >= 30 THEN
                v_candidate := jsonb_build_object(
                  'text',               left(v_chunk, 500),
                  'keyword_count',      v_kc,
                  'source_country',     v_source.country,
                  'source_iso',         v_source.iso,
                  'source_type',        v_source.source_type,
                  'source_name',        v_source.source_name,
                  'source_region',      v_source.region,
                  'lead_weeks',         4,
                  'intelligence_pass',  COALESCE(v_snap.intelligence_pass, 1),
                  'requires_translation',
                    CASE WHEN v_snap.language_detected NOT IN ('en', 'english')
                         THEN TRUE ELSE FALSE END
                );
                v_candidates := v_candidates || v_candidate;
                v_found := v_found + 1;
              END IF;
            END IF;
          END;
        END IF;

        v_chunk := v_sentence;
      ELSE
        v_chunk := v_chunk || ' ' || v_sentence;
      END IF;
    END LOOP;

    IF length(v_chunk) >= 30 THEN
      DECLARE
        v_chunk_lower TEXT := lower(v_chunk);
        v_kc INT := 0;
        v_is_boilerplate BOOLEAN := FALSE;
        v_bp TEXT;
      BEGIN
        SELECT COUNT(*) INTO v_kc
        FROM regexp_matches(v_chunk_lower, v_kw_pattern, 'g') AS m;

        IF v_kc > 0 THEN
          FOREACH v_bp IN ARRAY v_boilerplate LOOP
            IF v_chunk_lower LIKE '%' || v_bp || '%' THEN
              v_is_boilerplate := TRUE; EXIT;
            END IF;
          END LOOP;

          IF NOT v_is_boilerplate THEN
            v_candidate := jsonb_build_object(
              'text',               left(v_chunk, 500),
              'keyword_count',      v_kc,
              'source_country',     v_source.country,
              'source_iso',         v_source.iso,
              'source_type',        v_source.source_type,
              'source_name',        v_source.source_name,
              'source_region',      v_source.region,
              'lead_weeks',         4,
              'intelligence_pass',  COALESCE(v_snap.intelligence_pass, 1),
              'requires_translation',
                CASE WHEN v_snap.language_detected NOT IN ('en', 'english')
                     THEN TRUE ELSE FALSE END
            );
            v_candidates := v_candidates || v_candidate;
            v_found := v_found + 1;
          END IF;
        END IF;
      END;
    END IF;

    IF v_found = 0 THEN
      UPDATE source_snapshots
        SET processing_status = 'skipped',
            signal_candidates = jsonb_build_object(
              'skip_reason',    'no_valid_chunks',
              'source_name',    v_source.source_name,
              'source_country', v_source.country,
              'source_type',    v_source.source_type,
              'source_region',  v_source.region,
              'tier',           v_source.tier,
              'item_kind',      'html_snapshot',
              'matched_keywords', ARRAY(
                SELECT m[1] FROM regexp_matches(v_text_lower, v_kw_pattern, 'g') AS m
                LIMIT 5
              )
            )
      WHERE id = v_snap.id;

      snapshot_id := v_snap.id; source_name := v_source.source_name;
      country := v_source.country; candidates_found := 0; status_set := 'skipped';
      RETURN NEXT;
      CONTINUE;
    END IF;

    UPDATE source_snapshots
      SET signal_candidates = v_candidates,
          processing_status = 'extracted',
          processed_at      = now()
    WHERE id = v_snap.id;

    snapshot_id := v_snap.id; source_name := v_source.source_name;
    country := v_source.country; candidates_found := v_found; status_set := 'extracted';
    RETURN NEXT;

  END LOOP;
END;
$function$;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260724105120','fix_entity_decode_blanking_bug_in_signal_extraction','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260724105120_fix_entity_decode_blanking_bug_in_signal_extraction.sql

-- RECOVERY BEGIN 20260724112649_extract_conflict_classifiers_and_add_test_suite.sql
-- Retroactive reconciliation: applied directly to production via Supabase MCP on 20260724112649.\n-- Committed here per the migration-drift protocol to keep supabase/migrations/ in sync with\n-- supabase_migrations.schema_migrations. Statement below is the exact DDL/DML that was executed.\n\n-- Turns "debugged by eyeballing query output four times" into something that can actually be
-- tested. Extracts the classification logic that was inline in the view into named, reusable
-- functions, then adds a real test function that asserts known cases and RAISES on failure --
-- re-runnable, not a one-off manual check.
-- Chose function-extraction over a blocking CHECK constraint: a constraint forcing one "no
-- pathway" encoding would require destructively rewriting Malaysia's steps content (real,
-- useful monitoring guidance) just to satisfy a shape rule. The view already has to handle
-- legitimate variation in how "no pathway" gets written; better to make that handling itself
-- the tested, single source of truth than to outlaw the variation and lose content.

CREATE OR REPLACE FUNCTION public.jp_has_market_pathway(p_steps jsonb, p_cost_range text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT NOT (
    p_steps = '[]'::jsonb
    OR p_cost_range ILIKE 'Not applicable%'
    OR p_cost_range ILIKE '%no operating commercial%'
    OR p_cost_range ILIKE '%no established commercial%'
    OR p_steps::text ILIKE '%no licensing pathway%'
    OR p_steps::text ILIKE '%not currently registered%'
    OR p_steps::text ILIKE '%categorically prohibited%'
  );
$$;

CREATE OR REPLACE FUNCTION public.cc_status_says_prohibited(p_status text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT (
    p_status ILIKE 'Prohibited%'
    AND NOT (
      p_status ILIKE '%Legal%' OR p_status ILIKE '%Licens%' OR p_status ILIKE '%Channel%'
      OR p_status ILIKE '%Scheme%' OR p_status ILIKE '%Access%' OR p_status ILIKE '%Established%'
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.cc_status_says_reform(p_status text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT (
    p_status ILIKE 'Medical%' OR p_status ILIKE 'Legal%' OR p_status ILIKE 'Adult-Use%'
    OR (p_status ILIKE 'Decriminalized%' AND (p_status ILIKE '%Authority%' OR p_status ILIKE '%Licens%'))
  );
$$;

-- Rewire the view to call the same functions the tests exercise -- one source of truth.
CREATE OR REPLACE VIEW public.jurisdiction_cross_table_conflicts AS
WITH jp AS (
  SELECT
    country_iso2, country_name, difficulty, last_reviewed, estimated_cost_range,
    public.jp_has_market_pathway(steps, estimated_cost_range) AS has_market_pathway,
    NOT public.jp_has_market_pathway(steps, estimated_cost_range) AS looks_prohibited
  FROM public.jurisdiction_playbooks
  WHERE status = 'published'
),
mm AS (
  SELECT country_iso2, count(*) AS metric_count FROM public.market_metrics GROUP BY country_iso2
),
cc AS (
  SELECT
    country_iso2, program_status, last_reviewed_date,
    public.cc_status_says_prohibited(program_status) AS status_says_prohibited,
    public.cc_status_says_reform(program_status) AS status_says_reform,
    (program_status ILIKE '%no formal%' OR public_summary ILIKE '%no formal%program%' OR public_summary ILIKE '%expressed interest in developing%') AS status_understates_maturity
  FROM public.cc_jurisdiction_briefings
  WHERE state_iso2 IS NULL
)
SELECT
  jp.country_iso2, jp.country_name, jp.difficulty AS playbook_difficulty, jp.last_reviewed AS playbook_last_reviewed,
  cc.program_status AS briefing_program_status, cc.last_reviewed_date AS briefing_last_reviewed,
  coalesce(mm.metric_count, 0) AS playbook_metric_count,
  CASE
    WHEN jp.looks_prohibited AND cc.status_says_reform THEN 'polarity_conflict: playbook says prohibited, briefing implies reform/legal'
    WHEN jp.has_market_pathway AND cc.status_says_prohibited THEN 'polarity_conflict: playbook documents a real pathway, briefing says prohibited'
    WHEN jp.has_market_pathway AND coalesce(mm.metric_count, 0) >= 3 AND cc.status_understates_maturity THEN 'maturity_understated: briefing implies no program despite playbook + metrics documenting an operational one'
  END AS conflict_type,
  (cc.last_reviewed_date < jp.last_reviewed) AS briefing_predates_playbook
FROM jp
JOIN cc ON cc.country_iso2 = jp.country_iso2
LEFT JOIN mm ON mm.country_iso2 = jp.country_iso2
WHERE
  (jp.looks_prohibited AND cc.status_says_reform)
  OR (jp.has_market_pathway AND cc.status_says_prohibited)
  OR (jp.has_market_pathway AND coalesce(mm.metric_count, 0) >= 3 AND cc.status_understates_maturity)
ORDER BY jp.country_iso2;

-- The actual test suite: hardcoded assertions against the real cases that broke this session,
-- plus the real cases that must keep working. RAISES EXCEPTION on any failure -- re-run this
-- after any future change to the classifier functions, not just at build time.
CREATE OR REPLACE FUNCTION public.test_jurisdiction_conflict_classifiers()
RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  -- Iran/Kuwait: one-item array whose only content denies a pathway. Must read as prohibited.
  IF public.jp_has_market_pathway('["No licensing pathway exists under current law"]'::jsonb, NULL) THEN
    RAISE EXCEPTION 'TEST FAILED: Iran-style one-string-array should NOT count as a market pathway';
  END IF;
  -- Malaysia: multi-step array entirely about the absence of a pathway. Must read as prohibited.
  IF public.jp_has_market_pathway(
    '[{"step":"Recognize there is no operational commercial pathway as of 2026"},{"step":"Treat any hemp/CBD plans as categorically prohibited, not merely restricted"}]'::jsonb, NULL
  ) THEN
    RAISE EXCEPTION 'TEST FAILED: Malaysia-style all-negative multi-step array should NOT count as a market pathway';
  END IF;
  -- Greece: 4 real steps + 1 step that carves out only recreational. Must NOT read as prohibited --
  -- this is the bifurcated-status bug that produced the Greece false positive.
  IF NOT public.jp_has_market_pathway(
    '[{"step":"Obtain EOF marketing authorisation"},{"step":"Secure GMP certification"},{"step":"Register with INCB"},{"step":"Obtain Ministry approvals"},{"step":"No pathway exists for recreational/adult-use retail"}]'::jsonb,
    '$50,000-$250,000'
  ) THEN
    RAISE EXCEPTION 'TEST FAILED: Greece-style bifurcated (real medical pathway + one recreational carve-out) must still count as having a market pathway';
  END IF;
  -- Empty array + "Not applicable" cost range: the clean, unambiguous prohibited case.
  IF public.jp_has_market_pathway('[]'::jsonb, 'Not applicable -- no legal pathway exists') THEN
    RAISE EXCEPTION 'TEST FAILED: empty steps + Not applicable cost range must read as prohibited';
  END IF;

  -- Japan: self-qualified "Prohibited (Recreational); ... Access ..." must NOT trigger status_says_prohibited.
  IF public.cc_status_says_prohibited('Prohibited (Recreational); Limited Pharmaceutical Access (2024)') THEN
    RAISE EXCEPTION 'TEST FAILED: Japan-style self-qualified status (contains Access) must not read as blanket prohibited';
  END IF;
  -- My own Sri Lanka correction: "Prohibited; ... Channel Formally Legal; ... Scheme" must NOT trigger.
  IF public.cc_status_says_prohibited('Prohibited; Ayurvedic Channel Formally Legal; New Export-Only Scheme (2025)') THEN
    RAISE EXCEPTION 'TEST FAILED: Sri Lanka-style self-qualified status (contains Channel/Legal/Scheme) must not read as blanket prohibited';
  END IF;
  -- Albania's original (confirmed wrong) status must still trigger -- "Programme" alone must not
  -- be treated as an exception word, since it appears here specifically to deny one exists.
  IF NOT public.cc_status_says_prohibited('Prohibited — No Medical Programme') THEN
    RAISE EXCEPTION 'TEST FAILED: genuine blanket-prohibited status with a negated "Programme" must still trigger -- regression on the Albania false-negative fix';
  END IF;

  -- Trinidad: "Decriminalized...Authority Established" must trigger reform (my own earlier miss).
  IF NOT public.cc_status_says_reform('Decriminalized (30g); Cannabis Control Authority Established') THEN
    RAISE EXCEPTION 'TEST FAILED: Decriminalized+Authority must read as reform -- regression on the Trinidad fix';
  END IF;
  -- Guatemala-style pure personal decrim with no institutional claim must NOT trigger reform.
  IF public.cc_status_says_reform('Decriminalized (Small Amounts); Otherwise Prohibited') THEN
    RAISE EXCEPTION 'TEST FAILED: pure personal-decriminalization status (no Authority/Licensing) must not read as commercial reform -- regression on the Guatemala/Guyana/Dominica false-positive fix';
  END IF;

  RETURN 'ALL TESTS PASSED (10 assertions across jp_has_market_pathway, cc_status_says_prohibited, cc_status_says_reform)';
END;
$$;

COMMENT ON FUNCTION public.test_jurisdiction_conflict_classifiers() IS
  'Regression suite for the four real bugs found and fixed in the 20-Jul-2026 jurisdiction_cross_table_conflicts build (Iran/Kuwait array-length, Malaysia/Greece whole-array substring matching, Trinidad/Guatemala decrim-vs-commercial conflation). Run this before trusting any future change to jp_has_market_pathway/cc_status_says_prohibited/cc_status_says_reform.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260724112649','extract_conflict_classifiers_and_add_test_suite','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260724112649_extract_conflict_classifiers_and_add_test_suite.sql

-- RECOVERY BEGIN 20260724112729_null_unsourced_own_timeline_estimates.sql
-- Retroactive reconciliation: applied directly to production via Supabase MCP on 20260724112729.\n-- Committed here per the migration-drift protocol to keep supabase/migrations/ in sync with\n-- supabase_migrations.schema_migrations. Statement below is the exact DDL/DML that was executed.\n\n-- Closing the loop I opened three times this session and never finished. Auditing my own
-- typical_timeline_months values against the platform's own standard (NULL = not assessed,
-- never store a fabricated placeholder): TR=18, MK=12, VC=9, MA=9, ZW=9 were my own professional
-- estimates with no citation behind them -- VC's own estimated_cost_range text even says so
-- explicitly ("no publicly quantified standard processing-time figure was identified"), which
-- means the number in the field was contradicting my own prose. Nulling those five.
-- LK=6 is the one exception, kept as-is: it matches the actual stated 6-month initial licence
-- term from the BOI export scheme I documented -- a real cited fact, not a guess.

UPDATE public.jurisdiction_playbooks
SET typical_timeline_months = NULL, updated_at = now()
WHERE country_iso2 IN ('TR','MK','VC','MA','ZW');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260724112729','null_unsourced_own_timeline_estimates','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260724112729_null_unsourced_own_timeline_estimates.sql

-- RECOVERY BEGIN 20260726003138_populate_deal_data_batch2_israel_operators.sql
-- Retroactive reconciliation: applied directly to production via Supabase MCP on 20260726003138.\n-- Committed here per the migration-drift protocol to keep supabase/migrations/ in sync with\n-- supabase_migrations.schema_migrations. Statement below is the exact DDL/DML that was executed.\n\n-- Second deal-data tranche: Israeli operators already in cannabis_operators (Inter Cannabis
-- Ltd / IMC, Tikun Olam Ltd). All sourced to SEC 6-K filings or named-outlet reporting (Haaretz,
-- Globes, PRNewswire). The Kadimastem transaction is logged as 'terminated', not completed --
-- verified directly: Kadimastem's merger actually closed 30-Oct-2025 with a different company
-- entirely (NLS Pharmaceutics, forming NewcelX Ltd), meaning the Feb-2024 IMC proposal was
-- abandoned/superseded. Logging it accurately as a real but unconsummated proposal, not a
-- completed deal for IMC.

INSERT INTO public.deal_ma_transactions
  (acquirer_operator_id, acquirer_name, target_operator_id, target_name, transaction_type,
   country_iso2, deal_value_usd, consideration_type, announced_date, closed_date, deal_status,
   source_name, source_url, confidence, notes)
VALUES
(
  'a3000003-0000-0000-0000-000000000001', 'IM Cannabis Corp (via IMC Holdings Ltd, Israeli subsidiary)',
  NULL, 'R.A. Yarok Pharm Ltd (Pharm Yarok), Rosen High Way Ltd, and High Way Shinua Ltd',
  'acquisition', 'IL', 4600000, 'cash',
  '2021-07-28', '2021-07-28', 'closed',
  'IM Cannabis Corp SEC Form 6-K',
  'https://www.sec.gov/Archives/edgar/data/1792030/000106299321006798/exhibit99-1.htm',
  'confirmed',
  'Three simultaneous acquisitions accelerating IMC''s vertical integration into Israeli retail: a leading medical cannabis pharmacy (Pharm Yarok), a cannabis distribution/logistics center (Rosen High Way), and a transportation-license applicant (HW Shinua). Aggregate consideration ~$4.6M, of which $1.3M was invested back into IMC equity by the sellers.'
),
(
  'a3000003-0000-0000-0000-000000000001', 'IM Cannabis Corp (via IMC Holdings Ltd, Israeli subsidiary)',
  NULL, 'Oranim Pharm partnership (51% interest)',
  'majority_stake', 'IL', NULL, 'undisclosed',
  '2022-03-30', '2022-03-30', 'closed',
  'IM Cannabis Corp SEC Form 6-K',
  'https://www.sec.gov/Archives/edgar/data/1792030/000117891322001288/exhibit_99-1.htm',
  'confirmed',
  'Oranim Pharm was the largest medical cannabis pharmacy in the Jerusalem area, with disclosed FY revenue of approximately $16.5M (12 months to Oct 2021) and positive EBITDA at acquisition -- deal value itself not disclosed in the filing.'
),
(
  NULL, 'Cannbit Pharmaceuticals (TASE-listed)',
  'a3000003-0000-0000-0000-000000000002', 'Tikun Olam Ltd (Israel operations)',
  'acquisition', 'IL', 41500000, 'cash',
  '2019-11-25', NULL, 'announced',
  'Haaretz -- In Israel''s Biggest Medical-cannabis Deal, Cannbit Buys Tikun Olam',
  'https://www.haaretz.com/israel-news/business/2019-11-26/ty-article/in-israels-biggest-medical-cannabis-deal-cannbit-buys-tikun-olam/0000017f-db05-dee4-a9ff-ff7703210000',
  'reported',
  'At the time Israel''s largest-ever medical cannabis merger: $23.5M cash upfront plus up to $18M contingent on the merged company reaching a 1 billion shekel (~$290M) market value within 5 years, plus a 5% stake and 3.2% sales royalty for Tikun Olam founder Tzachi Cohen. Deal followed Tikun Olam losing its cultivation license renewal after a court ruling against Cohen remaining a controlling shareholder. The merged entity (Tikun Olam-Cannbit Pharmaceuticals, TASE: TKUN) itself later merged with unrelated industrial businesses in 2023 as its cannabis operations declined (Globes) -- closed_date left null as no confirmation of final completion terms was located independent of the announcement.'
),
(
  'a3000003-0000-0000-0000-000000000001', 'IM Cannabis Corp',
  NULL, 'Kadimastem Ltd (proposed reverse merger, cannabis-to-biotech pivot)',
  'reverse_merger', 'IL', NULL, 'stock',
  '2024-02-28', NULL, 'terminated',
  'PRNewswire (IMC investor relations) -- IMC Announces Potential Reverse Merger with Kadimastem',
  'https://www.prnewswire.com/news-releases/imc-announces-potential-reverse-merger-with-kadimastem-a-leading-clinical-cell-therapy-company-302074148.html',
  'confirmed',
  'Non-binding proposal announced Feb 2024: IMC shareholders would hold 12% of a resulting biotech-focused entity, Kadimastem shareholders 88%, with IMC exiting the cannabis business entirely. This did not proceed -- independently verified that Kadimastem instead completed a merger with a different company, NLS Pharmaceutics (NASDAQ: NLSP), effective 30 October 2025, forming NewcelX Ltd (NASDAQ: NCEL). The IMC proposal is treated as abandoned/superseded, not completed; IM Cannabis Corp''s subsequent corporate status was not independently re-verified in this pass.'
);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260726003138','populate_deal_data_batch2_israel_operators','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260726003138_populate_deal_data_batch2_israel_operators.sql

-- RECOVERY BEGIN 20260726121827_populate_deal_data_batch3_australia_operators.sql
-- Reconciliation: migration applied live via Supabase MCP on 20260726121827 but never committed to supabase/migrations/. Caught by .github/workflows/migration-drift-check.yml. Committing verbatim (exact SQL from supabase_migrations.schema_migrations.statements) to close the drift. Not re-applying anything -- this file documents SQL that is already live.

-- Third deal-data tranche: all 3 Australian operators now covered. The LGP/Cannatrek merger is
-- the standout -- extremely current (implemented 1-Jun-2026, weeks before this review) and
-- corroborated across 8+ independent sources including Federal Court approval confirmation.
-- Cann Group's follow-on offering is logged at lower confidence ('reported') from a single
-- aggregator source with imprecise dating -- flagged honestly rather than presented as precise.

INSERT INTO public.deal_ma_transactions
  (acquirer_operator_id, acquirer_name, target_operator_id, target_name, transaction_type,
   country_iso2, deal_value_usd, consideration_type, announced_date, closed_date, deal_status,
   source_name, source_url, confidence, notes)
VALUES (
  'a2000002-0000-0000-0000-000000000002', 'Little Green Pharma Ltd',
  'a2000002-0000-0000-0000-000000000001', 'Cannatrek Limited',
  'reverse_merger', 'AU', NULL, 'stock',
  '2026-01-14', '2026-06-01', 'closed',
  'Business News Australia; Federal Court of Australia scheme approval (25-May-2026)',
  'https://www.businessnewsaustralia.com/articles/cannatrek-in-reverse-takeover-of-little-green-pharma-to-tackle-surging-european-medicinal-cannabis-market.html',
  'confirmed',
  'Legally structured as LGP acquiring 100% of Cannatrek via scheme of arrangement (1.84 LGP shares per Cannatrek share, plus contingent value shares), but substantively a reverse takeover: Cannatrek shareholders ended up with 60.5% of the combined group (up to 68.2% under contingent terms) versus 39.5% for existing LGP holders. Federal Court approved the scheme 25 May 2026; implementation completed 1 June 2026. Creates one of the largest vertically integrated medicinal cannabis groups globally -- combined pro-forma 2025 revenue ~$112M, EBITDA ~$13M, net assets >$136.7M. No clean single USD deal-value figure exists since this was a nil-cash share exchange; left null rather than estimated from a specific-date market cap.'
);

INSERT INTO public.deal_capital_raises
  (company_operator_id, company_name, country_iso2, round_type, amount_usd, amount_currency,
   announced_date, closed_date, deal_status, use_of_proceeds, source_name, source_url, confidence, notes)
VALUES
(
  'a2000002-0000-0000-0000-000000000001', 'Cannatrek Limited', 'AU',
  'private_placement', 9000000, 'AUD',
  '2022-06-01', '2022-06-01', 'closed',
  'Growth capital ahead of a planned (later shelved in favor of the 2026 LGP merger) ASX listing',
  'Business News Australia; CB Insights company profile',
  'https://www.businessnewsaustralia.com/articles/cannatrek-in-reverse-takeover-of-little-green-pharma-to-tackle-surging-european-medicinal-cannabis-market.html',
  'reported',
  'Original reported figure is AUD 13 million, led by River Capital; USD amount is an approximate conversion at a representative 2022 AUD/USD rate (~0.69), not a directly reported USD figure. Only the year (2022) was confirmed in sourcing -- the specific date shown is a placeholder, not a sourced announcement date.'
),
(
  'a2000002-0000-0000-0000-000000000003', 'Cann Group Limited', 'AU',
  'public_offering', 1600000, 'AUD',
  '2026-06-01', NULL, 'closed',
  'General working capital (ASX follow-on ordinary equity offering)',
  'Simply Wall St (ASX:CAN stock analysis page)',
  'https://simplywall.st/stocks/au/pharmaceuticals-biotech/asx-can/cann-group-shares',
  'reported',
  'Original reported figure is AUD 2.5 million (217,391,304 ordinary shares at AUD 0.0115, with an AUD 0.00069 per-security discount). Sourced from a single financial-data aggregator rather than a company filing or press release; the specific announcement date could not be clearly isolated from surrounding FY2025-results context in the source, so the date shown is an approximate placeholder within the confirmed reporting window, not a verified announcement date.'
);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260726121827','populate_deal_data_batch3_australia_operators','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260726121827_populate_deal_data_batch3_australia_operators.sql

-- RECOVERY BEGIN 20260727002735_revoke_legacy_jurisdiction_briefings_grants.sql
-- Retire anon/authenticated public read access to the legacy jurisdiction_briefings
-- table and its api-schema view. Confirmed superseded by cc_jurisdiction_briefings:
--   - jurisdiction_briefings: 20 rows, stale (no writes since migration)
--   - cc_jurisdiction_briefings: 302 rows, actively written and read
-- Confirmed no application code reads the legacy table/view: both consumers of
-- jurisdiction data (app/actions/getJurisdictionBriefing.ts and
-- lib/command-centre/jurisdictionBriefingData.ts) query cc_jurisdiction_briefings
-- exclusively. The legacy api.jurisdiction_briefings view was still granted SELECT
-- to anon and authenticated, meaning stale country-briefing data was reachable by
-- anyone via PostgREST at GET /rest/v1/jurisdiction_briefings with no product
-- surface pointing at it -- dead, unnecessarily-exposed API surface.
--
-- This migration only revokes read grants; it does not drop the table or view,
-- so it is fully reversible (re-grant) and touches no data.
--
-- Applied live under this exact timestamp via apply_migration (2026-07-27).
-- A same-named file previously existed at 20260723180000 with identical content
-- but was never actually applied under that timestamp -- converted to a stub
-- pointing here to avoid a second, misleading ledger-vs-repo mismatch.

revoke select on api.jurisdiction_briefings from anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260727002735','revoke_legacy_jurisdiction_briefings_grants','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260727002735_revoke_legacy_jurisdiction_briefings_grants.sql

-- RECOVERY BEGIN 20260727105241_fix_promote_snapshot_orphaned_source_null_id.sql
-- Repaired 2026-08-05. Two file-level defects, no change to what this
-- migration does:
--
-- 1. The comment block below was committed as a single physical line with 16
--    literal backslash-n escapes instead of real newlines. The last thing on
--    that line was the CREATE OR REPLACE FUNCTION signature for
--    promote_snapshot_to_signals, so the leading `--` commented the signature
--    out and replay reached the next real line, ` RETURNS integer`:
--      ERROR: syntax error at or near "RETURNS" (SQLSTATE 42601)
--    Fixed by expanding the escapes to real newlines.
--
-- 2. Neither statement was terminated. Production applied these as two
--    separate MCP calls, so no terminator was needed there and the ledger
--    records two statements without one; replayed as one file the parser could
--    not split them and failed at the second CREATE. Two semicolons added
--    after the closing $function$ delimiters.
--
-- Both function bodies are otherwise byte-identical to the production record.
-- With the two added semicolons discounted they match statements[1] and
-- statements[2] of the live ledger row exactly:
--   promote_snapshot_to_signals      5523 chars, md5 1d898c0b3cbf4cb5a91ff4b3f42f567e
--   promote_all_extracted_snapshots  1111 chars, md5 7a64f863787929b2cc73ed3a30893ca2
-- Verified on a local PostgreSQL 16 database: both functions create with the
-- recorded signatures, return types and SECURITY DEFINER.

-- Fix: promote_snapshot_to_signals() had no guard for an orphaned source_id
-- (snapshot references a source_registry row that no longer exists). When that
-- happened, v_source came back entirely NULL, the md5() concatenation for
-- v_signal_id collapsed to NULL, and the INSERT into signals failed its NOT NULL
-- id constraint -- which aborted the ENTIRE daily promote_all_extracted_snapshots()
-- batch, not just the one bad snapshot. This had been silently failing the whole
-- batch daily; ~4,100 legitimate snapshots were backlogged behind ~21 orphaned ones
-- in the captured_at-ordered queue.
--
-- Fix: (1) skip snapshots with a missing/orphaned source instead of erroring, and
-- (2) wrap the per-snapshot call in the batch loop with its own exception handler
-- so any future unknown failure degrades to skipping one row, not aborting the run.
--
-- Applied directly to production via Supabase MCP; committed here per
-- docs/control/CONCURRENT_SESSION_COORDINATION.md (same-turn convention).

CREATE OR REPLACE FUNCTION public.promote_snapshot_to_signals(p_snapshot_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_snapshot  record;
  v_source    record;
  v_candidate jsonb;
  v_candidates_arr jsonb;
  v_scoring   jsonb;
  v_signal_id text;
  v_promoted  integer := 0;
  v_headline  text;
  v_summary   text;
  v_top_lane  text;
  v_text      text;
  v_lead_weeks integer;
BEGIN
  SELECT * INTO v_snapshot FROM public.source_snapshots WHERE id = p_snapshot_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  IF v_snapshot.processing_status != 'extracted' THEN RETURN 0; END IF;
  IF v_snapshot.signal_candidates IS NULL THEN RETURN 0; END IF;

  SELECT sr.source_name, sr.tier, sr.iso, sr.country, sr.region,
         sr.jurisdiction_code, sr.source_url, sr.sub_region
  INTO v_source
  FROM public.source_registry sr WHERE id = v_snapshot.source_id;

  -- Fix: source_id can be orphaned (source deleted from source_registry after the
  -- snapshot was captured). Without this guard, v_source is entirely NULL, the
  -- md5() concatenation below collapses to NULL, and the INSERT fails the
  -- signals.id NOT NULL constraint -- which previously aborted the ENTIRE daily
  -- batch in promote_all_extracted_snapshots(), not just this one snapshot.
  IF NOT FOUND OR v_source.source_name IS NULL THEN
    RETURN 0;
  END IF;

  -- Derive lead_weeks from tier (column removed from source_registry)
  v_lead_weeks := CASE
    WHEN v_source.tier = 1 THEN 12
    WHEN v_source.tier = 2 THEN 6
    ELSE 4
  END;

  IF jsonb_typeof(v_snapshot.signal_candidates) = 'array' THEN
    v_candidates_arr := v_snapshot.signal_candidates;
  ELSE
    v_candidates_arr := jsonb_build_array(v_snapshot.signal_candidates);
  END IF;

  FOR v_candidate IN
    SELECT value FROM jsonb_array_elements(v_candidates_arr)
  LOOP
    v_text := lower(coalesce(v_candidate->>'text', ''));

    IF v_candidate->>'keyword_count' IS NULL THEN
      CONTINUE WHEN (v_candidate->'matched_keywords' IS NULL
                     OR jsonb_array_length(coalesce(v_candidate->'matched_keywords','[]'::jsonb)) = 0);
    ELSE
      CONTINUE WHEN (v_candidate->>'keyword_count')::int < 2
        AND v_text !~ '\m(cannabis|hemp|cannabinoid|cbd|thc|marijuana|chanvre|ca[nñ]amo|ganja|kannabis|bhang|marihuana|canabis)\M';
    END IF;

    v_headline := left(coalesce(
      v_candidate->>'text',
      v_snapshot.captured_title,
      v_source.source_name
    ), 200);

    v_summary := coalesce(
      v_candidate->>'text',
      v_candidate->>'summary',
      v_snapshot.captured_title,
      v_source.source_name
    );

    CONTINUE WHEN v_headline ILIKE '%opens new tab%'
      OR v_headline ILIKE '%creative commons%'
      OR v_headline ILIKE '%code of conduct%'
      OR v_headline ILIKE '%hardware, software%'
      OR v_headline ILIKE '%covid-19%'
      OR length(trim(v_headline)) < 30;

    IF EXISTS (
      SELECT 1 FROM public.signals
      WHERE source = v_source.source_name
        AND headline = v_headline
        AND date > now() - interval '30 days'
    ) THEN CONTINUE; END IF;

    v_scoring := public.score_signal_from_snapshot(
      v_snapshot.intelligence_pass,
      v_lead_weeks,
      coalesce((v_candidate->>'keyword_count')::int,
               jsonb_array_length(coalesce(v_candidate->'matched_keywords','[]'::jsonb)))
    );

    v_top_lane := CASE
      WHEN (v_scoring->>'lane_r')::int >= (v_scoring->>'lane_e')::int
       AND (v_scoring->>'lane_r')::int >= (v_scoring->>'lane_t')::int THEN 'Regulatory'
      WHEN (v_scoring->>'lane_e')::int >= (v_scoring->>'lane_t')::int THEN 'Economic'
      ELSE 'Trade'
    END;

    v_signal_id := left(md5(v_source.source_name || v_headline || v_snapshot.captured_at::text), 20);

    INSERT INTO public.signals (
      id, date, cat, pri, score, headline, summary,
      source, url, verification, tier, lang,
      company, country, in_network,
      lane_r, lane_e, lane_t, top_lane,
      query_pack, commercial_impact,
      reviewed, action, created_at
    ) VALUES (
      v_signal_id,
      COALESCE(v_snapshot.captured_at, now()),
      CASE v_snapshot.intelligence_pass
        WHEN 1 THEN 'GAZETTE' WHEN 2 THEN 'PARLIAMENTARY'
        WHEN 3 THEN 'PROCUREMENT' WHEN 4 THEN 'MDB_PROJECT'
        ELSE 'SOURCE_ENGINE'
      END,
      v_scoring->>'pri',
      (v_scoring->>'score')::int,
      v_headline, v_summary,
      v_source.source_name, v_source.source_url,
      'source_engine_v1',
      CASE v_snapshot.intelligence_pass
        WHEN 1 THEN 'Tier 1' WHEN 2 THEN 'Tier 1'
        WHEN 3 THEN 'Tier 2' WHEN 4 THEN 'Tier 2'
        ELSE 'Tier 3'
      END,
      COALESCE(v_snapshot.language_detected, 'en'),
      NULL, v_source.country, false,
      (v_scoring->>'lane_r')::int,
      (v_scoring->>'lane_e')::int,
      (v_scoring->>'lane_t')::int,
      v_top_lane,
      'SP-' || COALESCE(v_snapshot.intelligence_pass::text, 'X')
        || ' | ' || COALESCE(v_source.sub_region, v_source.country, 'Global'),
      CASE
        WHEN (v_scoring->>'score')::int >= 75 THEN 'Immediate trade or market-access relevance'
        WHEN (v_scoring->>'score')::int >= 50 THEN 'Likely trade or market-access relevance'
        ELSE 'Monitor for developing relevance'
      END,
      false, '', now()
    )
    ON CONFLICT (id) DO NOTHING;

    v_promoted := v_promoted + 1;
  END LOOP;

  -- No self-referential UPDATE here — status is already 'extracted' when called
  RETURN v_promoted;
END;
$function$;


CREATE OR REPLACE FUNCTION public.promote_all_extracted_snapshots()
 RETURNS TABLE(snapshot_id uuid, signals_promoted integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_snap record;
  v_count integer;
BEGIN
  FOR v_snap IN
    SELECT id FROM public.source_snapshots
    WHERE processing_status = 'extracted'
      AND signal_candidates IS NOT NULL
    ORDER BY captured_at DESC
  LOOP
    -- Defense in depth: one bad snapshot must never abort the whole daily batch
    -- again (this is exactly what happened before promote_snapshot_to_signals's
    -- orphaned-source guard was added -- one poison row silently failed the
    -- entire run, and everything queued behind it in captured_at order never
    -- got a chance to process).
    BEGIN
      SELECT public.promote_snapshot_to_signals(v_snap.id) INTO v_count;
    EXCEPTION WHEN OTHERS THEN
      v_count := -1; -- signal "this one errored" to the caller without aborting the batch
    END;
    snapshot_id      := v_snap.id;
    signals_promoted := v_count;
    RETURN NEXT;
  END LOOP;
END;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260727105241','fix_promote_snapshot_orphaned_source_null_id','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260727105241_fix_promote_snapshot_orphaned_source_null_id.sql

-- RECOVERY BEGIN 20260727112118_revoke_legacy_jurisdiction_briefings_base_table_grants.sql
-- Follow-up to 20260727002735: that migration revoked SELECT on the api-schema
-- view (api.jurisdiction_briefings) but missed the underlying base table
-- (public.jurisdiction_briefings), which still had its own direct anon/authenticated
-- SELECT grant -- independently reachable via PostgREST at GET /rest/v1/jurisdiction_briefings
-- regardless of the view-level revoke, since this project exposes the public schema
-- directly (confirmed throughout this session via working /rest/v1/{table} calls
-- against other public-schema tables). Same rationale as before: legacy, superseded
-- by cc_jurisdiction_briefings, zero consuming application code. Revoke only, fully
-- reversible, touches no data.
revoke select on public.jurisdiction_briefings from anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260727112118','revoke_legacy_jurisdiction_briefings_base_table_grants','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260727112118_revoke_legacy_jurisdiction_briefings_base_table_grants.sql

-- RECOVERY BEGIN 20260727160000_clinical_control_foundation.sql
-- Clinical control foundation (Slice 1)
-- Extends hv_professionals for clinical gating; adds clinician links + immutable audit log.
-- No patient data, calculators, or clinical UI in this migration.
-- clinical_role enum drives feature gating (prescribing authority checks come in later slices).

-- ---------------------------------------------------------------------------
-- 1. Clinician verification fields on existing professionals directory
-- ---------------------------------------------------------------------------
ALTER TABLE public.hv_professionals
  ADD COLUMN IF NOT EXISTS licence_number text,
  ADD COLUMN IF NOT EXISTS licence_jurisdiction text,
  ADD COLUMN IF NOT EXISTS clinical_role text,
  ADD COLUMN IF NOT EXISTS verified_by uuid,
  ADD COLUMN IF NOT EXISTS verification_notes text,
  ADD COLUMN IF NOT EXISTS user_id uuid;

-- Constrained clinical_role values (CHECK rather than Postgres ENUM for easier evolution)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'hv_professionals_clinical_role_check'
  ) THEN
    ALTER TABLE public.hv_professionals
      ADD CONSTRAINT hv_professionals_clinical_role_check
      CHECK (
        clinical_role IS NULL
        OR clinical_role IN (
          'doctor',
          'pharmacist',
          'nurse',
          'nurse_practitioner',
          'other'
        )
      );
  END IF;
END $$;

-- One auth user → at most one professional profile (partial unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_hv_professionals_user_id
  ON public.hv_professionals (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hv_professionals_clinical_role
  ON public.hv_professionals (clinical_role)
  WHERE clinical_role IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hv_professionals_licence_jurisdiction
  ON public.hv_professionals (licence_jurisdiction)
  WHERE licence_jurisdiction IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Explicit clinician link table (auth user ↔ professional profile)
-- Supports future multi-profile / clinic models without breaking the unique user_id index.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinical_clinician_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  professional_id uuid NOT NULL REFERENCES public.hv_professionals(id) ON DELETE CASCADE,
  link_status text NOT NULL DEFAULT 'active'
    CHECK (link_status IN ('active', 'suspended', 'revoked')),
  linked_at timestamptz NOT NULL DEFAULT now(),
  linked_by uuid,
  UNIQUE (user_id, professional_id)
);

CREATE INDEX IF NOT EXISTS idx_clinical_clinician_links_user
  ON public.clinical_clinician_links (user_id)
  WHERE link_status = 'active';

CREATE INDEX IF NOT EXISTS idx_clinical_clinician_links_professional
  ON public.clinical_clinician_links (professional_id);

ALTER TABLE public.clinical_clinician_links ENABLE ROW LEVEL SECURITY;

-- Users may read their own active links only
DROP POLICY IF EXISTS clinical_clinician_links_self_read ON public.clinical_clinician_links;
CREATE POLICY clinical_clinician_links_self_read
  ON public.clinical_clinician_links
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND link_status = 'active'
  );

-- Writes are service_role / admin only
DROP POLICY IF EXISTS clinical_clinician_links_service_write ON public.clinical_clinician_links;
CREATE POLICY clinical_clinician_links_service_write
  ON public.clinical_clinician_links
  FOR ALL
  TO public
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

REVOKE ALL ON public.clinical_clinician_links FROM anon;
GRANT SELECT ON public.clinical_clinician_links TO authenticated;
GRANT ALL ON public.clinical_clinician_links TO service_role;

-- ---------------------------------------------------------------------------
-- 3. Immutable clinical audit log
-- Append-only. No UPDATE/DELETE policies. No public SELECT.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinical_audit_log (
  id bigserial PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid,
  actor_role text,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  jurisdiction text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_hash text,
  user_agent_hash text
);

CREATE INDEX IF NOT EXISTS idx_clinical_audit_log_occurred
  ON public.clinical_audit_log (occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_clinical_audit_log_actor
  ON public.clinical_audit_log (actor_user_id)
  WHERE actor_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clinical_audit_log_resource
  ON public.clinical_audit_log (resource_type, resource_id);

ALTER TABLE public.clinical_audit_log ENABLE ROW LEVEL SECURITY;

-- No SELECT for anon/authenticated. Service role only for insert + admin read path later.
DROP POLICY IF EXISTS clinical_audit_log_service_all ON public.clinical_audit_log;
CREATE POLICY clinical_audit_log_service_all
  ON public.clinical_audit_log
  FOR ALL
  TO public
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

REVOKE ALL ON public.clinical_audit_log FROM anon, authenticated;
GRANT ALL ON public.clinical_audit_log TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.clinical_audit_log_id_seq TO service_role;

-- ---------------------------------------------------------------------------
-- 4. Helper: is verified clinician (security definer, pinned search_path)
-- Used by future clinical RLS policies. Returns false if not verified.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_verified_clinician(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.hv_professionals p
    JOIN public.clinical_clinician_links l
      ON l.professional_id = p.id
     AND l.user_id = p_user_id
     AND l.link_status = 'active'
    WHERE p.user_id = p_user_id
      AND p.verification_status = 'verified'
      AND p.status = 'active'
      AND p.clinical_role IS NOT NULL
  );
$$;

REVOKE ALL ON FUNCTION public.is_verified_clinician(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_verified_clinician(uuid) TO authenticated, service_role;

COMMENT ON TABLE public.clinical_clinician_links IS
  'Links auth.users to verified hv_professionals profiles for clinical feature gating.';
COMMENT ON TABLE public.clinical_audit_log IS
  'Immutable append-only audit log for all clinical-domain actions. No public read.';
COMMENT ON COLUMN public.hv_professionals.clinical_role IS
  'Constrained role for clinical gating: doctor | pharmacist | nurse | nurse_practitioner | other';
COMMENT ON COLUMN public.hv_professionals.licence_number IS
  'Professional licence / registration number reviewed during admin verification.';
COMMENT ON COLUMN public.hv_professionals.licence_jurisdiction IS
  'Issuing jurisdiction code (ISO country or subnational) for the licence.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260727160000','clinical_control_foundation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260727160000_clinical_control_foundation.sql

-- RECOVERY BEGIN 20260727161000_clinical_patient_core.sql
-- Clinical patient core (Slice 2)
-- Depends on: 20260727160000_clinical_control_foundation.sql
-- Restricted clinical data. No public API exposure. Harbourview is data controller.
-- Tables created first; RLS policies second (avoids forward table references).

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinical_patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  jurisdiction text NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'archived')),
  given_name text NOT NULL,
  family_name text NOT NULL,
  date_of_birth date,
  sex_at_birth text
    CHECK (sex_at_birth IS NULL OR sex_at_birth IN ('female', 'male', 'intersex', 'unknown', 'unspecified')),
  external_mrn text,
  notes_internal text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_clinical_patients_jurisdiction
  ON public.clinical_patients (jurisdiction);
CREATE INDEX IF NOT EXISTS idx_clinical_patients_created_by
  ON public.clinical_patients (created_by);
CREATE INDEX IF NOT EXISTS idx_clinical_patients_name
  ON public.clinical_patients (family_name, given_name);

CREATE TABLE IF NOT EXISTS public.clinical_care_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.clinical_patients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  professional_id uuid REFERENCES public.hv_professionals(id) ON DELETE SET NULL,
  role text NOT NULL
    CHECK (role IN ('treating_clinician', 'pharmacist', 'nurse', 'care_coordinator', 'consultant', 'other')),
  membership_status text NOT NULL DEFAULT 'active'
    CHECK (membership_status IN ('active', 'ended', 'revoked')),
  added_at timestamptz NOT NULL DEFAULT now(),
  added_by uuid,
  ended_at timestamptz,
  UNIQUE (patient_id, user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_clinical_care_team_patient
  ON public.clinical_care_team (patient_id)
  WHERE membership_status = 'active';
CREATE INDEX IF NOT EXISTS idx_clinical_care_team_user
  ON public.clinical_care_team (user_id)
  WHERE membership_status = 'active';

CREATE TABLE IF NOT EXISTS public.clinical_consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.clinical_patients(id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  recorded_by uuid NOT NULL,
  jurisdiction text NOT NULL,
  consent_type text NOT NULL
    CHECK (consent_type IN (
      'treatment',
      'data_processing',
      'sharing_with_care_team',
      'research_optional',
      'marketing_optional'
    )),
  lawful_basis text NOT NULL
    CHECK (lawful_basis IN (
      'consent',
      'contract',
      'legal_obligation',
      'vital_interests',
      'public_task',
      'legitimate_interests'
    )),
  status text NOT NULL DEFAULT 'granted'
    CHECK (status IN ('granted', 'withdrawn', 'expired')),
  method text
    CHECK (method IS NULL OR method IN ('written', 'verbal', 'electronic', 'implied_documented')),
  version_label text,
  notes text,
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_clinical_consent_patient
  ON public.clinical_consent_records (patient_id, consent_type)
  WHERE status = 'granted';

CREATE TABLE IF NOT EXISTS public.clinical_encounters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.clinical_patients(id) ON DELETE CASCADE,
  clinician_user_id uuid NOT NULL,
  professional_id uuid REFERENCES public.hv_professionals(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  jurisdiction text NOT NULL,
  encounter_type text NOT NULL DEFAULT 'consultation'
    CHECK (encounter_type IN (
      'consultation',
      'follow_up',
      'dispensing',
      'review',
      'telehealth',
      'other'
    )),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed', 'cancelled')),
  chief_complaint text,
  clinical_notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_clinical_encounters_patient
  ON public.clinical_encounters (patient_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_encounters_clinician
  ON public.clinical_encounters (clinician_user_id, started_at DESC);

-- ---------------------------------------------------------------------------
-- 2. RLS enable + policies
-- ---------------------------------------------------------------------------
ALTER TABLE public.clinical_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_care_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_encounters ENABLE ROW LEVEL SECURITY;

-- patients
DROP POLICY IF EXISTS clinical_patients_clinician_select ON public.clinical_patients;
CREATE POLICY clinical_patients_clinician_select
  ON public.clinical_patients FOR SELECT TO authenticated
  USING (
    public.is_verified_clinician()
    AND (
      created_by = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.clinical_care_team ct
        WHERE ct.patient_id = clinical_patients.id
          AND ct.user_id = (SELECT auth.uid())
          AND ct.membership_status = 'active'
      )
    )
  );

DROP POLICY IF EXISTS clinical_patients_clinician_insert ON public.clinical_patients;
CREATE POLICY clinical_patients_clinician_insert
  ON public.clinical_patients FOR INSERT TO authenticated
  WITH CHECK (
    public.is_verified_clinician()
    AND created_by = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS clinical_patients_clinician_update ON public.clinical_patients;
CREATE POLICY clinical_patients_clinician_update
  ON public.clinical_patients FOR UPDATE TO authenticated
  USING (
    public.is_verified_clinician()
    AND (
      created_by = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.clinical_care_team ct
        WHERE ct.patient_id = clinical_patients.id
          AND ct.user_id = (SELECT auth.uid())
          AND ct.membership_status = 'active'
          AND ct.role IN ('treating_clinician', 'care_coordinator')
      )
    )
  )
  WITH CHECK (public.is_verified_clinician());

DROP POLICY IF EXISTS clinical_patients_service ON public.clinical_patients;
CREATE POLICY clinical_patients_service
  ON public.clinical_patients FOR ALL TO public
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

-- care team
DROP POLICY IF EXISTS clinical_care_team_clinician_select ON public.clinical_care_team;
CREATE POLICY clinical_care_team_clinician_select
  ON public.clinical_care_team FOR SELECT TO authenticated
  USING (
    public.is_verified_clinician()
    AND (
      user_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.clinical_patients p
        WHERE p.id = clinical_care_team.patient_id
          AND p.created_by = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS clinical_care_team_clinician_insert ON public.clinical_care_team;
CREATE POLICY clinical_care_team_clinician_insert
  ON public.clinical_care_team FOR INSERT TO authenticated
  WITH CHECK (
    public.is_verified_clinician()
    AND EXISTS (
      SELECT 1 FROM public.clinical_patients p
      WHERE p.id = patient_id
        AND (
          p.created_by = (SELECT auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.clinical_care_team ct2
            WHERE ct2.patient_id = p.id
              AND ct2.user_id = (SELECT auth.uid())
              AND ct2.membership_status = 'active'
              AND ct2.role IN ('treating_clinician', 'care_coordinator')
          )
        )
    )
  );

DROP POLICY IF EXISTS clinical_care_team_service ON public.clinical_care_team;
CREATE POLICY clinical_care_team_service
  ON public.clinical_care_team FOR ALL TO public
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

-- consent
DROP POLICY IF EXISTS clinical_consent_clinician_select ON public.clinical_consent_records;
CREATE POLICY clinical_consent_clinician_select
  ON public.clinical_consent_records FOR SELECT TO authenticated
  USING (
    public.is_verified_clinician()
    AND EXISTS (
      SELECT 1 FROM public.clinical_patients p
      WHERE p.id = clinical_consent_records.patient_id
        AND (
          p.created_by = (SELECT auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.clinical_care_team ct
            WHERE ct.patient_id = p.id
              AND ct.user_id = (SELECT auth.uid())
              AND ct.membership_status = 'active'
          )
        )
    )
  );

DROP POLICY IF EXISTS clinical_consent_clinician_insert ON public.clinical_consent_records;
CREATE POLICY clinical_consent_clinician_insert
  ON public.clinical_consent_records FOR INSERT TO authenticated
  WITH CHECK (
    public.is_verified_clinician()
    AND recorded_by = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.clinical_patients p
      WHERE p.id = patient_id
        AND (
          p.created_by = (SELECT auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.clinical_care_team ct
            WHERE ct.patient_id = p.id
              AND ct.user_id = (SELECT auth.uid())
              AND ct.membership_status = 'active'
          )
        )
    )
  );

DROP POLICY IF EXISTS clinical_consent_service ON public.clinical_consent_records;
CREATE POLICY clinical_consent_service
  ON public.clinical_consent_records FOR ALL TO public
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

-- encounters
DROP POLICY IF EXISTS clinical_encounters_clinician_select ON public.clinical_encounters;
CREATE POLICY clinical_encounters_clinician_select
  ON public.clinical_encounters FOR SELECT TO authenticated
  USING (
    public.is_verified_clinician()
    AND (
      clinician_user_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.clinical_care_team ct
        WHERE ct.patient_id = clinical_encounters.patient_id
          AND ct.user_id = (SELECT auth.uid())
          AND ct.membership_status = 'active'
      )
    )
  );

DROP POLICY IF EXISTS clinical_encounters_clinician_insert ON public.clinical_encounters;
CREATE POLICY clinical_encounters_clinician_insert
  ON public.clinical_encounters FOR INSERT TO authenticated
  WITH CHECK (
    public.is_verified_clinician()
    AND clinician_user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.clinical_patients p
      WHERE p.id = patient_id
        AND (
          p.created_by = (SELECT auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.clinical_care_team ct
            WHERE ct.patient_id = p.id
              AND ct.user_id = (SELECT auth.uid())
              AND ct.membership_status = 'active'
          )
        )
    )
  );

DROP POLICY IF EXISTS clinical_encounters_clinician_update ON public.clinical_encounters;
CREATE POLICY clinical_encounters_clinician_update
  ON public.clinical_encounters FOR UPDATE TO authenticated
  USING (
    public.is_verified_clinician()
    AND clinician_user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    public.is_verified_clinician()
    AND clinician_user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS clinical_encounters_service ON public.clinical_encounters;
CREATE POLICY clinical_encounters_service
  ON public.clinical_encounters FOR ALL TO public
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

-- ---------------------------------------------------------------------------
-- 3. Grants
-- ---------------------------------------------------------------------------
REVOKE ALL ON public.clinical_patients FROM anon;
REVOKE ALL ON public.clinical_care_team FROM anon;
REVOKE ALL ON public.clinical_consent_records FROM anon;
REVOKE ALL ON public.clinical_encounters FROM anon;

GRANT SELECT, INSERT, UPDATE ON public.clinical_patients TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.clinical_care_team TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.clinical_consent_records TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.clinical_encounters TO authenticated;

GRANT ALL ON public.clinical_patients TO service_role;
GRANT ALL ON public.clinical_care_team TO service_role;
GRANT ALL ON public.clinical_consent_records TO service_role;
GRANT ALL ON public.clinical_encounters TO service_role;

-- ---------------------------------------------------------------------------
-- 4. updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clinical_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_patients_updated_at ON public.clinical_patients;
CREATE TRIGGER trg_clinical_patients_updated_at
  BEFORE UPDATE ON public.clinical_patients
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_set_updated_at();

COMMENT ON TABLE public.clinical_patients IS
  'Identifiable patient records. Restricted. Harbourview is controller. Consent required before create.';
COMMENT ON TABLE public.clinical_consent_records IS
  'Lawful basis and consent history per patient.';
COMMENT ON TABLE public.clinical_encounters IS
  'Clinical encounters linked to patients and treating clinicians.';
COMMENT ON TABLE public.clinical_care_team IS
  'Care team membership gating patient access beyond the creating clinician.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260727161000','clinical_patient_core','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260727161000_clinical_patient_core.sql

-- RECOVERY BEGIN 20260727162000_clinical_workflows.sql
-- Clinical workflows (Slice 3)
-- Depends on: control foundation + patient core migrations.
-- Enforces consent, care-team bootstrap, audit helpers; adds calculation,
-- recommendation, prescription/dispensing, and jurisdiction authority tables.

-- ---------------------------------------------------------------------------
-- 1. Audit write helper (service_role + SECURITY DEFINER for trusted paths)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clinical_audit_write(
  p_action text,
  p_resource_type text,
  p_resource_id text DEFAULT NULL,
  p_jurisdiction text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_actor_user_id uuid DEFAULT auth.uid(),
  p_actor_role text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id bigint;
BEGIN
  INSERT INTO public.clinical_audit_log (
    actor_user_id,
    actor_role,
    action,
    resource_type,
    resource_id,
    jurisdiction,
    metadata
  ) VALUES (
    p_actor_user_id,
    COALESCE(p_actor_role, (SELECT auth.role())),
    p_action,
    p_resource_type,
    p_resource_id,
    p_jurisdiction,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.clinical_audit_write FROM public;
GRANT EXECUTE ON FUNCTION public.clinical_audit_write TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Active consent check
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clinical_has_active_consent(
  p_patient_id uuid,
  p_consent_type text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clinical_consent_records c
    WHERE c.patient_id = p_patient_id
      AND c.consent_type = p_consent_type
      AND c.status = 'granted'
      AND c.effective_from <= now()
      AND (c.effective_to IS NULL OR c.effective_to > now())
  );
$$;

REVOKE ALL ON FUNCTION public.clinical_has_active_consent FROM public;
GRANT EXECUTE ON FUNCTION public.clinical_has_active_consent TO authenticated, service_role;

-- Requires treatment + data_processing for clinical actions on a patient
CREATE OR REPLACE FUNCTION public.clinical_require_core_consent(p_patient_id uuid)
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.clinical_has_active_consent(p_patient_id, 'treatment') THEN
    RAISE EXCEPTION 'clinical_consent_required: treatment'
      USING ERRCODE = '42501';
  END IF;
  IF NOT public.clinical_has_active_consent(p_patient_id, 'data_processing') THEN
    RAISE EXCEPTION 'clinical_consent_required: data_processing'
      USING ERRCODE = '42501';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.clinical_require_core_consent FROM public;
GRANT EXECUTE ON FUNCTION public.clinical_require_core_consent TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Care-team bootstrap on patient create + audit
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clinical_patient_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.clinical_care_team (
    patient_id,
    user_id,
    role,
    membership_status,
    added_by
  ) VALUES (
    NEW.id,
    NEW.created_by,
    'treating_clinician',
    'active',
    NEW.created_by
  )
  ON CONFLICT (patient_id, user_id, role) DO NOTHING;

  PERFORM public.clinical_audit_write(
    'patient.create',
    'clinical_patients',
    NEW.id::text,
    NEW.jurisdiction,
    jsonb_build_object(
      'status', NEW.status,
      'created_by', NEW.created_by
    ),
    NEW.created_by
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_patient_after_insert ON public.clinical_patients;
CREATE TRIGGER trg_clinical_patient_after_insert
  AFTER INSERT ON public.clinical_patients
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_patient_after_insert();

-- ---------------------------------------------------------------------------
-- 4. Consent record audit
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clinical_consent_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.clinical_audit_write(
    'consent.' || NEW.status,
    'clinical_consent_records',
    NEW.id::text,
    NEW.jurisdiction,
    jsonb_build_object(
      'patient_id', NEW.patient_id,
      'consent_type', NEW.consent_type,
      'lawful_basis', NEW.lawful_basis
    ),
    NEW.recorded_by
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_consent_after_insert ON public.clinical_consent_records;
CREATE TRIGGER trg_clinical_consent_after_insert
  AFTER INSERT ON public.clinical_consent_records
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_consent_after_insert();

-- ---------------------------------------------------------------------------
-- 5. Encounter gates: consent required; audit open/close
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clinical_encounter_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.clinical_require_core_consent(NEW.patient_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_encounter_before_insert ON public.clinical_encounters;
CREATE TRIGGER trg_clinical_encounter_before_insert
  BEFORE INSERT ON public.clinical_encounters
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_encounter_before_insert();

CREATE OR REPLACE FUNCTION public.clinical_encounter_after_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.clinical_audit_write(
      'encounter.open',
      'clinical_encounters',
      NEW.id::text,
      NEW.jurisdiction,
      jsonb_build_object(
        'patient_id', NEW.patient_id,
        'encounter_type', NEW.encounter_type
      ),
      NEW.clinician_user_id
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.clinical_audit_write(
      'encounter.status.' || NEW.status,
      'clinical_encounters',
      NEW.id::text,
      NEW.jurisdiction,
      jsonb_build_object(
        'patient_id', NEW.patient_id,
        'from_status', OLD.status,
        'to_status', NEW.status
      ),
      NEW.clinician_user_id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_encounter_after_write ON public.clinical_encounters;
CREATE TRIGGER trg_clinical_encounter_after_write
  AFTER INSERT OR UPDATE ON public.clinical_encounters
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_encounter_after_write();

-- ---------------------------------------------------------------------------
-- 6. Jurisdiction clinical authority (who may do what, where)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinical_jurisdiction_authority (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction text NOT NULL,
  clinical_role text NOT NULL
    CHECK (clinical_role IN (
      'doctor', 'pharmacist', 'nurse', 'nurse_practitioner', 'other'
    )),
  may_recommend boolean NOT NULL DEFAULT true,
  may_calculate_dose boolean NOT NULL DEFAULT true,
  may_prescribe boolean NOT NULL DEFAULT false,
  may_dispense boolean NOT NULL DEFAULT false,
  may_claim_appropriateness boolean NOT NULL DEFAULT false,
  notes text,
  evidence_version text,
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  UNIQUE (jurisdiction, clinical_role)
);

CREATE INDEX IF NOT EXISTS idx_clinical_jurisdiction_authority_j
  ON public.clinical_jurisdiction_authority (jurisdiction);

ALTER TABLE public.clinical_jurisdiction_authority ENABLE ROW LEVEL SECURITY;

-- Verified clinicians may read authority matrix for their work
DROP POLICY IF EXISTS clinical_jurisdiction_authority_read ON public.clinical_jurisdiction_authority;
CREATE POLICY clinical_jurisdiction_authority_read
  ON public.clinical_jurisdiction_authority
  FOR SELECT TO authenticated
  USING (public.is_verified_clinician());

DROP POLICY IF EXISTS clinical_jurisdiction_authority_service ON public.clinical_jurisdiction_authority;
CREATE POLICY clinical_jurisdiction_authority_service
  ON public.clinical_jurisdiction_authority
  FOR ALL TO public
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

REVOKE ALL ON public.clinical_jurisdiction_authority FROM anon;
GRANT SELECT ON public.clinical_jurisdiction_authority TO authenticated;
GRANT ALL ON public.clinical_jurisdiction_authority TO service_role;

CREATE OR REPLACE FUNCTION public.clinical_authority_allows(
  p_jurisdiction text,
  p_clinical_role text,
  p_capability text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.clinical_jurisdiction_authority%ROWTYPE;
BEGIN
  SELECT * INTO v_row
  FROM public.clinical_jurisdiction_authority a
  WHERE a.jurisdiction = p_jurisdiction
    AND a.clinical_role = p_clinical_role
    AND a.effective_from <= now()
    AND (a.effective_to IS NULL OR a.effective_to > now())
  LIMIT 1;

  -- Fail closed: no row => deny
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  CASE p_capability
    WHEN 'recommend' THEN RETURN v_row.may_recommend;
    WHEN 'calculate_dose' THEN RETURN v_row.may_calculate_dose;
    WHEN 'prescribe' THEN RETURN v_row.may_prescribe;
    WHEN 'dispense' THEN RETURN v_row.may_dispense;
    WHEN 'claim_appropriateness' THEN RETURN v_row.may_claim_appropriateness;
    ELSE RETURN false;
  END CASE;
END;
$$;

REVOKE ALL ON FUNCTION public.clinical_authority_allows FROM public;
GRANT EXECUTE ON FUNCTION public.clinical_authority_allows TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 7. Dose calculations (versioned; audited)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinical_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES public.clinical_patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES public.clinical_encounters(id) ON DELETE SET NULL,
  clinician_user_id uuid NOT NULL,
  jurisdiction text NOT NULL,
  calculator_key text NOT NULL,
  algorithm_version text NOT NULL,
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  outputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  unit text,
  status text NOT NULL DEFAULT 'computed'
    CHECK (status IN ('computed', 'superseded', 'void')),
  notes text
);

CREATE INDEX IF NOT EXISTS idx_clinical_calculations_patient
  ON public.clinical_calculations (patient_id, created_at DESC);

ALTER TABLE public.clinical_calculations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clinical_calculations_select ON public.clinical_calculations;
CREATE POLICY clinical_calculations_select
  ON public.clinical_calculations FOR SELECT TO authenticated
  USING (
    public.is_verified_clinician()
    AND (
      clinician_user_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.clinical_care_team ct
        WHERE ct.patient_id = clinical_calculations.patient_id
          AND ct.user_id = (SELECT auth.uid())
          AND ct.membership_status = 'active'
      )
    )
  );

DROP POLICY IF EXISTS clinical_calculations_insert ON public.clinical_calculations;
CREATE POLICY clinical_calculations_insert
  ON public.clinical_calculations FOR INSERT TO authenticated
  WITH CHECK (
    public.is_verified_clinician()
    AND clinician_user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS clinical_calculations_service ON public.clinical_calculations;
CREATE POLICY clinical_calculations_service
  ON public.clinical_calculations FOR ALL TO public
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE OR REPLACE FUNCTION public.clinical_calculation_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  PERFORM public.clinical_require_core_consent(NEW.patient_id);

  SELECT p.clinical_role INTO v_role
  FROM public.hv_professionals p
  JOIN public.clinical_clinician_links l
    ON l.professional_id = p.id
   AND l.user_id = NEW.clinician_user_id
   AND l.link_status = 'active'
  WHERE p.user_id = NEW.clinician_user_id
    AND p.verification_status = 'verified'
    AND p.status = 'active'
  LIMIT 1;

  IF v_role IS NULL OR NOT public.clinical_authority_allows(
    NEW.jurisdiction, v_role, 'calculate_dose'
  ) THEN
    RAISE EXCEPTION 'clinical_authority_denied: calculate_dose'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_calculation_before_insert ON public.clinical_calculations;
CREATE TRIGGER trg_clinical_calculation_before_insert
  BEFORE INSERT ON public.clinical_calculations
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_calculation_before_insert();

CREATE OR REPLACE FUNCTION public.clinical_calculation_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.clinical_audit_write(
    'calculation.compute',
    'clinical_calculations',
    NEW.id::text,
    NEW.jurisdiction,
    jsonb_build_object(
      'patient_id', NEW.patient_id,
      'calculator_key', NEW.calculator_key,
      'algorithm_version', NEW.algorithm_version
    ),
    NEW.clinician_user_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_calculation_after_insert ON public.clinical_calculations;
CREATE TRIGGER trg_clinical_calculation_after_insert
  AFTER INSERT ON public.clinical_calculations
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_calculation_after_insert();

REVOKE ALL ON public.clinical_calculations FROM anon;
GRANT SELECT, INSERT ON public.clinical_calculations TO authenticated;
GRANT ALL ON public.clinical_calculations TO service_role;

-- ---------------------------------------------------------------------------
-- 8. Personalised recommendations + appropriateness claims
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinical_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES public.clinical_patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES public.clinical_encounters(id) ON DELETE SET NULL,
  calculation_id uuid REFERENCES public.clinical_calculations(id) ON DELETE SET NULL,
  clinician_user_id uuid NOT NULL,
  jurisdiction text NOT NULL,
  recommendation_key text NOT NULL,
  evidence_version text NOT NULL,
  summary text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Explicit appropriateness claim (high risk; authority-gated)
  appropriateness_claim text
    CHECK (
      appropriateness_claim IS NULL
      OR appropriateness_claim IN (
        'appropriate',
        'appropriate_with_cautions',
        'not_appropriate',
        'insufficient_data'
      )
    ),
  appropriateness_rationale text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'superseded', 'withdrawn')),
  clinician_attestation_at timestamptz,
  clinician_attestation_note text
);

CREATE INDEX IF NOT EXISTS idx_clinical_recommendations_patient
  ON public.clinical_recommendations (patient_id, created_at DESC);

ALTER TABLE public.clinical_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clinical_recommendations_select ON public.clinical_recommendations;
CREATE POLICY clinical_recommendations_select
  ON public.clinical_recommendations FOR SELECT TO authenticated
  USING (
    public.is_verified_clinician()
    AND (
      clinician_user_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.clinical_care_team ct
        WHERE ct.patient_id = clinical_recommendations.patient_id
          AND ct.user_id = (SELECT auth.uid())
          AND ct.membership_status = 'active'
      )
    )
  );

DROP POLICY IF EXISTS clinical_recommendations_insert ON public.clinical_recommendations;
CREATE POLICY clinical_recommendations_insert
  ON public.clinical_recommendations FOR INSERT TO authenticated
  WITH CHECK (
    public.is_verified_clinician()
    AND clinician_user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS clinical_recommendations_service ON public.clinical_recommendations;
CREATE POLICY clinical_recommendations_service
  ON public.clinical_recommendations FOR ALL TO public
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE OR REPLACE FUNCTION public.clinical_recommendation_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  PERFORM public.clinical_require_core_consent(NEW.patient_id);

  SELECT p.clinical_role INTO v_role
  FROM public.hv_professionals p
  JOIN public.clinical_clinician_links l
    ON l.professional_id = p.id
   AND l.user_id = NEW.clinician_user_id
   AND l.link_status = 'active'
  WHERE p.user_id = NEW.clinician_user_id
    AND p.verification_status = 'verified'
    AND p.status = 'active'
  LIMIT 1;

  IF v_role IS NULL OR NOT public.clinical_authority_allows(
    NEW.jurisdiction, v_role, 'recommend'
  ) THEN
    RAISE EXCEPTION 'clinical_authority_denied: recommend'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.appropriateness_claim IS NOT NULL THEN
    IF NOT public.clinical_authority_allows(
      NEW.jurisdiction, v_role, 'claim_appropriateness'
    ) THEN
      RAISE EXCEPTION 'clinical_authority_denied: claim_appropriateness'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.clinician_attestation_at IS NULL THEN
      NEW.clinician_attestation_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_recommendation_before_insert ON public.clinical_recommendations;
CREATE TRIGGER trg_clinical_recommendation_before_insert
  BEFORE INSERT ON public.clinical_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_recommendation_before_insert();

CREATE OR REPLACE FUNCTION public.clinical_recommendation_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.clinical_audit_write(
    CASE
      WHEN NEW.appropriateness_claim IS NOT NULL THEN 'recommendation.with_appropriateness'
      ELSE 'recommendation.create'
    END,
    'clinical_recommendations',
    NEW.id::text,
    NEW.jurisdiction,
    jsonb_build_object(
      'patient_id', NEW.patient_id,
      'recommendation_key', NEW.recommendation_key,
      'evidence_version', NEW.evidence_version,
      'appropriateness_claim', NEW.appropriateness_claim
    ),
    NEW.clinician_user_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_recommendation_after_insert ON public.clinical_recommendations;
CREATE TRIGGER trg_clinical_recommendation_after_insert
  AFTER INSERT ON public.clinical_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_recommendation_after_insert();

REVOKE ALL ON public.clinical_recommendations FROM anon;
GRANT SELECT, INSERT ON public.clinical_recommendations TO authenticated;
GRANT ALL ON public.clinical_recommendations TO service_role;

-- ---------------------------------------------------------------------------
-- 9. Prescriptions + dispensing workflow
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinical_prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES public.clinical_patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES public.clinical_encounters(id) ON DELETE SET NULL,
  recommendation_id uuid REFERENCES public.clinical_recommendations(id) ON DELETE SET NULL,
  prescriber_user_id uuid NOT NULL,
  jurisdiction text NOT NULL,
  product_code text,
  product_name text NOT NULL,
  dose_text text NOT NULL,
  quantity text,
  directions text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft',
      'signed',
      'sent_to_pharmacy',
      'dispensed',
      'partially_dispensed',
      'cancelled',
      'expired'
    )),
  signed_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_clinical_prescriptions_patient
  ON public.clinical_prescriptions (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_prescriptions_status
  ON public.clinical_prescriptions (status)
  WHERE status NOT IN ('cancelled', 'expired', 'dispensed');

CREATE TABLE IF NOT EXISTS public.clinical_dispensing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  prescription_id uuid NOT NULL REFERENCES public.clinical_prescriptions(id) ON DELETE CASCADE,
  pharmacist_user_id uuid NOT NULL,
  jurisdiction text NOT NULL,
  quantity_dispensed text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'completed'
    CHECK (status IN ('completed', 'reversed')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_clinical_dispensing_rx
  ON public.clinical_dispensing_events (prescription_id, created_at DESC);

ALTER TABLE public.clinical_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_dispensing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clinical_prescriptions_select ON public.clinical_prescriptions;
CREATE POLICY clinical_prescriptions_select
  ON public.clinical_prescriptions FOR SELECT TO authenticated
  USING (
    public.is_verified_clinician()
    AND (
      prescriber_user_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.clinical_care_team ct
        WHERE ct.patient_id = clinical_prescriptions.patient_id
          AND ct.user_id = (SELECT auth.uid())
          AND ct.membership_status = 'active'
      )
    )
  );

DROP POLICY IF EXISTS clinical_prescriptions_insert ON public.clinical_prescriptions;
CREATE POLICY clinical_prescriptions_insert
  ON public.clinical_prescriptions FOR INSERT TO authenticated
  WITH CHECK (
    public.is_verified_clinician()
    AND prescriber_user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS clinical_prescriptions_update ON public.clinical_prescriptions;
CREATE POLICY clinical_prescriptions_update
  ON public.clinical_prescriptions FOR UPDATE TO authenticated
  USING (
    public.is_verified_clinician()
    AND (
      prescriber_user_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.clinical_care_team ct
        WHERE ct.patient_id = clinical_prescriptions.patient_id
          AND ct.user_id = (SELECT auth.uid())
          AND ct.membership_status = 'active'
          AND ct.role IN ('pharmacist', 'treating_clinician')
      )
    )
  )
  WITH CHECK (public.is_verified_clinician());

DROP POLICY IF EXISTS clinical_prescriptions_service ON public.clinical_prescriptions;
CREATE POLICY clinical_prescriptions_service
  ON public.clinical_prescriptions FOR ALL TO public
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS clinical_dispensing_select ON public.clinical_dispensing_events;
CREATE POLICY clinical_dispensing_select
  ON public.clinical_dispensing_events FOR SELECT TO authenticated
  USING (
    public.is_verified_clinician()
    AND (
      pharmacist_user_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1
        FROM public.clinical_prescriptions rx
        JOIN public.clinical_care_team ct ON ct.patient_id = rx.patient_id
        WHERE rx.id = clinical_dispensing_events.prescription_id
          AND ct.user_id = (SELECT auth.uid())
          AND ct.membership_status = 'active'
      )
    )
  );

DROP POLICY IF EXISTS clinical_dispensing_insert ON public.clinical_dispensing_events;
CREATE POLICY clinical_dispensing_insert
  ON public.clinical_dispensing_events FOR INSERT TO authenticated
  WITH CHECK (
    public.is_verified_clinician()
    AND pharmacist_user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS clinical_dispensing_service ON public.clinical_dispensing_events;
CREATE POLICY clinical_dispensing_service
  ON public.clinical_dispensing_events FOR ALL TO public
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE OR REPLACE FUNCTION public.clinical_prescription_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  PERFORM public.clinical_require_core_consent(NEW.patient_id);

  SELECT p.clinical_role INTO v_role
  FROM public.hv_professionals p
  JOIN public.clinical_clinician_links l
    ON l.professional_id = p.id
   AND l.user_id = NEW.prescriber_user_id
   AND l.link_status = 'active'
  WHERE p.user_id = NEW.prescriber_user_id
    AND p.verification_status = 'verified'
    AND p.status = 'active'
  LIMIT 1;

  IF v_role IS NULL OR NOT public.clinical_authority_allows(
    NEW.jurisdiction, v_role, 'prescribe'
  ) THEN
    RAISE EXCEPTION 'clinical_authority_denied: prescribe'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_prescription_before_insert ON public.clinical_prescriptions;
CREATE TRIGGER trg_clinical_prescription_before_insert
  BEFORE INSERT ON public.clinical_prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_prescription_before_insert();

CREATE OR REPLACE FUNCTION public.clinical_prescription_after_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.clinical_audit_write(
      'prescription.' || NEW.status,
      'clinical_prescriptions',
      NEW.id::text,
      NEW.jurisdiction,
      jsonb_build_object(
        'patient_id', NEW.patient_id,
        'product_name', NEW.product_name,
        'status', NEW.status
      ),
      NEW.prescriber_user_id
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.updated_at := now();
    PERFORM public.clinical_audit_write(
      'prescription.status.' || NEW.status,
      'clinical_prescriptions',
      NEW.id::text,
      NEW.jurisdiction,
      jsonb_build_object(
        'patient_id', NEW.patient_id,
        'from_status', OLD.status,
        'to_status', NEW.status
      ),
      (SELECT auth.uid())
    );
  END IF;
  RETURN NEW;
END;
$$;

-- BEFORE UPDATE for updated_at + AFTER for audit on prescriptions
CREATE OR REPLACE FUNCTION public.clinical_prescription_before_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.status = 'signed' AND OLD.status = 'draft' AND NEW.signed_at IS NULL THEN
    NEW.signed_at := now();
  END IF;
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' AND NEW.cancelled_at IS NULL THEN
    NEW.cancelled_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_prescription_before_update ON public.clinical_prescriptions;
CREATE TRIGGER trg_clinical_prescription_before_update
  BEFORE UPDATE ON public.clinical_prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_prescription_before_update();

DROP TRIGGER IF EXISTS trg_clinical_prescription_after_write ON public.clinical_prescriptions;
CREATE TRIGGER trg_clinical_prescription_after_write
  AFTER INSERT OR UPDATE ON public.clinical_prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_prescription_after_write();

CREATE OR REPLACE FUNCTION public.clinical_dispensing_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_rx public.clinical_prescriptions%ROWTYPE;
BEGIN
  SELECT * INTO v_rx FROM public.clinical_prescriptions WHERE id = NEW.prescription_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'clinical_prescription_not_found' USING ERRCODE = 'P0002';
  END IF;

  PERFORM public.clinical_require_core_consent(v_rx.patient_id);

  SELECT p.clinical_role INTO v_role
  FROM public.hv_professionals p
  JOIN public.clinical_clinician_links l
    ON l.professional_id = p.id
   AND l.user_id = NEW.pharmacist_user_id
   AND l.link_status = 'active'
  WHERE p.user_id = NEW.pharmacist_user_id
    AND p.verification_status = 'verified'
    AND p.status = 'active'
  LIMIT 1;

  IF v_role IS NULL OR NOT public.clinical_authority_allows(
    NEW.jurisdiction, v_role, 'dispense'
  ) THEN
    RAISE EXCEPTION 'clinical_authority_denied: dispense'
      USING ERRCODE = '42501';
  END IF;

  IF v_rx.status NOT IN ('signed', 'sent_to_pharmacy', 'partially_dispensed') THEN
    RAISE EXCEPTION 'clinical_prescription_not_dispensable: status=%', v_rx.status
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_dispensing_before_insert ON public.clinical_dispensing_events;
CREATE TRIGGER trg_clinical_dispensing_before_insert
  BEFORE INSERT ON public.clinical_dispensing_events
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_dispensing_before_insert();

CREATE OR REPLACE FUNCTION public.clinical_dispensing_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.clinical_prescriptions
  SET status = 'dispensed',
      updated_at = now()
  WHERE id = NEW.prescription_id
    AND status IN ('signed', 'sent_to_pharmacy', 'partially_dispensed');

  PERFORM public.clinical_audit_write(
    'dispensing.completed',
    'clinical_dispensing_events',
    NEW.id::text,
    NEW.jurisdiction,
    jsonb_build_object(
      'prescription_id', NEW.prescription_id,
      'quantity_dispensed', NEW.quantity_dispensed
    ),
    NEW.pharmacist_user_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_dispensing_after_insert ON public.clinical_dispensing_events;
CREATE TRIGGER trg_clinical_dispensing_after_insert
  AFTER INSERT ON public.clinical_dispensing_events
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_dispensing_after_insert();

REVOKE ALL ON public.clinical_prescriptions FROM anon;
REVOKE ALL ON public.clinical_dispensing_events FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.clinical_prescriptions TO authenticated;
GRANT SELECT, INSERT ON public.clinical_dispensing_events TO authenticated;
GRANT ALL ON public.clinical_prescriptions TO service_role;
GRANT ALL ON public.clinical_dispensing_events TO service_role;

COMMENT ON TABLE public.clinical_jurisdiction_authority IS
  'Fail-closed capability matrix by jurisdiction and clinical_role.';
COMMENT ON TABLE public.clinical_calculations IS
  'Versioned dose/clinical calculations; requires consent + authority.';
COMMENT ON TABLE public.clinical_recommendations IS
  'Personalised recommendations; appropriateness claims authority-gated + attested.';
COMMENT ON TABLE public.clinical_prescriptions IS
  'Prescription workflow draft→signed→pharmacy→dispensed.';
COMMENT ON TABLE public.clinical_dispensing_events IS
  'Pharmacist dispensing events against signed prescriptions.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260727162000','clinical_workflows','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260727162000_clinical_workflows.sql

-- RECOVERY BEGIN 20260727212340_remove_duplicate_legacy_seed_entities_ia_graph.sql
-- Repaired 2026-08-05. The comment block below was committed as one physical
-- line carrying literal backslash-n escapes instead of real newlines, and the
-- last thing on that line was the DELETE statement's first line. The leading
-- `--` therefore commented the DELETE out, leaving its WHERE clause stranded
-- on the next real line:
--   ERROR: syntax error at or near "WHERE" (SQLSTATE 42601)
-- Same defect already repaired at 20260727105241. Only the escapes were
-- expanded; the statement is unchanged and still matches statements[1] of the
-- live ledger row exactly (123 chars, md5 0bec6249d9fa16f907177b3fcbe826de).

-- Removes 8 duplicate legacy seed rows from ia_graph_entities (ids ge-001..ge-007, ge-019).
-- These were hand-seeded on 2026-05-31 (before the current gr-ent-<hash> entity-resolution
-- pipeline existed) and duplicated 8 labels the new pipeline had independently re-created on
-- 2026-07-04 (Germany, United Kingdom, Portugal, Canada, Australia, Netherlands, Colombia,
-- BfArM Medical Cannabis Registry) -- e.g. "Australia" existed twice as two separate graph
-- nodes, each carrying only half the real connection/signal counts.
--
-- Confirmed zero live references to the old ids before deleting: neither hv_entity_mentions
-- (FK-enforced) nor signal_entities (informal) had ever pointed to any ge-XXX id -- the old
-- rows were fully disconnected from the real signal graph, and their connection_count /
-- signal_count were static seed numbers, not live-computed. For that reason this is a plain
-- delete, not a count-merge into the surviving rows -- merging would have mixed fabricated
-- seed numbers into the new pipeline's real computed counts.
--
-- Applied directly to production via Supabase MCP; committed here per
-- docs/control/CONCURRENT_SESSION_COORDINATION.md (same-turn convention).

DELETE FROM public.ia_graph_entities
WHERE id IN ('ge-001','ge-002','ge-003','ge-004','ge-005','ge-006','ge-007','ge-019');

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260727212340','remove_duplicate_legacy_seed_entities_ia_graph','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260727212340_remove_duplicate_legacy_seed_entities_ia_graph.sql

-- RECOVERY BEGIN 20260727213922_populate_health_canada_tranche1_57_licence_sites_v2.sql
INSERT INTO public.health_canada_source_snapshots
  (id, source_name, source_url, source_page_details_date, source_fetched_at, source_confidence, source_package_name, row_count)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'Health Canada licensed cannabis cultivators, processors and sellers',
  'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/industry-licensees-applicants/licensed-cultivators-processors-sellers.html',
  '2026-07-10', now(), 'transcript_reconciled_hold',
  'Cannabis Act licence holders (cultivation, processing, sale for medical purposes)', 57
);

INSERT INTO public.health_canada_raw_source_rows
  (source_snapshot_id, source_row_id, source_row_index, raw_company_name, normalized_company_name, province, status, site_marker, licence_class, authorized_classes, website, raw_payload, row_hash)
VALUES
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-001',1,'CRAFT BC HOLDINGS CORP.','craft bc holdings corp','BC','active',NULL,'Micro-Processing','Plants/Seeds; Dried/Fresh',NULL,'{}'::jsonb, md5('CRAFT BC HOLDINGS CORP.|BC|Micro-Processing')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-002',2,'1411763 B.C. Ltd.','1411763 bc ltd','BC','active',NULL,'Micro-Cultivation','Plants/Seeds',NULL,'{}'::jsonb, md5('1411763 B.C. Ltd.|BC|Micro-Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-003',3,'1001370515 ONTARIO LTD.','1001370515 ontario ltd','ON','active',NULL,'Micro-Processing; Micro-Cultivation','Plants/Seeds; Dried/Fresh',NULL,'{}'::jsonb, md5('1001370515 ONTARIO LTD.|ON|Micro-Processing; Micro-Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-004',4,'2143119 ALBERTA LTD.','2143119 alberta ltd','AB','active','2nd site','Sale (Medical); Processing','Plants/Seeds; Dried/Fresh',NULL,'{}'::jsonb, md5('2143119 ALBERTA LTD.|AB|Sale (Medical); Processing|2nd site')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-005',5,'9520-0671 Québec Inc.','9520-0671 quebec inc','QC','active',NULL,'Micro-Cultivation','Plants/Seeds',NULL,'{}'::jsonb, md5('9520-0671 Québec Inc.|QC|Micro-Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-006',6,'Jackalope Cannabis Inc.','jackalope cannabis inc','SK','active',NULL,'Micro-Processing; Micro-Cultivation','Plants/Seeds; Dried/Fresh',NULL,'{}'::jsonb, md5('Jackalope Cannabis Inc.|SK|Micro-Processing; Micro-Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-007',7,'FIRST NATIONS CANNA CORP.','first nations canna corp','BC','active',NULL,'Micro-Processing; Micro-Cultivation','Plants/Seeds; Dried/Fresh',NULL,'{}'::jsonb, md5('FIRST NATIONS CANNA CORP.|BC|Micro-Processing; Micro-Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-008',8,'Great Gardener Farms Ltd.','great gardener farms ltd','BC','active','2nd site','Micro-Cultivation','Plants/Seeds','https://www.greatgardenerfarms.com','{}'::jsonb, md5('Great Gardener Farms Ltd.|BC|Micro-Cultivation|2nd site')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-009',9,'Iconic Clones Incorporated','iconic clones incorporated','NS','active',NULL,'Nursery','Plants/Seeds',NULL,'{}'::jsonb, md5('Iconic Clones Incorporated|NS|Nursery')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-010',10,'BC CANN PROCESSING INC.','bc cann processing inc','BC','active',NULL,'Sale (Medical); Processing','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical','https://www.bccann.com','{}'::jsonb, md5('BC CANN PROCESSING INC.|BC|Sale (Medical); Processing')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-011',11,'DEALR CANNABIS INC.','dealr cannabis inc','BC','active',NULL,'Processing; Cultivation','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical','https://dealrcannabis.com','{}'::jsonb, md5('DEALR CANNABIS INC.|BC|Processing; Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-012',12,'DEALR CANNABIS INC.','dealr cannabis inc','BC','active','2nd site','Micro-Cultivation','Plants/Seeds','https://dealrcannabis.com','{}'::jsonb, md5('DEALR CANNABIS INC.|BC|Micro-Cultivation|2nd site')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-013',13,'Nextleaf Labs Ltd.','nextleaf labs ltd','BC','active','2nd site','Micro-Processing','Plants/Seeds; Dried/Fresh','https://www.nextleafsolutions.com','{}'::jsonb, md5('Nextleaf Labs Ltd.|BC|Micro-Processing|2nd site')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-014',14,'Orbex Solutions Ltd.','orbex solutions ltd','ON','active','2nd site','Sale (Medical); Processing','Plants/Seeds; Dried/Fresh',NULL,'{}'::jsonb, md5('Orbex Solutions Ltd.|ON|Sale (Medical); Processing|2nd site')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-015',15,'Metro Green Logistics Limited Partnership','metro green logistics lp','ON','active','3rd site','Sale (Medical); Processing','Plants/Seeds; Dried/Fresh',NULL,'{}'::jsonb, md5('Metro Green Logistics LP|ON|Sale (Medical); Processing|3rd site')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-016',16,'Rubicon Holdings Corp.','rubicon holdings corp','BC','active','2nd site','Processing; Cultivation','Plants/Seeds; Dried/Fresh','https://www.rubiconorganics.com','{}'::jsonb, md5('Rubicon Holdings Corp.|BC|Processing; Cultivation|2nd site')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-017',17,'Christina Lake Cannabis Corp.','christina lake cannabis corp','BC','active','2nd site','Cultivation','Plants/Seeds','https://christinalakecannabis.com','{}'::jsonb, md5('Christina Lake Cannabis Corp.|BC|Cultivation|2nd site')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-018',18,'ORGANIGRAM INC.','organigram inc','ON','active','2nd site','Processing','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical',NULL,'{}'::jsonb, md5('ORGANIGRAM INC.|ON|Processing|2nd site')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-019',19,'South Okanagan Cannabis Company Inc.','south okanagan cannabis company inc','BC','active','2nd site','Micro-Processing','Plants/Seeds; Dried/Fresh',NULL,'{}'::jsonb, md5('South Okanagan Cannabis Company Inc.|BC|Micro-Processing|2nd site')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-020',20,'South Okanagan Cannabis Company Inc.','south okanagan cannabis company inc','BC','active',NULL,'Cultivation','Plants/Seeds',NULL,'{}'::jsonb, md5('South Okanagan Cannabis Company Inc.|BC|Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-021',21,'Sathiananthan Farms Inc.','sathiananthan farms inc','BC','revoked_on_request',NULL,'REVOKED ON REQUEST',NULL,NULL,'{}'::jsonb, md5('Sathiananthan Farms Inc.|BC|REVOKED')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-022',22,'Humble Grow Corp.','humble grow corp','MB','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical',NULL,'{}'::jsonb, md5('Humble Grow Corp.|MB|Sale (Medical); Processing; Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-023',23,'AgMedica Bioscience Inc.','agmedica bioscience inc','ON','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical',NULL,'{}'::jsonb, md5('AgMedica Bioscience Inc.|ON|Sale (Medical); Processing; Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-024',24,'Freedom Cannabis Inc.','freedom cannabis inc','AB','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical',NULL,'{}'::jsonb, md5('Freedom Cannabis Inc.|AB|Sale (Medical); Processing; Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-025',25,'Entourage Brands Corp.','entourage brands corp','ON','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical',NULL,'{}'::jsonb, md5('Entourage Brands Corp.|ON|Sale (Medical); Processing; Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-026',26,'8586985 Canada Corp. d.b.a. WILL Cannabis Group','8586985 canada corp','ON','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh',NULL,'{}'::jsonb, md5('8586985 Canada Corp.|ON|Sale (Medical); Processing; Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-027',27,'Trichome JWC Acquisition Corp. d.b.a. JWC','trichome jwc acquisition corp','ON','active',NULL,'Micro-Cultivation','Plants/Seeds',NULL,'{}'::jsonb, md5('Trichome JWC Acquisition Corp.|ON|Micro-Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-028',28,'8688958 CANADA INC.','8688958 canada inc','QC','active',NULL,'Processing; Cultivation; Sale (Medical)','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical','https://www.lot420.com','{}'::jsonb, md5('8688958 CANADA INC.|QC|Processing; Cultivation; Sale (Medical)')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-029',29,'Aubrey Duncan Lang','aubrey duncan lang','ON','active',NULL,'Micro-Cultivation','Plants/Seeds',NULL,'{}'::jsonb, md5('Aubrey Duncan Lang|ON|Micro-Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-030',30,'Jonathon Couchie','jonathon couchie','ON','active',NULL,'Micro-Cultivation','Plants/Seeds',NULL,'{}'::jsonb, md5('Jonathon Couchie|ON|Micro-Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-031',31,'Ran Marduhaev','ran marduhaev','ON','active',NULL,'Micro-Cultivation','Plants/Seeds',NULL,'{}'::jsonb, md5('Ran Marduhaev|ON|Micro-Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-032',32,'Adrian Tornifoglia','adrian tornifoglia','ON','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh',NULL,'{}'::jsonb, md5('Adrian Tornifoglia|ON|Sale (Medical); Processing; Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-033',33,'Olds softgels Ltd.','olds softgels ltd','AB','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical','https://osg4life.com','{}'::jsonb, md5('Olds softgels Ltd.|AB|Sale (Medical); Processing; Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-034',34,'Argento Medical Inc.','argento medical inc','ON','active',NULL,'Sale (Medical)','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical','https://argentomedical.ca','{}'::jsonb, md5('Argento Medical Inc.|ON|Sale (Medical)')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-035',35,'Pure Blue Cannabis Inc.','pure blue cannabis inc','ON','active',NULL,'Processing; Cultivation','Plants/Seeds; Dried/Fresh','http://purebluecannabis.com','{}'::jsonb, md5('Pure Blue Cannabis Inc.|ON|Processing; Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-036',36,'Smyle Brands Ltd.','smyle brands ltd','BC','active',NULL,'Processing','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical','https://smylebrands.com','{}'::jsonb, md5('Smyle Brands Ltd.|BC|Processing')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-037',37,'Purplefarm Genetics (Fredericton) Inc.','purplefarm genetics fredericton inc','NB','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh',NULL,'{}'::jsonb, md5('Purplefarm Genetics (Fredericton) Inc.|NB|Sale (Medical); Processing; Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-038',38,'Pharmaflorx Inc.','pharmaflorx inc','QC','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh','https://www.pharmaflo.ca','{}'::jsonb, md5('Pharmaflorx Inc.|QC|Sale (Medical); Processing; Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-039',39,'Connected Supply Chain Solutions Ltd.','connected supply chain solutions ltd','BC','active',NULL,'Sale (Medical); Processing','Plants/Seeds; Dried/Fresh','https://connectedscs.com','{}'::jsonb, md5('Connected Supply Chain Solutions Ltd.|BC|Sale (Medical); Processing')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-040',40,'Prolot Packaging Inc. (D.B.A. Cannabis Co-Pack)','prolot packaging inc','ON','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical','https://www.cannabiscopack.com','{}'::jsonb, md5('Prolot Packaging Inc.|ON|Sale (Medical); Processing; Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-041',41,'Nacerna Life Sciences Inc.','nacerna life sciences inc','NS','active',NULL,'Sale (Medical); Micro-Processing','Plants/Seeds; Dried/Fresh','https://wearenacerna.com','{}'::jsonb, md5('Nacerna Life Sciences Inc.|NS|Sale (Medical); Micro-Processing')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-042',42,'Greencraft Cannabis Limited Partnership','greencraft cannabis lp','MB','active',NULL,'Sale (Medical); Micro-Processing; Micro-Cultivation','Plants/Seeds; Dried/Fresh','http://www.greencraftcannabis.ca','{}'::jsonb, md5('Greencraft Cannabis LP|MB|Sale (Medical); Micro-Processing; Micro-Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-043',43,'CANNAJUANA LABORATORY INC.','cannajuana laboratory inc','QC','active',NULL,'Sale (Medical); Micro-Processing; Micro-Cultivation','Plants/Seeds; Dried/Fresh',NULL,'{}'::jsonb, md5('CANNAJUANA LABORATORY INC.|QC|Sale (Medical); Micro-Processing; Micro-Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-044',44,'Meridian 125 W Cultivation Ltd.','meridian 125 w cultivation ltd','BC','active',NULL,'Sale (Medical); Cultivation','Plants/Seeds',NULL,'{}'::jsonb, md5('Meridian 125 W Cultivation Ltd.|BC|Sale (Medical); Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-045',45,'1000536880 Ontario Inc. d.b.a. 1809 Underground','1000536880 ontario inc','ON','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh','https://www.1809underground.ca','{}'::jsonb, md5('1000536880 Ontario Inc.|ON|Sale (Medical); Processing; Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-046',46,'BC GREEN FARMS LTD.','bc green farms ltd','BC','active',NULL,'Sale (Medical); Micro-Processing; Micro-Cultivation','Plants/Seeds; Dried/Fresh','https://www.bcgreenfarms.ca','{}'::jsonb, md5('BC GREEN FARMS LTD.|BC|Sale (Medical); Micro-Processing; Micro-Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-047',47,'FORT 20 FARMS INC.','fort 20 farms inc','BC','active',NULL,'Micro-Processing; Micro-Cultivation','Plants/Seeds; Dried/Fresh','https://www.fort20farms.com','{}'::jsonb, md5('FORT 20 FARMS INC.|BC|Micro-Processing; Micro-Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-048',48,'ECG HOLDINGS LTD.','ecg holdings ltd','BC','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh',NULL,'{}'::jsonb, md5('ECG HOLDINGS LTD.|BC|Sale (Medical); Processing; Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-049',49,'MEDMAR GROWTH LTD.','medmar growth ltd','BC','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh',NULL,'{}'::jsonb, md5('MEDMAR GROWTH LTD.|BC|Sale (Medical); Processing; Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-050',50,'That''s Dope Cultivation Specialists Inc.','thats dope cultivation specialists inc','BC','active',NULL,'Sale (Medical); Micro-Cultivation','Plants/Seeds',NULL,'{}'::jsonb, md5('Thats Dope Cultivation Specialists Inc.|BC|Sale (Medical); Micro-Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-051',51,'Vanquish Holdings Inc.','vanquish holdings inc','BC','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical',NULL,'{}'::jsonb, md5('Vanquish Holdings Inc.|BC|Sale (Medical); Processing; Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-052',52,'NORTHGROW BOTANICALS LTD.','northgrow botanicals ltd','ON','active',NULL,'Cultivation','Plants/Seeds',NULL,'{}'::jsonb, md5('NORTHGROW BOTANICALS LTD.|ON|Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-053',53,'WILD ISLANDS CANNABIS INC.','wild islands cannabis inc','NS','active',NULL,'Micro-Processing; Micro-Cultivation','Plants/Seeds; Dried/Fresh',NULL,'{}'::jsonb, md5('WILD ISLANDS CANNABIS INC.|NS|Micro-Processing; Micro-Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-054',54,'Germanabis Organic Farming Inc.','germanabis organic farming inc','NS','active',NULL,'Micro-Cultivation','Plants/Seeds','https://germanabis.com','{}'::jsonb, md5('Germanabis Organic Farming Inc.|NS|Micro-Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-055',55,'NORTHERN CANNA INCORPORATED','northern canna incorporated','ON','active',NULL,'Processing; Cultivation','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical',NULL,'{}'::jsonb, md5('NORTHERN CANNA INCORPORATED|ON|Processing; Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-056',56,'Thunder Spirit Ventures Inc.','thunder spirit ventures inc','ON','active',NULL,'Processing; Cultivation','Plants/Seeds; Dried/Fresh',NULL,'{}'::jsonb, md5('Thunder Spirit Ventures Inc.|ON|Processing; Cultivation')),
('b0000000-0000-0000-0000-000000000001','hc-fetch-20260725-057',57,'Anchor Cannabis Inc.','anchor cannabis inc','NB','active',NULL,'Micro-Cultivation','Plants/Seeds','https://www.anchorcannabis.net','{}'::jsonb, md5('Anchor Cannabis Inc.|NB|Micro-Cultivation'));

INSERT INTO public.canadian_operator_canonical
  (canonical_operator_id, canonical_name, normalized_name, primary_province, track, individual_name_hold, source_confidence)
VALUES
('craft-bc-holdings-corp','Craft BC Holdings Corp.','craft bc holdings corp','BC','micro_craft',false,'transcript_reconciled_hold'),
('1411763-bc-ltd','1411763 B.C. Ltd.','1411763 bc ltd','BC','micro_craft',false,'transcript_reconciled_hold'),
('1001370515-ontario-ltd','1001370515 Ontario Ltd.','1001370515 ontario ltd','ON','micro_craft',false,'transcript_reconciled_hold'),
('2143119-alberta-ltd','2143119 Alberta Ltd.','2143119 alberta ltd','AB','medical_processing',false,'transcript_reconciled_hold'),
('9520-0671-quebec-inc','9520-0671 Quebec Inc.','9520-0671 quebec inc','QC','micro_craft',false,'transcript_reconciled_hold'),
('jackalope-cannabis-inc','Jackalope Cannabis Inc.','jackalope cannabis inc','SK','micro_craft',false,'transcript_reconciled_hold'),
('first-nations-canna-corp','First Nations Canna Corp.','first nations canna corp','BC','micro_craft',false,'transcript_reconciled_hold'),
('great-gardener-farms-ltd','Great Gardener Farms Ltd.','great gardener farms ltd','BC','micro_craft',false,'transcript_reconciled_hold'),
('iconic-clones-incorporated','Iconic Clones Incorporated','iconic clones incorporated','NS','nursery_starting_material',false,'transcript_reconciled_hold'),
('bc-cann-processing-inc','BC Cann Processing Inc.','bc cann processing inc','BC','medical_processing',false,'transcript_reconciled_hold'),
('dealr-cannabis-inc','DEALR Cannabis Inc.','dealr cannabis inc','BC','processor_cultivator',false,'transcript_reconciled_hold'),
('nextleaf-labs-ltd','Nextleaf Labs Ltd.','nextleaf labs ltd','BC','micro_craft',false,'transcript_reconciled_hold'),
('orbex-solutions-ltd','Orbex Solutions Ltd.','orbex solutions ltd','ON','medical_processing',false,'transcript_reconciled_hold'),
('metro-green-logistics-lp','Metro Green Logistics Limited Partnership','metro green logistics lp','ON','medical_processing',false,'transcript_reconciled_hold'),
('rubicon-holdings-corp','Rubicon Holdings Corp.','rubicon holdings corp','BC','processor_cultivator',false,'transcript_reconciled_hold'),
('christina-lake-cannabis-corp','Christina Lake Cannabis Corp.','christina lake cannabis corp','BC','processor_cultivator',false,'transcript_reconciled_hold'),
('organigram-inc','Organigram Inc.','organigram inc','ON','integrated_operator',false,'transcript_reconciled_hold'),
('south-okanagan-cannabis-company-inc','South Okanagan Cannabis Company Inc.','south okanagan cannabis company inc','BC','processor_cultivator',false,'transcript_reconciled_hold'),
('sathiananthan-farms-inc','Sathiananthan Farms Inc.','sathiananthan farms inc','BC','exclusion',false,'transcript_reconciled_hold'),
('humble-grow-corp','Humble Grow Corp.','humble grow corp','MB','integrated_operator',false,'transcript_reconciled_hold'),
('agmedica-bioscience-inc','AgMedica Bioscience Inc.','agmedica bioscience inc','ON','integrated_operator',false,'transcript_reconciled_hold'),
('freedom-cannabis-inc','Freedom Cannabis Inc.','freedom cannabis inc','AB','integrated_operator',false,'transcript_reconciled_hold'),
('entourage-brands-corp','Entourage Brands Corp.','entourage brands corp','ON','integrated_operator',false,'transcript_reconciled_hold'),
('8586985-canada-corp','8586985 Canada Corp. (d.b.a. WILL Cannabis Group)','8586985 canada corp','ON','integrated_operator',false,'transcript_reconciled_hold'),
('trichome-jwc-acquisition-corp','Trichome JWC Acquisition Corp. (d.b.a. JWC)','trichome jwc acquisition corp','ON','micro_craft',false,'transcript_reconciled_hold'),
('8688958-canada-inc','8688958 Canada Inc. (d.b.a. LOT420)','8688958 canada inc','QC','integrated_operator',false,'transcript_reconciled_hold'),
('aubrey-duncan-lang','Aubrey Duncan Lang','aubrey duncan lang','ON','individual_name_verification_hold',true,'transcript_reconciled_hold'),
('jonathon-couchie','Jonathon Couchie','jonathon couchie','ON','individual_name_verification_hold',true,'transcript_reconciled_hold'),
('ran-marduhaev','Ran Marduhaev','ran marduhaev','ON','individual_name_verification_hold',true,'transcript_reconciled_hold'),
('adrian-tornifoglia','Adrian Tornifoglia','adrian tornifoglia','ON','individual_name_verification_hold',true,'transcript_reconciled_hold'),
('olds-softgels-ltd','Olds Softgels Ltd.','olds softgels ltd','AB','integrated_operator',false,'transcript_reconciled_hold'),
('argento-medical-inc','Argento Medical Inc.','argento medical inc','ON','medical_only',false,'transcript_reconciled_hold'),
('pure-blue-cannabis-inc','Pure Blue Cannabis Inc.','pure blue cannabis inc','ON','processor_cultivator',false,'transcript_reconciled_hold'),
('smyle-brands-ltd','Smyle Brands Ltd.','smyle brands ltd','BC','medical_processing',false,'transcript_reconciled_hold'),
('purplefarm-genetics-fredericton-inc','Purplefarm Genetics (Fredericton) Inc.','purplefarm genetics fredericton inc','NB','integrated_operator',false,'transcript_reconciled_hold'),
('pharmaflorx-inc','Pharmaflorx Inc.','pharmaflorx inc','QC','integrated_operator',false,'transcript_reconciled_hold'),
('connected-supply-chain-solutions-ltd','Connected Supply Chain Solutions Ltd.','connected supply chain solutions ltd','BC','medical_processing',false,'transcript_reconciled_hold'),
('prolot-packaging-inc','Prolot Packaging Inc. (d.b.a. Cannabis Co-Pack)','prolot packaging inc','ON','integrated_operator',false,'transcript_reconciled_hold'),
('nacerna-life-sciences-inc','Nacerna Life Sciences Inc.','nacerna life sciences inc','NS','medical_processing',false,'transcript_reconciled_hold'),
('greencraft-cannabis-lp','Greencraft Cannabis Limited Partnership','greencraft cannabis lp','MB','medical_processing',false,'transcript_reconciled_hold'),
('cannajuana-laboratory-inc','Cannajuana Laboratory Inc.','cannajuana laboratory inc','QC','medical_processing',false,'transcript_reconciled_hold'),
('meridian-125-w-cultivation-ltd','Meridian 125 W Cultivation Ltd.','meridian 125 w cultivation ltd','BC','medical_processing',false,'transcript_reconciled_hold'),
('1809-underground','1000536880 Ontario Inc. (d.b.a. 1809 Underground)','1000536880 ontario inc','ON','integrated_operator',false,'transcript_reconciled_hold'),
('bc-green-farms-ltd','BC Green Farms Ltd.','bc green farms ltd','BC','medical_processing',false,'transcript_reconciled_hold'),
('fort-20-farms-inc','Fort 20 Farms Inc.','fort 20 farms inc','BC','micro_craft',false,'transcript_reconciled_hold'),
('ecg-holdings-ltd','ECG Holdings Ltd.','ecg holdings ltd','BC','integrated_operator',false,'transcript_reconciled_hold'),
('medmar-growth-ltd','Medmar Growth Ltd.','medmar growth ltd','BC','integrated_operator',false,'transcript_reconciled_hold'),
('that-s-dope-cultivation-specialists-inc','That''s Dope Cultivation Specialists Inc.','thats dope cultivation specialists inc','BC','medical_processing',false,'transcript_reconciled_hold'),
('vanquish-holdings-inc','Vanquish Holdings Inc.','vanquish holdings inc','BC','integrated_operator',false,'transcript_reconciled_hold'),
('northgrow-botanicals-ltd','Northgrow Botanicals Ltd.','northgrow botanicals ltd','ON','processor_cultivator',false,'transcript_reconciled_hold'),
('wild-islands-cannabis-inc','Wild Islands Cannabis Inc.','wild islands cannabis inc','NS','micro_craft',false,'transcript_reconciled_hold'),
('germanabis-organic-farming-inc','Germanabis Organic Farming Inc.','germanabis organic farming inc','NS','micro_craft',false,'transcript_reconciled_hold'),
('northern-canna-incorporated','Northern Canna Incorporated','northern canna incorporated','ON','processor_cultivator',false,'transcript_reconciled_hold'),
('thunder-spirit-ventures-inc','Thunder Spirit Ventures Inc.','thunder spirit ventures inc','ON','processor_cultivator',false,'transcript_reconciled_hold'),
('anchor-cannabis-inc','Anchor Cannabis Inc.','anchor cannabis inc','NB','micro_craft',false,'transcript_reconciled_hold');

INSERT INTO public.canadian_operator_licence_sites
  (site_id, canonical_operator_id, source_row_id, company_name, province, status, site_marker, licence_class, authorized_classes, website, track, outreach_ready, evidence_type, review_required)
VALUES
('hc-2026-0001','craft-bc-holdings-corp','hc-fetch-20260725-001','CRAFT BC HOLDINGS CORP.','BC','active',NULL,'Micro-Processing','Plants/Seeds; Dried/Fresh',NULL,'micro_craft',false,'government_registry',false),
('hc-2026-0002','1411763-bc-ltd','hc-fetch-20260725-002','1411763 B.C. Ltd.','BC','active',NULL,'Micro-Cultivation','Plants/Seeds',NULL,'micro_craft',false,'government_registry',false),
('hc-2026-0003','1001370515-ontario-ltd','hc-fetch-20260725-003','1001370515 ONTARIO LTD.','ON','active',NULL,'Micro-Processing; Micro-Cultivation','Plants/Seeds; Dried/Fresh',NULL,'micro_craft',false,'government_registry',false),
('hc-2026-0004','2143119-alberta-ltd','hc-fetch-20260725-004','2143119 ALBERTA LTD.','AB','active','2nd site','Sale (Medical); Processing','Plants/Seeds; Dried/Fresh',NULL,'medical_processing',true,'government_registry',false),
('hc-2026-0005','9520-0671-quebec-inc','hc-fetch-20260725-005','9520-0671 Quebec Inc.','QC','active',NULL,'Micro-Cultivation','Plants/Seeds',NULL,'micro_craft',false,'government_registry',false),
('hc-2026-0006','jackalope-cannabis-inc','hc-fetch-20260725-006','Jackalope Cannabis Inc.','SK','active',NULL,'Micro-Processing; Micro-Cultivation','Plants/Seeds; Dried/Fresh',NULL,'micro_craft',false,'government_registry',false),
('hc-2026-0007','first-nations-canna-corp','hc-fetch-20260725-007','FIRST NATIONS CANNA CORP.','BC','active',NULL,'Micro-Processing; Micro-Cultivation','Plants/Seeds; Dried/Fresh',NULL,'micro_craft',false,'government_registry',false),
('hc-2026-0008','great-gardener-farms-ltd','hc-fetch-20260725-008','Great Gardener Farms Ltd.','BC','active','2nd site','Micro-Cultivation','Plants/Seeds','https://www.greatgardenerfarms.com','micro_craft',true,'government_registry',false),
('hc-2026-0009','iconic-clones-incorporated','hc-fetch-20260725-009','Iconic Clones Incorporated','NS','active',NULL,'Nursery','Plants/Seeds',NULL,'nursery_starting_material',false,'government_registry',false),
('hc-2026-0010','bc-cann-processing-inc','hc-fetch-20260725-010','BC CANN PROCESSING INC.','BC','active',NULL,'Sale (Medical); Processing','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical','https://www.bccann.com','medical_processing',true,'government_registry',false),
('hc-2026-0011','dealr-cannabis-inc','hc-fetch-20260725-011','DEALR CANNABIS INC.','BC','active',NULL,'Processing; Cultivation','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical','https://dealrcannabis.com','processor_cultivator',true,'government_registry',false),
('hc-2026-0012','dealr-cannabis-inc','hc-fetch-20260725-012','DEALR CANNABIS INC.','BC','active','2nd site','Micro-Cultivation','Plants/Seeds','https://dealrcannabis.com','micro_craft',true,'government_registry',false),
('hc-2026-0013','nextleaf-labs-ltd','hc-fetch-20260725-013','Nextleaf Labs Ltd.','BC','active','2nd site','Micro-Processing','Plants/Seeds; Dried/Fresh','https://www.nextleafsolutions.com','micro_craft',true,'government_registry',false),
('hc-2026-0014','orbex-solutions-ltd','hc-fetch-20260725-014','Orbex Solutions Ltd.','ON','active','2nd site','Sale (Medical); Processing','Plants/Seeds; Dried/Fresh',NULL,'medical_processing',true,'government_registry',false),
('hc-2026-0015','metro-green-logistics-lp','hc-fetch-20260725-015','Metro Green Logistics Limited Partnership','ON','active','3rd site','Sale (Medical); Processing','Plants/Seeds; Dried/Fresh',NULL,'medical_processing',true,'government_registry',false),
('hc-2026-0016','rubicon-holdings-corp','hc-fetch-20260725-016','Rubicon Holdings Corp.','BC','active','2nd site','Processing; Cultivation','Plants/Seeds; Dried/Fresh','https://www.rubiconorganics.com','processor_cultivator',true,'government_registry',false),
('hc-2026-0017','christina-lake-cannabis-corp','hc-fetch-20260725-017','Christina Lake Cannabis Corp.','BC','active','2nd site','Cultivation','Plants/Seeds','https://christinalakecannabis.com','processor_cultivator',true,'government_registry',false),
('hc-2026-0018','organigram-inc','hc-fetch-20260725-018','ORGANIGRAM INC.','ON','active','2nd site','Processing','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical',NULL,'integrated_operator',true,'government_registry',false),
('hc-2026-0019','south-okanagan-cannabis-company-inc','hc-fetch-20260725-019','South Okanagan Cannabis Company Inc.','BC','active','2nd site','Micro-Processing','Plants/Seeds; Dried/Fresh',NULL,'micro_craft',false,'government_registry',false),
('hc-2026-0020','south-okanagan-cannabis-company-inc','hc-fetch-20260725-020','South Okanagan Cannabis Company Inc.','BC','active',NULL,'Cultivation','Plants/Seeds',NULL,'processor_cultivator',false,'government_registry',false),
('hc-2026-0021','sathiananthan-farms-inc','hc-fetch-20260725-021','Sathiananthan Farms Inc.','BC','revoked_on_request',NULL,'REVOKED ON REQUEST',NULL,NULL,'exclusion',false,'government_registry',true),
('hc-2026-0022','humble-grow-corp','hc-fetch-20260725-022','Humble Grow Corp.','MB','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical',NULL,'integrated_operator',true,'government_registry',false),
('hc-2026-0023','agmedica-bioscience-inc','hc-fetch-20260725-023','AgMedica Bioscience Inc.','ON','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical',NULL,'integrated_operator',true,'government_registry',false),
('hc-2026-0024','freedom-cannabis-inc','hc-fetch-20260725-024','Freedom Cannabis Inc.','AB','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical',NULL,'integrated_operator',true,'government_registry',false),
('hc-2026-0025','entourage-brands-corp','hc-fetch-20260725-025','Entourage Brands Corp.','ON','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical',NULL,'integrated_operator',true,'government_registry',false),
('hc-2026-0026','8586985-canada-corp','hc-fetch-20260725-026','8586985 Canada Corp. d.b.a. WILL Cannabis Group','ON','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh',NULL,'integrated_operator',true,'government_registry',false),
('hc-2026-0027','trichome-jwc-acquisition-corp','hc-fetch-20260725-027','Trichome JWC Acquisition Corp. d.b.a. JWC','ON','active',NULL,'Micro-Cultivation','Plants/Seeds',NULL,'micro_craft',false,'government_registry',false),
('hc-2026-0028','8688958-canada-inc','hc-fetch-20260725-028','8688958 CANADA INC.','QC','active',NULL,'Processing; Cultivation; Sale (Medical)','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical','https://www.lot420.com','integrated_operator',true,'government_registry',false),
('hc-2026-0029','aubrey-duncan-lang','hc-fetch-20260725-029','Aubrey Duncan Lang','ON','active',NULL,'Micro-Cultivation','Plants/Seeds',NULL,'individual_name_verification_hold',false,'government_registry',true),
('hc-2026-0030','jonathon-couchie','hc-fetch-20260725-030','Jonathon Couchie','ON','active',NULL,'Micro-Cultivation','Plants/Seeds',NULL,'individual_name_verification_hold',false,'government_registry',true),
('hc-2026-0031','ran-marduhaev','hc-fetch-20260725-031','Ran Marduhaev','ON','active',NULL,'Micro-Cultivation','Plants/Seeds',NULL,'individual_name_verification_hold',false,'government_registry',true),
('hc-2026-0032','adrian-tornifoglia','hc-fetch-20260725-032','Adrian Tornifoglia','ON','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh',NULL,'individual_name_verification_hold',false,'government_registry',true),
('hc-2026-0033','olds-softgels-ltd','hc-fetch-20260725-033','Olds softgels Ltd.','AB','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical','https://osg4life.com','integrated_operator',true,'government_registry',false),
('hc-2026-0034','argento-medical-inc','hc-fetch-20260725-034','Argento Medical Inc.','ON','active',NULL,'Sale (Medical)','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical','https://argentomedical.ca','medical_only',true,'government_registry',false),
('hc-2026-0035','pure-blue-cannabis-inc','hc-fetch-20260725-035','Pure Blue Cannabis Inc.','ON','active',NULL,'Processing; Cultivation','Plants/Seeds; Dried/Fresh','http://purebluecannabis.com','processor_cultivator',false,'government_registry',false),
('hc-2026-0036','smyle-brands-ltd','hc-fetch-20260725-036','Smyle Brands Ltd.','BC','active',NULL,'Processing','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical','https://smylebrands.com','medical_processing',true,'government_registry',false),
('hc-2026-0037','purplefarm-genetics-fredericton-inc','hc-fetch-20260725-037','Purplefarm Genetics (Fredericton) Inc.','NB','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh',NULL,'integrated_operator',true,'government_registry',false),
('hc-2026-0038','pharmaflorx-inc','hc-fetch-20260725-038','Pharmaflorx Inc.','QC','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh','https://www.pharmaflo.ca','integrated_operator',true,'government_registry',false),
('hc-2026-0039','connected-supply-chain-solutions-ltd','hc-fetch-20260725-039','Connected Supply Chain Solutions Ltd.','BC','active',NULL,'Sale (Medical); Processing','Plants/Seeds; Dried/Fresh','https://connectedscs.com','medical_processing',true,'government_registry',false),
('hc-2026-0040','prolot-packaging-inc','hc-fetch-20260725-040','Prolot Packaging Inc. (D.B.A. Cannabis Co-Pack)','ON','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical','https://www.cannabiscopack.com','integrated_operator',true,'government_registry',false),
('hc-2026-0041','nacerna-life-sciences-inc','hc-fetch-20260725-041','Nacerna Life Sciences Inc.','NS','active',NULL,'Sale (Medical); Micro-Processing','Plants/Seeds; Dried/Fresh','https://wearenacerna.com','medical_processing',true,'government_registry',false),
('hc-2026-0042','greencraft-cannabis-lp','hc-fetch-20260725-042','Greencraft Cannabis Limited Partnership','MB','active',NULL,'Sale (Medical); Micro-Processing; Micro-Cultivation','Plants/Seeds; Dried/Fresh','http://www.greencraftcannabis.ca','medical_processing',true,'government_registry',false),
('hc-2026-0043','cannajuana-laboratory-inc','hc-fetch-20260725-043','CANNAJUANA LABORATORY INC.','QC','active',NULL,'Sale (Medical); Micro-Processing; Micro-Cultivation','Plants/Seeds; Dried/Fresh',NULL,'medical_processing',true,'government_registry',false),
('hc-2026-0044','meridian-125-w-cultivation-ltd','hc-fetch-20260725-044','Meridian 125 W Cultivation Ltd.','BC','active',NULL,'Sale (Medical); Cultivation','Plants/Seeds',NULL,'medical_processing',true,'government_registry',false),
('hc-2026-0045','1809-underground','hc-fetch-20260725-045','1000536880 Ontario Inc. d.b.a. 1809 Underground','ON','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh','https://www.1809underground.ca','integrated_operator',true,'government_registry',false),
('hc-2026-0046','bc-green-farms-ltd','hc-fetch-20260725-046','BC GREEN FARMS LTD.','BC','active',NULL,'Sale (Medical); Micro-Processing; Micro-Cultivation','Plants/Seeds; Dried/Fresh','https://www.bcgreenfarms.ca','medical_processing',true,'government_registry',false),
('hc-2026-0047','fort-20-farms-inc','hc-fetch-20260725-047','FORT 20 FARMS INC.','BC','active',NULL,'Micro-Processing; Micro-Cultivation','Plants/Seeds; Dried/Fresh','https://www.fort20farms.com','micro_craft',false,'government_registry',false),
('hc-2026-0048','ecg-holdings-ltd','hc-fetch-20260725-048','ECG HOLDINGS LTD.','BC','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh',NULL,'integrated_operator',true,'government_registry',false),
('hc-2026-0049','medmar-growth-ltd','hc-fetch-20260725-049','MEDMAR GROWTH LTD.','BC','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh',NULL,'integrated_operator',true,'government_registry',false),
('hc-2026-0050','that-s-dope-cultivation-specialists-inc','hc-fetch-20260725-050','That''s Dope Cultivation Specialists Inc.','BC','active',NULL,'Sale (Medical); Micro-Cultivation','Plants/Seeds',NULL,'medical_processing',true,'government_registry',false),
('hc-2026-0051','vanquish-holdings-inc','hc-fetch-20260725-051','Vanquish Holdings Inc.','BC','active',NULL,'Sale (Medical); Processing; Cultivation','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical',NULL,'integrated_operator',true,'government_registry',false),
('hc-2026-0052','northgrow-botanicals-ltd','hc-fetch-20260725-052','NORTHGROW BOTANICALS LTD.','ON','active',NULL,'Cultivation','Plants/Seeds',NULL,'processor_cultivator',false,'government_registry',false),
('hc-2026-0053','wild-islands-cannabis-inc','hc-fetch-20260725-053','WILD ISLANDS CANNABIS INC.','NS','active',NULL,'Micro-Processing; Micro-Cultivation','Plants/Seeds; Dried/Fresh',NULL,'micro_craft',false,'government_registry',false),
('hc-2026-0054','germanabis-organic-farming-inc','hc-fetch-20260725-054','Germanabis Organic Farming Inc.','NS','active',NULL,'Micro-Cultivation','Plants/Seeds','https://germanabis.com','micro_craft',false,'government_registry',false),
('hc-2026-0055','northern-canna-incorporated','hc-fetch-20260725-055','NORTHERN CANNA INCORPORATED','ON','active',NULL,'Processing; Cultivation','Plants/Seeds; Dried/Fresh; Extracts; Edible; Topical',NULL,'processor_cultivator',false,'government_registry',false),
('hc-2026-0056','thunder-spirit-ventures-inc','hc-fetch-20260725-056','Thunder Spirit Ventures Inc.','ON','active',NULL,'Processing; Cultivation','Plants/Seeds; Dried/Fresh',NULL,'processor_cultivator',false,'government_registry',false),
('hc-2026-0057','anchor-cannabis-inc','hc-fetch-20260725-057','Anchor Cannabis Inc.','NB','active',NULL,'Micro-Cultivation','Plants/Seeds','https://www.anchorcannabis.net','micro_craft',false,'government_registry',false);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260727213922','populate_health_canada_tranche1_57_licence_sites_v2','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260727213922_populate_health_canada_tranche1_57_licence_sites_v2.sql

-- RECOVERY BEGIN 20260728191340_professional_service_providers.sql
-- Professional services marketplace directory. Closes a real gap identified in
-- product review: app/marketplace/professional-services/page.tsx has been a
-- dead one-line redirect stub (`redirect('/dashboard?page=marketplace')`) with
-- no backing schema, no listing, no submission path. This migration adds the
-- directory table and the two thin api-schema views needed to browse
-- (public, approved-only) and apply (authenticated, insert-only) without
-- exposing the base table directly to PostgREST.
--
-- Deliberately NOT seeded with any provider rows. This repo already has one
-- lesson on this exact point: lib/enterprise/fixtures.ts and
-- lib/monetization/fixtures.ts contain hardcoded fake providers ("Insurance
-- Providers -- Cannabis", 8 records) that were never wired to any real data
-- source and are dead code today. Inventing plausible-looking law firms,
-- accountants, or insurers here would repeat that mistake, but live and
-- customer-facing instead of admin-only -- a much worse failure mode. The
-- directory launches empty; real providers are added via the application
-- flow this migration also creates, then approved by an operator.

create table if not exists public.professional_service_providers (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  category          text not null check (
                      category in ('legal', 'accounting', 'insurance', 'banking', 'compliance-consulting')
                    ),
  name              text not null check (length(trim(name)) between 1 and 200),
  description       text check (description is null or length(description) <= 2000),
  markets_covered   text[] not null default '{}',
  website            text check (website is null or length(website) <= 500),
  contact_email     text not null check (length(contact_email) <= 320 and contact_email like '%@%'),
  submitted_by      uuid references auth.users(id) on delete set null default auth.uid(),
  status            text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at       timestamptz,
  reviewer_notes    text
);

alter table public.professional_service_providers enable row level security;

revoke all on public.professional_service_providers from anon;
revoke all on public.professional_service_providers from authenticated;

grant insert on public.professional_service_providers to authenticated;

drop policy if exists "Authenticated users can apply to be listed" on public.professional_service_providers;
create policy "Authenticated users can apply to be listed"
  on public.professional_service_providers
  for insert
  to authenticated
  with check (
    submitted_by is not distinct from auth.uid()
    and status = 'pending'
    and reviewed_at is null
    and reviewer_notes is null
  );

create index if not exists professional_service_providers_status_category_idx
  on public.professional_service_providers (status, category);

create or replace view api.professional_service_providers
with (security_invoker = true)
as
select id, category, name, description, markets_covered, website, created_at
from public.professional_service_providers
where status = 'approved';

grant select on api.professional_service_providers to anon, authenticated;

create or replace view api.professional_service_provider_applications
with (security_invoker = true)
as select * from public.professional_service_providers;

grant insert on api.professional_service_provider_applications to authenticated;

notify pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260728191340','professional_service_providers','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260728191340_professional_service_providers.sql

-- RECOVERY BEGIN 20260728192052_rename_professional_service_providers_table.sql
alter table public.professional_service_providers
  rename to professional_service_provider_listings;

alter index professional_service_providers_status_category_idx
  rename to professional_service_provider_listings_status_category_idx;

create or replace view api.professional_service_providers
with (security_invoker = true)
as
select id, category, name, description, markets_covered, website, created_at
from public.professional_service_provider_listings
where status = 'approved';

grant select on api.professional_service_providers to anon, authenticated;

create or replace view api.professional_service_provider_applications
with (security_invoker = true)
as select * from public.professional_service_provider_listings;

grant insert on api.professional_service_provider_applications to authenticated;

notify pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260728192052','rename_professional_service_providers_table','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260728192052_rename_professional_service_providers_table.sql

-- RECOVERY BEGIN 20260728201438_fix_promote_snapshot_headline_prefers_captured_title.sql
-- Repaired 2026-08-05. The comment block below was committed as one physical
-- line carrying literal backslash-n escapes instead of real newlines, and the
-- last thing on that line was this migration's CREATE OR REPLACE FUNCTION
-- signature. The leading `--` commented the signature out, leaving replay to
-- hit the next real line bare:
--   ERROR: syntax error at or near "RETURNS" (SQLSTATE 42601)
-- Third instance of this defect on this branch, after 20260727105241 and
-- 20260727212340. Only the escapes were expanded. This file holds a single
-- statement, so unlike 20260727105241 it needed no added terminator, and the
-- body still matches statements[1] of the live ledger row exactly
-- (5693 chars, md5 e8978827677725ec9d8f8c40fe9debbc).

-- Fix: promote_snapshot_to_signals() built the headline from the keyword-matched
-- candidate snippet first, falling back to the real page <title> (captured_title)
-- only if the candidate text was null (which it almost never is). For several
-- source templates (Wikipedia navboxes, related-articles sidebars, menu widgets),
-- the keyword scanner matches page chrome rather than the article itself, so the
-- exact same boilerplate string got promoted as "the headline" for many unrelated
-- countries at once. Verified directly: for every affected row checked,
-- source_snapshots.captured_title held the correct real title.
--
-- Fix: prefer captured_title, fall back to candidate text only if the title is
-- missing. Summary is unchanged (still prefers candidate text -- no better
-- body-text alternative exists at this point in the pipeline).
--
-- Historical backfill considered and abandoned: there is no snapshot_id FK on
-- signals, and the best available join (captured_at + source name) produces
-- false matches whenever a source's crawl batch shares one captured_at across
-- many snapshots -- sampled 12 "matches" before running anything and found both
-- old and new headlines were legitimate but unrelated articles, i.e. the backfill
-- would have silently replaced correct headlines with wrong ones. Forward-only fix.
--
-- Applied directly to production via Supabase MCP; committed here per
-- docs/control/CONCURRENT_SESSION_COORDINATION.md (same-turn convention).

CREATE OR REPLACE FUNCTION public.promote_snapshot_to_signals(p_snapshot_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_snapshot  record;
  v_source    record;
  v_candidate jsonb;
  v_candidates_arr jsonb;
  v_scoring   jsonb;
  v_signal_id text;
  v_promoted  integer := 0;
  v_headline  text;
  v_summary   text;
  v_top_lane  text;
  v_text      text;
  v_lead_weeks integer;
BEGIN
  SELECT * INTO v_snapshot FROM public.source_snapshots WHERE id = p_snapshot_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  IF v_snapshot.processing_status != 'extracted' THEN RETURN 0; END IF;
  IF v_snapshot.signal_candidates IS NULL THEN RETURN 0; END IF;

  SELECT sr.source_name, sr.tier, sr.iso, sr.country, sr.region,
         sr.jurisdiction_code, sr.source_url, sr.sub_region
  INTO v_source
  FROM public.source_registry sr WHERE id = v_snapshot.source_id;

  IF NOT FOUND OR v_source.source_name IS NULL THEN
    RETURN 0;
  END IF;

  v_lead_weeks := CASE
    WHEN v_source.tier = 1 THEN 12
    WHEN v_source.tier = 2 THEN 6
    ELSE 4
  END;

  IF jsonb_typeof(v_snapshot.signal_candidates) = 'array' THEN
    v_candidates_arr := v_snapshot.signal_candidates;
  ELSE
    v_candidates_arr := jsonb_build_array(v_snapshot.signal_candidates);
  END IF;

  FOR v_candidate IN
    SELECT value FROM jsonb_array_elements(v_candidates_arr)
  LOOP
    v_text := lower(coalesce(v_candidate->>'text', ''));

    IF v_candidate->>'keyword_count' IS NULL THEN
      CONTINUE WHEN (v_candidate->'matched_keywords' IS NULL
                     OR jsonb_array_length(coalesce(v_candidate->'matched_keywords','[]'::jsonb)) = 0);
    ELSE
      CONTINUE WHEN (v_candidate->>'keyword_count')::int < 2
        AND v_text !~ '\m(cannabis|hemp|cannabinoid|cbd|thc|marijuana|chanvre|ca[nñ]amo|ganja|kannabis|bhang|marihuana|canabis)\M';
    END IF;

    -- Fix: prefer the real page <title> (captured_title) over the keyword-matched
    -- candidate snippet for the headline. The candidate snippet is scanned from
    -- whatever text on the page contains cannabis keywords, which for several
    -- source templates (Wikipedia navboxes, related-articles sidebars, menu
    -- widgets) is page chrome, not the actual article -- causing the exact same
    -- boilerplate string to get promoted as "the headline" for many unrelated
    -- countries at once. captured_title (the real <title> tag) does not have
    -- this failure mode. Candidate text remains the summary's first choice,
    -- since no better body-text alternative exists at this point in the pipeline.
    v_headline := left(coalesce(
      v_snapshot.captured_title,
      v_candidate->>'text',
      v_source.source_name
    ), 200);

    v_summary := coalesce(
      v_candidate->>'text',
      v_candidate->>'summary',
      v_snapshot.captured_title,
      v_source.source_name
    );

    CONTINUE WHEN v_headline ILIKE '%opens new tab%'
      OR v_headline ILIKE '%creative commons%'
      OR v_headline ILIKE '%code of conduct%'
      OR v_headline ILIKE '%hardware, software%'
      OR v_headline ILIKE '%covid-19%'
      OR length(trim(v_headline)) < 30;

    IF EXISTS (
      SELECT 1 FROM public.signals
      WHERE source = v_source.source_name
        AND headline = v_headline
        AND date > now() - interval '30 days'
    ) THEN CONTINUE; END IF;

    v_scoring := public.score_signal_from_snapshot(
      v_snapshot.intelligence_pass,
      v_lead_weeks,
      coalesce((v_candidate->>'keyword_count')::int,
               jsonb_array_length(coalesce(v_candidate->'matched_keywords','[]'::jsonb)))
    );

    v_top_lane := CASE
      WHEN (v_scoring->>'lane_r')::int >= (v_scoring->>'lane_e')::int
       AND (v_scoring->>'lane_r')::int >= (v_scoring->>'lane_t')::int THEN 'Regulatory'
      WHEN (v_scoring->>'lane_e')::int >= (v_scoring->>'lane_t')::int THEN 'Economic'
      ELSE 'Trade'
    END;

    v_signal_id := left(md5(v_source.source_name || v_headline || v_snapshot.captured_at::text), 20);

    INSERT INTO public.signals (
      id, date, cat, pri, score, headline, summary,
      source, url, verification, tier, lang,
      company, country, in_network,
      lane_r, lane_e, lane_t, top_lane,
      query_pack, commercial_impact,
      reviewed, action, created_at
    ) VALUES (
      v_signal_id,
      COALESCE(v_snapshot.captured_at, now()),
      CASE v_snapshot.intelligence_pass
        WHEN 1 THEN 'GAZETTE' WHEN 2 THEN 'PARLIAMENTARY'
        WHEN 3 THEN 'PROCUREMENT' WHEN 4 THEN 'MDB_PROJECT'
        ELSE 'SOURCE_ENGINE'
      END,
      v_scoring->>'pri',
      (v_scoring->>'score')::int,
      v_headline, v_summary,
      v_source.source_name, v_source.source_url,
      'source_engine_v1',
      CASE v_snapshot.intelligence_pass
        WHEN 1 THEN 'Tier 1' WHEN 2 THEN 'Tier 1'
        WHEN 3 THEN 'Tier 2' WHEN 4 THEN 'Tier 2'
        ELSE 'Tier 3'
      END,
      COALESCE(v_snapshot.language_detected, 'en'),
      NULL, v_source.country, false,
      (v_scoring->>'lane_r')::int,
      (v_scoring->>'lane_e')::int,
      (v_scoring->>'lane_t')::int,
      v_top_lane,
      'SP-' || COALESCE(v_snapshot.intelligence_pass::text, 'X')
        || ' | ' || COALESCE(v_source.sub_region, v_source.country, 'Global'),
      CASE
        WHEN (v_scoring->>'score')::int >= 75 THEN 'Immediate trade or market-access relevance'
        WHEN (v_scoring->>'score')::int >= 50 THEN 'Likely trade or market-access relevance'
        ELSE 'Monitor for developing relevance'
      END,
      false, '', now()
    )
    ON CONFLICT (id) DO NOTHING;

    v_promoted := v_promoted + 1;
  END LOOP;

  RETURN v_promoted;
END;
$function$


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260728201438','fix_promote_snapshot_headline_prefers_captured_title','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260728201438_fix_promote_snapshot_headline_prefers_captured_title.sql

-- RECOVERY BEGIN 20260728201439_restore_marketplace_candidates_source_id.sql
-- Production already had marketplace_candidates.source_id when the platform
-- optimization migration was applied, but repository zero-state never recorded
-- its creator. Restore only that prerequisite column immediately before the
-- production-recorded migration that indexes it.
--
-- 20260729000000_platform_optimizations.sql fails without it during zero-state
-- replay, at its eighth statement:
--   CREATE INDEX IF NOT EXISTS idx_marketplace_candidates_source_id
--     ON marketplace_candidates(source_id)
--   column "source_id" does not exist (SQLSTATE 42703)
--
-- Third column restored on this table for the same reason, after
-- 20260615091139 (discovered_at) and 20260719190928 (price_amount).
-- marketplace_candidates is built during replay by the pinned candidate
-- assembler, whose column set differs from production's.
--
-- Shape taken from the live table, not guessed: `text`, nullable, no default,
-- and no constraint on this project references source_id -- despite the name it
-- is not a foreign key to marketplace_source_registry, so none is added here.
--
-- Every other prerequisite 20260729000000 needs is already present at this
-- point in replay: the seventh statement indexes discovered_at (restored at
-- 20260615091139) and succeeds, and hv_import_staging, scraper_source_state,
-- hv_artifacts and source_snapshots -- the tables its remaining statements
-- reference -- are all created earlier. source_id is the only gap.

alter table public.marketplace_candidates
  add column if not exists source_id text;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260728201439','restore_marketplace_candidates_source_id','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260728201439_restore_marketplace_candidates_source_id.sql

-- RECOVERY BEGIN 20260729000002_fix_jurisdiction_playbooks_missing_grant.sql
-- SUPERSEDED. This file's version prefix (20260729000000, later renumbered to
-- 20260729000002 to resolve a collision with platform_optimizations.sql) does
-- not match its actual applied ledger version. The real applied migration is
-- 20260729095416_fix_jurisdiction_playbooks_missing_grant.sql (identical
-- content: grant select on public.jurisdiction_playbooks to anon, authenticated).
-- Retired per docs/control/PENDING_PRODUCTION_MIGRATION_DECISIONS_2026-08-02.md.
-- No-op placeholder -- do not add statements here.


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260729000002','fix_jurisdiction_playbooks_missing_grant','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260729000002_fix_jurisdiction_playbooks_missing_grant.sql

-- RECOVERY BEGIN 20260729021338_fix_professional_services_public_schema_access.sql
create or replace view public.professional_service_providers_public
with (security_invoker = true)
as
select id, category, name, description, markets_covered, website, created_at
from public.professional_service_provider_listings
where status = 'approved';

grant select on public.professional_service_providers_public to anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260729021338','fix_professional_services_public_schema_access','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260729021338_fix_professional_services_public_schema_access.sql

-- RECOVERY BEGIN 20260729021608_fix_provider_view_security_invoker.sql
-- Root cause found via live REST testing: api.professional_service_providers
-- was declared `with (security_invoker = true)`, copied from the INSERT-view
-- precedent (api.client_error_reports) without recognizing that mode is
-- wrong for a SELECT-restriction view. security_invoker=true makes the view
-- execute as the CALLING role, so anon also needed direct SELECT on the
-- underlying public.professional_service_provider_listings table -- which
-- was intentionally never granted (RLS + no anon grant is the point, the
-- view's own WHERE status='approved' + column list is supposed to be the
-- security boundary). Result: anon could never actually read the view,
-- despite every grant on the view itself being correct -- confirmed via
-- information_schema and via three rounds of live REST testing.
--
-- Fix: default to security_invoker=false (the Postgres default -- simply
-- omitting the WITH clause) so the view runs with its OWNER's privileges,
-- bypassing the base table's RLS/grants, with the view's own query doing
-- the actual restriction. This is the standard "curated read view over an
-- RLS-protected table" pattern. The INSERT-facing
-- api.professional_service_provider_applications view keeps
-- security_invoker=true deliberately -- that one SHOULD enforce as the
-- caller, since the point there is to require the caller to satisfy the
-- insert policy themselves (matches original client_error_reports intent).

create or replace view api.professional_service_providers
as
select id, category, name, description, markets_covered, website, created_at
from public.professional_service_provider_listings
where status = 'approved';

grant select on api.professional_service_providers to anon, authenticated;

-- Drop the public-schema workaround view from the prior (unnecessary, since
-- db-schemas here is 'api' only -- public.* objects aren't reachable by name
-- via REST at all, confirmed by the PGRST205 "not found" response it got).
drop view if exists public.professional_service_providers_public;

notify pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260729021608','fix_provider_view_security_invoker','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260729021608_fix_provider_view_security_invoker.sql

-- RECOVERY BEGIN 20260729021709_explicitly_set_security_invoker_false.sql
-- CREATE OR REPLACE VIEW does NOT reset an omitted storage option back to
-- Postgres's default -- it preserves whatever was already set. Confirmed by
-- querying pg_class.reloptions directly: after the prior migration's
-- "create or replace view ... as select ..." with no WITH clause at all,
-- reloptions still showed security_invoker=true. Must set it explicitly.
alter view api.professional_service_providers set (security_invoker = false);
notify pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260729021709','explicitly_set_security_invoker_false','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260729021709_explicitly_set_security_invoker_false.sql

-- RECOVERY BEGIN 20260729021820_grant_select_and_rls_for_approved_listings.sql
-- Real root cause: this project enforces security_invoker=true on every
-- api-schema view via a DDL event trigger
-- (enforce_api_view_security_invoker_trigger) -- a deliberate, project-wide
-- safety guardrail that cannot be overridden per-view (confirmed: DROP+
-- CREATE VIEW with no WITH clause at all still resulted in
-- security_invoker=true in pg_class.reloptions). This is the correct
-- behavior to design around, not fight.
--
-- With security_invoker=true enforced, the calling role (anon/authenticated)
-- needs its own SELECT grant + RLS policy satisfied on the underlying base
-- table -- the view's own WHERE clause is not sufficient on its own. Adding
-- both here. This is safe to do broadly (not narrowing to specific columns)
-- because:
--   1. This project's PostgREST only exposes the `api` schema (confirmed via
--      live testing: requesting an api-schema-only object with no
--      counterpart in `public` returned PGRST205 "not found", not a
--      permission or public-schema resolution) -- so
--      public.professional_service_provider_listings is never reachable by
--      name via REST at all, regardless of what's granted on it directly.
--   2. Column-level restriction (hiding contact_email, submitted_by,
--      status, reviewed_at, reviewer_notes from anon/authenticated) is
--      enforced by api.professional_service_providers' own column list,
--      which is unaffected by the base table's grant breadth.

drop policy if exists "Public can view approved listings" on public.professional_service_provider_listings;
create policy "Public can view approved listings"
  on public.professional_service_provider_listings
  for select
  to anon, authenticated
  using (status = 'approved');

grant select on public.professional_service_provider_listings to anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260729021820','grant_select_and_rls_for_approved_listings','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260729021820_grant_select_and_rls_for_approved_listings.sql

-- RECOVERY BEGIN 20260729025619_add_promoted_status_stop_infinite_rescan.sql
-- Repaired 2026-08-05. The comment block below was committed as one physical
-- line carrying literal backslash-n escapes instead of real newlines, and the
-- last thing on that line was this migration's first statement, the
-- DROP CONSTRAINT. The leading `--` commented it out, so replay went straight
-- to the ADD CONSTRAINT on the next line and collided with the constraint the
-- DROP was supposed to have removed:
--   ERROR: constraint "source_snapshots_processing_status_check" for relation
--   "source_snapshots" already exists (SQLSTATE 42710)
--
-- Fourth and last instance of this defect on this branch, after 20260727105241,
-- 20260727212340 and 20260728201438. Only the escapes were expanded; both
-- statements are unchanged and still match the live ledger row exactly:
--   ALTER TABLE ... DROP/ADD CONSTRAINT   383 chars, md5 5fc1cb510e7dae52b6ba1baa6e9be9d6
--   promote_snapshot_to_signals          5726 chars, md5 13f508342c5b724d44ffb380bb82322f
-- The ledger records the DROP and ADD as one statement, which is why the two
-- together hash as a single 383-character entry.

-- Fix: processing_status never advanced past 'extracted' after a snapshot was
-- promoted to signals, so promote_all_extracted_snapshots() (the daily catch-up
-- cron) re-scanned the entire historical pool of extracted snapshots every run,
-- forever -- not a shrinking backlog. Harmless (signal_id is a deterministic hash
-- and the INSERT uses ON CONFLICT DO NOTHING, so no duplicate signals could ever
-- result) but wasteful, and made "backlog remaining" a meaningless metric.
--
-- Also explains why snapshots could sit unpromoted for a while even with
-- trg_promote_snapshot (AFTER INSERT OR UPDATE OF processing_status) in place:
-- that trigger only fires on a transition INTO 'extracted'. If signal_candidates
-- gets populated by a later UPDATE that does not touch processing_status (already
-- 'extracted'), the trigger never fires, and only the daily cron would ever catch
-- it -- which is why the fix here matters for both paths, not just the cron one.
--
-- Fix: widen the processing_status CHECK constraint to allow a new terminal
-- 'promoted' value, and have promote_snapshot_to_signals() set it (or 'skipped'/
-- 'failed' for its early-exit paths) once a snapshot has actually been considered.
-- Verified end-to-end: ran the daily batch twice after this change -- first run
-- cleared the full backlog (4,140 snapshots, 1,685 additional signals promoted
-- beyond what an earlier manual run under the previous code already added),
-- second run processed exactly 0, confirming re-scanning has stopped.
--
-- Applied directly to production via Supabase MCP; committed here per
-- docs/control/CONCURRENT_SESSION_COORDINATION.md (same-turn convention).

ALTER TABLE public.source_snapshots DROP CONSTRAINT source_snapshots_processing_status_check;
ALTER TABLE public.source_snapshots ADD CONSTRAINT source_snapshots_processing_status_check
  CHECK (processing_status = ANY (ARRAY['pending'::text, 'pending_extraction'::text, 'processing'::text, 'extracted'::text, 'translated'::text, 'promoted'::text, 'failed'::text, 'skipped'::text]));

CREATE OR REPLACE FUNCTION public.promote_snapshot_to_signals(p_snapshot_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_snapshot  record;
  v_source    record;
  v_candidate jsonb;
  v_candidates_arr jsonb;
  v_scoring   jsonb;
  v_signal_id text;
  v_promoted  integer := 0;
  v_headline  text;
  v_summary   text;
  v_top_lane  text;
  v_text      text;
  v_lead_weeks integer;
BEGIN
  SELECT * INTO v_snapshot FROM public.source_snapshots WHERE id = p_snapshot_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  IF v_snapshot.processing_status != 'extracted' THEN RETURN 0; END IF;

  -- Fix: mark a terminal status once this snapshot has been considered, so it
  -- stops being picked up by promote_all_extracted_snapshots() forever. Previously
  -- processing_status never advanced past 'extracted', so the daily batch re-scanned
  -- the entire historical pool every run (harmless -- signal_id is deterministic and
  -- INSERT uses ON CONFLICT DO NOTHING -- but wasteful, and "backlog remaining" was a
  -- meaningless metric as a result).
  IF v_snapshot.signal_candidates IS NULL THEN
    UPDATE public.source_snapshots SET processing_status = 'skipped' WHERE id = p_snapshot_id;
    RETURN 0;
  END IF;

  SELECT sr.source_name, sr.tier, sr.iso, sr.country, sr.region,
         sr.jurisdiction_code, sr.source_url, sr.sub_region
  INTO v_source
  FROM public.source_registry sr WHERE id = v_snapshot.source_id;

  IF NOT FOUND OR v_source.source_name IS NULL THEN
    UPDATE public.source_snapshots SET processing_status = 'failed' WHERE id = p_snapshot_id;
    RETURN 0;
  END IF;

  v_lead_weeks := CASE
    WHEN v_source.tier = 1 THEN 12
    WHEN v_source.tier = 2 THEN 6
    ELSE 4
  END;

  IF jsonb_typeof(v_snapshot.signal_candidates) = 'array' THEN
    v_candidates_arr := v_snapshot.signal_candidates;
  ELSE
    v_candidates_arr := jsonb_build_array(v_snapshot.signal_candidates);
  END IF;

  FOR v_candidate IN
    SELECT value FROM jsonb_array_elements(v_candidates_arr)
  LOOP
    v_text := lower(coalesce(v_candidate->>'text', ''));

    IF v_candidate->>'keyword_count' IS NULL THEN
      CONTINUE WHEN (v_candidate->'matched_keywords' IS NULL
                     OR jsonb_array_length(coalesce(v_candidate->'matched_keywords','[]'::jsonb)) = 0);
    ELSE
      CONTINUE WHEN (v_candidate->>'keyword_count')::int < 2
        AND v_text !~ '\m(cannabis|hemp|cannabinoid|cbd|thc|marijuana|chanvre|ca[nñ]amo|ganja|kannabis|bhang|marihuana|canabis)\M';
    END IF;

    v_headline := left(coalesce(
      v_snapshot.captured_title,
      v_candidate->>'text',
      v_source.source_name
    ), 200);

    v_summary := coalesce(
      v_candidate->>'text',
      v_candidate->>'summary',
      v_snapshot.captured_title,
      v_source.source_name
    );

    CONTINUE WHEN v_headline ILIKE '%opens new tab%'
      OR v_headline ILIKE '%creative commons%'
      OR v_headline ILIKE '%code of conduct%'
      OR v_headline ILIKE '%hardware, software%'
      OR v_headline ILIKE '%covid-19%'
      OR length(trim(v_headline)) < 30;

    IF EXISTS (
      SELECT 1 FROM public.signals
      WHERE source = v_source.source_name
        AND headline = v_headline
        AND date > now() - interval '30 days'
    ) THEN CONTINUE; END IF;

    v_scoring := public.score_signal_from_snapshot(
      v_snapshot.intelligence_pass,
      v_lead_weeks,
      coalesce((v_candidate->>'keyword_count')::int,
               jsonb_array_length(coalesce(v_candidate->'matched_keywords','[]'::jsonb)))
    );

    v_top_lane := CASE
      WHEN (v_scoring->>'lane_r')::int >= (v_scoring->>'lane_e')::int
       AND (v_scoring->>'lane_r')::int >= (v_scoring->>'lane_t')::int THEN 'Regulatory'
      WHEN (v_scoring->>'lane_e')::int >= (v_scoring->>'lane_t')::int THEN 'Economic'
      ELSE 'Trade'
    END;

    v_signal_id := left(md5(v_source.source_name || v_headline || v_snapshot.captured_at::text), 20);

    INSERT INTO public.signals (
      id, date, cat, pri, score, headline, summary,
      source, url, verification, tier, lang,
      company, country, in_network,
      lane_r, lane_e, lane_t, top_lane,
      query_pack, commercial_impact,
      reviewed, action, created_at
    ) VALUES (
      v_signal_id,
      COALESCE(v_snapshot.captured_at, now()),
      CASE v_snapshot.intelligence_pass
        WHEN 1 THEN 'GAZETTE' WHEN 2 THEN 'PARLIAMENTARY'
        WHEN 3 THEN 'PROCUREMENT' WHEN 4 THEN 'MDB_PROJECT'
        ELSE 'SOURCE_ENGINE'
      END,
      v_scoring->>'pri',
      (v_scoring->>'score')::int,
      v_headline, v_summary,
      v_source.source_name, v_source.source_url,
      'source_engine_v1',
      CASE v_snapshot.intelligence_pass
        WHEN 1 THEN 'Tier 1' WHEN 2 THEN 'Tier 1'
        WHEN 3 THEN 'Tier 2' WHEN 4 THEN 'Tier 2'
        ELSE 'Tier 3'
      END,
      COALESCE(v_snapshot.language_detected, 'en'),
      NULL, v_source.country, false,
      (v_scoring->>'lane_r')::int,
      (v_scoring->>'lane_e')::int,
      (v_scoring->>'lane_t')::int,
      v_top_lane,
      'SP-' || COALESCE(v_snapshot.intelligence_pass::text, 'X')
        || ' | ' || COALESCE(v_source.sub_region, v_source.country, 'Global'),
      CASE
        WHEN (v_scoring->>'score')::int >= 75 THEN 'Immediate trade or market-access relevance'
        WHEN (v_scoring->>'score')::int >= 50 THEN 'Likely trade or market-access relevance'
        ELSE 'Monitor for developing relevance'
      END,
      false, '', now()
    )
    ON CONFLICT (id) DO NOTHING;

    v_promoted := v_promoted + 1;
  END LOOP;

  UPDATE public.source_snapshots SET processing_status = 'promoted' WHERE id = p_snapshot_id;

  RETURN v_promoted;
END;
$function$


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260729025619','add_promoted_status_stop_infinite_rescan','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260729025619_add_promoted_status_stop_infinite_rescan.sql

-- RECOVERY BEGIN 20260729095416_fix_jurisdiction_playbooks_missing_grant.sql
grant select on public.jurisdiction_playbooks to anon, authenticated;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260729095416','fix_jurisdiction_playbooks_missing_grant','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260729095416_fix_jurisdiction_playbooks_missing_grant.sql

-- RECOVERY BEGIN 20260729102231_optimize_rls_auth_function_reevaluation.sql

-- Performance-only rewrite of 9 RLS policies flagged by the Supabase advisor
-- (auth_rls_initplan): each called auth.uid()/auth.role() directly in its
-- USING/WITH CHECK clause, which Postgres re-evaluates per row instead of
-- once per query. Wrapping the call as (select auth.uid()) lets the planner
-- treat it as a stable subplan evaluated once. No change in semantics or
-- access control -- every condition is logically identical, just faster at
-- scale. Verified via pg_policies immediately before writing this migration.

alter policy "Public can report client errors" on public.client_error_reports
  with check (
    (length(trim(both from message)) > 0)
    and (length(message) <= 2000)
    and ((stack is null) or (length(stack) <= 4000))
    and ((route is null) or (length(route) <= 500))
    and ((digest is null) or (length(digest) <= 200))
    and ((user_agent is null) or (length(user_agent) <= 500))
    and ((viewport_width is null) or ((viewport_width > 0) and (viewport_width <= 20000)))
    and ((extra is null) or (pg_column_size(extra) <= 4000))
    and (not (user_id is distinct from (select auth.uid())))
  );

alter policy deal_capital_raises_service_write on public.deal_capital_raises
  using ((select auth.role()) = 'service_role'::text)
  with check ((select auth.role()) = 'service_role'::text);

alter policy deal_investors_service_write on public.deal_investors
  using ((select auth.role()) = 'service_role'::text)
  with check ((select auth.role()) = 'service_role'::text);

alter policy deal_ma_transactions_service_write on public.deal_ma_transactions
  using ((select auth.role()) = 'service_role'::text)
  with check ((select auth.role()) = 'service_role'::text);

alter policy deal_participants_service_write on public.deal_participants
  using ((select auth.role()) = 'service_role'::text)
  with check ((select auth.role()) = 'service_role'::text);

alter policy education_content_citations_service_write on public.education_content_citations
  using ((select auth.role()) = 'service_role'::text);

alter policy education_content_citations_staff_all on public.education_content_citations
  using (exists (
    select 1 from user_roles
    where user_roles.user_id = (select auth.uid())
      and user_roles.role = any (array['admin'::text, 'operator'::text, 'analyst'::text])
  ));

alter policy ia_source_embeddings_admin_operator_all on public.ia_source_embeddings
  using (exists (
    select 1 from user_roles
    where user_roles.user_id = (select auth.uid())
      and user_roles.role = any (array['admin'::text, 'operator'::text])
  ))
  with check (exists (
    select 1 from user_roles
    where user_roles.user_id = (select auth.uid())
      and user_roles.role = any (array['admin'::text, 'operator'::text])
  ));

alter policy "Authenticated users can apply to be listed" on public.professional_service_provider_listings
  with check (
    (not (submitted_by is distinct from (select auth.uid())))
    and (status = 'pending'::text)
    and (reviewed_at is null)
    and (reviewer_notes is null)
  );


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260729102231','optimize_rls_auth_function_reevaluation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260729102231_optimize_rls_auth_function_reevaluation.sql

-- RECOVERY BEGIN 20260729230849_create_job_search_schema.sql
create schema if not exists job_search;

create table job_search.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text,
  notes text,
  created_at timestamptz default now()
);

create table job_search.jobs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  external_id text,
  title text not null,
  company_id uuid references job_search.companies(id),
  location text,
  remote boolean default false,
  job_type text,
  description text,
  url text,
  posted_at date,
  fetched_at timestamptz default now(),
  status text default 'found',
  fit_score int,
  fit_reasons text,
  unique (source, external_id)
);

create table job_search.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references job_search.jobs(id),
  status text default 'interested',
  applied_at date,
  resume_version_id uuid,
  cover_note text,
  notes text,
  updated_at timestamptz default now()
);

create table job_search.resume_versions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references job_search.applications(id),
  content text,
  docx_url text,
  created_at timestamptz default now()
);

alter table job_search.applications
  add constraint fk_resume_version foreign key (resume_version_id) references job_search.resume_versions(id);

create table job_search.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references job_search.companies(id),
  name text,
  title text,
  email text,
  linkedin_url text,
  source text,
  created_at timestamptz default now()
);

create table job_search.outreach_messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references job_search.applications(id),
  contact_id uuid references job_search.contacts(id),
  type text,
  draft_body text,
  status text default 'drafted',
  scheduled_for date,
  sent_at timestamptz
);

create table job_search.settings (
  id int primary key default 1,
  search_terms jsonb default '["business development manager","account manager","channel partnerships manager"]'::jsonb,
  locations jsonb default '["Ottawa, Ontario","Remote, Canada"]'::jsonb,
  base_resume jsonb,
  constraint singleton check (id = 1)
);

insert into job_search.settings (id) values (1) on conflict do nothing;

alter table job_search.companies enable row level security;
alter table job_search.jobs enable row level security;
alter table job_search.applications enable row level security;
alter table job_search.resume_versions enable row level security;
alter table job_search.contacts enable row level security;
alter table job_search.outreach_messages enable row level security;
alter table job_search.settings enable row level security;

create policy "service role full access" on job_search.companies for all using (auth.role() = 'service_role');
create policy "service role full access" on job_search.jobs for all using (auth.role() = 'service_role');
create policy "service role full access" on job_search.applications for all using (auth.role() = 'service_role');
create policy "service role full access" on job_search.resume_versions for all using (auth.role() = 'service_role');
create policy "service role full access" on job_search.contacts for all using (auth.role() = 'service_role');
create policy "service role full access" on job_search.outreach_messages for all using (auth.role() = 'service_role');
create policy "service role full access" on job_search.settings for all using (auth.role() = 'service_role');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260729230849','create_job_search_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260729230849_create_job_search_schema.sql

-- RECOVERY BEGIN 20260729233712_job_search_expose_schema_grants.sql
GRANT USAGE ON SCHEMA job_search TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA job_search TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA job_search TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA job_search GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA job_search GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260729233712','job_search_expose_schema_grants','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260729233712_job_search_expose_schema_grants.sql

-- RECOVERY BEGIN 20260730003050_expose_all_pipeline_tick_counters_in_json.sql
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

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730003050','expose_all_pipeline_tick_counters_in_json','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730003050_expose_all_pipeline_tick_counters_in_json.sql

-- RECOVERY BEGIN 20260730030414_ship_hv_classify_v1_at_current_recall_enable_quality_pipeline.sql
-- Repaired 2026-08-05. The comment block below was committed as one physical
-- line carrying literal backslash-n escapes instead of real newlines, ending
-- with this migration's first statement, `UPDATE public.classifier_validation`.
-- The leading `--` commented that line out, leaving the SET clause to be parsed
-- as a statement in its own right:
--   ERROR: syntax error at or near "=" (SQLSTATE 42601)
--
-- Only the comment block on line 1 was expanded. The backslash-n sequences
-- inside the E'...' literal in the SET clause are NOT the same defect -- they
-- are correct escape-string syntax that Postgres interprets as newlines in the
-- notes text, they are present in the production-recorded statement verbatim,
-- and expanding them would corrupt the literal.
--
-- The UPDATE is unchanged and matches statements[1] of the live ledger row
-- exactly: 394 chars, md5 7206668a7fba8c5b8d01bccc8e00001d.

-- Ships the hv-classify/openai/v1 classifier at its current measured quality
-- (precision 1.000, recall 0.559, n=181 eval rows, validated 2026-07-23) rather than
-- holding for further prompt-tuning against the 0.70 recall bar proposed in spec
-- Section 6.2. Decision made and confirmed directly by Tyler (2026-07-29).
--
-- This flips classifier_gate_hv_v1 to passed and re-enables the two crons that were
-- deliberately held inactive pending exactly this decision (see hv_pipeline_health()):
-- hv-quality-pipeline (public.hv_pipeline_tick -- translate/classify/embed/entity-
-- resolve dispatch+harvest) and hv-quality-promote (public.hv_quality_promote_tick).
-- Both scheduled every 10 minutes, matching this pipeline generation's existing cadence.
--
-- Applied directly to production via Supabase MCP; committed here per
-- docs/control/CONCURRENT_SESSION_COORDINATION.md (same-turn convention).

UPDATE public.classifier_validation
SET gate_passed = true,
    notes = notes || E'\n\nDecision (2026-07-29): Tyler confirmed ship-as-is. Precision (1.000) clears the bar with no false positives; recall (0.559) accepted rather than holding for further prompt-tuning. Gate flipped, hv-quality-pipeline and hv-quality-promote crons re-enabled.'
WHERE classifier_version = 'hv-classify/openai/v1';

-- Replay guard added 2026-08-05. The recorded statement here is
--   SELECT cron.alter_job(48, schedule := '*/10 * * * *', active := true);
-- which resolves hv-quality-promote by a hardcoded job id. Job ids are
-- database-local, so in zero-state replay this fails outright:
--   ERROR: Job 48 does not exist or you don't own it (SQLSTATE XX000)
--
-- This is the same trap 20260722185015 fixed in production ("resolve quality
-- crons by name") and that 20260722021500 already carries a guard for on this
-- branch. Nothing in the repository ever schedules hv-quality-promote -- it is
-- only ever altered -- so during replay the job simply does not exist and this
-- becomes a documented no-op.
--
-- The guard only decides whether to run, never what to do. Where the job is
-- present -- production, where id 48 is hv-quality-promote -- resolving by name
-- reaches exactly that job and applies the identical schedule and active flag.
do $enable_hv_quality_promote$
declare
  v_promote_id bigint;
begin
  if to_regclass('cron.job') is null then
    raise notice 'pg_cron not present; skipping hv-quality-promote activation';
    return;
  end if;

  select jobid into v_promote_id from cron.job where jobname = 'hv-quality-promote';

  if v_promote_id is null then
    raise notice 'hv-quality-promote not scheduled; skipping activation';
    return;
  end if;

  perform cron.alter_job(v_promote_id, schedule := '*/10 * * * *', active := true);
end
$enable_hv_quality_promote$;

SELECT cron.schedule('hv-quality-pipeline', '*/10 * * * *', 'select public.hv_pipeline_tick();');

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730030414','ship_hv_classify_v1_at_current_recall_enable_quality_pipeline','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730030414_ship_hv_classify_v1_at_current_recall_enable_quality_pipeline.sql

-- RECOVERY BEGIN 20260730103137_fix_missing_public_read_grants.sql
-- Canonical migration (applied 2026-07-30 10:31:37 UTC). Continuation of the
-- missing-grant audit series (20260729095416, 20260729021338, and earlier).
-- Every table below already has a correct, deliberate RLS policy for public
-- or scoped read access (confirmed via pg_policy) but was missing the grant
-- -- the same gap as jurisdiction_playbooks. Without the grant, the
-- security_invoker=true enforcement on api-schema views blocks every read
-- regardless of the view's own grant, and RLS never even gets evaluated
-- (the grant check happens first).
--
-- Confirmed each policy's intent before granting -- these are all genuine
-- "already designed to be public/scoped, missing the grant" cases, not new
-- access decisions:
--   - listings: RLS restricts to public_visibility=true AND status=approved
--     for anon/authenticated. Marketplace listings, meant to be public.
--   - local_authorities, local_intel_coverage, local_open_questions,
--     local_operating_notes, local_subdivisions_intel: RLS policy is
--     literally `true` for all five -- unconditional public read already
--     intended by design.
--   - operator_countries: RLS policy `true`, explicit public_select policy
--     name confirms intent.
--   - cc_watchlist_notifications, subscriptions, workspace_members: RLS
--     restricts to auth.uid()-owned rows. Granting anon SELECT here is
--     harmless (RLS still returns zero rows for anon, since auth.uid() is
--     null when unauthenticated) but included for consistency with the
--     view-level grant these already had.
--
-- Deliberately NOT included (need individual judgment, not a blanket
-- grant): local_evidence_coverage (its view joins public.marketplace_inquiries,
-- which has only an INSERT policy -- write-only for the public, holds buyer
-- contact data; granting the joined view would expose raw inquiry rows) and
-- talent_jobs / talent_jobs_public (joins public.workspaces, which has no
-- anon-facing policy either). Both flagged for follow-up, not fixed here.

grant select on public.listings to anon, authenticated;
grant select on public.local_authorities to anon, authenticated;
grant select on public.local_intel_coverage to anon, authenticated;
grant select on public.local_open_questions to anon, authenticated;
grant select on public.local_operating_notes to anon, authenticated;
grant select on public.local_subdivisions_intel to anon, authenticated;
grant select on public.operator_countries to anon, authenticated;
grant select on public.cc_watchlist_notifications to anon;
grant select on public.subscriptions to anon;
grant select on public.workspace_members to anon;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730103137','fix_missing_public_read_grants','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730103137_fix_missing_public_read_grants.sql

-- RECOVERY BEGIN 20260730104444_fix_hv_dedup_assign_timeout_and_ranking.sql
create or replace function public.hv_dedup_assign(
  p_tau double precision default 0.90,
  p_scope_days integer default 120
)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  n int;
  c_batch constant int := 400;
begin
  p_scope_days := least(greatest(coalesce(p_scope_days, 120), 1), 400);
  p_tau        := least(greatest(coalesce(p_tau, 0.90), 0.5), 0.999);

  with targets as (
    select a.id, a.embedding_1024, a.created_at,
           coalesce(a.quality_confidence, 0) as qc
    from public.signals a
    where a.embedding_1024 is not null
      and a.created_at > now() - (p_scope_days || ' days')::interval
      and a.cluster_rep_id is null
    order by a.created_at desc
    limit c_batch
  ),
  scored as (
    select
      t.id,
      (
        select b.id
        from public.signals b
        where b.id <> t.id
          and b.embedding_1024 is not null
          and b.created_at > now() - (p_scope_days || ' days')::interval
          and (1 - (t.embedding_1024 <=> b.embedding_1024)) >= p_tau
          and (
                coalesce(b.quality_confidence, 0) > t.qc
             or (coalesce(b.quality_confidence, 0) = t.qc and b.created_at < t.created_at)
             or (coalesce(b.quality_confidence, 0) = t.qc and b.created_at = t.created_at and b.id < t.id)
          )
        order by (1 - (t.embedding_1024 <=> b.embedding_1024)) desc
        limit 1
      ) as better_id
    from targets t
  )
  update public.signals a
     set is_representative = (s.better_id is null),
         cluster_rep_id    = coalesce(s.better_id, a.id)
    from scored s
   where a.id = s.id;

  get diagnostics n = row_count;
  return n;
end
$function$;

comment on function public.hv_dedup_assign(double precision, integer) is
  'Assigns dedup cluster representatives by cosine similarity over embedding_1024. Incremental: only rows with cluster_rep_id IS NULL, max 400 per run (was: every embedded row every run, which timed out and blocked promotion). Ranks by quality_confidence, never by the inverted legacy signals.score. See docs/PLATFORM_OPTIMIZATION_REVIEW_2026-07-30.md and INTELLIGENCE_ARCHITECTURE_SPEC.md 6.4.';

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730104444','fix_hv_dedup_assign_timeout_and_ranking','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730104444_fix_hv_dedup_assign_timeout_and_ranking.sql

-- RECOVERY BEGIN 20260730104633_hv_dedup_assign_use_hnsw_index.sql
create or replace function public.hv_dedup_assign(
  p_tau double precision default 0.90,
  p_scope_days integer default 120
)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  n int;
  c_batch constant int := 400;
  c_neighbours constant int := 25;
begin
  p_scope_days := least(greatest(coalesce(p_scope_days, 120), 1), 400);
  p_tau        := least(greatest(coalesce(p_tau, 0.90), 0.5), 0.999);

  with targets as (
    select a.id, a.embedding_1024, a.created_at,
           coalesce(a.quality_confidence, 0) as qc
    from public.signals a
    where a.embedding_1024 is not null
      and a.created_at > now() - (p_scope_days || ' days')::interval
      and a.cluster_rep_id is null
    order by a.created_at desc
    limit c_batch
  ),
  scored as (
    select
      t.id,
      (
        select nb.id
        from (
          select b.id,
                 b.created_at,
                 coalesce(b.quality_confidence, 0) as qc,
                 1 - (t.embedding_1024 <=> b.embedding_1024) as sim
          from public.signals b
          where b.embedding_1024 is not null
            and b.id <> t.id
          order by t.embedding_1024 <=> b.embedding_1024
          limit c_neighbours
        ) nb
        where nb.sim >= p_tau
          and nb.created_at > now() - (p_scope_days || ' days')::interval
          and (
                nb.qc > t.qc
             or (nb.qc = t.qc and nb.created_at < t.created_at)
             or (nb.qc = t.qc and nb.created_at = t.created_at and nb.id < t.id)
          )
        order by nb.sim desc
        limit 1
      ) as better_id
    from targets t
  )
  update public.signals a
     set is_representative = (s.better_id is null),
         cluster_rep_id    = coalesce(s.better_id, a.id)
    from scored s
   where a.id = s.id;

  get diagnostics n = row_count;
  return n;
end
$function$;

comment on function public.hv_dedup_assign(double precision, integer) is
  'Assigns dedup cluster representatives by cosine similarity over embedding_1024. Uses the HNSW index via a top-25 nearest-neighbour probe per target (a >= tau filter cannot use the index; ORDER BY <=> LIMIT k can). Incremental: only rows with cluster_rep_id IS NULL, max 400 per run. Ranks by quality_confidence, never by the inverted legacy signals.score. See docs/PLATFORM_OPTIMIZATION_REVIEW_2026-07-30.md and INTELLIGENCE_ARCHITECTURE_SPEC.md 6.4.';

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730104633','hv_dedup_assign_use_hnsw_index','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730104633_hv_dedup_assign_use_hnsw_index.sql

-- RECOVERY BEGIN 20260730110000_fix_hv_dedup_assign_timeout_and_ranking.sql
-- SUPERSEDED -- do not treat the body below as current.
--
-- This was the first pass at the timeout fix. It reduced the comparison count but
-- still filtered on `WHERE (1 - (a <=> b)) >= p_tau`, which pgvector cannot serve
-- from the HNSW index. Production was moved to the k-NN form
-- (`ORDER BY <=> LIMIT c_neighbours`, threshold applied afterwards) by
-- `20260730104633_hv_dedup_assign_use_hnsw_index`, applied via Supabase MCP and
-- therefore absent from this directory.
--
-- The body below is kept verbatim rather than edited, so the migration history
-- stays an honest record of what was applied when. The current definition is
-- restored by `20260731090000_hv_dedup_assign_restore_hnsw_knn.sql`, which sorts
-- after this file and so wins if CI ever replays both.
--
-- Fix hv_dedup_assign: statement timeout + inverted-scorer ranking
--
-- CONTEXT (verified live 2026-07-30, see docs/PLATFORM_OPTIMIZATION_REVIEW_2026-07-30.md)
--
-- Two defects, one function.
--
-- 1. TIMEOUT — hv_quality_promote_tick() calls hv_dedup_assign(0.90, 400) and then
--    hv_promote_signals(0.65) in a single statement. hv_dedup_assign re-evaluated
--    EVERY embedded row in the window on EVERY run, with two correlated subqueries
--    each computing a pgvector distance: 5,145 x 5,145 ~= 26.5M comparisons. It hit
--    `canceling statement due to statement timeout` on 45 of 46 runs over ~8 hours,
--    and because the timeout aborts the whole statement, hv_promote_signals never
--    executed. Net effect: the promotion gate was open, both crons were active, and
--    zero signals were promoted — the feed sat 9d20h stale while a 120-second
--    failing query fired every 10 minutes against a Nano-tier instance.
--
--    Fix: only assign rows that have never been assigned (`cluster_rep_id is null`),
--    bounded to 400 per run, and collapse the two correlated subqueries into one.
--    ~2M comparisons per run instead of 26.5M.
--
--    Known trade-off, stated deliberately: rows already assigned are not
--    re-evaluated when newer neighbours arrive. A newly-arrived duplicate is still
--    correctly marked non-representative against existing rows, which is the
--    semantics promotion depends on. Full re-evaluation is a backfill concern, not
--    a per-tick concern, and a per-tick job that never completes assigns nothing
--    at all.
--
-- 2. INVERTED RANKING — representative selection ordered by `coalesce(score, ...)`.
--    `signals.score` is the legacy keyword-density scorer, known inverted (spec
--    §2.5: rates nav chrome ~99, genuine headlines <40). hv_promote_signals filters
--    `is_representative = true`, so within every duplicate cluster the *spammiest*
--    row was the one selected for publication.
--
--    Fix: rank by `quality_confidence` — the validated classifier output
--    (signal_precision 1.000 against the 202-row labeled eval set). Same tie-breaks
--    (older first, then id) so ordering stays total and deterministic.
--
-- Signature is unchanged, so hv_quality_promote_tick needs no edit.
-- Rollback: the prior definition is in
-- supabase/migrations/20260723084446_baseline_hv_intelligence_pipeline.sql

create or replace function public.hv_dedup_assign(
  p_tau double precision default 0.90,
  p_scope_days integer default 120
)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  n int;
  -- Hard per-run bound, independent of caller input (Stage F guardrail:
  -- a resource ceiling lives in the code that spends the resource).
  c_batch constant int := 400;
begin
  p_scope_days := least(greatest(coalesce(p_scope_days, 120), 1), 400);
  p_tau        := least(greatest(coalesce(p_tau, 0.90), 0.5), 0.999);

  with targets as (
    select a.id, a.embedding_1024, a.created_at,
           coalesce(a.quality_confidence, 0) as qc
    from public.signals a
    where a.embedding_1024 is not null
      and a.created_at > now() - (p_scope_days || ' days')::interval
      and a.cluster_rep_id is null
    order by a.created_at desc
    limit c_batch
  ),
  scored as (
    select
      t.id,
      (
        select b.id
        from public.signals b
        where b.id <> t.id
          and b.embedding_1024 is not null
          and b.created_at > now() - (p_scope_days || ' days')::interval
          and (1 - (t.embedding_1024 <=> b.embedding_1024)) >= p_tau
          and (
                coalesce(b.quality_confidence, 0) > t.qc
             or (coalesce(b.quality_confidence, 0) = t.qc and b.created_at < t.created_at)
             or (coalesce(b.quality_confidence, 0) = t.qc and b.created_at = t.created_at and b.id < t.id)
          )
        order by (1 - (t.embedding_1024 <=> b.embedding_1024)) desc
        limit 1
      ) as better_id
    from targets t
  )
  update public.signals a
     set is_representative = (s.better_id is null),
         cluster_rep_id    = coalesce(s.better_id, a.id)
    from scored s
   where a.id = s.id;

  get diagnostics n = row_count;
  return n;
end
$function$;

comment on function public.hv_dedup_assign(double precision, integer) is
  'Assigns dedup cluster representatives by cosine similarity over embedding_1024. '
  'Incremental: only rows with cluster_rep_id IS NULL, max 400 per run (was: every '
  'embedded row every run, which timed out and blocked promotion). Ranks by '
  'quality_confidence, never by the inverted legacy signals.score. '
  'See docs/PLATFORM_OPTIMIZATION_REVIEW_2026-07-30.md and INTELLIGENCE_ARCHITECTURE_SPEC.md 6.4.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730110000','fix_hv_dedup_assign_timeout_and_ranking','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730110000_fix_hv_dedup_assign_timeout_and_ranking.sql

-- RECOVERY BEGIN 20260730112133_job_search_anon_rls_policies.sql
CREATE POLICY "anon full access" ON job_search.companies FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon full access" ON job_search.jobs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon full access" ON job_search.applications FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon full access" ON job_search.resume_versions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon full access" ON job_search.contacts FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon full access" ON job_search.outreach_messages FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon full access" ON job_search.settings FOR ALL TO anon USING (true) WITH CHECK (true);

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730112133','job_search_anon_rls_policies','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730112133_job_search_anon_rls_policies.sql

-- RECOVERY BEGIN 20260730112457_job_search_fix_settings_shape.sql
ALTER TABLE job_search.settings RENAME TO settings_legacy_single_row;

CREATE TABLE job_search.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE job_search.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access" ON job_search.settings
  FOR ALL TO public USING (auth.role() = 'service_role'::text);

CREATE POLICY "anon full access" ON job_search.settings
  FOR ALL TO anon USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON job_search.settings TO anon, authenticated;

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON job_search.settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO job_search.settings (key, value)
SELECT 'search_terms', jsonb_build_object('terms', search_terms, 'locations', locations)
FROM job_search.settings_legacy_single_row
WHERE id = 1;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730112457','job_search_fix_settings_shape','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730112457_job_search_fix_settings_shape.sql

-- RECOVERY BEGIN 20260730112536_job_search_004_005_006_source_and_indexes.sql
ALTER TABLE job_search.jobs DROP CONSTRAINT IF EXISTS jobs_source_check;
ALTER TABLE job_search.jobs ADD CONSTRAINT jobs_source_check
  CHECK (source IN ('indeed', 'ziprecruiter', 'manual', 'adzuna', 'linkedin'));

CREATE INDEX IF NOT EXISTS idx_applications_updated_at ON job_search.applications (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_resume_version_id ON job_search.applications (resume_version_id);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_contact_id ON job_search.outreach_messages (contact_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_application_id ON job_search.resume_versions (application_id);

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730112536','job_search_004_005_006_source_and_indexes','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730112536_job_search_004_005_006_source_and_indexes.sql

-- RECOVERY BEGIN 20260730112600_job_search_fix_fit_reasons_type.sql
ALTER TABLE job_search.jobs ALTER COLUMN fit_reasons TYPE TEXT[] USING NULL;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730112600','job_search_fix_fit_reasons_type','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730112600_job_search_fix_fit_reasons_type.sql

-- RECOVERY BEGIN 20260730112630_job_search_applications_unique_job_id.sql
ALTER TABLE job_search.applications ADD CONSTRAINT applications_job_id_key UNIQUE (job_id);

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730112630','job_search_applications_unique_job_id','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730112630_job_search_applications_unique_job_id.sql

-- RECOVERY BEGIN 20260730160830_job_search_jobs_source_check_add_remoteok.sql
ALTER TABLE job_search.jobs DROP CONSTRAINT IF EXISTS jobs_source_check;
ALTER TABLE job_search.jobs ADD CONSTRAINT jobs_source_check
  CHECK (source IN (
    'indeed', 'ziprecruiter', 'manual', 'adzuna', 'linkedin', 'remoteok'
  ));

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730160830','job_search_jobs_source_check_add_remoteok','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730160830_job_search_jobs_source_check_add_remoteok.sql

-- RECOVERY BEGIN 20260730160833_job_search_resumes_storage_bucket.sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false,
  5242880,
  ARRAY[
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'resumes_service_all'
  ) THEN
    CREATE POLICY resumes_service_all
      ON storage.objects
      FOR ALL
      TO service_role
      USING (bucket_id = 'resumes')
      WITH CHECK (bucket_id = 'resumes');
  END IF;
END $$;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730160833','job_search_resumes_storage_bucket','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730160833_job_search_resumes_storage_bucket.sql

-- RECOVERY BEGIN 20260730161011_job_search_schedule_daily_job_pull.sql
SELECT cron.unschedule('daily-job-pull')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-job-pull'
);

SELECT cron.schedule(
  'daily-job-pull',
  '0 12 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/daily-job-pull',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer '
        || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'job_pull_auth_key')
    ),
    body := jsonb_build_object('source', 'pg_cron', 'triggered_at', now()::text)
  ) AS request_id;
  $$
);

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730161011','job_search_schedule_daily_job_pull','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730161011_job_search_schedule_daily_job_pull.sql

-- RECOVERY BEGIN 20260730161013_job_search_schedule_daily_follow_up.sql
SELECT cron.unschedule('daily-follow-up-scheduler')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-follow-up-scheduler'
);

SELECT cron.schedule(
  'daily-follow-up-scheduler',
  '0 13 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/follow-up-scheduler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'job_pull_auth_key')
    ),
    body := jsonb_build_object('source', 'cron', 'triggered_at', now())
  ) AS request_id;
  $$
);

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730161013','job_search_schedule_daily_follow_up','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730161013_job_search_schedule_daily_follow_up.sql

-- RECOVERY BEGIN 20260730161318_harvest_stamp_classifier_v2_summary_fix.sql
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

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730161318','harvest_stamp_classifier_v2_summary_fix','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730161318_harvest_stamp_classifier_v2_summary_fix.sql

-- RECOVERY BEGIN 20260730180000_search_public_signals_rpc.sql
-- Semantic search RPC over public.signals (Pipeline B, the canonical
-- customer-facing feed). Backs app/api/signals/search/route.ts.
--
-- The query embedding MUST come from OpenAI text-embedding-3-small at
-- dimensions=1024 -- that is what populated signals.embedding_1024 (confirmed
-- live: atttypmod=1024, embedding_model='text-embedding-3-small' on all 6,441
-- embedded rows). Any other model/dimension produces a vector in a different
-- space and silently meaningless cosine distances.
--
-- Filters mirror lib/signals/quality.ts (EXCLUDED_QUALITY_LABELS, reviewed
-- gate) so search results obey the same surfacing rules as the rest of the
-- site. Uses the existing idx_signals_embedding_1024_hnsw index via
-- ORDER BY <=> LIMIT (no threshold filter, which the index cannot serve).
CREATE OR REPLACE FUNCTION api.search_public_signals(
  p_query_embedding vector(1024),
  p_match_count integer DEFAULT 20,
  p_country text DEFAULT NULL,
  p_content_type text DEFAULT NULL
)
RETURNS TABLE(
  id text, date timestamptz, cat text, headline text, summary text, country text,
  commercial_impact text, source text, url text, tier text, created_at timestamptz,
  quality_label text, quality_confidence numeric, content_type text, impact text,
  title_en text, summary_en text, lang_detected text, is_representative boolean,
  cluster_rep_id text, similarity double precision
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
  select s.id, s.date, s.cat, s.headline, s.summary, s.country,
         s.commercial_impact, s.source, s.url, s.tier, s.created_at,
         s.quality_label, s.quality_confidence, s.content_type, s.impact,
         s.title_en, s.summary_en, s.lang_detected, s.is_representative, s.cluster_rep_id,
         1 - (s.embedding_1024 <=> p_query_embedding) as similarity
  from public.signals s
  where s.reviewed = true
    and s.embedding_1024 is not null
    and (s.quality_label is null or s.quality_label not in ('spam','boilerplate','nav','duplicate'))
    and (p_country is null or s.country ilike p_country)
    and (p_content_type is null or s.content_type = p_content_type)
  order by s.embedding_1024 <=> p_query_embedding
  limit greatest(1, least(coalesce(p_match_count, 20), 50));
$function$;

COMMENT ON FUNCTION api.search_public_signals IS
  'Semantic search over public.signals (Pipeline B, the canonical customer-facing feed). Query embedding must come from OpenAI text-embedding-3-small at dimensions=1024 to be comparable with the stored embedding_1024 column -- any other model/dimension produces meaningless similarity scores. Filters match lib/signals/quality.ts (EXCLUDED_QUALITY_LABELS, reviewed=true).';

REVOKE ALL ON FUNCTION api.search_public_signals(vector,integer,text,text) FROM public;
GRANT EXECUTE ON FUNCTION api.search_public_signals(vector,integer,text,text) TO service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730180000','search_public_signals_rpc','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730180000_search_public_signals_rpc.sql

-- RECOVERY BEGIN 20260730182043_add_prospects_table.sql
create table job_search.prospects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references job_search.companies(id),
  company_name text not null,
  signal text not null,
  signal_source_url text,
  status text default 'watching',
  created_at timestamptz default now()
);

alter table job_search.prospects enable row level security;
create policy "service role full access" on job_search.prospects for all using (auth.role() = 'service_role');

insert into job_search.prospects (company_name, signal, signal_source_url)
values (
  'Evidence Partners',
  'Ottawa SaaS company (DistillerSR) reported outgrowing its office within four months of moving, a documented rapid-growth signal worth a warm approach before any BD/ops role is posted publicly.',
  'https://www.investottawa.ca/blog/10-ottawa-global-tech-companies-with-job-openings-in-june-2026/'
);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730182043','add_prospects_table','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730182043_add_prospects_table.sql

-- RECOVERY BEGIN 20260730182145_add_geo_columns_to_jobs.sql
alter table job_search.jobs add column if not exists distance_km int;
alter table job_search.jobs add column if not exists remote boolean default false;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730182145','add_geo_columns_to_jobs','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730182145_add_geo_columns_to_jobs.sql

-- RECOVERY BEGIN 20260730182606_seed_real_prospects_and_status_support.sql
insert into job_search.prospects (company_name, signal, signal_source_url)
values
(
  'BrokerLink',
  'Acquired Spriggs Insurance Brokers, a family-run Ottawa-area brokerage, effective Feb 1 2026, as part of an active national roll-up (also acquired SL Insurance and William G. Waters same wave). New market entrants integrating acquisitions typically need BD/account management support before any role is posted.',
  'https://www.insurancebusinessmag.com/ca/news/mergers-acquisitions/brokerlink-expands-alberta-and-ontario-footprint-with-latest-deals-565691.aspx'
),
(
  'McDougall Insurance',
  'Largest insurance brokerage in Eastern Ontario, based in Ottawa (K2G, within your 30km radius). Recently merged with D.S. Currey & Son Insurance Brokers and opened a new Ottawa office as a result.',
  'https://www.mcdougallinsurance.com/ottawa/'
);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730182606','seed_real_prospects_and_status_support','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730182606_seed_real_prospects_and_status_support.sql

-- RECOVERY BEGIN 20260730184257_fix_duplicate_dispatch_translate_and_embed.sql
-- Restored 2026-08-12 (repository audit following PR #1280). This version is
-- recorded in supabase_migrations.schema_migrations (confirmed via ledger query
-- and pg_get_functiondef against live production) but had no corresponding file
-- anywhere in this repository -- the CI auto-reconcile step
-- (.github/workflows/supabase-migrate.yml) had been silently writing a SELECT 1
-- stub for it. Consequence: public.hv_pipeline_tick() had NO creator in the repo
-- at all (20260730030414 schedules a cron job that calls it, but the function
-- itself never existed on a fresh replay), and hv_translate_dispatch() was stuck
-- on the pre-184257 body that still double-dispatches translation for a signal
-- with an unharvested in-flight job.
--
-- Body below is verbatim from the production ledger / live pg_get_functiondef,
-- unmodified. See docs/control/EVIDENCE_LOG.md for the audit that found this.
--
-- Original message, retained:
--
-- Fixes a bug flagged (but left as a documented, non-live-risk follow-up) during
-- PR #1125's review: hv_translate_dispatch and hv_pipeline_tick's embed-candidate
-- selection both excluded already-completed rows (title_en/embedding_1024 IS NULL)
-- but never excluded rows with an existing DISPATCHED-BUT-NOT-YET-HARVESTED job.
-- classify/entities dispatch already guard against this via
-- "not exists (... where ... and not harvested)" -- this applies the same pattern
-- here. This was flagged as non-urgent because hv-quality-pipeline/hv-quality-
-- promote were inactive at the time; PR #1215 just reactivated both, so this is
-- now a live risk (duplicate paid OpenAI calls on any slow upstream response)
-- rather than a documented future concern.

CREATE OR REPLACE FUNCTION public.hv_translate_dispatch(p_limit integer DEFAULT 30, p_eval_only boolean DEFAULT false)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      and not exists (select 1 from public.hv_translation_jobs j where j.signal_id = s.id and not j.harvested)
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
    select s.id from public.signals s
    where s.quality_label='signal' and s.embedding_1024 is null
      and not exists (select 1 from public.hv_embed_jobs j where s.id = any(j.signal_ids) and not j.harvested)
    order by s.created_at desc limit 100
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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730184257','fix_duplicate_dispatch_translate_and_embed','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730184257_fix_duplicate_dispatch_translate_and_embed.sql

-- RECOVERY BEGIN 20260730185321_source_registry_metadata_and_api_seeds.sql
-- ============================================================
-- source_registry.metadata + public legal-tech API seeds
--
-- 1. Ensure metadata jsonb exists so APIDataAdapter can read
--    headers / auth_env / timeout_ms without a schema error.
-- 2. Seed public, no-auth Tier-1/2 API sources that return JSON
--    and are useful for cannabis compliance + market intelligence.
--
-- acquire_crawl_targets returns setof public.source_registry, so
-- once the column exists the primary RPC path already includes it.
-- The task-queue mapRow on this branch forwards metadata to ScrapeTarget.
-- ============================================================

ALTER TABLE public.source_registry
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.source_registry.metadata IS
  'Optional adapter config. For adapter=api: { headers, accept, timeout_ms, auth_env }. Secrets must live in env vars referenced by auth_env, never in this column.';

-- ---------------------------------------------------------------------------
-- Helper pattern: INSERT … SELECT … WHERE NOT EXISTS (by source_url)
-- ---------------------------------------------------------------------------

-- 1) Texas COA — 50-state + DC hemp compliance matrix (public, no key)
INSERT INTO public.source_registry (
  source_name, source_url, iso, adapter, crawl_cadence, tier,
  content_type, language, requires_translation, is_active, crawl_allowed,
  metadata, source_type
)
SELECT
  'Texas COA — 50-state hemp compliance matrix',
  'https://texascoa.com/api/v1/coa/public/states',
  'US',
  'api',
  'daily',
  1,
  ARRAY['regulatory'],
  'en',
  false,
  true,
  true,
  '{"timeout_ms": 20000}'::jsonb,
  'regulatory'
WHERE NOT EXISTS (
  SELECT 1 FROM public.source_registry
  WHERE source_url = 'https://texascoa.com/api/v1/coa/public/states'
);

-- 2) Texas COA — live state-check sample (TX flower) for enforcement-window signals
INSERT INTO public.source_registry (
  source_name, source_url, iso, adapter, crawl_cadence, tier,
  content_type, language, requires_translation, is_active, crawl_allowed,
  metadata, source_type
)
SELECT
  'Texas COA — TX flower state-check',
  'https://texascoa.com/api/v1/compliance/state-check?state=TX&product_type=flower',
  'US',
  'api',
  'daily',
  1,
  ARRAY['regulatory'],
  'en',
  false,
  true,
  true,
  '{"timeout_ms": 15000}'::jsonb,
  'regulatory'
WHERE NOT EXISTS (
  SELECT 1 FROM public.source_registry
  WHERE source_url = 'https://texascoa.com/api/v1/compliance/state-check?state=TX&product_type=flower'
);

-- 3) Nabis Platform — Universal Cannabis API well-known discovery document
INSERT INTO public.source_registry (
  source_name, source_url, iso, adapter, crawl_cadence, tier,
  content_type, language, requires_translation, is_active, crawl_allowed,
  metadata, source_type
)
SELECT
  'Nabis UCAPI well-known (cannabis-api.json)',
  'https://platform-api.nabis.pro/ucapi/.well-known/cannabis-api.json',
  'US',
  'api',
  'weekly',
  2,
  ARRAY['commercial'],
  'en',
  false,
  true,
  true,
  '{"timeout_ms": 15000}'::jsonb,
  'commercial'
WHERE NOT EXISTS (
  SELECT 1 FROM public.source_registry
  WHERE source_url = 'https://platform-api.nabis.pro/ucapi/.well-known/cannabis-api.json'
);

-- 4) Colorado open data — Marijuana Sales Revenue (Socrata SODA, public domain)
INSERT INTO public.source_registry (
  source_name, source_url, iso, adapter, crawl_cadence, tier,
  content_type, language, requires_translation, is_active, crawl_allowed,
  metadata, source_type
)
SELECT
  'Colorado CIM — Marijuana Sales Revenue (Socrata)',
  'https://data.colorado.gov/resource/j7a3-jgd3.json?$limit=5000',
  'US',
  'api',
  'weekly',
  1,
  ARRAY['regulatory', 'commercial'],
  'en',
  false,
  true,
  true,
  '{"timeout_ms": 30000}'::jsonb,
  'regulatory'
WHERE NOT EXISTS (
  SELECT 1 FROM public.source_registry
  WHERE source_url = 'https://data.colorado.gov/resource/j7a3-jgd3.json?$limit=5000'
);

-- 5) Colorado open data — Marijuana tax / retained revenue series (Socrata)
INSERT INTO public.source_registry (
  source_name, source_url, iso, adapter, crawl_cadence, tier,
  content_type, language, requires_translation, is_active, crawl_allowed,
  metadata, source_type
)
SELECT
  'Colorado CIM — Marijuana tax retained-by-state (Socrata)',
  'https://data.colorado.gov/resource/v9m8-x8dh.json?$limit=5000',
  'US',
  'api',
  'weekly',
  1,
  ARRAY['regulatory', 'commercial'],
  'en',
  false,
  true,
  true,
  '{"timeout_ms": 30000}'::jsonb,
  'regulatory'
WHERE NOT EXISTS (
  SELECT 1 FROM public.source_registry
  WHERE source_url = 'https://data.colorado.gov/resource/v9m8-x8dh.json?$limit=5000'
);

-- 6) Open Definition licenses catalog (open-data / compliance reference JSON)
INSERT INTO public.source_registry (
  source_name, source_url, iso, adapter, crawl_cadence, tier,
  content_type, language, requires_translation, is_active, crawl_allowed,
  metadata, source_type
)
SELECT
  'Open Definition — open licenses catalog (JSON)',
  'https://licenses.opendefinition.org/licenses/groups/all.json',
  'GLB',
  'api',
  'monthly',
  3,
  ARRAY['scientific'],
  'en',
  false,
  true,
  true,
  '{"timeout_ms": 15000}'::jsonb,
  'scientific'
WHERE NOT EXISTS (
  SELECT 1 FROM public.source_registry
  WHERE source_url = 'https://licenses.opendefinition.org/licenses/groups/all.json'
);

COMMENT ON TABLE public.source_registry IS
  'Unified source ledger for intelligence + marketplace estates. adapter in {html_snapshot,rss,api,playwright_full}. metadata jsonb holds adapter-specific config (no secrets).';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730185321','source_registry_metadata_and_api_seeds','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730185321_source_registry_metadata_and_api_seeds.sql

-- RECOVERY BEGIN 20260730211140_replay_reconcile_listings_production_columns.sql
-- Reconcile public.listings with the live production contract, immediately
-- before the first migration that seeds it.
--
-- 20260730220100 fails during zero-state replay on the first column of its
-- INSERT column list that the repository never creates:
--   insert into public.listings
--     (id, category, title, description, product_type, region, price_range, ...
--   column "price_range" of relation "listings" does not exist (SQLSTATE 42703)
--
-- price_range is not the only gap, so this restores the whole contract in one
-- place rather than one column per replay cycle. Production's public.listings
-- has 43 columns; the repository's creator
-- (20260528033000_unified_marketplace_listings.sql) builds a much narrower
-- table, and neither a CREATE TABLE nor an ALTER ... TYPE for this table
-- appears anywhere in supabase_migrations.schema_migrations -- production's
-- shape was established entirely outside recorded history, so there is no
-- recorded body to restore and no ledger chronology to preserve. Every column
-- below is taken from the live catalog (pg_attribute / pg_get_expr), not
-- inferred.
--
-- Every added column uses IF NOT EXISTS, so columns the repository already
-- builds are skipped untouched -- including their existing types.
--
-- Zero-state replay also carries a legacy listings.listing_type text NOT NULL
-- column plus listings_listing_type_check from 20260528033000. Fresh production
-- catalog evidence shows neither the column nor its check exists in production,
-- while the historical api.listings view still depends on the column at this
-- point in replay. Dropping the column here would cascade into unrelated
-- historical API shape. Instead, when the replay-only legacy column exists,
-- remove only its stale discriminator check and NOT NULL requirement so the
-- historical supply seed (which correctly does not populate listing_type) can
-- run. On production these operations are no-ops because the column/constraint
-- are absent.
--
-- Deliberate deviations from the live catalog, both to keep this replay-safe:
--   * Columns are added nullable even where production marks them NOT NULL.
--     Adding a NOT NULL column without a default fails if the table has rows,
--     and asserting production's nullability is not needed for replay to build
--     the same surface.
--   * Production defaults are reproduced only where they are literals. id's
--     uuid_generate_v4() default is not reproduced, because that depends on the
--     uuid-ossp extension; id already exists in replay regardless.
--
-- status is intentionally left alone here. It is converted to production's
-- listing_status enum much earlier, at 20260528033001, immediately after the
-- table is created and before any view is built over it -- the only point where
-- the type can be changed without dropping and recreating dependent views.
-- ADD COLUMN IF NOT EXISTS would skip it in any case.

-- price_range is the one enum this table needs that the repository never
-- creates. The other four (marketplace_category, region, seller_type,
-- listing_status) are created at 20260626110924. Guarded the same way.
do $$
begin
  if to_regtype('public.price_range') is null then
    create type public.price_range as enum (
      'under_100k',
      '100k_500k',
      '500k_1m',
      '1m_5m',
      '5m_plus',
      'negotiable'
    );
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_catalog.pg_constraint con
    where con.conrelid = 'public.listings'::regclass
      and con.conname = 'listings_listing_type_check'
  ) then
    alter table public.listings drop constraint listings_listing_type_check;
  end if;

  if exists (
    select 1
    from pg_catalog.pg_attribute a
    join pg_catalog.pg_class c on c.oid = a.attrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'listings'
      and a.attname = 'listing_type'
      and a.attnum > 0
      and not a.attisdropped
      and a.attnotnull
  ) then
    alter table public.listings alter column listing_type drop not null;
  end if;
end $$;

alter table public.listings
  add column if not exists category public.marketplace_category,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists product_type text,
  add column if not exists region public.region,
  add column if not exists price_range public.price_range,
  add column if not exists seller_type public.seller_type,
  add column if not exists high_level_specs jsonb default '{}'::jsonb,
  add column if not exists internal_notes text,
  add column if not exists internal_score integer,
  add column if not exists contact_name text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists legal_entity text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now(),
  add column if not exists archived_at timestamptz,
  add column if not exists superseded_by uuid,
  add column if not exists marketplace_section text default 'equipment'::text,
  add column if not exists slug text,
  add column if not exists public_visibility boolean default false,
  add column if not exists is_featured boolean default false,
  add column if not exists price_amount numeric,
  add column if not exists price_currency text default 'USD'::text,
  add column if not exists location_country text,
  add column if not exists condition text,
  add column if not exists brand text,
  add column if not exists model text,
  add column if not exists quantity numeric,
  add column if not exists unit text,
  add column if not exists private_notes text,
  add column if not exists average_rating numeric(3,2),
  add column if not exists review_count bigint default 0,
  add column if not exists ratings_updated_at timestamptz default now(),
  add column if not exists sold_by_harbourview boolean default false,
  add column if not exists sku text,
  add column if not exists stock_qty integer,
  add column if not exists lead_time_days integer,
  add column if not exists moq integer,
  add column if not exists compliance_flags jsonb default '{}'::jsonb,
  add column if not exists target_countries text[] default '{}'::text[];


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730211140','replay_reconcile_listings_production_columns','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730211140_replay_reconcile_listings_production_columns.sql

-- RECOVERY BEGIN 20260730211141_add_harbourview_direct_supply_catalog_fields.sql

alter table public.listings
  add column if not exists sold_by_harbourview boolean not null default false,
  add column if not exists sku text,
  add column if not exists stock_qty integer,
  add column if not exists lead_time_days integer,
  add column if not exists moq integer,
  add column if not exists compliance_flags jsonb not null default '{}'::jsonb,
  add column if not exists target_countries text[] not null default '{}';

create index if not exists listings_sold_by_harbourview_idx
  on public.listings (sold_by_harbourview)
  where sold_by_harbourview = true;

comment on column public.listings.sold_by_harbourview is 'True for Harbourview''s own direct-sale supply catalog (consumables/equipment), false for third-party P2P marketplace listings.';
comment on column public.listings.compliance_flags is 'Per-jurisdiction compliance metadata, e.g. {"CA": {"child_resistant": true, "csa_z76_1": true, "plain_packaging": true}}';
comment on column public.listings.target_countries is 'ISO country codes this SKU is compliant/available for (e.g. {CA,DE,AU}).';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730211141','add_harbourview_direct_supply_catalog_fields','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730211141_add_harbourview_direct_supply_catalog_fields.sql

-- RECOVERY BEGIN 20260730211147_create_supply_catalog_public_view.sql
-- Repository-only replay-fidelity repair.
--
-- Production already records 20260730211147. In the clean replay schema the
-- legacy listings table does not yet contain the full supply-catalog column set
-- used by the production-era view. The following migration supersedes this
-- temporary view shortly afterward, so fail closed by skipping creation when
-- the prerequisite columns are absent.

DO $$
BEGIN
  IF (
    SELECT count(*)
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'listings'
      AND column_name IN (
        'id','slug','title','description','category','marketplace_section','sku',
        'brand','model','condition','quantity','unit','price_amount','price_currency',
        'price_range','stock_qty','lead_time_days','moq','compliance_flags',
        'target_countries','is_featured','average_rating','review_count',
        'created_at','updated_at','sold_by_harbourview','status','public_visibility'
      )
  ) = 28 THEN
    EXECUTE $view$
      create or replace view api.supply_catalog_v1
      with (security_invoker = on) as
      select
        l.id, l.slug, l.title, l.description, l.category, l.marketplace_section,
        l.sku, l.brand, l.model, l.condition, l.quantity, l.unit,
        l.price_amount, l.price_currency, l.price_range, l.stock_qty,
        l.lead_time_days, l.moq, l.compliance_flags, l.target_countries,
        l.is_featured, l.average_rating, l.review_count, l.created_at, l.updated_at
      from public.listings l
      where l.sold_by_harbourview = true
        and l.status = 'approved'
        and l.public_visibility = true
    $view$;

    EXECUTE 'grant select on api.supply_catalog_v1 to anon, authenticated';
  END IF;
END $$;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730211147','create_supply_catalog_public_view','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730211147_create_supply_catalog_public_view.sql

-- RECOVERY BEGIN 20260730211325_seed_supply_catalog_canada_starter.sql
-- Replay preflight: production established the listings contract outside the recorded
-- migration chronology. Restore the minimum complete shape before the seed batches.
DO $$
BEGIN
  IF to_regtype('public.price_range') IS NULL THEN
    CREATE TYPE public.price_range AS ENUM ('under_100k','100k_500k','500k_1m','1m_5m','5m_plus','negotiable');
  END IF;
END $$;

DO $listing_type$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.listings'::regclass
      AND conname = 'listings_listing_type_check'
  ) THEN
    ALTER TABLE public.listings DROP CONSTRAINT listings_listing_type_check;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_attribute a
    JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
    WHERE c.oid = 'public.listings'::regclass
      AND a.attname = 'listing_type'
      AND a.attnotnull
      AND a.attnum > 0
      AND NOT a.attisdropped
  ) THEN
    ALTER TABLE public.listings ALTER COLUMN listing_type DROP NOT NULL;
  END IF;
END $listing_type$;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS category public.marketplace_category,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS product_type text,
  ADD COLUMN IF NOT EXISTS region public.region,
  ADD COLUMN IF NOT EXISTS price_range public.price_range,
  ADD COLUMN IF NOT EXISTS seller_type public.seller_type,
  ADD COLUMN IF NOT EXISTS high_level_specs jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS public_visibility boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_amount numeric,
  ADD COLUMN IF NOT EXISTS price_currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS location_country text,
  ADD COLUMN IF NOT EXISTS condition text,
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS quantity numeric,
  ADD COLUMN IF NOT EXISTS unit text,
  ADD COLUMN IF NOT EXISTS average_rating numeric(3,2),
  ADD COLUMN IF NOT EXISTS review_count bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sold_by_harbourview boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS stock_qty integer,
  ADD COLUMN IF NOT EXISTS lead_time_days integer,
  ADD COLUMN IF NOT EXISTS moq integer,
  ADD COLUMN IF NOT EXISTS compliance_flags jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS target_countries text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS marketplace_section text DEFAULT 'equipment',
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();


insert into public.listings
  (id, category, title, description, product_type, region, price_range, seller_type,
   high_level_specs, status, public_visibility, is_featured, price_amount, price_currency,
   location_country, condition, brand, model, quantity, unit, slug, marketplace_section,
   sold_by_harbourview, sku, stock_qty, lead_time_days, moq, compliance_flags, target_countries,
   created_at, updated_at)
values
(gen_random_uuid(),'packaging','Child-Resistant Mylar Pouch — 3.5g (Matte Black)','CR zipper mylar pouch, matte black, opaque, smell-proof. Meets CSA Z76.1 CR standard and Health Canada plain packaging rules.','pouch','north_america','negotiable','distributor','{"size":"3.5g","material":"mylar","finish":"matte black","cr":true}','approved',true,false,0.09,'CAD','CA','new','Harbourview Supply','HV-POUCH-35',1000,'each','cr-mylar-pouch-3-5g-matte-black','packaging',true,'HVP-PCH-035',50000,10,1000,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now()),
(gen_random_uuid(),'packaging','Child-Resistant Mylar Pouch — 7g (Matte Black)','CR zipper mylar pouch, matte black, opaque, smell-proof.','pouch','north_america','negotiable','distributor','{"size":"7g","material":"mylar","finish":"matte black","cr":true}','approved',true,false,0.11,'CAD','CA','new','Harbourview Supply','HV-POUCH-7',1000,'each','cr-mylar-pouch-7g-matte-black','packaging',true,'HVP-PCH-007',40000,10,1000,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now()),
(gen_random_uuid(),'packaging','Child-Resistant Mylar Pouch — 14g (Matte Black)','CR zipper mylar pouch, matte black, opaque, smell-proof.','pouch','north_america','negotiable','distributor','{"size":"14g","material":"mylar","finish":"matte black","cr":true}','approved',true,false,0.14,'CAD','CA','new','Harbourview Supply','HV-POUCH-14',1000,'each','cr-mylar-pouch-14g-matte-black','packaging',true,'HVP-PCH-014',30000,10,1000,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now()),
(gen_random_uuid(),'packaging','Child-Resistant Mylar Pouch — 28g / 1oz (Matte Black)','CR zipper mylar pouch, matte black, opaque, smell-proof. Bulk flower / trim format.','pouch','north_america','negotiable','distributor','{"size":"28g","material":"mylar","finish":"matte black","cr":true}','approved',true,false,0.19,'CAD','CA','new','Harbourview Supply','HV-POUCH-28',1000,'each','cr-mylar-pouch-28g-matte-black','packaging',true,'HVP-PCH-028',20000,10,500,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now()),
(gen_random_uuid(),'packaging','CR Glass Jar — 30mL (3.5g, Matte Black)','Child-resistant glass flower jar, matte black, tamper-evident cap.','jar','north_america','negotiable','distributor','{"size":"30mL","material":"glass","finish":"matte black","cr":true}','approved',true,true,0.85,'CAD','CA','new','Harbourview Supply','HV-JAR-30',1000,'each','cr-glass-jar-30ml-matte-black','packaging',true,'HVP-JAR-030',15000,14,500,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now()),
(gen_random_uuid(),'packaging','CR Glass Jar — 60mL (7g, Matte Black)','Child-resistant glass flower jar, matte black, tamper-evident cap.','jar','north_america','negotiable','distributor','{"size":"60mL","material":"glass","finish":"matte black","cr":true}','approved',true,false,1.05,'CAD','CA','new','Harbourview Supply','HV-JAR-60',1000,'each','cr-glass-jar-60ml-matte-black','packaging',true,'HVP-JAR-060',12000,14,500,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now()),
(gen_random_uuid(),'packaging','CR Pop-Top Plastic Jar — 13 Dram','Child-resistant pop-top plastic jar, opaque, standard dispensary format.','jar','north_america','negotiable','distributor','{"size":"13 dram","material":"plastic","cr":true}','approved',true,false,0.22,'CAD','CA','new','Harbourview Supply','HV-JAR-13D',1000,'each','cr-pop-top-jar-13-dram','packaging',true,'HVP-JAR-13D',25000,10,1000,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now()),
(gen_random_uuid(),'packaging','Pre-Roll Tube — 84mm CR Pop-Top (Single)','Child-resistant pop-top tube for single pre-rolls.','pre_roll_tube','north_america','negotiable','distributor','{"length":"84mm","cr":true}','approved',true,false,0.14,'CAD','CA','new','Harbourview Supply','HV-TUBE-84',1000,'each','pre-roll-tube-84mm-cr','packaging',true,'HVP-TUB-084',30000,10,1000,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now()),
(gen_random_uuid(),'packaging','Pre-Roll Tube — 116mm CR Pop-Top (King)','Child-resistant pop-top tube for king-size pre-rolls.','pre_roll_tube','north_america','negotiable','distributor','{"length":"116mm","cr":true}','approved',true,false,0.18,'CAD','CA','new','Harbourview Supply','HV-TUBE-116',1000,'each','pre-roll-tube-116mm-cr','packaging',true,'HVP-TUB-116',20000,10,1000,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now()),
(gen_random_uuid(),'packaging','Pre-Roll Multi-Pack Box — 5-Count CR Slider','Child-resistant slider box for 5-count pre-roll multipacks.','pre_roll_box','north_america','negotiable','distributor','{"count":5,"cr":true}','approved',true,true,0.55,'CAD','CA','new','Harbourview Supply','HV-BOX-5PK',1000,'each','pre-roll-multipack-box-5ct-cr','packaging',true,'HVP-BOX-5PK',10000,14,500,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Unbleached Pre-Roll Cones — 84mm (Bulk)','Pre-rolled unbleached cones with filter tip, bulk case.','cone','north_america','negotiable','distributor','{"length":"84mm","material":"unbleached paper"}','approved',true,false,0.09,'CAD','CA','new','Harbourview Supply','HV-CONE-84',1000,'each','pre-roll-cones-84mm-unbleached','consumables',true,'HVP-CON-084',100000,7,1000,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Unbleached Pre-Roll Cones — 109mm King (Bulk)','Pre-rolled unbleached king-size cones with filter tip, bulk case.','cone','north_america','negotiable','distributor','{"length":"109mm","material":"unbleached paper"}','approved',true,false,0.11,'CAD','CA','new','Harbourview Supply','HV-CONE-109',1000,'each','pre-roll-cones-109mm-king-unbleached','consumables',true,'HVP-CON-109',80000,7,1000,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Rolling Papers — Unbleached Hemp, King Slim (Booklet of 32)','Unbleached hemp rolling papers, king slim size.','papers','north_america','negotiable','distributor','{"size":"king slim","material":"hemp","count":32}','approved',true,false,0.28,'CAD','CA','new','Harbourview Supply','HV-PAPER-KS',1000,'booklet','rolling-papers-unbleached-hemp-king-slim','consumables',true,'HVP-PAP-KS1',20000,7,500,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Organic Pre-Roll Filter Tips (Bulk, per 1000)','Unbleached organic filter tips for pre-roll production.','filter_tip','north_america','negotiable','distributor','{"material":"organic unbleached"}','approved',true,false,0.03,'CAD','CA','new','Harbourview Supply','HV-FILTIP',1000,'each','organic-pre-roll-filter-tips-bulk','consumables',true,'HVP-FIL-001',150000,7,5000,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Humidity Control Packs — 62% RH (Case of 100)','2-way humidity control packs for cured flower and pre-roll freshness.','humidity_pack','north_america','negotiable','distributor','{"rh":"62%"}','approved',true,false,0.35,'CAD','CA','new','Harbourview Supply','HV-HUMID-62',500,'each','humidity-control-packs-62rh','consumables',true,'HVP-HUM-062',10000,10,100,'{}','{CA}',now(),now()),
(gen_random_uuid(),'processing_equipment','Twister T2 Pre-Roll Machine (Compact)','Compact automated pre-roll filling machine, entry throughput tier.','pre_roll_machine','north_america','negotiable','distributor','{"throughput":"~250 cones/run","tier":"compact"}','approved',true,true,3200.00,'CAD','CA','new','Twister','T2',5,'unit','twister-t2-pre-roll-machine','processing',true,'HVP-EQP-T2',5,21,1,'{}','{CA}',now(),now()),
(gen_random_uuid(),'processing_equipment','Twister T4 Pre-Roll Machine (Mid-Volume)','Mid-tier automated pre-roll filling machine for growing production lines.','pre_roll_machine','north_america','negotiable','distributor','{"throughput":"~500-1000 cones/run","tier":"mid"}','approved',true,true,6800.00,'CAD','CA','new','Twister','T4',3,'unit','twister-t4-pre-roll-machine','processing',true,'HVP-EQP-T4',3,21,1,'{}','{CA}',now(),now()),
(gen_random_uuid(),'processing_equipment','Twister T6 Pre-Roll Machine (High-Volume)','High-volume automated pre-roll filling machine for commercial operators.','pre_roll_machine','north_america','negotiable','distributor','{"throughput":"high volume","tier":"commercial"}','approved',true,false,14500.00,'CAD','CA','new','Twister','T6',2,'unit','twister-t6-pre-roll-machine','processing',true,'HVP-EQP-T6',2,28,1,'{}','{CA}',now(),now()),
(gen_random_uuid(),'processing_equipment','Industrial Bud Shredder / De-Stemmer','Industrial-grade shredder and de-stemmer for pre-roll production feedstock.','shredder','north_america','negotiable','distributor','{}','approved',true,false,4200.00,'CAD','CA','new','Harbourview Supply','HV-SHRED-1',4,'unit','industrial-bud-shredder-de-stemmer','processing',true,'HVP-EQP-SHR',4,21,1,'{}','{CA}',now(),now()),
(gen_random_uuid(),'processing_equipment','Digital Compliance Scale (0.01g Precision)','Bench-top digital scale for compliant dosing and fill weights.','scale','north_america','negotiable','distributor','{"precision":"0.01g"}','approved',true,false,180.00,'CAD','CA','new','Harbourview Supply','HV-SCALE-1',10,'unit','digital-compliance-scale-0-01g','processing',true,'HVP-EQP-SCL',10,7,1,'{}','{CA}',now(),now());


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730211325','seed_supply_catalog_canada_starter','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730211325_seed_supply_catalog_canada_starter.sql
