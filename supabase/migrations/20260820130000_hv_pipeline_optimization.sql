-- =============================================================================
-- HV Intelligence Pipeline Optimization — 2026-08-20
-- =============================================================================
-- Additive and replay-safe. This migration does not schedule, unschedule, alter,
-- or enable any cron job.
--
-- The change is intentionally narrow:
--   * extend the current 20260814180000 classifier dispatch with a persisted
--     pre-filter disposition;
--   * add a borderline human-review queue and stage log;
--   * retain the classifier_validation publication gate in promotion.
--
-- Deliberately NOT redefined here:
--   * hv_classify_corpus_harvest() and its recorded retry outcomes;
--   * hv_dedup_assign(), whose authoritative body is the HNSW KNN implementation
--     from 20260814143000 with search_path pg_catalog, public, extensions;
--   * hv_pipeline_tick(), whose authoritative body is 20260730184257 and excludes
--     signals with an unharvested hv_embed_jobs row;
--   * hv_quality_promote_tick();
--   * the existing idx_signals_embedding_1024_hnsw index.
--
-- No second HNSW index is created. No fail-open evaluation helper is introduced:
-- classifier_validation remains the mechanical publication authority.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Borderline human-review queue
-- ---------------------------------------------------------------------------
create table if not exists public.hv_signal_review_queue (
  signal_id text primary key references public.signals(id) on delete cascade,
  quality_label text,
  quality_confidence numeric,
  content_type text,
  impact text,
  reason text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'skipped')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text
);

create index if not exists hv_signal_review_queue_status_idx
  on public.hv_signal_review_queue (status, created_at desc);

alter table public.hv_signal_review_queue enable row level security;

drop policy if exists hv_signal_review_queue_service_all
  on public.hv_signal_review_queue;
drop policy if exists hv_signal_review_queue_service_select
  on public.hv_signal_review_queue;
create policy hv_signal_review_queue_service_select
  on public.hv_signal_review_queue
  for select
  to service_role
  using (true);

revoke all on table public.hv_signal_review_queue
  from public, anon, authenticated, service_role;
grant select on table public.hv_signal_review_queue to service_role;

comment on table public.hv_signal_review_queue is
  'Internal borderline-classification review queue. Direct service_role access is read-only; '
  'approval and rejection are authoritative through the locked SECURITY DEFINER RPCs.';

-- ---------------------------------------------------------------------------
-- 2. Persisted pre-filter dispositions
-- ---------------------------------------------------------------------------
create table if not exists public.hv_classify_prefilter_dispositions (
  signal_id text primary key references public.signals(id) on delete cascade,
  eligible boolean not null,
  disposition text not null check (
    disposition in (
      'eligible',
      'eligible_untranslated_non_english',
      'eligible_language_unknown',
      'filtered_too_short',
      'filtered_navigation',
      'filtered_excluded_domain',
      'filtered_low_relevance'
    )
  ),
  filter_version text not null,
  input_hash text not null,
  translated_text_used boolean not null default false,
  language text,
  evaluated_at timestamptz not null default now()
);

create index if not exists hv_classify_prefilter_disposition_idx
  on public.hv_classify_prefilter_dispositions
  (eligible, disposition, evaluated_at desc);

alter table public.hv_classify_prefilter_dispositions enable row level security;

drop policy if exists hv_classify_prefilter_dispositions_service_select
  on public.hv_classify_prefilter_dispositions;
create policy hv_classify_prefilter_dispositions_service_select
  on public.hv_classify_prefilter_dispositions
  for select
  to service_role
  using (true);

revoke all on table public.hv_classify_prefilter_dispositions
  from public, anon, authenticated, service_role;
grant select on table public.hv_classify_prefilter_dispositions to service_role;

comment on table public.hv_classify_prefilter_dispositions is
  'Explicit, versioned disposition for every signal evaluated by the classifier pre-filter. '
  'The input hash makes a translated-text update eligible for re-evaluation.';

