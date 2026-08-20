\set ON_ERROR_STOP on

-- Production-shaped zero-state prerequisites for the two PR #1598 migrations.
create schema if not exists api;
create schema if not exists auth;
create schema if not exists cron;
create schema if not exists extensions;
create schema if not exists net;
create schema if not exists regulatory_signals;
create schema if not exists signals;
create schema if not exists storage;
create schema if not exists vault;

do $$ begin create role anon; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
do $$ begin create role service_role; exception when duplicate_object then null; end $$;

create table public.signals (
  id text primary key,
  headline text,
  summary text,
  title_en text,
  summary_en text,
  url text,
  lang text,
  lang_detected text,
  quality_label text,
  quality_confidence numeric,
  content_type text,
  impact text,
  classifier_version text,
  is_representative boolean,
  reviewed boolean default false,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);
alter table public.signals enable row level security;

create table public.excluded_source_domains (
  domain text primary key,
  reason text not null default 'fixture'
);
insert into public.excluded_source_domains(domain)
values ('leafly.com'), ('news.google.com');

create table public.classifier_validation (
  classifier_version text primary key,
  gate_passed boolean not null default false
);

create table public.hv_classify_jobs (
  request_id bigint primary key,
  signal_id text not null references public.signals(id) on delete cascade,
  harvested boolean not null default false,
  outcome text
);

