\set ON_ERROR_STOP on
begin;
create extension if not exists vector;
create table public.signals (
  id text primary key,
  embedding_1024 vector(1024),
  created_at timestamptz not null default now(),
  quality_confidence numeric,
  cluster_rep_id text,
  is_representative boolean
);
create index idx_signals_embedding_1024_hnsw
  on public.signals using hnsw (embedding_1024 vector_cosine_ops);
\ir ../../supabase/migrations/20260802073000_hv_dedup_assign_restore_hnsw_knn.sql

do $verify$
declare
  definition text;
  proc_security boolean;
begin
  select pg_get_functiondef('public.hv_dedup_assign(double precision,integer)'::regprocedure),
         p.prosecdef
    into definition, proc_security
  from pg_proc p
  where p.oid = 'public.hv_dedup_assign(double precision,integer)'::regprocedure;

  if proc_security is distinct from true then
    raise exception 'hv_dedup_assign must remain SECURITY DEFINER';
  end if;
  if position('order by t.embedding_1024 <=> b.embedding_1024' in lower(definition)) = 0 then
    raise exception 'HNSW k-NN ORDER BY shape missing';
  end if;
  if position('limit c_neighbours' in lower(definition)) = 0 then
    raise exception 'bounded-neighbour LIMIT missing';
  end if;
  if position('where (1 - (a <=> b))' in lower(definition)) > 0 then
    raise exception 'superseded sequential-scan threshold form returned';
  end if;
end
$verify$;
rollback;
