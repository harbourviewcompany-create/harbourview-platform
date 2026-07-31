-- Outcome-based pipeline alerting: assert on results, not job exit codes.
--
-- WHY
-- ---
-- Every staleness incident found during the 2026-07-30 review was invisible to
-- the existing monitoring because the jobs themselves reported success:
--
--   * hv-classify returned 401 for eight days; the dispatch cron logged "ok"
--     because the HTTP call was made, not because it was accepted.
--   * The digest job "succeeds" when it skips, so a dark digest looked healthy.
--   * hv_dedup_assign timed out at 120s; the cron row recorded the attempt.
--
-- So each check below asserts a fact about the *output* of the pipeline that
-- must hold if the stage genuinely worked. A stage cannot report health by
-- claiming it ran.
--
-- CONSOLIDATION NOTE
-- ------------------
-- Applied to production as two migrations: 20260730222127 established the
-- checks, 20260730222221 replaced two of them that could not do their job:
--
--   * `extraction_rescan` originally measured a lifetime dispatch:signal ratio
--     (56.4x at the time). Lifetime history never shrinks, so once tripped the
--     check could never clear even after the rescan bug was fixed. Replaced
--     with a structural assertion: a signal already dispatched must not still
--     be eligible for dispatch. That reads 0 when correct and is self-clearing.
--
--   * `classifier_gate` originally checked the gate row for the newest signal's
--     classifier_version, which is not the same as checking every version in
--     use — a stale version on older rows would silently fail to promote while
--     the check read green. Replaced with an assertion over all distinct
--     classifier_version values present on signals.
--
-- This file carries the corrected definitions only; reproducing the superseded
-- intermediate state on a fresh database has no value.

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
  ) g;
$function$;

comment on function public.hv_pipeline_alerts() is
  'Outcome-based pipeline assertions. Each row asserts a fact that must hold if a stage genuinely '
  'worked, rather than trusting the stage to report its own health -- every 2026-07-30 staleness '
  'incident was invisible to exit-code monitoring. severity <> ''ok'' is a breach.';

-- Operator-plane only: SECURITY DEFINER over internal pipeline state.
revoke execute on function public.hv_pipeline_alerts() from public, anon, authenticated;
grant  execute on function public.hv_pipeline_alerts() to service_role;
