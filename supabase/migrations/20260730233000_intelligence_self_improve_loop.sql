-- Continuous improvement for the intelligence product.
--
-- 1. signal_relevance_feedback — operators mark signals helpful / not helpful.
--    Aggregates feed back into digest ranking (soft boost) and human review queues.
-- 2. intelligence_outcome_snapshot — point-in-time product health (not just "cron OK").
-- 3. hv_intelligence_outcome_check() — pure SQL health check for Stage G alerting.

-- ── Operator feedback ─────────────────────────────────────────────────────────
create table if not exists public.signal_relevance_feedback (
  id uuid primary key default gen_random_uuid(),
  signal_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  verdict text not null check (verdict in ('helpful', 'not_helpful', 'stale', 'wrong_country')),
  note text,
  surface text not null default 'digest' check (surface in ('digest', 'signals', 'search', 'email')),
  created_at timestamptz not null default now()
);

create index if not exists idx_signal_relevance_feedback_signal
  on public.signal_relevance_feedback (signal_id, created_at desc);

create index if not exists idx_signal_relevance_feedback_verdict
  on public.signal_relevance_feedback (verdict, created_at desc);

comment on table public.signal_relevance_feedback is
  'Operator judgments on signal usefulness. Soft signal for ranking; hard input for human review when not_helpful rate is high.';

alter table public.signal_relevance_feedback enable row level security;

drop policy if exists signal_relevance_feedback_insert_own on public.signal_relevance_feedback;
create policy signal_relevance_feedback_insert_own
  on public.signal_relevance_feedback
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists signal_relevance_feedback_select_own on public.signal_relevance_feedback;
create policy signal_relevance_feedback_select_own
  on public.signal_relevance_feedback
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Service role reads aggregates; no broad select for anon.

-- ── Aggregate helper used by ranking ──────────────────────────────────────────
create or replace function public.signal_feedback_score(p_signal_id text)
returns numeric
language sql
stable
security invoker
set search_path to 'public'
as $$
  select coalesce(
    (
      select
        (count(*) filter (where verdict = 'helpful')::numeric * 8)
        - (count(*) filter (where verdict = 'not_helpful')::numeric * 12)
        - (count(*) filter (where verdict = 'stale')::numeric * 6)
        - (count(*) filter (where verdict = 'wrong_country')::numeric * 10)
      from public.signal_relevance_feedback f
      where f.signal_id = p_signal_id
        and f.created_at > now() - interval '90 days'
    ),
    0
  );
$$;

-- ── Outcome health (Stage G — product outcomes, not cron OK) ──────────────────
create or replace function public.hv_intelligence_outcome_check()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_newest_promoted timestamptz;
  v_feed_age_hours numeric;
  v_last_digest date;
  v_digest_age_days int;
  v_unclassified bigint;
  v_reviewed_7d bigint;
  v_not_helpful_7d bigint;
  v_alerts jsonb := '[]'::jsonb;
  v_status text := 'healthy';
begin
  select max(reviewed_at) into v_newest_promoted
  from public.signals
  where reviewed is true;

  v_feed_age_hours := case
    when v_newest_promoted is null then null
    else extract(epoch from (now() - v_newest_promoted)) / 3600.0
  end;

  select max(digest_date) into v_last_digest
  from public.daily_digest
  where status = 'published'
    and (
      (headlines is not null and jsonb_array_length(headlines) > 0)
      or (editorial_headlines is not null and jsonb_array_length(editorial_headlines) > 0)
    );

  v_digest_age_days := case
    when v_last_digest is null then null
    else (current_date - v_last_digest)
  end;

  select count(*) into v_unclassified
  from public.signals
  where reviewed is distinct from true
    and quality_label is null
    and created_at > now() - interval '14 days';

  select count(*) into v_reviewed_7d
  from public.signals
  where reviewed is true
    and coalesce(reviewed_at, created_at) > now() - interval '7 days';

  select count(*) into v_not_helpful_7d
  from public.signal_relevance_feedback
  where verdict in ('not_helpful', 'stale', 'wrong_country')
    and created_at > now() - interval '7 days';

  -- Alert rules (plain English, actionable)
  if v_feed_age_hours is null or v_feed_age_hours > 72 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'code', 'feed_stale',
      'severity', 'critical',
      'message', format(
        'Intel feed has no promotion in %s hours. Operators see a silent stale product while monitors may still say green.',
        coalesce(round(v_feed_age_hours)::text, 'unknown')
      )
    ));
    v_status := 'critical';
  elsif v_feed_age_hours > 36 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'code', 'feed_aging',
      'severity', 'warning',
      'message', format('Intel feed last promotion %s hours ago — still within tolerance but cooling.', round(v_feed_age_hours))
    ));
    if v_status = 'healthy' then v_status := 'warning'; end if;
  end if;

  if v_digest_age_days is null or v_digest_age_days > 2 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'code', 'digest_stale',
      'severity', 'critical',
      'message', format(
        'Daily Digest has no published edition for %s days. Check run_daily_digest / LLM providers.',
        coalesce(v_digest_age_days::text, 'unknown')
      )
    ));
    v_status := 'critical';
  elsif v_digest_age_days > 0 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'code', 'digest_missed_today',
      'severity', 'warning',
      'message', 'No Digest edition for today yet — may still land if cron is pending.'
    ));
    if v_status = 'healthy' then v_status := 'warning'; end if;
  end if;

  if v_unclassified > 2000 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'code', 'classify_backlog',
      'severity', 'warning',
      'message', format('%s unclassified signals in 14d window — quality pipeline may be lagging.', v_unclassified)
    ));
    if v_status = 'healthy' then v_status := 'warning'; end if;
  end if;

  if v_not_helpful_7d >= 5 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'code', 'operator_negative_feedback',
      'severity', 'info',
      'message', format('%s negative operator feedback marks in 7d — review ranking / promotion sample.', v_not_helpful_7d)
    ));
  end if;

  return jsonb_build_object(
    'ok', true,
    'status', v_status,
    'checked_at', now(),
    'metrics', jsonb_build_object(
      'newest_promoted_at', v_newest_promoted,
      'feed_age_hours', v_feed_age_hours,
      'last_digest_date', v_last_digest,
      'digest_age_days', v_digest_age_days,
      'unclassified_14d', v_unclassified,
      'reviewed_7d', v_reviewed_7d,
      'negative_feedback_7d', v_not_helpful_7d
    ),
    'alerts', v_alerts
  );
end;
$function$;

comment on function public.hv_intelligence_outcome_check() is
  'Stage G product-outcome health: feed freshness, digest currency, classify backlog, operator feedback — not cron success alone.';

revoke all on function public.hv_intelligence_outcome_check() from public;
grant execute on function public.hv_intelligence_outcome_check() to service_role;
