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