-- ---------------------------------------------------------------------------
-- 3. Internal stage observability
-- ---------------------------------------------------------------------------
create table if not exists public.hv_pipeline_stage_log (
  id bigserial primary key,
  stage text not null,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists hv_pipeline_stage_log_stage_created_idx
  on public.hv_pipeline_stage_log (stage, created_at desc);

alter table public.hv_pipeline_stage_log enable row level security;

drop policy if exists hv_pipeline_stage_log_service_select
  on public.hv_pipeline_stage_log;
create policy hv_pipeline_stage_log_service_select
  on public.hv_pipeline_stage_log
  for select
  to service_role
  using (true);

revoke all on table public.hv_pipeline_stage_log
  from public, anon, authenticated, service_role;
grant select on table public.hv_pipeline_stage_log to service_role;

comment on table public.hv_pipeline_stage_log is
  'Internal pipeline counters. Browser roles have no privileges; service_role is read-only.';

-- ---------------------------------------------------------------------------
-- 4. Cheap pre-filter decision
-- ---------------------------------------------------------------------------
-- Remove the three-argument draft overload if an ephemeral branch applied the
-- earlier PR head. The repaired function has language/translation context so
-- untranslated non-English inputs can fail open instead of losing recall.
drop function if exists public.hv_prefilter_signal(text, text, text);

create or replace function public.hv_prefilter_signal_disposition(
  p_headline text,
  p_summary text,
  p_url text default null,
  p_language text default null,
  p_translated boolean default false
)
returns text
language plpgsql
stable
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_headline text := lower(btrim(coalesce(p_headline, '')));
  v_summary text := lower(btrim(coalesce(p_summary, '')));
  v_combined text := lower(btrim(coalesce(p_headline, '') || ' ' || coalesce(p_summary, '')));
  v_authority text;
  v_host text;
  v_language text := lower(split_part(coalesce(nullif(btrim(p_language), ''), 'unknown'), '-', 1));
begin
  if coalesce(btrim(p_url), '') <> '' then
    v_authority := split_part(
      regexp_replace(btrim(p_url), '^[a-z][a-z0-9+.-]*://', '', 'i'),
      '/',
      1
    );
    v_host := lower(regexp_replace(v_authority, '^.*@', ''));
    v_host := regexp_replace(v_host, ':[0-9]+$', '');
    v_host := regexp_replace(v_host, '^www\.', '');

    if exists (
      select 1
      from public.excluded_source_domains d
      where v_host = lower(regexp_replace(d.domain, '^www\.', ''))
         or v_host like '%.' || lower(regexp_replace(d.domain, '^www\.', ''))
    ) then
      return 'filtered_excluded_domain';
    end if;
  end if;

  -- PostgreSQL ARE does not treat \b as a word boundary. Explicit
  -- non-alphanumeric/end boundaries keep this branch executable and testable.
  if (
    v_headline ~ '(^|[^[:alnum:]_])(cookie(s)?|subscribe|sign[[:space:]]+in|log[[:space:]]+in|register|privacy[[:space:]]+policy|terms[[:space:]]+of[[:space:]]+use|all[[:space:]]+rights[[:space:]]+reserved)([^[:alnum:]_]|$)'
    or (
      v_headline ~ '^(home|menu|search|contact|about|faq)([^[:alnum:]_]|$)'
      and length(v_headline) < 80
    )
  ) then
    return 'filtered_navigation';
  end if;

  -- A terse headline can still be substantive when its summary carries the
  -- meaning. Filter only empty/near-empty combined inputs.
  if v_headline = '' or length(regexp_replace(v_combined, '[[:space:]]+', '', 'g')) < 12 then
    return 'filtered_too_short';
  end if;

  -- The classifier is language-agnostic; a predominantly English keyword filter
  -- is not. Until translation exists, explicitly fail open for known non-English
  -- rows. Unknown-language rows also fail open so missing metadata cannot become
  -- a hidden publication-recall loss.
  if not coalesce(p_translated, false)
     and v_language not in ('en', 'eng', 'unknown', 'und', '') then
    return 'eligible_untranslated_non_english';
  end if;

  if not coalesce(p_translated, false)
     and v_language in ('unknown', 'und', '') then
    return 'eligible_language_unknown';
  end if;

  -- Relevance filtering is applied only to English or translated text. The
  -- multilingual terms are defense in depth; translated rows normally match the
  -- English vocabulary.
  if v_combined !~ '(cannabis|marijuana|marihuana|maconha|hemp|chanvre|cáñamo|กัญชา|thc|cbd|gmp|gacp|licen[cs]e|regulat|ministry|minister|agency|fda|bfarm|health[[:space:]]+canada|ema|quota|import|export|cultivat|pharma|medicin|patient|dispensar|prescri|narcotic|drug|legalis|legaliz|decriminal|parliament|senate|bill|court|policy|market|sales|clinical[[:space:]]+trial)' then
    return 'filtered_low_relevance';
  end if;

  return 'eligible';
end
$function$;

create or replace function public.hv_prefilter_signal(
  p_headline text,
  p_summary text,
  p_url text default null,
  p_language text default null,
  p_translated boolean default false
)
returns boolean
language sql
stable
set search_path to 'pg_catalog', 'public'
as $function$
  select public.hv_prefilter_signal_disposition(
    p_headline,
    p_summary,
    p_url,
    p_language,
    p_translated
  ) like 'eligible%';
$function$;

revoke all on function public.hv_prefilter_signal_disposition(text, text, text, text, boolean)
  from public, anon, authenticated;
revoke all on function public.hv_prefilter_signal(text, text, text, text, boolean)
  from public, anon, authenticated;
grant execute on function public.hv_prefilter_signal_disposition(text, text, text, text, boolean)
  to service_role;
grant execute on function public.hv_prefilter_signal(text, text, text, text, boolean)
  to service_role;

-- ---------------------------------------------------------------------------
-- 5. Current safe classifier dispatch + pre-filter
-- ---------------------------------------------------------------------------
-- This is the 20260814180000 body with its budget accounting, five-attempt
-- retirement, unresolved manual-review exclusion, and broad live search_path
-- retained. The only selection change is the persisted pre-filter disposition.
create or replace function public.hv_classify_corpus_dispatch(
  p_limit integer default 100,
  p_scope_days integer default 120
)
returns integer
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
as $function$
declare
  r record;
  v_rid bigint;
  n int := 0;
  v_ids text[];
  v_evaluated int := 0;
  v_filtered int := 0;
  v_started_at timestamptz := clock_timestamp();
  c_max_attempts constant int := 5;
  c_filter_version constant text := 'hv-prefilter/v1-translated';
  c_prefilter_scan constant int := 400;
begin
  p_limit := least(greatest(coalesce(p_limit, 100), 1), 150);
  p_scope_days := least(greatest(coalesce(p_scope_days, 120), 1), 400);

  -- Preserve the bounded retry/manual-review retirement from 20260814180000.
  insert into public.intel_classify_review_queue (signal_id, headline, summary, reason)
  select
    s.id,
    coalesce(nullif(btrim(s.title_en), ''), s.headline),
    coalesce(
      nullif(btrim(s.summary_en), ''),
      nullif(btrim(left(s.summary, 1000)), ''),
      nullif(btrim(s.title_en), ''),
      s.headline
    ),
    'classify_failed_after_' || c_max_attempts || '_attempts'
  from public.signals s
  where s.quality_label is null
    and s.reviewed is distinct from true
    and s.headline is not null
    and s.created_at > now() - (p_scope_days || ' days')::interval
    and (
      select count(*)
      from public.hv_classify_jobs k
      where k.signal_id = s.id
        and k.outcome is not null
        and k.outcome <> 'ok'
    ) >= c_max_attempts
  on conflict (signal_id) do nothing;

  -- Evaluate a bounded candidate window. The exact coalesced h/sm values sent
  -- to hv-classify are the values evaluated here. A changed translation changes
  -- input_hash and causes re-evaluation.
  with base as (
    select
      s.id,
      s.created_at,
      coalesce(nullif(btrim(s.title_en), ''), s.headline) as h,
      coalesce(
        nullif(btrim(s.summary_en), ''),
        nullif(btrim(left(s.summary, 1000)), ''),
        nullif(btrim(s.title_en), ''),
        s.headline
      ) as sm,
      s.url,
      coalesce(
        nullif(btrim(s.lang_detected), ''),
        nullif(btrim(s.lang), ''),
        'unknown'
      ) as language,
      (
        nullif(btrim(s.title_en), '') is not null
        or nullif(btrim(s.summary_en), '') is not null
      ) as translated_text_used
    from public.signals s
    where s.quality_label is null
      and s.reviewed is distinct from true
      and s.headline is not null
      and s.created_at > now() - (p_scope_days || ' days')::interval
      and not exists (
        select 1
        from public.hv_classify_jobs j
        where j.signal_id = s.id
          and not j.harvested
      )
      and not exists (
        select 1
        from public.intel_classify_review_queue q
        where q.signal_id = s.id
          and not q.resolved
      )
  ),
  fingerprinted as (
    select
      b.*,
      md5(concat_ws(
        chr(31),
        coalesce(b.h, ''),
        coalesce(b.sm, ''),
        coalesce(b.url, ''),
        coalesce(b.language, ''),
        b.translated_text_used::text
      )) as input_hash
    from base b
  ),
  candidates as (
    select f.*
    from fingerprinted f
    left join public.hv_classify_prefilter_dispositions d
      on d.signal_id = f.id
    where d.signal_id is null
       or d.filter_version <> c_filter_version
       or d.input_hash is distinct from f.input_hash
    order by f.created_at desc
    limit least(c_prefilter_scan, greatest(p_limit * 5, p_limit))
  ),
  evaluated as (
    select
      c.*,
      public.hv_prefilter_signal_disposition(
        c.h,
        c.sm,
        c.url,
        c.language,
        c.translated_text_used
      ) as disposition
    from candidates c
  )
  insert into public.hv_classify_prefilter_dispositions (
    signal_id,
    eligible,
    disposition,
    filter_version,
    input_hash,
    translated_text_used,
    language,
    evaluated_at
  )
  select
    e.id,
    e.disposition like 'eligible%',
    e.disposition,
    c_filter_version,
    e.input_hash,
    e.translated_text_used,
    e.language,
    clock_timestamp()
  from evaluated e
  on conflict (signal_id) do update
    set eligible = excluded.eligible,
        disposition = excluded.disposition,
        filter_version = excluded.filter_version,
        input_hash = excluded.input_hash,
        translated_text_used = excluded.translated_text_used,
        language = excluded.language,
        evaluated_at = excluded.evaluated_at;

  get diagnostics v_evaluated = row_count;

  select count(*)
    into v_filtered
  from public.hv_classify_prefilter_dispositions d
  where d.filter_version = c_filter_version
    and not d.eligible
    and d.evaluated_at >= v_started_at;

  -- Select before consuming budget, then charge exactly the eligible rows that
  -- will dispatch. This preserves the August budget repair.
  with base as (
    select
      s.id,
      s.created_at,
      coalesce(nullif(btrim(s.title_en), ''), s.headline) as h,
      coalesce(
        nullif(btrim(s.summary_en), ''),
        nullif(btrim(left(s.summary, 1000)), ''),
        nullif(btrim(s.title_en), ''),
        s.headline
      ) as sm,
      s.url,
      coalesce(
        nullif(btrim(s.lang_detected), ''),
        nullif(btrim(s.lang), ''),
        'unknown'
      ) as language,
      (
        nullif(btrim(s.title_en), '') is not null
        or nullif(btrim(s.summary_en), '') is not null
      ) as translated_text_used
    from public.signals s
    where s.quality_label is null
      and s.reviewed is distinct from true
      and s.headline is not null
      and s.created_at > now() - (p_scope_days || ' days')::interval
      and not exists (
        select 1
        from public.hv_classify_jobs j
        where j.signal_id = s.id
          and not j.harvested
      )
      and not exists (
        select 1
        from public.intel_classify_review_queue q
        where q.signal_id = s.id
          and not q.resolved
      )
  ),
  fingerprinted as (
    select
      b.*,
      md5(concat_ws(
        chr(31),
        coalesce(b.h, ''),
        coalesce(b.sm, ''),
        coalesce(b.url, ''),
        coalesce(b.language, ''),
        b.translated_text_used::text
      )) as input_hash
    from base b
  )
  select array_agg(x.id order by x.created_at desc)
    into v_ids
  from (
    select f.id, f.created_at
    from fingerprinted f
    join public.hv_classify_prefilter_dispositions d
      on d.signal_id = f.id
     and d.filter_version = c_filter_version
     and d.input_hash = f.input_hash
     and d.eligible
    order by f.created_at desc
    limit p_limit
  ) x;

  if v_ids is null then
    insert into public.hv_pipeline_stage_log(stage, metrics)
    values (
      'classify_dispatch',
      jsonb_build_object(
        'dispatched', 0,
        'prefilter_evaluated', v_evaluated,
        'prefilter_filtered', v_filtered,
        'filter_version', c_filter_version
      )
    );
    return 0;
  end if;

  p_limit := public.hv_consume_dispatch_budget(
    'classify',
    array_length(v_ids, 1)
  );
  if p_limit <= 0 then
    insert into public.hv_pipeline_stage_log(stage, metrics)
    values (
      'classify_dispatch',
      jsonb_build_object(
        'dispatched', 0,
        'budget_blocked', true,
        'prefilter_evaluated', v_evaluated,
        'prefilter_filtered', v_filtered,
        'filter_version', c_filter_version
      )
    );
    return 0;
  end if;
  v_ids := v_ids[1:least(p_limit, array_length(v_ids, 1))];

  for r in
    select
      s.id,
      coalesce(nullif(btrim(s.title_en), ''), s.headline) as h,
      coalesce(
        nullif(btrim(s.summary_en), ''),
        nullif(btrim(left(s.summary, 1000)), ''),
        nullif(btrim(s.title_en), ''),
        s.headline
      ) as sm
    from public.signals s
    where s.id = any(v_ids)
    order by s.created_at desc
  loop
    select net.http_post(
      url := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-classify',
      headers := jsonb_build_object(
        'Content-Type',
        'application/json',
        'Authorization',
        'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'hv_edge_anon_key'
          limit 1
        )
      ),
      body := jsonb_build_object(
        'text',
        jsonb_build_object('headline', r.h, 'summary', r.sm)
      ),
      timeout_milliseconds := 30000
    ) into v_rid;

    insert into public.hv_classify_jobs(request_id, signal_id)
    values (v_rid, r.id)
    on conflict do nothing;

    n := n + 1;
  end loop;

  insert into public.hv_pipeline_stage_log(stage, metrics)
  values (
    'classify_dispatch',
    jsonb_build_object(
      'dispatched', n,
      'prefilter_evaluated', v_evaluated,
      'prefilter_filtered', v_filtered,
      'filter_version', c_filter_version
    )
  );

  return n;
