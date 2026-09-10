-- Reconstructed from production. Applied 2026-08-30/31 via the same
-- unmerged branch as 20260831120000 (never got a PR, applied directly to
-- prod). Confirmed byte-identical to what is currently live.
--
-- Free, instant nearest-centroid classifier checked before spending an LLM
-- call on classification. Validated on held-out data: only auto-resolves
-- boilerplate/nav/spam predictions with a wide confidence margin, never
-- "signal" -- measured zero real-signal leakage at this threshold, ~17% of
-- volume resolvable this way. Everything else (including every
-- low-confidence case) still goes to the LLM exactly as before. Consumed
-- by hv_classify_corpus_dispatch (see 20260830140000_full_regulatory_tier_coverage.sql
-- era pipeline; wired into the dispatch loop directly against
-- signals.embedding_gemini_1024).

CREATE OR REPLACE FUNCTION public.hv_local_classify_gate(p_embedding vector)
 RETURNS TABLE(quality_label text, margin numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
  with dists as (
    select c.quality_label, (c.centroid <=> p_embedding) as d
    from public.hv_local_classifier_centroids c
  ),
  ranked as (
    select quality_label, d, row_number() over (order by d) as rnk
    from dists
  )
  select r1.quality_label, (r2.d - r1.d)::numeric as margin
  from ranked r1 join ranked r2 on r2.rnk = 2
  where r1.rnk = 1
    and r1.quality_label != 'signal'
    and (r2.d - r1.d) >= 0.015;
$function$
;

CREATE OR REPLACE FUNCTION public.hv_classify_corpus_dispatch(p_limit integer DEFAULT 100, p_scope_days integer DEFAULT 120)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
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
  end loop;
  return n + v_local_resolved;
end
$function$
;
