-- Restore the HNSW k-NN form of hv_dedup_assign, and stop CI from reverting it.
--
-- THE BUG THIS PREVENTS
-- ---------------------
-- Production currently runs the correct, HNSW-index-using definition. It got
-- there via a migration applied directly through Supabase MCP
-- (`20260730104633_hv_dedup_assign_use_hnsw_index`) that was never written to a
-- file. Meanwhile the repo carries `20260730110000_fix_hv_dedup_assign_timeout_
-- and_ranking.sql`, which holds the SUPERSEDED pre-HNSW body.
--
-- `.github/workflows/supabase-migrate.yml` applies every local file whose
-- version is absent from `supabase_migrations.schema_migrations`, in version
-- order. `20260730104633` has no file, so its auto-reconcile step writes a
-- `SELECT 1;` placeholder for it -- which does NOT carry the HNSW body -- and
-- then `supabase db push --include-all` applies `20260730110000`, whose version
-- IS absent from the remote history and whose body is the old one.
--
-- Net effect without this file: CI silently reverts hv_dedup_assign to the form
-- that scans instead of using idx_signals_embedding_1024_hnsw, reintroducing the
-- 120s statement timeout that made dedup unrunnable (fixed to ~2.4s).
--
-- Because this file sorts after 20260730110000, it lands last and wins
-- regardless of what the stale file does. That is deliberate: correcting the
-- stale file alone would still leave the outcome dependent on file ordering.
--
-- WHY THE k-NN FORM IS REQUIRED
-- -----------------------------
-- pgvector can only serve an HNSW index through `ORDER BY <col> <=> <query>`
-- with a LIMIT. A predicate like `WHERE (1 - (a <=> b)) >= tau` is a filter over
-- the whole candidate set, not an index probe, so the planner falls back to a
-- sequential scan with a distance computation per row. The correct shape is:
-- take the k nearest neighbours via the index, THEN apply the similarity
-- threshold to those k rows -- which is what this body does with
-- c_neighbours = 25.
--
-- This body is a verbatim copy of the live production definition, read back
-- from pg_get_functiondef on 2026-07-31, so applying it is a no-op against the
-- current database and a repair against any database CI has already regressed.

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
          -- Index probe: nearest c_neighbours by cosine distance. The threshold
          -- is applied outside this subquery, never as a WHERE on the distance.
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
          -- Deterministic representative choice: higher confidence wins, then
          -- earlier, then lowest id. Without the final id tiebreak two rows can
          -- each name the other as better and neither becomes representative.
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
  'Assigns cluster representatives over signals.embedding_1024. Uses the HNSW index via '
  'ORDER BY <=> LIMIT c_neighbours and applies p_tau to those neighbours -- a WHERE clause on '
  'the distance cannot use the index and made this function time out at 120s. Supersedes the '
  'body in 20260730110000_fix_hv_dedup_assign_timeout_and_ranking.sql, which predates the HNSW '
  'change and must not be allowed to apply last.';
