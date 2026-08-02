\set ON_ERROR_STOP on
\pset pager off
\pset format unaligned
\pset fieldsep '|'
\pset tuples_only off

begin transaction read only;

\echo '=== elite_digest_postflight: exact ledger ==='
with expected(version, expected_name) as (
  values
    ('20260802073000', 'hv_dedup_assign_restore_hnsw_knn'),
    ('20260802152500', 'signal_feedback_api_rpcs'),
    ('20260802163000', 'elite_digest_rpc_boundary_hardening')
)
select
  e.version,
  e.expected_name,
  m.name as live_name,
  m.version is not null as applied,
  m.name is not distinct from e.expected_name as name_matches
from expected e
left join supabase_migrations.schema_migrations m
  on m.version = e.version
order by e.version;

select count(*) = 3 as approved_three_applied_exactly
from supabase_migrations.schema_migrations
where (version, name) in (
  ('20260802073000', 'hv_dedup_assign_restore_hnsw_knn'),
  ('20260802152500', 'signal_feedback_api_rpcs'),
  ('20260802163000', 'elite_digest_rpc_boundary_hardening')
)
\gset

\if :approved_three_applied_exactly
\else
  \echo 'Postflight failed: approved migration ledger entries are incomplete or mismatched.'
  \quit 1
\endif

\echo '=== elite_digest_postflight: feedback integrity ==='
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

select
  count(*) = 0 as no_duplicate_user_signal_groups,
  to_regclass('public.idx_signal_relevance_feedback_one_per_user_signal') is not null
    as unique_current_verdict_index_exists
from (
  select signal_id, user_id
  from public.signal_relevance_feedback
  group by signal_id, user_id
  having count(*) > 1
) duplicates
\gset

\if :no_duplicate_user_signal_groups
\else
  \echo 'Postflight failed: duplicate feedback groups exist.'
  \quit 1
\endif
\if :unique_current_verdict_index_exists
\else
  \echo 'Postflight failed: one-current-verdict unique index is absent.'
  \quit 1
\endif

\echo '=== elite_digest_postflight: function and grant contract ==='
select
  to_regprocedure('api.submit_signal_relevance_feedback(text,text,text,text)') is not null as writer_exists,
  to_regprocedure('api.signal_relevance_feedback_for_ranking(text[],timestamp with time zone)') is not null as ranking_projection_exists,
  has_function_privilege('authenticated', 'api.submit_signal_relevance_feedback(text,text,text,text)', 'EXECUTE') as authenticated_writer_execute,
  not has_function_privilege('anon', 'api.submit_signal_relevance_feedback(text,text,text,text)', 'EXECUTE') as anon_writer_denied,
  not has_function_privilege('service_role', 'api.submit_signal_relevance_feedback(text,text,text,text)', 'EXECUTE') as service_writer_denied,
  has_function_privilege('service_role', 'api.signal_relevance_feedback_for_ranking(text[],timestamp with time zone)', 'EXECUTE') as service_ranking_execute,
  not has_function_privilege('anon', 'api.signal_relevance_feedback_for_ranking(text[],timestamp with time zone)', 'EXECUTE') as anon_ranking_denied,
  not has_function_privilege('authenticated', 'api.signal_relevance_feedback_for_ranking(text[],timestamp with time zone)', 'EXECUTE') as authenticated_ranking_denied,
  has_function_privilege('service_role', 'public.hv_dedup_assign(double precision,integer)', 'EXECUTE') as service_dedup_execute,
  not has_function_privilege('anon', 'public.hv_dedup_assign(double precision,integer)', 'EXECUTE') as anon_dedup_denied,
  not has_function_privilege('authenticated', 'public.hv_dedup_assign(double precision,integer)', 'EXECUTE') as authenticated_dedup_denied,
  has_function_privilege('service_role', 'public._digest_cluster_size(text)', 'EXECUTE') as service_cluster_execute,
  not has_function_privilege('anon', 'public._digest_cluster_size(text)', 'EXECUTE') as anon_cluster_denied,
  not has_function_privilege('authenticated', 'public._digest_cluster_size(text)', 'EXECUTE') as authenticated_cluster_denied
\gset

\if :writer_exists
\else
  \echo 'Postflight failed: feedback writer RPC is absent.'
  \quit 1
\endif
\if :ranking_projection_exists
\else
  \echo 'Postflight failed: ranking projection RPC is absent.'
  \quit 1
