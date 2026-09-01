-- Local, zero-cost centroid classifier gate. 2026-08-31.
--
-- Validated on held-out data (80/20 split of the labeled corpus,
-- full embedding_gemini_1024 coverage): nearest-centroid alone gets
-- ~77.6% overall accuracy, but recall is not the number that
-- matters for auto-rejection -- PRECISION on the predicted-reject
-- classes is. Checked separately: predicted-boilerplate and
-- predicted-nav precision were only ~45-47%, with real signals
-- leaking into both (unsafe to auto-reject on). Predicted-spam was
-- 85% precision with zero signal leakage. Adding a confidence-
-- margin gate (>= 0.015 between nearest and second-nearest
-- centroid) eliminated essentially ALL signal leakage across every
-- predicted class, not just spam -- both real leaks in the test set
-- occurred specifically in the LOW-margin group. Final design: only
-- ever auto-resolves boilerplate/nav/spam predictions with margin
-- >= 0.015; NEVER auto-resolves a "signal" prediction (still needs
-- real content_type/impact from the LLM regardless); measured zero
-- real-signal leakage at this threshold; ~17% of classification
-- volume becomes resolvable for free.
--
-- Centroids are a point-in-time snapshot of the labeled corpus at
-- deploy time (929 rows). They are not automatically retrained as
-- new labels accumulate -- worth revisiting periodically by re-
-- running the insert...on conflict below against the then-current
-- signal_classifications table.

create table if not exists public.hv_local_classifier_centroids (
  quality_label text primary key,
  centroid vector(1024) not null,
  n int not null,
  updated_at timestamptz default now()
);

insert into public.hv_local_classifier_centroids (quality_label, centroid, n, updated_at)
select sc.quality_label, avg(s.embedding_gemini_1024), count(*), now()
from public.signal_classifications sc
join public.signals s on s.id = sc.signal_id
where s.embedding_gemini_1024 is not null and sc.quality_label != 'duplicate'
group by sc.quality_label
on conflict (quality_label) do update set centroid = excluded.centroid, n = excluded.n, updated_at = now();

CREATE OR REPLACE FUNCTION public.hv_local_classify_gate(p_embedding vector)
 RETURNS TABLE(quality_label text, margin numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
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

  -- 2026-08-30: local centroid gate. For each candidate, check a free,
  -- instant nearest-centroid classifier before ever spending an LLM call.
  -- Validated on held-out data: only auto-resolves boilerplate/nav/spam
  -- predictions with a wide confidence margin, never "signal" -- measured
  -- zero real-signal leakage at this threshold, ~17% of volume resolvable.
  -- Everything else (including every low-confidence case) still goes to
  -- the LLM exactly as before.
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
