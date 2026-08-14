-- Outcome-based pipeline alerting (Stage G, completing the PARTIAL status).
--
-- WHY THESE SPECIFIC CHECKS
-- On 2026-07-30 five separate failures were found, each having run silently for days
-- or weeks. None was surfaced by the platform; all were found by a human looking.
-- hv_pipeline_health() existed but was never scheduled, asserted only on job-table
-- backlogs and cron flags, and would have caught NONE of the five:
--
--   1. feed stale 9.5 days, 0 promotions        -> feed_stale, no_recent_promotions
--   2. classify 401 for 8 days (looked "busy"
--      because the budget counter was full)     -> dispatch_http_errors, budget_below_ingest
--   3. dedup timeout, 45/46 runs failing        -> cron_failures
--   4. entity rescan, 62.6 attempts/signal      -> extraction_rescan
--   5. digest dark 7 days behind a
--      success-reporting no-op                  -> digest_stale
--
-- The design principle: assert on OUTCOMES (did the feed gain rows? is content fresh?
-- are dispatches returning 2xx? is work being repeated?), never on job exit codes.
-- Every one of the five reported success while failing.

create table if not exists public.hv_alert_log (
  id            bigserial primary key,
  alert_key     text        not null,
  severity      text        not null check (severity in ('critical','warning','ok')),
  value         text,
  detail        text,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  notified_at   timestamptz,
  resolved_at   timestamptz
);

create unique index if not exists idx_hv_alert_log_open
  on public.hv_alert_log (alert_key) where resolved_at is null;

alter table public.hv_alert_log enable row level security;
revoke all on public.hv_alert_log from anon, authenticated;

comment on table public.hv_alert_log is
  'Open/resolved history of pipeline alert breaches. One open row per alert_key; '
  'resolved_at is stamped when the condition clears. Service-role only.';

create or replace function public.hv_pipeline_alerts()
returns table(alert_key text, severity text, value text, detail text)
language sql
security definer
set search_path to 'public'
as $function$
  -- 1. Feed content freshness. Failure #1: newest promoted content sat 9.5 days old.
  select 'feed_stale',
         case when h > 96 then 'critical' when h > 48 then 'warning' else 'ok' end,
         round(h)::text || 'h',
         'hours since newest promoted signal date; ingest runs daily so >48h means promotion is not keeping up'
  from (select extract(epoch from (now() - max(date)))/3600 as h
        from public.signals where reviewed) f

  union all
  -- 2. Did the feed actually gain anything? Failure #1 again: crons green, zero output.
  select 'no_recent_promotions',
         case when n = 0 then 'critical' else 'ok' end,
         n::text,
         'signals promoted in the last 48h; zero while ingestion runs means the promote path is broken'
  from (select count(*) n from public.signals
        where reviewed and reviewed_at > now() - interval '48 hours') p

  union all
  -- 3. Are dispatches actually succeeding? Failure #2: 401 on every classify call for
  --    8 days while the budget counter showed full usage, i.e. it looked busy.
  select 'dispatch_http_errors',
         case when n > 0 then 'critical' else 'ok' end,
         n::text,
         'unharvested dispatch jobs whose HTTP response was 4xx/5xx; any non-zero means a stage is failing every call'
  from (
    select count(*) n from (
      select j.request_id from public.hv_classify_jobs j
        join net._http_response r on r.id=j.request_id where not j.harvested and r.status_code >= 400
      union all
      select j.request_id from public.hv_entity_jobs j
        join net._http_response r on r.id=j.request_id where not j.harvested and r.status_code >= 400
      union all
      select j.request_id from public.hv_embed_jobs j
        join net._http_response r on r.id=j.request_id where not j.harvested and r.status_code >= 400
      union all
      select j.request_id from public.hv_translation_jobs j
        join net._http_response r on r.id=j.request_id where not j.harvested and r.status_code >= 400
    ) e) d

  union all
  -- 4. Is work being repeated? Failure #4: 22,520 entity jobs over 360 signals (62.6x).
  select 'extraction_rescan',
         case when ratio > 5 then 'critical' when ratio > 2 then 'warning' else 'ok' end,
         round(ratio,1)::text || 'x',
         'entity dispatches per distinct signal; >2 means signals are being re-processed instead of finished'
  from (select coalesce(count(*)::numeric / nullif(count(distinct signal_id),0), 0) as ratio
        from public.hv_entity_jobs) rs

  union all
  -- 5. Digest freshness. Failure #5: dark 7 days behind {"ok":true,"skipped":...}.
  select 'digest_stale',
         case when h > 72 then 'critical' when h > 48 then 'warning' else 'ok' end,
         round(h)::text || 'h',
         'hours since the last published daily_digest; the digest job reports success when it skips, so only freshness reveals it'
  from (select extract(epoch from (now() - max(generated_at)))/3600 as h
        from public.daily_digest where status='published') dg

  union all
  -- 6. Structural: can the classifier ever catch up? Failure #2's second half -- the
  --    ceiling sat below the ingest rate, making the backlog mathematically unclearable.
  select 'budget_below_ingest',
         case when ceiling_per_day < ingest_per_day then 'critical'
              when ceiling_per_day < ingest_per_day * 1.5 then 'warning' else 'ok' end,
         ceiling_per_day::text || '/day vs ' || round(ingest_per_day)::text || ' ingested/day',
         'classify daily ceiling versus actual ingest rate; at or below parity the backlog can never clear'
  from (
    select (select daily_ceiling from public.hv_dispatch_budget where stage='classify') as ceiling_per_day,
           (select count(*)::numeric/7 from public.signals where created_at > now() - interval '7 days') as ingest_per_day
  ) b

  union all
  -- 7. Cron failures. Failure #3: dedup timing out on 45 of 46 runs.
  select 'cron_failures',
         case when n > 3 then 'critical' when n > 0 then 'warning' else 'ok' end,
         n::text,
         'failed pipeline cron runs in the last 2h'
  from (select count(*) n from cron.job_run_details d
        join cron.job j on j.jobid=d.jobid
        where d.status='failed' and d.start_time > now() - interval '2 hours'
          and j.jobname like 'hv-%') c

  union all
  -- 8. Harvest backlog (retained from hv_pipeline_health).
  select 'harvest_backlog',
         case when n > 500 then 'critical' when n > 200 then 'warning' else 'ok' end,
         n::text,
         'unharvested jobs across all stages; a rising count means a harvest step is not running'
  from (select (select count(*) from public.hv_classify_jobs where not harvested)
             + (select count(*) from public.hv_embed_jobs where not harvested)
             + (select count(*) from public.hv_translation_jobs where not harvested)
             + (select count(*) from public.hv_entity_jobs where not harvested) as n) hb

  union all
  -- 9. Promotion gate matches the classifier version actually in use.
  select 'classifier_gate',
         case when coalesce(cv.gate_passed,false) then 'ok' else 'critical' end,
         coalesce(live.classifier_version,'unknown') || '=' || coalesce(cv.gate_passed::text,'no_row'),
         'the live classifier_version must have a gate_passed row or promotion silently halts'
  from (select classifier_version from public.signals
        where classifier_version is not null order by created_at desc limit 1) live
  left join public.classifier_validation cv on cv.classifier_version = live.classifier_version;
$function$;

comment on function public.hv_pipeline_alerts() is
  'Outcome assertions for the intelligence pipeline. Asserts on results (feed freshness, '
  'HTTP status, repeat-work ratio, digest freshness, ceiling-vs-ingest) rather than job '
  'exit codes, because every failure found on 2026-07-30 reported success while failing.';
