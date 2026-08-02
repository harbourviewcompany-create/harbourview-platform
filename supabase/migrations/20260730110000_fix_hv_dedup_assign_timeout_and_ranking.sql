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
