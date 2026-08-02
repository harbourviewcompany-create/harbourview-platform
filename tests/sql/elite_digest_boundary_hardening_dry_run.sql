\set ON_ERROR_STOP on
begin;

create extension if not exists vector;
create schema if not exists auth;
create schema if not exists api;

do $roles$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end
$roles$;

create table auth.users (id uuid primary key);
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;

create table public.signals (
  id text primary key,
  embedding_1024 vector(1024),
  created_at timestamptz not null default now(),
  quality_confidence numeric,
  cluster_rep_id text,
  is_representative boolean,
  reviewed boolean,
  reviewed_at timestamptz,
  quality_label text
);

grant select on table public.signals to service_role;

create or replace function public._digest_cluster_size(p_cluster_rep_id text)
returns integer
language sql
stable
security invoker
set search_path to 'public'
as $$
  select greatest(1, count(*)::integer)
  from public.signals s
  where s.cluster_rep_id is not null
    and s.cluster_rep_id = p_cluster_rep_id;
$$;

create table public.daily_digest (
  digest_date date,
  status text,
  headlines jsonb,
  editorial_headlines jsonb
);

create index idx_signals_embedding_1024_hnsw
  on public.signals using hnsw (embedding_1024 vector_cosine_ops);

\ir ../../supabase/migrations/20260730233000_intelligence_self_improve_loop.sql
\ir ../../supabase/migrations/20260802073000_hv_dedup_assign_restore_hnsw_knn.sql
\ir ../../supabase/migrations/20260802152500_signal_feedback_api_rpcs.sql

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222');

insert into public.signals (
  id, embedding_1024, created_at, quality_confidence, cluster_rep_id, is_representative
) values (
  'signal-a',
  ('[1,' || repeat('0,', 1022) || '0]')::vector,
  now() - interval '1 minute',
  0.90,
  null,
  null
);

-- Create existing feedback through the approved writer before hardening, then
-- fingerprint it so the forward migration must preserve every stored value.
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-1111-1111-111111111111',
  true
);
set local role authenticated;
select api.submit_signal_relevance_feedback(
  'signal-a',
  'helpful',
  'preserve me',
  'digest'
);
reset role;

create temporary table feedback_before_hardening as
select
  count(*)::bigint as row_count,
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
      E'\n'
      order by id
    )
  ) as content_md5
from public.signal_relevance_feedback;

\ir ../../supabase/migrations/20260802163000_elite_digest_rpc_boundary_hardening.sql

do $preservation_and_grants$
declare
  v_before_count bigint;
  v_before_md5 text;
  v_after_count bigint;
  v_after_md5 text;
