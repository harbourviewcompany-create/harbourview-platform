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
) values
  (
    'signal-a',
    ('[1,' || repeat('0,', 1022) || '0]')::vector,
    now() - interval '2 minutes',
    0.90,
    null,
    null
  ),
  (
    'signal-b',
    ('[1,' || repeat('0,', 1022) || '0]')::vector,
    now() - interval '1 minute',
    0.50,
    null,
    null
  );

-- Actual invocation catches lazy PL/pgSQL compilation and runtime failures.
select public.hv_dedup_assign(0.90, 120);

do $dedup_verify$
begin
  if not exists (
    select 1 from public.signals
    where id = 'signal-b' and cluster_rep_id = 'signal-a' and is_representative is false
  ) then
    raise exception 'hv_dedup_assign invocation did not produce the expected representative assignment';
  end if;
end
$dedup_verify$;

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
set local role authenticated;
select api.submit_signal_relevance_feedback('signal-a', 'helpful', 'fixture', 'digest');
select api.submit_signal_relevance_feedback('signal-a', 'not_helpful', null, 'signals');
select api.submit_signal_relevance_feedback('signal-a', 'stale', null, 'search');
select api.submit_signal_relevance_feedback('signal-a', 'wrong_country', null, 'email');
reset role;

do $feedback_verify$
declare
  v_score numeric;
  v_count integer;
begin
  select public.signal_feedback_score('signal-a') into v_score;
  if v_score <> -20 then
    raise exception 'signed feedback score mismatch: expected -20, got %', v_score;
  end if;

  select count(*) into v_count
  from api.signal_relevance_feedback_for_ranking(
    array['signal-a'], now() - interval '1 day'
  );
  if v_count <> 4 then
    raise exception 'ranking verdict projection expected 4 rows, got %', v_count;
  end if;

  if has_function_privilege(
    'anon',
    'api.submit_signal_relevance_feedback(text,text,text,text)',
    'EXECUTE'
  ) then
    raise exception 'anon must not execute feedback writer';
  end if;

  if has_function_privilege(
    'authenticated',
    'api.signal_relevance_feedback_for_ranking(text[],timestamptz)',
    'EXECUTE'
  ) then
    raise exception 'authenticated must not execute ranking projection';
  end if;

  if not has_function_privilege(
    'service_role',
    'api.signal_relevance_feedback_for_ranking(text[],timestamptz)',
    'EXECUTE'
  ) then
    raise exception 'service_role must execute ranking projection';
  end if;
end
$feedback_verify$;

rollback;
