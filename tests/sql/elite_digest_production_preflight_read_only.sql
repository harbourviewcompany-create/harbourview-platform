\set ON_ERROR_STOP on
\pset pager off
\pset format unaligned
\pset fieldsep '|'
\pset tuples_only off

begin transaction read only;

\echo '=== elite_digest_preflight: platform ==='
select
  current_setting('server_version') as postgres_version,
  coalesce((select extversion from pg_extension where extname = 'vector'), 'missing') as pgvector_version,
  coalesce(current_setting('pgrst.db_schemas', true), 'unavailable') as postgrest_exposed_schemas;

\echo '=== elite_digest_preflight: exact ledger ==='
with expected(version, expected_name, sequence_no) as (
  values
    ('20260730230000', 'elite_digest_from_pipeline_b', 1),
    ('20260730233000', 'intelligence_self_improve_loop', 2),
    ('20260731090000', 'digest_rank_includes_feedback', 3),
    ('20260731100000', 'run_daily_digest_uses_feedback_rank', 4),
    ('20260731110000', 'feedback_service_aggregates', 5),
    ('20260731130000', 'elite_digest_release_hardening', 6),
    ('20260802073000', 'hv_dedup_assign_restore_hnsw_knn', 7),
    ('20260802152500', 'signal_feedback_api_rpcs', 8),
    ('20260802163000', 'elite_digest_rpc_boundary_hardening', 9)
)
select
  e.sequence_no,
  e.version,
  e.expected_name,
  m.name as live_name,
  m.version is not null as applied,
  m.name is not distinct from e.expected_name as name_matches
from expected e
left join supabase_migrations.schema_migrations m
  on m.version = e.version
order by e.sequence_no;

select
  count(*) filter (
    where version in (
      '20260730230000',
      '20260730233000',
      '20260731090000',
      '20260731100000',
      '20260731110000',
      '20260731130000'
    )
  ) = 6 as first_six_applied,
  count(*) filter (
    where version in (
      '20260802073000',
      '20260802152500',
      '20260802163000'
    )
  ) = 0 as approved_three_unapplied
from supabase_migrations.schema_migrations
\gset

\if :first_six_applied
\else
  \echo 'Preflight failed: one or more prerequisite Elite Digest migrations are absent.'
  \quit 1
\endif

\if :approved_three_unapplied
\else
  \echo 'Preflight failed: the approved three-migration activation is partially or fully applied.'
  \quit 1
\endif

\echo '=== elite_digest_preflight: schema prerequisites ==='
select
  to_regnamespace('api') is not null as api_schema_exists,
  to_regnamespace('auth') is not null as auth_schema_exists,
  to_regclass('public.signals') is not null as signals_table_exists,
  to_regclass('public.signal_relevance_feedback') is not null as feedback_table_exists,
  to_regclass('public.daily_digest') is not null as daily_digest_table_exists,
  to_regprocedure('auth.uid()') is not null as auth_uid_exists,
  to_regprocedure('gen_random_uuid()') is not null as gen_random_uuid_exists;

select
  (select format_type(atttypid, atttypmod)
     from pg_attribute
    where attrelid = 'public.signals'::regclass
      and attname = 'embedding_1024'
      and not attisdropped) = 'vector(1024)' as embedding_type_ok,
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'signals'
      and indexname = 'idx_signals_embedding_1024_hnsw'
      and indexdef ilike '%using hnsw%'
      and indexdef ilike '%vector_cosine_ops%'
  ) as hnsw_index_ok,
  to_regprocedure('public.hv_dedup_assign(double precision,integer)') is not null as dedup_function_exists,
  to_regprocedure('public._digest_cluster_size(text)') is not null as cluster_helper_exists,
  to_regprocedure('public.signal_feedback_score(text)') is not null as feedback_score_exists,
  to_regprocedure('public._digest_rank_score(numeric,text,text,integer,text)') is not null as rank_helper_exists,
  to_regprocedure('public.run_daily_digest()') is not null as digest_runner_exists
\gset