end
$function$;

-- Preserve the current postgres-only ACL from 20260814180000. CREATE OR REPLACE
-- carries that ACL forward; no service_role grant is added.
revoke all on function public.hv_classify_corpus_dispatch(integer, integer)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Promotion: classifier gate + authoritative review dispositions
-- ---------------------------------------------------------------------------
create or replace function public.hv_promote_signals(
  p_min_conf numeric default 0.65
)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  n int;
  v_queued int;
  v_floor numeric := greatest(coalesce(p_min_conf, 0.65), 0.65);
begin
  -- Queue only borderline rows. Existing approved/rejected/skipped decisions
  -- are never reopened by an automatic run.
  insert into public.hv_signal_review_queue (
    signal_id,
    quality_label,
    quality_confidence,
    content_type,
    impact,
    reason,
    status
  )
  select
    s.id,
    s.quality_label,
    s.quality_confidence,
    s.content_type,
    s.impact,
    'below_confidence_floor',
    'pending'
  from public.signals s
  where s.quality_label = 'signal'
    and coalesce(s.is_representative, true) = true
    and s.quality_confidence is not null
    and s.quality_confidence >= 0.50
    and s.quality_confidence < v_floor
    and s.reviewed is distinct from true
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%')
    and regexp_replace(
      coalesce(s.url, ''),
      '^https?://(www\.)?([^/]+).*',
      '\2'
    ) not in (select domain from public.excluded_source_domains)
  on conflict (signal_id) do update
    set quality_label = excluded.quality_label,
        quality_confidence = excluded.quality_confidence,
        content_type = excluded.content_type,
        impact = excluded.impact,
        reason = excluded.reason
  where public.hv_signal_review_queue.status = 'pending';

  get diagnostics v_queued = row_count;

  -- Auto-promotion retains the classifier_validation publication gate. Pending,
  -- rejected, and skipped human dispositions are authoritative and block it.
  update public.signals s
  set
    reviewed = true,
    reviewed_by = 'auto:v1',
    reviewed_at = now()
  where s.quality_label = 'signal'
    and coalesce(s.is_representative, true) = true
    and s.quality_confidence is not null
    and s.quality_confidence >= v_floor
    and s.reviewed is distinct from true
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%')
    and exists (
      select 1
      from public.classifier_validation cv
      where cv.classifier_version = s.classifier_version
        and cv.gate_passed = true
    )
    and not exists (
      select 1
      from public.hv_signal_review_queue q
      where q.signal_id = s.id
        and q.status in ('pending', 'rejected', 'skipped')
    )
    and regexp_replace(
      coalesce(s.url, ''),
      '^https?://(www\.)?([^/]+).*',
      '\2'
    ) not in (select domain from public.excluded_source_domains);

  get diagnostics n = row_count;

  insert into public.hv_pipeline_stage_log(stage, metrics)
  values (
    'promote',
    jsonb_build_object(
      'promoted', n,
      'min_conf', v_floor,
      'queued_borderline', v_queued,
      'classifier_validation_gate', 'required'
    )
  );

  return n;
end
$function$;

revoke all on function public.hv_promote_signals(numeric)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. Preservation boundary
-- ---------------------------------------------------------------------------
-- No CREATE OR REPLACE follows for hv_dedup_assign, hv_pipeline_tick, or
-- hv_quality_promote_tick. No CREATE INDEX follows. Their latest pre-existing
-- migration definitions remain authoritative, including HNSW KNN, extensions
-- search_path, pending-embedding exclusion, and current cron call behavior.