create table public.intel_classify_review_queue (
  signal_id text primary key references public.signals(id) on delete cascade,
  headline text,
  summary text,
  reason text,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create table vault.decrypted_secrets (
  name text primary key,
  decrypted_secret text
);
insert into vault.decrypted_secrets(name, decrypted_secret)
values ('hv_edge_anon_key', 'fixture-only-not-a-real-key');

create sequence net.fixture_http_request_id start 1000;
create table net.fixture_http_requests (
  id bigint primary key,
  url text not null,
  headers jsonb not null,
  body jsonb not null,
  timeout_milliseconds integer not null
);

create or replace function net.http_post(
  url text,
  headers jsonb,
  body jsonb,
  timeout_milliseconds integer
)
returns bigint
language plpgsql
as $function$
declare
  v_id bigint := nextval('net.fixture_http_request_id');
begin
  insert into net.fixture_http_requests(id, url, headers, body, timeout_milliseconds)
  values (v_id, url, headers, body, timeout_milliseconds);
  return v_id;
end
$function$;

create table public.fixture_budget_calls (
  id bigserial primary key,
  stage text not null,
  requested integer not null
);

create or replace function public.hv_consume_dispatch_budget(
  p_stage text,
  p_requested integer
)
returns integer
language plpgsql
as $function$
begin
  insert into public.fixture_budget_calls(stage, requested)
  values (p_stage, p_requested);
  return p_requested;
end
$function$;

-- Simulate the current pre-PR ACL and preservation boundary.
create or replace function public.hv_classify_corpus_dispatch(
  p_limit integer default 100,
  p_scope_days integer default 120
)
returns integer
language sql
security definer
as $$ select 0 $$;
revoke all on function public.hv_classify_corpus_dispatch(integer, integer)
  from public, anon, authenticated, service_role;

create or replace function public.hv_promote_signals(
  p_min_conf numeric default 0.65
)
returns integer
language sql
security definer
as $$ select 0 $$;
revoke all on function public.hv_promote_signals(numeric)
  from public, anon, authenticated, service_role;

create or replace function public.hv_dedup_assign(
  p_tau double precision default 0.90,
  p_scope_days integer default 120
)
returns integer
language sql
security definer
set search_path to 'pg_catalog', 'public', 'extensions'
as $$ select 777 $$;

create or replace function public.hv_pipeline_tick()
returns jsonb
language sql
security definer
set search_path to 'public'
as $$ select '{"pending_embedding_guard":true}'::jsonb $$;

create index idx_signals_embedding_1024_hnsw
  on public.signals(created_at);

create temp table preserved_function_definitions (
  function_name text primary key,
  definition text not null
);
insert into preserved_function_definitions(function_name, definition)
select 'hv_dedup_assign',
       pg_get_functiondef('public.hv_dedup_assign(double precision,integer)'::regprocedure)
union all
select 'hv_pipeline_tick',
       pg_get_functiondef('public.hv_pipeline_tick()'::regprocedure);

-- Zero-state replay through both new migrations, then same-database idempotence.
\i supabase/migrations/20260820130000_hv_pipeline_optimization.sql
\i supabase/migrations/20260820131000_hv_review_queue_resolve.sql
\i supabase/migrations/20260820130000_hv_pipeline_optimization.sql
\i supabase/migrations/20260820131000_hv_review_queue_resolve.sql

do $$
declare
  v_before text;
  v_after text;
  v_search_path text;
begin
  select definition into v_before
  from preserved_function_definitions
  where function_name = 'hv_dedup_assign';
  select pg_get_functiondef('public.hv_dedup_assign(double precision,integer)'::regprocedure)
    into v_after;
  if v_before <> v_after then
    raise exception 'hv_dedup_assign was replaced by PR #1598';
  end if;

  select definition into v_before
  from preserved_function_definitions
  where function_name = 'hv_pipeline_tick';
  select pg_get_functiondef('public.hv_pipeline_tick()'::regprocedure)
    into v_after;
  if v_before <> v_after then
    raise exception 'hv_pipeline_tick was replaced by PR #1598';
  end if;

  select array_to_string(p.proconfig, ',')
    into v_search_path
  from pg_proc p
  where p.oid = 'public.hv_dedup_assign(double precision,integer)'::regprocedure;
  if v_search_path not like '%pg_catalog%'
     or v_search_path not like '%public%'
     or v_search_path not like '%extensions%' then
    raise exception 'dedup search_path was not preserved: %', v_search_path;
  end if;

  if to_regclass('public.idx_signals_embedding_1024_hnsw') is null then
    raise exception 'canonical HNSW index identity was lost';
  end if;
  if to_regclass('public.signals_embedding_1024_hnsw_idx') is not null then
    raise exception 'duplicate HNSW index identity was created';
  end if;
end
$$;

-- Measurable multilingual fixture recall. This is a controlled contract set,
-- not a claim about production-corpus recall.
create temp table prefilter_fixture (
  fixture_id text primary key,
  language text not null,
  headline text not null,
  summary text,
  title_en text,
  summary_en text,
  url text,
  recall_member boolean not null,
  expected_disposition text
);

insert into prefilter_fixture values
  ('es', 'es', 'Nueva norma', 'El ministerio aprobó nuevas reglas.', 'Ministry approves medical cannabis import rules', 'The regulation creates a new patient import pathway.', 'https://authority.example/es', true, null),
  ('pt', 'pt-BR', 'Nova regra', 'A agência publicou a decisão.', 'Agency publishes medicinal cannabis licensing decision', 'New licences cover cultivation and export.', 'https://authority.example/pt', true, null),
  ('fr', 'fr', 'Décret adopté', 'Le ministère a publié le texte.', 'Government adopts cannabis cultivation decree', 'The decree sets a pharmaceutical licence framework.', 'https://authority.example/fr', true, null),
  ('de', 'de', 'Neue Vorgabe', 'Das Parlament stimmte zu.', 'Parliament approves medical cannabis quota bill', 'The bill changes pharmacy supply quotas.', 'https://authority.example/de', true, null),
  ('th', 'th', 'กฎใหม่', 'กระทรวงประกาศข้อกำหนด', 'Ministry issues new medical cannabis regulation', 'The policy covers licensed patient access.', 'https://authority.example/th', true, null),
  ('ja-untranslated', 'ja', '厚生省が医療用大麻規則を承認', '患者アクセスの新しい規則です。', null, null, 'https://authority.example/ja', true, 'eligible_untranslated_non_english'),
  ('nav', 'en', 'Menu news', 'Subscribe and sign in', null, null, 'https://authority.example/menu', false, 'filtered_navigation'),
  ('off-topic', 'en', 'Local football club announces a new coach', 'The team begins training next week.', null, null, 'https://authority.example/sport', false, 'filtered_low_relevance'),
  ('excluded-subdomain', 'en', 'Cannabis regulator publishes a licensing update', null, null, null, 'https://news.leafly.com/update', false, 'filtered_excluded_domain'),
  ('url-query-not-host', 'en', 'Cannabis ministry publishes import rules', null, null, null, 'https://authority.example/path?next=leafly.com', false, 'eligible');

do $$
declare
  v_relevant integer;
  v_recalled integer;
  v_recall numeric;
  v_wrong integer;
begin
  with scored as (
    select
      f.*,
      public.hv_prefilter_signal_disposition(
        coalesce(f.title_en, f.headline),
        coalesce(f.summary_en, f.summary, f.title_en, f.headline),
        f.url,
        f.language,
        f.title_en is not null or f.summary_en is not null
      ) as disposition
    from prefilter_fixture f
  )
  select
    count(*) filter (where recall_member),
    count(*) filter (where recall_member and disposition like 'eligible%'),
    count(*) filter (
      where expected_disposition is not null
        and disposition <> expected_disposition
    )
  into v_relevant, v_recalled, v_wrong
  from scored;

  v_recall := round(v_recalled::numeric / nullif(v_relevant, 0), 3);
  raise notice
    'PR1598 multilingual fixture recall: %/% = %',
    v_recalled,
    v_relevant,
    v_recall;

  if v_recall <> 1.000 then
    raise exception 'multilingual fixture recall below 1.000: %', v_recall;
  end if;
  if v_wrong <> 0 then
    raise exception '% explicit pre-filter dispositions differed', v_wrong;
  end if;
end
$$;

-- Dispatch behavior: translated text, explicit filtered rows, exact budget use,
-- five-attempt retirement, and unresolved manual-review exclusion.
truncate table
  net.fixture_http_requests,
  public.fixture_budget_calls,
  public.hv_pipeline_stage_log,
  public.hv_classify_prefilter_dispositions,
  public.hv_signal_review_queue,
  public.hv_classify_jobs,
  public.intel_classify_review_queue,
  public.signals
restart identity cascade;

insert into public.signals(
  id, headline, summary, title_en, summary_en, url, lang, lang_detected, created_at
) values
  ('translated-es', 'Nueva ley', 'El ministerio aprobó la norma.', 'Parliament approves medical cannabis import quota', 'The ministry created a licensed patient import pathway.', 'https://authority.example/es', 'es', 'es', now()),
  ('nav', 'Menu news', 'Subscribe and sign in', null, null, 'https://authority.example/menu', 'en', 'en', now() - interval '1 second'),
  ('off-topic', 'Local football club announces a new coach', 'The team begins training next week.', null, null, 'https://authority.example/sport', 'en', 'en', now() - interval '2 seconds'),
  ('retry', 'Cannabis regulator publishes licensing rules', 'A substantive licensing update.', null, null, 'https://authority.example/retry', 'en', 'en', now() - interval '3 seconds'),
  ('manual', 'Cannabis ministry publishes export quota', 'A substantive quota update.', null, null, 'https://authority.example/manual', 'en', 'en', now() - interval '4 seconds');

insert into public.hv_classify_jobs(request_id, signal_id, harvested, outcome)
select 100 + i, 'retry', true, 'http_503'
from generate_series(1, 5) i;

insert into public.intel_classify_review_queue(signal_id, headline, reason)
values ('manual', 'Cannabis ministry publishes export quota', 'fixture_unresolved');

do $$
declare
  v_dispatched integer;
  v_budget integer;
  v_headline text;
begin
  v_dispatched := public.hv_classify_corpus_dispatch(10, 90);
  if v_dispatched <> 1 then
    raise exception 'expected exactly one translated dispatch, got %', v_dispatched;
  end if;

  select requested into v_budget
  from public.fixture_budget_calls
  where stage = 'classify'
  order by id desc
  limit 1;
  if v_budget <> 1 then
    raise exception 'budget charged % instead of actual selected count 1', v_budget;
  end if;

  select body->'text'->>'headline' into v_headline
  from net.fixture_http_requests
  order by id desc
  limit 1;
  if v_headline <> 'Parliament approves medical cannabis import quota' then
    raise exception 'dispatch did not use translated headline: %', v_headline;
  end if;

  if not exists (
    select 1
    from public.hv_classify_prefilter_dispositions
    where signal_id = 'translated-es'
      and eligible
      and translated_text_used
      and disposition = 'eligible'
  ) then
    raise exception 'translated signal lacks explicit eligible disposition';
  end if;
  if not exists (
    select 1
    from public.hv_classify_prefilter_dispositions
    where signal_id = 'nav'
      and not eligible
      and disposition = 'filtered_navigation'
  ) then
    raise exception 'navigation signal lacks explicit filtered disposition';
  end if;
  if not exists (
    select 1
    from public.hv_classify_prefilter_dispositions
    where signal_id = 'off-topic'
      and not eligible
      and disposition = 'filtered_low_relevance'
  ) then
    raise exception 'off-topic signal lacks explicit filtered disposition';
  end if;
  if not exists (
    select 1
    from public.intel_classify_review_queue
    where signal_id = 'retry'
      and not resolved
      and reason = 'classify_failed_after_5_attempts'
  ) then
    raise exception 'five-attempt failure was not retired to manual review';
  end if;
  if exists (
    select 1
    from public.hv_classify_jobs
    where signal_id in ('retry', 'manual')
      and not harvested
  ) then
    raise exception 'retired or unresolved manual-review signal was dispatched';
  end if;
end
$$;

-- Promotion and review decisions.
truncate table
  public.hv_pipeline_stage_log,
  public.hv_classify_prefilter_dispositions,
  public.hv_signal_review_queue,
  public.hv_classify_jobs,
  public.intel_classify_review_queue,
  public.signals
restart identity cascade;
truncate table public.classifier_validation;

insert into public.classifier_validation(classifier_version, gate_passed)
values ('v-false', false), ('v-ok', true);

insert into public.signals(
  id, headline, url, quality_label, quality_confidence, content_type, impact,
  classifier_version, is_representative, reviewed
) values
  ('gate-missing', 'Cannabis market signal', 'https://authority.example/1', 'signal', 0.95, 'market', 'high', 'v-missing', true, false),
  ('gate-false', 'Cannabis market signal', 'https://authority.example/2', 'signal', 0.95, 'market', 'high', 'v-false', true, false),
  ('auto-ok', 'Cannabis market signal', 'https://authority.example/3', 'signal', 0.95, 'market', 'high', 'v-ok', true, false),
  ('borderline-approve', 'Cannabis market signal', 'https://authority.example/4', 'signal', 0.60, 'market', 'medium', 'v-ok', true, false),
  ('borderline-reject', 'Cannabis market signal', 'https://authority.example/5', 'signal', 0.60, 'market', 'medium', 'v-ok', true, false),
  ('blank-review', 'Cannabis market signal', 'https://authority.example/6', 'signal', 0.60, 'market', 'medium', 'v-ok', true, false),
  ('not-queued', 'Cannabis market signal', 'https://authority.example/7', 'signal', 0.40, 'market', 'low', 'v-ok', true, false),
  ('excluded-high', 'Cannabis market signal', 'https://news.leafly.com/8', 'signal', 0.99, 'market', 'high', 'v-ok', true, false);

do $$
declare
  v_promoted integer;
  v_result boolean;
  v_pending_count integer;
begin
  v_result := public.hv_review_queue_approve('not-queued', 'operator-a');
  if v_result then
    raise exception 'approval accepted a signal without a pending queue row';
  end if;

  v_promoted := public.hv_promote_signals(0.65);
  if v_promoted <> 1 then
    raise exception 'expected only gate-passed auto-ok promotion, got %', v_promoted;
  end if;
  if not (select reviewed from public.signals where id = 'auto-ok') then
    raise exception 'gate-passed high-confidence signal did not promote';
  end if;
  if (select reviewed from public.signals where id = 'gate-missing')
     or (select reviewed from public.signals where id = 'gate-false') then
    raise exception 'classifier_validation gate failed open';
  end if;
  if (select reviewed from public.signals where id = 'excluded-high') then
    raise exception 'excluded domain was promoted';
  end if;

  select count(*) into v_pending_count
  from public.hv_signal_review_queue
  where status = 'pending';
  if v_pending_count <> 3 then
    raise exception 'expected three borderline pending rows, got %', v_pending_count;
  end if;

  v_result := public.hv_review_queue_approve('borderline-approve', 'operator-a');
  if not v_result then
    raise exception 'pending approval returned false';
  end if;
  if not (
    select reviewed
       and reviewed_by = 'human:operator-a'
    from public.signals
    where id = 'borderline-approve'
  ) then
    raise exception 'approval did not atomically publish with human authority';
  end if;
  if public.hv_review_queue_approve('borderline-approve', 'operator-a') then
    raise exception 'repeat approval was not idempotently false';
  end if;

  v_result := public.hv_review_queue_reject(
    'borderline-reject',
    'operator-b',
    'fixture rejection'
  );
  if not v_result then
    raise exception 'pending rejection returned false';
  end if;
  if (
    select reviewed
       or reviewed_by <> 'human:operator-b:rejected'
    from public.signals
    where id = 'borderline-reject'
  ) then
    raise exception 'rejection did not write authoritative human state';
  end if;
  if public.hv_review_queue_reject('borderline-reject', 'operator-b', null) then
    raise exception 'repeat rejection was not idempotently false';
  end if;

  begin
    perform public.hv_review_queue_approve('blank-review', '   ');
    raise exception 'blank reviewer was accepted';
  exception
    when sqlstate '22023' then null;
  end;
  if not exists (
    select 1
    from public.hv_signal_review_queue
    where signal_id = 'blank-review'
      and status = 'pending'
  ) then
    raise exception 'invalid reviewer partially mutated queue state';
  end if;

  update public.signals
  set quality_confidence = 0.99
  where id in ('borderline-reject', 'blank-review');
  v_promoted := public.hv_promote_signals(0.65);
  if v_promoted <> 0 then
    raise exception 'pending/rejected authority was bypassed by promotion';
  end if;
  if (select reviewed from public.signals where id = 'borderline-reject')
     or (select reviewed from public.signals where id = 'blank-review') then
    raise exception 'pending/rejected signal was promoted';
  end if;

  select count(*) into v_pending_count
  from public.hv_review_queue_list_pending(50);
  if v_pending_count <> 1 then
    raise exception 'pending list is not authoritative, count %', v_pending_count;
  end if;
end
$$;

-- RLS and ACL checks.
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'hv_signal_review_queue',
    'hv_classify_prefilter_dispositions',
    'hv_pipeline_stage_log'
  ]
  loop
    if not (
      select c.relrowsecurity
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = v_table
    ) then
      raise exception 'RLS disabled on %', v_table;
    end if;
    if has_table_privilege('anon', 'public.' || v_table, 'select')
       or has_table_privilege('authenticated', 'public.' || v_table, 'select') then
      raise exception 'browser read privilege leaked on %', v_table;
    end if;
    if not has_table_privilege('service_role', 'public.' || v_table, 'select') then
      raise exception 'service_role lost internal read privilege on %', v_table;
    end if;
    if has_table_privilege('service_role', 'public.' || v_table, 'insert')
       or has_table_privilege('service_role', 'public.' || v_table, 'update')
       or has_table_privilege('service_role', 'public.' || v_table, 'delete') then
      raise exception 'service_role has direct DML privilege on %', v_table;
    end if;
  end loop;

  if has_function_privilege(
       'anon',
       'public.hv_review_queue_approve(text,text)',
       'execute'
     )
     or has_function_privilege(
       'authenticated',
       'public.hv_review_queue_approve(text,text)',
       'execute'
     )
     or not has_function_privilege(
       'service_role',
       'public.hv_review_queue_approve(text,text)',
       'execute'
     ) then
    raise exception 'review approval ACL is not service_role-only';
  end if;

  if has_function_privilege(
       'anon',
       'public.hv_prefilter_signal_disposition(text,text,text,text,boolean)',
       'execute'
     )
     or has_function_privilege(
       'authenticated',
       'public.hv_prefilter_signal_disposition(text,text,text,text,boolean)',
       'execute'
     )
     or not has_function_privilege(
       'service_role',
       'public.hv_prefilter_signal_disposition(text,text,text,text,boolean)',
       'execute'
     ) then
    raise exception 'pre-filter ACL is not service_role-only';
  end if;

  if has_function_privilege(
       'service_role',
       'public.hv_classify_corpus_dispatch(integer,integer)',
       'execute'
     )
     or has_function_privilege(
       'anon',
       'public.hv_classify_corpus_dispatch(integer,integer)',
       'execute'
     ) then
    raise exception 'classifier dispatch ACL widened beyond postgres';
  end if;
end
$$;

select 'PR1598 zero-state, idempotence, multilingual recall, behavior, RLS and ACL: PASS';
