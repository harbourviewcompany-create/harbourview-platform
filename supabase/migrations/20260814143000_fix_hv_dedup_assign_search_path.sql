-- Repair public.hv_dedup_assign: the pinned search_path cannot resolve pgvector.
--
-- THE DEFECT
--
-- The function is SECURITY DEFINER with `set search_path to 'public'`. pgvector
-- is installed in the `extensions` schema on this project, and the `<=>` cosine
-- distance operator lives there and nowhere else. An unqualified `<=>` inside
-- the body therefore cannot resolve, and every call fails with SQLSTATE 42883.
--
-- Verified read-only against production on 2026-08-14 rather than inferred:
--
--   vector extension schema ......................... extensions
--   <=> operator schema ............................. extensions
--   <=> operators in public ......................... 0
--   live hv_dedup_assign proconfig .................. search_path=public
--   to_regoperator('<=>(extensions.vector,extensions.vector)')
--     evaluated under search_path=public ............ NULL  (unresolvable)
--     evaluated schema-qualified .................... non-null
--
-- Checked whether this is a class or a one-off: hv_dedup_assign is the ONLY
-- function in the database with a pinned search_path that omits `extensions`
-- while referencing pgvector operators or types. Every other pinned function is
-- unaffected. This migration is deliberately narrow for that reason.
--
-- WHY A NEW VERSION RATHER THAN EDITING 20260802073000
--
-- The defect originates in 20260802073000, and the obvious repair is to edit
-- that file. It does not work. That version was applied to production on
-- 2026-08-14 and is recorded in supabase_migrations.schema_migrations, so
-- `supabase db push` skips it forever -- an in-place edit would be verified by
-- a local `db reset` (which replays from scratch and does pick it up) while
-- never reaching production. The fix has to be a forward migration.
--
-- Credit where due: #1420 identified this defect and its correct remedy. Its
-- delivery mechanism is the in-place edit described above, which is why this
-- exists separately. Its accompanying release-closure migration hardens
-- hv_truncate_at_word_boundary, not this function.
--
-- WHY NOT JUST ADD `extensions` TO THE SEARCH PATH AND STOP THINKING
--
-- pg_catalog is listed first and explicitly. For a SECURITY DEFINER function
-- that is the part that matters: it prevents a caller-controlled schema earlier
-- in the path from shadowing a built-in. `public` and `extensions` follow
-- because the body genuinely needs both -- public.signals and the pgvector
-- operator respectively. The path stays narrow; no caller privilege is widened.
--
-- The body below is otherwise byte-for-byte the definition from 20260802073000.
-- Only the `set search_path` clause and the comment change.

create or replace function public.hv_dedup_assign(
  p_tau double precision default 0.90,
  p_scope_days integer default 120
)
returns integer
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'extensions'
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

-- Least-privilege is preserved exactly as 20260802163000 left it: browser roles
-- hold no EXECUTE on this function. CREATE OR REPLACE does not reset privileges,
-- so these are reasserted only to keep the intent visible next to the function,
-- not because the replace would have dropped them.
revoke all privileges on function public.hv_dedup_assign(double precision, integer)
  from PUBLIC, anon, authenticated;
grant execute on function public.hv_dedup_assign(double precision, integer)
  to service_role;

comment on function public.hv_dedup_assign(double precision, integer) is
  'Assigns cluster representatives over signals.embedding_1024. Uses the HNSW index via '
  'ORDER BY <=> LIMIT c_neighbours and applies p_tau to those neighbours -- a WHERE clause on '
  'the distance cannot use the index and made this function time out at 120s. SECURITY DEFINER '
  'search_path is pg_catalog, public, extensions: pgvector lives in extensions, so a path of '
  'public alone made the unqualified <=> unresolvable (42883) and every call fail. '
  'Service-role only; browser roles have no EXECUTE.';
