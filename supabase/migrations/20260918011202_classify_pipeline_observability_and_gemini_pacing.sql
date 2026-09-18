-- Fix 1: hv_classify_corpus_harvest() discarded the actual per-provider
-- failure reason (e.g. "gemini_429 | openai_429 | anthropic_400") returned
-- by hv-classify, collapsing every non-classification outcome into a
-- generic 'no_classification' label. That's why diagnosing the current
-- outage required reading raw HTTP response bodies instead of a single
-- query. Add a reason column and capture it.

alter table public.hv_classify_jobs add column if not exists reason text;

create or replace function public.hv_classify_corpus_harvest()
returns integer
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
as $function$
declare r record; v_c jsonb; v_outcome text; v_reason text; n int:=0;
begin
  for r in
    select j.request_id, j.signal_id, resp.status_code, resp.content
    from public.hv_classify_jobs j join net._http_response resp on resp.id=j.request_id
    where not j.harvested
  loop
    v_outcome := 'http_' || coalesce(r.status_code::text, 'null');
    v_reason := null;
    if r.status_code=200 then
      v_outcome := 'no_classification';
      begin
        v_c := (r.content::jsonb->'classification');
        v_reason := r.content::jsonb->>'reason';
        if v_c is not null then
          update public.signals s set
            quality_label = v_c->>'quality_label',
            content_type = v_c->>'content_type',
            impact = v_c->>'impact',
            quality_confidence = (v_c->>'confidence')::numeric,
            classifier_version = 'hv-classify/openai/v2-summary-fix'
          where s.id = r.signal_id;
          v_outcome := 'ok';
          v_reason := null;
          n:=n+1;
        end if;
      exception when others then v_outcome := 'parse_error';
      end;
    end if;
    update public.hv_classify_jobs
       set harvested=true, outcome=v_outcome, reason=v_reason, attempted_at=coalesce(attempted_at, now())
     where request_id=r.request_id;
  end loop;
  return n;
end$function$;

-- Fix 2: hv_classify_corpus_dispatch fired every net.http_post to
-- hv-classify in a tight loop with no pacing, which is exactly the kind of
-- burst that trips Gemini's per-minute rate limit even though the
-- underlying key has working quota (confirmed via direct test). Add a
-- short pace between dispatches -- costs at most ~500ms * p_limit per run,
-- well within the function's own scheduling cadence.

create or replace function public.hv_classify_corpus_dispatch(p_limit integer DEFAULT 100, p_scope_days integer DEFAULT 120)
returns integer
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
as $function$
declare r record; v_rid bigint; n int:=0; v_ids text[]; c_max_attempts constant int := 5;
  v_gate record; v_local_resolved int := 0;
begin
  p_limit := least(greatest(coalesce(p_limit, 100), 1), 150);
  p_scope_days := least(greatest(coalesce(p_scope_days, 120), 1), 400);

  insert into public.intel_classify_review_queue (signal_id, headline, summary, reason)
  select s.id,
         coalesce(s.title_en, s.headline),
         coalesce(s.summary_en, left(s.summary,1000), s.title_en, s.headline),
         'classify_failed_after_' || c_max_attempts || '_attempts'
  from public.signals s
  where s.quality_label is null
    and s.reviewed is distinct from true
    and s.headline is not null
    and s.created_at > now() - (p_scope_days||' days')::interval
    and (
      select count(*) from public.hv_classify_jobs k
      where k.signal_id = s.id and k.outcome is not null and k.outcome <> 'ok'
    ) >= c_max_attempts
  on conflict (signal_id) do nothing;

  select array_agg(s.id order by s.created_at desc) into v_ids
  from (
    select s.id, s.created_at
    from public.signals s
    where s.quality_label is null
      and s.reviewed is distinct from true
      and s.headline is not null
      and s.created_at > now() - (p_scope_days||' days')::interval
      and not exists (select 1 from public.hv_classify_jobs j where j.signal_id=s.id and not j.harvested)
      and not exists (select 1 from public.intel_classify_review_queue q where q.signal_id=s.id and not q.resolved)
    order by s.created_at desc
    limit p_limit
  ) s;

  if v_ids is null then return 0; end if;

  for r in
    select s.id, s.embedding_gemini_1024 as emb
    from public.signals s
    where s.id = any(v_ids) and s.embedding_gemini_1024 is not null
  loop
    select * into v_gate from public.hv_local_classify_gate(r.emb);
    if v_gate.quality_label is not null then
      update public.signals
      set quality_label = v_gate.quality_label,
          content_type = 'noise',
          impact = 'low',
          quality_confidence = 0.85,
          classifier_version = 'local-centroid-v1'
      where id = r.id;
      v_ids := array_remove(v_ids, r.id);
      v_local_resolved := v_local_resolved + 1;
    end if;
  end loop;

  if v_ids is null or array_length(v_ids,1) = 0 then return v_local_resolved; end if;

  p_limit := public.hv_consume_dispatch_budget('classify', array_length(v_ids,1));
  if p_limit <= 0 then return v_local_resolved; end if;
  v_ids := v_ids[1:p_limit];

  for r in
    select s.id, coalesce(s.title_en, s.headline) as h, coalesce(s.summary_en, left(s.summary,1000), s.title_en, s.headline) as sm
    from public.signals s
    where s.id = any(v_ids)
    order by s.created_at desc
  loop
    select net.http_post(
      url:='https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-classify',
      headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='hv_edge_anon_key' limit 1)),
      body:=jsonb_build_object('text', jsonb_build_object('headline', r.h, 'summary', r.sm)),
      timeout_milliseconds:=30000
    ) into v_rid;
    insert into public.hv_classify_jobs(request_id, signal_id) values (v_rid, r.id) on conflict do nothing;
    n:=n+1;
    perform pg_sleep(0.4);
  end loop;
  return n + v_local_resolved;
end
$function$;
