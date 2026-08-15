-- Make an unconfigured alert channel a first-class alert instead of a silent skip.
--
-- THE DEFECT
--
-- `hv_alert_tick()` emails through Resend only when the vault holds BOTH
-- `resend_api_key` and `alert_email_to`. When either is missing it takes an
-- early return:
--
--   return jsonb_build_object(..., 'delivery',
--     'skipped: vault needs resend_api_key and alert_email_to
--      (detection and history are unaffected)');
--
-- That return value goes to pg_cron job 55, which discards it. So the alerting
-- system reports its own deafness into a void.
--
-- MEASURED AGAINST PRODUCTION 2026-08-14, not inferred:
--
--   vault.decrypted_secrets 'resend_api_key' ......... 0 rows
--   vault.decrypted_secrets 'alert_email_to' ......... 0 rows
--   hv_alert_log open (resolved_at is null) .......... 3
--   hv_alert_log ever notified (notified_at not null) . 0
--
-- Zero. Not one alert has been delivered in the entire history of the table,
-- and the three currently open ones are not minor:
--
--   classification_stalled  critical  first seen 2026-08-13 20:47  value 122
--   edge_http_errors        critical  first seen 2026-08-13 20:47  value 3
--   extraction_rescan       warning   first seen 2026-08-12 00:47  value 40
--
-- `classification_stalled` is the assertion that catches exactly the outage
-- diagnosed on 2026-08-14 -- "signals ingested >6h ago with no quality_label".
-- It fired correctly, a day early, and reached nobody.
--
-- INTELLIGENCE_ARCHITECTURE_SPEC.md §9 Guardrail 5 requires that "observable"
-- mean actively alerting, "not a dashboard someone has to remember to check".
-- The detection half satisfies that. The delivery half is unconfigured, and
-- nothing anywhere reports that fact.
--
-- WHY THIS EXTENDS hv_pipeline_alerts RATHER THAN FIXING hv_alert_tick
--
-- The obvious repair is to make `hv_alert_tick` raise or otherwise escalate on
-- the unconfigured path. That would be clobbered.
--
-- `20260802080000_harden_eval_labels_and_alert_delivery.sql` is committed,
-- merged, and NOT applied to production (verified: absent from
-- schema_migrations; `hv_alert_log` has no `delivery_status` column). It is
-- classified `separately_authorized` in the pending-decisions ledger, so it is
-- deliberately gated, not forgotten. It redefines `hv_alert_tick` -- and
-- carries the SAME silent-skip early return at its own line 180.
--
-- So any edit to `hv_alert_tick` here would be silently reverted the moment
-- that gated migration is applied, because it is an EARLIER version number that
-- will be applied LATER. `hv_pipeline_alerts()` is not redefined by it
-- (checked, not assumed: the only functions it replaces are
-- `api.admin_add_signal_to_eval_set` and `public.hv_alert_tick`), so extending
-- the board is durable across that release where patching the tick is not.
--
-- It is also the better fit: this is an assertion about pipeline health, and
-- asserting is what this function is for.
--
-- SELF-REFERENCE IS INTENTIONAL AND BOUNDED
--
-- `hv_alert_tick` calls `hv_pipeline_alerts()` and then upserts the non-ok rows
-- into `hv_alert_log`; this new assertion reads `hv_alert_log`. That is not a
-- loop. The read happens inside the `cur` CTE under the statement snapshot, so
-- it observes the table as of statement start and cannot see its own insert.
--
-- The assertion counts open alerts rather than un-notified ones on purpose.
-- `resolved_at` means the same thing before and after 20260802080000, whereas
-- that migration reworks delivery bookkeeping (`notified_at` gains company in
-- `delivery_status`, `delivery_attempts`, `last_delivery_error`). Keying on the
-- stable column keeps this assertion correct across that release.
--
-- Once both secrets exist the assertion returns 'ok' and `hv_alert_tick`
-- resolves the logged row on its next pass. It is self-clearing; no follow-up
-- migration is needed to retire it.
--
-- WHAT THIS DOES NOT DO
--
-- It does not deliver anything. An alert saying "alerts cannot be delivered"
-- still cannot be emailed. It makes the condition visible wherever the board is
-- read and gives it a dated row in `hv_alert_log`, which is strictly better than
-- a discarded string, but the actual repair is two vault secrets -- an owner
-- action under CLAUDE.md Rule 3b, deliberately not taken here.
--
-- A hard failure signal is available if wanted: schedule a job that raises when
-- this assertion is critical, so `cron.job_run_details.status` goes 'failed'.
-- That needs a pg_cron change, which is owner state with no version history
-- (AGENT_OPERATING_FACTS.md §10), so it is left as a decision rather than done.
--
-- The whole function is restated because `create or replace function` has no
-- partial form. Every pre-existing assertion below is reproduced verbatim from
-- the live definition read back on 2026-08-14; the only change is the final
-- `alert_delivery_unconfigured` block.

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
  -- Asserts that ingested signals are actually getting labelled.
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
  ) cs

  union all
  -- Asserts that the alerting channel can actually reach a human. Every other
  -- assertion above is worthless if this one is failing: hv_alert_tick records
  -- breaches either way, but sends nothing without both vault secrets, and it
  -- reports that only through a return value pg_cron discards.
  --
  -- Critical only when something is actually waiting to be sent. An unconfigured
  -- channel with a clean board is a warning, not an emergency -- keeping the
  -- board honest matters more here than shouting, because a permanently critical
  -- row is one people learn to scroll past.
  select 'alert_delivery_unconfigured',
         case when not configured and n_open > 0 then 'critical'
              when not configured then 'warning'
              else 'ok' end,
         case when configured then 'configured'
              else n_open::text || ' open alert(s) with no delivery channel' end,
         'hv_alert_tick emails via Resend only when vault holds resend_api_key and alert_email_to; without both it logs breaches and silently sends nothing'
  from (
    select (exists (select 1 from vault.decrypted_secrets where name = 'resend_api_key')
        and exists (select 1 from vault.decrypted_secrets where name = 'alert_email_to')) as configured,
           (select count(*) from public.hv_alert_log where resolved_at is null) as n_open
  ) ad;
$function$;
