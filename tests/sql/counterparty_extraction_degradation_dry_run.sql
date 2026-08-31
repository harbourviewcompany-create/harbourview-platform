-- Dry run for 20260828153000_counterparty_extraction_degradation_visibility.sql
--
-- Builds a production-shaped run_signal_counterparty_extraction() from scratch --
-- the same shape that exists live but in no committed migration -- so the
-- production-only patch path is reproducible from this commit rather than from a
-- throwaway cluster. Sanitized: no production payloads, no keys, invented
-- counterparty names, stubbed HTTP responses.
--
-- Asserts:
--   1. Before the migration, both providers degraded still selects gemini, so the
--      all_configured_llm_providers_degraded alarm never fires. (the defect)
--   2. After the migration, the same state selects no provider, the alarm row is
--      written to pipeline_manual_review_queue, and the function reports degraded.
--   3. After the migration, a non-200 collect phase reports llm_status_code and
--      degraded=true instead of a bare ok:true. (the silent-success defect)
--   4. A healthy anthropic still wins, so the change does not disable extraction.

\set ON_ERROR_STOP on

create schema if not exists net;
create schema if not exists vault;

create table net._http_response(id bigint primary key, status_code int, content text);
create table _counterparty_jobs(request_id bigint, signal_ids text[], provider text,
  collected boolean default false, created_at timestamptz default now());
create table ia_counterparties(id text primary key, name text, role text, markets text[],
  categories text[], interaction_count int, introduction_count int, documentation_status text,
  last_interaction date, notes text, updated_at timestamptz);
create table ia_signals(id text primary key, stage text, title text, market text, category text,
  summary text, counterparty_extracted_at timestamptz, created_at timestamptz default now());
create table pipeline_manual_review_queue(
  id bigserial primary key, pipeline text not null, reference_date date not null,
  reason text, detail jsonb, created_at timestamptz default now(),
  notified_at timestamptz, resolved_at timestamptz, resolved_by text,
  unique (pipeline, reference_date));
create table vault.decrypted_secrets(name text primary key, decrypted_secret text);

create function safe_to_jsonb(t text) returns jsonb language plpgsql immutable as $$
begin return t::jsonb; exception when others then return null; end $$;

-- Both providers configured. Values are placeholders, not credentials.
insert into vault.decrypted_secrets values ('anthropic_api_key','not-a-real-key'),('gemini_api_key','not-a-real-key');

-- Production-shaped function: gemini selected unconditionally, collect phase
-- returning a bare ok:true. Reduced to the branches under test.
create function run_signal_counterparty_extraction() returns jsonb language plpgsql security definer as $function$
declare
  v_anthropic_key text;
  v_gemini_key text;
  v_signals jsonb;
  v_inserted int := 0;
  v_provider text; v_attempts int; v_failures int;
  v_collect_provider text;
begin
  perform 1 from _counterparty_jobs j where not j.collected;
  if found then
    with resp as (
      select j.request_id, j.signal_ids, j.provider,
             safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text' as llm_text, r.status_code
      from _counterparty_jobs j join net._http_response r on r.id = j.request_id
      where not j.collected order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, signal_ids, provider, status_code, safe_to_jsonb(llm_text) as p from resp
    ),
    ok as (
      select request_id, signal_ids, p from parsed where status_code = 200 and jsonb_typeof(p) = 'array'
    ),
    extracted as (
      select 'rm-' || md5(lower(trim(h->>'name'))) as id, trim(h->>'name') as name
      from ok, jsonb_array_elements(ok.p) h where coalesce(h->>'name','') <> ''
    ),
    ins as (
      insert into ia_counterparties(id,name) select id,name from extracted
      on conflict (id) do nothing returning 1
    ),
    done as (
      update _counterparty_jobs j set collected = true from parsed p where j.request_id = p.request_id returning 1
    )
    select (select count(*) from ins), (select provider from parsed)
      into v_inserted, v_collect_provider;

    return jsonb_build_object('ok', true, 'phase', 'collect', 'provider', v_collect_provider, 'counterparties_touched', coalesce(v_inserted,0));
  end if;

  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;

  select jsonb_agg(jsonb_build_object('id', s.id)) into v_signals
  from (select * from ia_signals where stage in ('qualified','converted_to_opportunity')
        and counterparty_extracted_at is null order by created_at desc limit 25) s;
  if v_signals is null then
    return jsonb_build_object('ok', true, 'skipped', 'no unprocessed qualified signals');
  end if;

  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _counterparty_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'anthropic'; end if;
  end if;
  if v_provider is null and v_gemini_key is not null then v_provider := 'gemini'; end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('counterparty_extraction', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('available_signals', jsonb_array_length(v_signals)))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded');
  end if;

  return jsonb_build_object('ok', true, 'phase', 'fire', 'provider', v_provider);
