-- Alert on edge-function calls that failed, which pg_cron cannot see.
--
-- pg_cron marks a job 'succeeded' when net.http_post enqueues the request. The
-- edge function's actual response is recorded separately in net._http_response
-- and was, until now, unasserted. On 2026-08-13 cron reported 33/33 jobs green
-- over 24 hours while 17 of 61 responses were failures:
--
--     400 x 6   Anthropic: "Your credit balance is too low"        (hourly, :40)
--     500 x 6   "permission denied for function
--               get_tables_missing_from_api_schema"                (hourly, :12)
--     none x 5  Timeout of 25000 ms                                (:00 / :30)
--
-- This adds one assertion in the style this function already documents: assert
-- the fact that must hold if the stage genuinely worked, rather than trusting
-- the stage to report its own health.
--
-- Only the new `edge_http_errors` branch is added. Every existing branch is
-- reproduced byte-for-byte from 20260730222221_hv_pipeline_alerts_outcome_assertions.sql,
-- and this file is generated from that one rather than retyped.

create or replace function public.hv_pipeline_alerts()
returns table(alert_key text, severity text, value text, detail text)
language sql
security definer
set search_path to 'public'
as $function$
  select 'feed_stale',
         case when h > 96 then 'critical' when h > 48 then 'warning' else 'ok' end,
         round(h)::text || 'h',
         'hours since newest promoted signal date; ingest runs daily so >48h means promotion is not keeping up'
  from (select extract(epoch from (now() - max(date)))/3600 as h
        from public.signals where reviewed) f

  union all
  select 'no_recent_promotions',
         case when n = 0 then 'critical' else 'ok' end,
         n::text,
         'signals promoted in the last 48h; zero while ingestion runs means the promote path is broken'
  from (select count(*) n from public.signals
        where reviewed and reviewed_at > now() - interval '48 hours') p

  union all
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
  -- Structural rescan check: a signal already dispatched must not be eligible again.
  select 'extraction_rescan',
         case when n > 50 then 'critical' when n > 0 then 'warning' else 'ok' end,
         n::text,
         'signals already entity-dispatched yet still eligible for dispatch; >0 means the once-only guard has regressed'
  from (
    select count(*) n
    from public.signals s
    where s.quality_label = 'signal'
      and s.entities_extracted_at is null
      and exists (select 1 from public.hv_entity_jobs j where j.signal_id = s.id and j.harvested)
  ) rs

  union all
  select 'digest_stale',
         case when h > 72 then 'critical' when h > 48 then 'warning' else 'ok' end,
         round(h)::text || 'h',
         'hours since the last published daily_digest; the digest job reports success when it skips, so only freshness reveals it'
  from (select extract(epoch from (now() - max(generated_at)))/3600 as h
        from public.daily_digest where status='published') dg

  union all
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
  select 'cron_failures',
         case when n > 3 then 'critical' when n > 0 then 'warning' else 'ok' end,
         n::text,
         'failed pipeline cron runs in the last 2h'
  from (select count(*) n from cron.job_run_details d
        join cron.job j on j.jobid=d.jobid
        where d.status='failed' and d.start_time > now() - interval '2 hours'
          and j.jobname like 'hv-%') c

  union all
  select 'harvest_backlog',
         case when n > 500 then 'critical' when n > 200 then 'warning' else 'ok' end,
         n::text,
         'unharvested jobs across all stages; a rising count means a harvest step is not running'
  from (select (select count(*) from public.hv_classify_jobs where not harvested)
             + (select count(*) from public.hv_embed_jobs where not harvested)
             + (select count(*) from public.hv_translation_jobs where not harvested)
             + (select count(*) from public.hv_entity_jobs where not harvested) as n) hb

  union all
  -- Every classifier_version in use must have a gate_passed row, else promotion for
  -- those rows halts silently. Checks all versions present, not just one guessed row.
  select 'classifier_gate',
         case when n_ungated > 0 then 'critical' else 'ok' end,
         coalesce(versions, 'none'),
         'classifier versions on signals lacking a gate_passed=true validation row; any such version cannot promote'
  from (
    select count(*) filter (where not coalesce(cv.gate_passed,false)) as n_ungated,
           string_agg(v.classifier_version || '=' || coalesce(cv.gate_passed::text,'no_row'), ', ' order by v.classifier_version) as versions
    from (select distinct classifier_version from public.signals where classifier_version is not null) v
    left join public.classifier_validation cv on cv.classifier_version = v.classifier_version
  ) g

  union all
  -- pg_cron reports success when net.http_post *enqueues* a request, not when the
  -- edge function succeeds. On 2026-08-13 that hid three permanently failing jobs
  -- while cron showed 33/33 green for 24h: an hourly Anthropic 400 (credit balance),
  -- an hourly schema-drift-monitor 500 (permission denied), and a recurring 25s
  -- timeout. dispatch_http_errors does not cover these -- it only inspects
  -- unharvested *dispatch* jobs, and cron-invoked functions are not dispatch jobs.
  --
  -- Asserts the outcome (a 2xx actually came back) rather than trusting the caller.
  select 'edge_http_errors',
         case when n > 0 then 'critical' else 'ok' end,
         n::text,
         'non-2xx or timed-out edge-function responses in the last 2h; pg_cron reports these as succeeded'
  from (
    select count(*) as n
    from net._http_response
    where created > now() - interval '2 hours'
      and (status_code is null or status_code < 200 or status_code >= 300)
  ) eh

  union all
  -- Classification is the gate every downstream stage depends on: a signal with a
  -- null quality_label can never reach quality_label='signal', so it can never be
  -- promoted, so the feed goes stale. On 2026-08-12 the Anthropic classifier began
  -- returning 400 "credit balance is too low"; classification silently stopped and
  -- the first visible symptom was feed_stale two days later, because every stage in
  -- between reported success.
  --
  -- Asserts that ingested signals are actually getting labelled. Ingest is hourly,
  -- so anything unclassified beyond 6h means the classifier is not keeping up.
  select 'classification_stalled',
         case when n > 0 then 'critical' else 'ok' end,
         n::text,
         'signals ingested >6h ago with no quality_label; unclassified rows can never promote'
  from (
    select count(*) as n
    from public.signals
    where quality_label is null
      and created_at < now() - interval '6 hours'
      and created_at > now() - interval '7 days'
  ) cs;
$function$;

comment on function public.hv_pipeline_alerts() is
  'Outcome-based pipeline assertions. Each row asserts a fact that must hold if a stage genuinely '
  'worked, rather than trusting the stage to report its own health -- every 2026-07-30 staleness '
  'incident was invisible to exit-code monitoring. severity <> ''ok'' is a breach. '
  'edge_http_errors (added 2026-08-13) covers cron-invoked edge functions, whose failures pg_cron '
  'reports as successes.';

-- Operator-plane only: SECURITY DEFINER over internal pipeline state. Unchanged.
revoke execute on function public.hv_pipeline_alerts() from public, anon, authenticated;
grant  execute on function public.hv_pipeline_alerts() to service_role;