begin
  select row_count, content_md5
    into v_before_count, v_before_md5
  from feedback_before_hardening;

  select
    count(*)::bigint,
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
        E'\n'
        order by id
      )
    )
    into v_after_count, v_after_md5
  from public.signal_relevance_feedback;

  if v_before_count <> v_after_count or v_before_md5 is distinct from v_after_md5 then
    raise exception
      'boundary hardening changed feedback data: before count/md5 %/%, after %/%',
      v_before_count, v_before_md5, v_after_count, v_after_md5;
  end if;

  if has_schema_privilege('anon', 'api', 'USAGE')
     or not has_schema_privilege('authenticated', 'api', 'USAGE')
     or not has_schema_privilege('service_role', 'api', 'USAGE') then
    raise exception 'api schema usage boundary mismatch';
  end if;

  if has_table_privilege('anon', 'public.signal_relevance_feedback', 'SELECT')
     or has_table_privilege('anon', 'public.signal_relevance_feedback', 'INSERT')
     or has_table_privilege('authenticated', 'public.signal_relevance_feedback', 'SELECT')
     or has_table_privilege('authenticated', 'public.signal_relevance_feedback', 'INSERT')
     or has_table_privilege('authenticated', 'public.signal_relevance_feedback', 'UPDATE')
     or has_table_privilege('authenticated', 'public.signal_relevance_feedback', 'DELETE') then
    raise exception 'public API roles retain direct feedback table privileges';
  end if;

  if not has_table_privilege('service_role', 'public.signal_relevance_feedback', 'SELECT')
     or not has_table_privilege('service_role', 'public.signal_relevance_feedback', 'INSERT') then
    raise exception 'service_role aggregate access was not preserved';
  end if;

  if has_function_privilege(
       'anon',
       'public.hv_dedup_assign(double precision,integer)',
       'EXECUTE'
     )
     or has_function_privilege(
       'authenticated',
       'public.hv_dedup_assign(double precision,integer)',
       'EXECUTE'
     )
     or not has_function_privilege(
       'service_role',
       'public.hv_dedup_assign(double precision,integer)',
       'EXECUTE'
     ) then
    raise exception 'hv_dedup_assign execution boundary mismatch';
  end if;

  if has_function_privilege(
       'anon',
       'public._digest_cluster_size(text)',
       'EXECUTE'
     )
     or has_function_privilege(
       'authenticated',
       'public._digest_cluster_size(text)',
       'EXECUTE'
     )
     or not has_function_privilege(
       'service_role',
       'public._digest_cluster_size(text)',
       'EXECUTE'
     ) then
    raise exception '_digest_cluster_size execution boundary mismatch';
  end if;

  if has_function_privilege(
       'anon',
       'api.submit_signal_relevance_feedback(text,text,text,text)',
       'EXECUTE'
     )
     or not has_function_privilege(
       'authenticated',
       'api.submit_signal_relevance_feedback(text,text,text,text)',
       'EXECUTE'
     )
     or has_function_privilege(
       'service_role',
       'api.submit_signal_relevance_feedback(text,text,text,text)',
       'EXECUTE'
     ) then
    raise exception 'feedback writer RPC boundary mismatch';
  end if;

  if has_function_privilege(
       'anon',
       'api.signal_relevance_feedback_for_ranking(text[],timestamptz)',
       'EXECUTE'
     )
     or has_function_privilege(
       'authenticated',
       'api.signal_relevance_feedback_for_ranking(text[],timestamptz)',
       'EXECUTE'
     )
     or not has_function_privilege(
       'service_role',
       'api.signal_relevance_feedback_for_ranking(text[],timestamptz)',
       'EXECUTE'
     ) then
    raise exception 'ranking projection RPC boundary mismatch';
  end if;
end
$preservation_and_grants$;

-- Authenticated clients can update their current verdict through the API RPC,
-- but direct Data API table reads and writes fail for the same role.
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-1111-1111-111111111111',
  true
);
set local role authenticated;

do $direct_read_denied$
begin
  begin
    perform count(*) from public.signal_relevance_feedback;
    raise exception 'authenticated direct feedback SELECT unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end
$direct_read_denied$;

do $direct_insert_denied$
begin
  begin
    insert into public.signal_relevance_feedback (
      signal_id, user_id, verdict, surface
    ) values (
      'signal-a',
      '22222222-2222-2222-2222-222222222222',
      'helpful',
      'digest'
    );
    raise exception 'authenticated direct feedback INSERT unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end
$direct_insert_denied$;

select api.submit_signal_relevance_feedback(
  'signal-a',
  'wrong_country',
  'updated through RPC',
  'signals'
);
reset role;

do $rpc_update_verify$
declare
  v_count integer;
begin
  select count(*) into v_count
  from public.signal_relevance_feedback
  where signal_id = 'signal-a'
    and user_id = '11111111-1111-1111-1111-111111111111'
    and verdict = 'wrong_country'
    and note = 'updated through RPC'
    and surface = 'signals';

  if v_count <> 1 then
    raise exception 'authenticated writer RPC did not update one current verdict';
  end if;
end
$rpc_update_verify$;

-- Service role can consume the narrow ranking projection and invoke internal
-- helpers while receiving no notes or user identifiers from the projection.
set local role service_role;
select *
from api.signal_relevance_feedback_for_ranking(
  array['signal-a'],
  now() - interval '1 day'
);
select public._digest_cluster_size(null);
select public.hv_dedup_assign(0.90, 120);
reset role;

rollback;