\if :embedding_type_ok
\else
  \echo 'Preflight failed: signals.embedding_1024 is not vector(1024).'
  \quit 1
\endif
\if :hnsw_index_ok
\else
  \echo 'Preflight failed: required HNSW index is absent or has the wrong operator class.'
  \quit 1
\endif
\if :dedup_function_exists
\else
  \echo 'Preflight failed: hv_dedup_assign is absent.'
  \quit 1
\endif
\if :cluster_helper_exists
\else
  \echo 'Preflight failed: _digest_cluster_size is absent.'
  \quit 1
\endif
\if :feedback_score_exists
\else
  \echo 'Preflight failed: signal_feedback_score is absent.'
  \quit 1
\endif
\if :rank_helper_exists
\else
  \echo 'Preflight failed: _digest_rank_score is absent.'
  \quit 1
\endif
\if :digest_runner_exists
\else
  \echo 'Preflight failed: run_daily_digest is absent.'
  \quit 1
\endif

\echo '=== elite_digest_preflight: feedback integrity ==='
select
  count(*) as row_count,
  count(distinct user_id) as distinct_users,
  count(distinct signal_id) as distinct_signals,
  count(*) filter (where user_id is null) as null_user_rows,
  max(created_at) as latest_created_at,
  coalesce(
    md5(
      string_agg(
        concat_ws(
          '|',
          id::text,
          signal_id,
          coalesce(user_id::text, ''),
          verdict,
          coalesce(note, ''),
          surface,
          created_at::text
        ),
        E'\n' order by id
      )
    ),
    md5('')
  ) as content_fingerprint
from public.signal_relevance_feedback;

select count(*) = 0 as no_duplicate_user_signal_groups
from (
  select signal_id, user_id
  from public.signal_relevance_feedback
  group by signal_id, user_id
  having count(*) > 1
) duplicates
\gset

\if :no_duplicate_user_signal_groups
\else
  \echo 'Preflight failed: duplicate (signal_id,user_id) feedback groups exist.'
  \quit 1
\endif

\echo '=== elite_digest_preflight: constraints and indexes ==='
select conname, contype, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.signal_relevance_feedback'::regclass
order by conname;

select schemaname, tablename, indexname, indexdef
from pg_indexes
where (schemaname, tablename) in (
  ('public', 'signal_relevance_feedback'),
  ('public', 'signals')
)
  and (
    tablename = 'signal_relevance_feedback'
    or indexname = 'idx_signals_embedding_1024_hnsw'
  )
order by tablename, indexname;

\echo '=== elite_digest_preflight: RLS and grants ==='
select
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced,
  pg_get_userbyid(c.relowner) as table_owner,
  c.relacl as raw_acl
from pg_class c
where c.oid = 'public.signal_relevance_feedback'::regclass;

select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'signal_relevance_feedback'
order by policyname;

select
  role_name,
  has_table_privilege(role_name, 'public.signal_relevance_feedback', 'SELECT') as can_select,
  has_table_privilege(role_name, 'public.signal_relevance_feedback', 'INSERT') as can_insert,
  has_table_privilege(role_name, 'public.signal_relevance_feedback', 'UPDATE') as can_update,
  has_table_privilege(role_name, 'public.signal_relevance_feedback', 'DELETE') as can_delete
from (values ('anon'), ('authenticated'), ('service_role')) roles(role_name)
order by role_name;

\echo '=== elite_digest_preflight: function rollback evidence ==='
select
  p.oid::regprocedure::text as signature,
  pg_get_userbyid(p.proowner) as owner,
  p.prosecdef as security_definer,
  p.proconfig as function_config,
  p.proacl as raw_acl,
  md5(pg_get_functiondef(p.oid)) as definition_md5,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
where p.oid in (
  'public.hv_dedup_assign(double precision,integer)'::regprocedure,
  'public._digest_cluster_size(text)'::regprocedure,
  'public.signal_feedback_score(text)'::regprocedure,
  'public._digest_rank_score(numeric,text,text,integer,text)'::regprocedure,
  'public.run_daily_digest()'::regprocedure
)
order by signature;

rollback;