\endif
\if :authenticated_writer_execute
\else
  \echo 'Postflight failed: authenticated writer EXECUTE is absent.'
  \quit 1
\endif
\if :anon_writer_denied
\else
  \echo 'Postflight failed: anon can execute the feedback writer.'
  \quit 1
\endif
\if :service_writer_denied
\else
  \echo 'Postflight failed: service_role can execute the client writer.'
  \quit 1
\endif
\if :service_ranking_execute
\else
  \echo 'Postflight failed: service_role cannot execute the ranking projection.'
  \quit 1
\endif
\if :anon_ranking_denied
\else
  \echo 'Postflight failed: anon can execute the ranking projection.'
  \quit 1
\endif
\if :authenticated_ranking_denied
\else
  \echo 'Postflight failed: authenticated can execute the ranking projection.'
  \quit 1
\endif
\if :service_dedup_execute
\else
  \echo 'Postflight failed: service_role cannot execute hv_dedup_assign.'
  \quit 1
\endif
\if :anon_dedup_denied
\else
  \echo 'Postflight failed: anon can execute hv_dedup_assign.'
  \quit 1
\endif
\if :authenticated_dedup_denied
\else
  \echo 'Postflight failed: authenticated can execute hv_dedup_assign.'
  \quit 1
\endif
\if :service_cluster_execute
\else
  \echo 'Postflight failed: service_role cannot execute _digest_cluster_size.'
  \quit 1
\endif
\if :anon_cluster_denied
\else
  \echo 'Postflight failed: anon can execute _digest_cluster_size.'
  \quit 1
\endif
\if :authenticated_cluster_denied
\else
  \echo 'Postflight failed: authenticated can execute _digest_cluster_size.'
  \quit 1
\endif

\echo '=== elite_digest_postflight: direct table boundary ==='
select
  (select relrowsecurity from pg_class where oid = 'public.signal_relevance_feedback'::regclass)
    as feedback_rls_enabled,
  not (
    has_table_privilege('anon', 'public.signal_relevance_feedback', 'SELECT')
    or has_table_privilege('anon', 'public.signal_relevance_feedback', 'INSERT')
    or has_table_privilege('anon', 'public.signal_relevance_feedback', 'UPDATE')
    or has_table_privilege('anon', 'public.signal_relevance_feedback', 'DELETE')
  ) as anon_direct_table_denied,
  not (
    has_table_privilege('authenticated', 'public.signal_relevance_feedback', 'SELECT')
    or has_table_privilege('authenticated', 'public.signal_relevance_feedback', 'INSERT')
    or has_table_privilege('authenticated', 'public.signal_relevance_feedback', 'UPDATE')
    or has_table_privilege('authenticated', 'public.signal_relevance_feedback', 'DELETE')
  ) as authenticated_direct_table_denied,
  has_table_privilege('service_role', 'public.signal_relevance_feedback', 'SELECT') as service_select_retained,
  has_table_privilege('service_role', 'public.signal_relevance_feedback', 'INSERT') as service_insert_retained
\gset

\if :feedback_rls_enabled
\else
  \echo 'Postflight failed: feedback-table RLS is disabled.'
  \quit 1
\endif
\if :anon_direct_table_denied
\else
  \echo 'Postflight failed: anon retains a direct feedback-table privilege.'
  \quit 1
\endif
\if :authenticated_direct_table_denied
\else
  \echo 'Postflight failed: authenticated retains a direct feedback-table privilege.'
  \quit 1
\endif
\if :service_select_retained
\else
  \echo 'Postflight failed: service_role SELECT was not retained.'
  \quit 1
\endif
\if :service_insert_retained
\else
  \echo 'Postflight failed: service_role INSERT was not retained.'
  \quit 1
\endif

\echo '=== elite_digest_postflight: HNSW implementation ==='
select
  position(
    'order by t.embedding_1024 <=> b.embedding_1024'
    in lower(pg_get_functiondef('public.hv_dedup_assign(double precision,integer)'::regprocedure))
  ) > 0 as hnsw_order_present,
  position(
    'limit c_neighbours'
    in lower(pg_get_functiondef('public.hv_dedup_assign(double precision,integer)'::regprocedure))
  ) > 0 as hnsw_limit_present
\gset

\if :hnsw_order_present
\else
  \echo 'Postflight failed: HNSW ORDER BY shape is absent.'
  \quit 1
\endif
\if :hnsw_limit_present
\else
  \echo 'Postflight failed: HNSW neighbour LIMIT is absent.'
  \quit 1
\endif

rollback;