end;
$function$;

-- Eligible work exists, and BOTH providers have been failing for the last 2 hours.
insert into ia_signals(id, stage) values ('sig-1','qualified');
insert into net._http_response values
  (101, 400, '{"error":{"message":"credit balance is too low"}}'),
  (102, 429, '{"error":{"message":"quota exceeded"}}');
insert into _counterparty_jobs(request_id, provider, collected, created_at) values
  (101,'anthropic',true, now() - interval '30 minutes'),
  (102,'gemini',   true, now() - interval '20 minutes');

-- ASSERTION 1: the defect. Both degraded, yet gemini is still selected and no alarm fires.
do $$
declare r jsonb; queued int;
begin
  r := run_signal_counterparty_extraction();
  select count(*) into queued from pipeline_manual_review_queue;
  if r->>'provider' is distinct from 'gemini' then
    raise exception 'pre-migration expectation failed: expected gemini to be selected despite degradation, got %', r;
  end if;
  if queued <> 0 then
    raise exception 'pre-migration expectation failed: alarm should be unreachable, found % queued row(s)', queued;
  end if;
  raise notice 'ASSERT 1 OK (defect reproduced): both providers degraded -> provider=gemini, manual-review rows=0';
end $$;

-- Apply the migration under test.
\i supabase/migrations/20260828153000_counterparty_extraction_degradation_visibility.sql

-- ASSERTION 2: the fix. Same state now selects no provider, writes the alarm row,
-- and reports degraded.
do $$
declare r jsonb; queued int; v_reason text;
begin
  r := run_signal_counterparty_extraction();
  select count(*), max(q.reason) into queued, v_reason from pipeline_manual_review_queue q;
  if coalesce((r->>'degraded')::boolean, false) is not true then
    raise exception 'post-migration: expected degraded=true, got %', r;
  end if;
  if r->>'reason' is distinct from 'all_configured_llm_providers_degraded' then
    raise exception 'post-migration: expected all_configured_llm_providers_degraded, got %', r;
  end if;
  if queued <> 1 or v_reason is distinct from 'all_configured_llm_providers_degraded' then
    raise exception 'post-migration: expected exactly 1 alarm row, found % with reason %', queued, v_reason;
  end if;
  raise notice 'ASSERT 2 OK (alarm now reachable): provider=null -> degraded=true, manual-review rows=1';
end $$;

-- ASSERTION 3: the collect phase now distinguishes "ran" from "worked".
do $$
declare r jsonb;
begin
  insert into net._http_response values (201, 500, '{"error":"upstream exploded"}');
  insert into _counterparty_jobs(request_id, provider, collected, created_at)
    values (201, 'anthropic', false, now());

  r := run_signal_counterparty_extraction();
  if r->>'phase' is distinct from 'collect' then
    raise exception 'expected collect phase, got %', r;
  end if;
  if (r->>'llm_status_code')::int is distinct from 500 then
    raise exception 'expected llm_status_code 500 surfaced, got %', r;
  end if;
  if coalesce((r->>'degraded')::boolean, false) is not true then
    raise exception 'expected degraded=true on a non-200 collect, got %', r;
  end if;
  raise notice 'ASSERT 3 OK (silent success closed): non-200 collect -> llm_status_code=500, degraded=true';
end $$;

-- ASSERTION 4: a healthy provider still wins. The change must not disable extraction.
do $$
declare r jsonb;
begin
  delete from _counterparty_jobs;
  delete from net._http_response;
  update ia_signals set counterparty_extracted_at = null;
  insert into net._http_response values (301, 200, '[]');
  insert into _counterparty_jobs(request_id, provider, collected, created_at)
    values (301, 'anthropic', true, now() - interval '10 minutes');

  r := run_signal_counterparty_extraction();
  if r->>'provider' is distinct from 'anthropic' then
    raise exception 'healthy anthropic should still be selected, got %', r;
  end if;
  if r->>'phase' is distinct from 'fire' then
    raise exception 'expected fire phase with a healthy provider, got %', r;
  end if;
  raise notice 'ASSERT 4 OK (no regression): healthy anthropic -> provider=anthropic, phase=fire';
end $$;

select 'GO: counterparty extraction degradation visibility dry run passed' as result;
