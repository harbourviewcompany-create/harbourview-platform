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