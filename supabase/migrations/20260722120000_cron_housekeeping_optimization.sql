-- Cron/DB housekeeping optimization pass, evidence-based via pg_stat_statements.
--
-- Findings that motivated this migration:
--  - cron.job_run_details had NO retention (never autovacuumed, 19,649 rows and
--    growing under 18 active jobs); an insert into it was observed taking up to
--    11s (vs a 17ms mean), consistent with periodic contention.
--  - net._http_response (pg_net async response bodies) has no built-in TTL either;
--    91 rows already totalled 2.7MB, and a plain by-id SELECT from it averaged
--    ~2s (max 6.4s) in pg_stat_statements — both are documented pg_net/pg_cron
--    footguns if left unpruned.
--  - 'schema-drift-monitor' ran every 15 minutes, 24/7 (96x/day) via net.http_post
--    to an edge function — excessive cadence for a drift *monitor* with no
--    pipeline dependents; reduced to hourly, and moved off :00/:15/:30/:45 to
--    stop colliding with several other jobs that fire on those exact minutes.
--
-- NOT changed here (flagged for the app/data owners instead, see chat/handoff):
--  - The minute-offsets of the business-pipeline jobs (extract/counterparty/
--    country-intel/etc.) collide 2-3 ways every half hour, but I don't know
--    their dependency graph — moving them blind risks breaking an implicit
--    pipeline order.
--  - A high-call-volume WAL-decoding query (172k calls) of unclear ownership.
--  - A pg_sleep-while-holding-connection polling pattern (19 calls, ~5.4s mean)
--    whose owning function I could not identify from cron.job commands alone.
--  - Two one-off multi-second-to-minute-scale queries (promote_all_extracted_
--    snapshots ~28-56s; a manual backfill count ~51s) — not recurring, low
--    priority.

CREATE OR REPLACE FUNCTION public.prune_net_http_response()
 RETURNS void LANGUAGE sql AS $function$
  delete from net._http_response where created < now() - interval '24 hours';
$function$;

CREATE OR REPLACE FUNCTION public.prune_cron_job_run_details()
 RETURNS void LANGUAGE sql AS $function$
  delete from cron.job_run_details where end_time < now() - interval '7 days';
$function$;

-- cron.schedule/cron.alter_job are environment state, not idempotent DDL — not
-- re-run here. Live jobs created/changed by this pass:
--   cron.schedule('prune-net-http-response', '17 3 * * *', 'select public.prune_net_http_response()');
--   cron.schedule('prune-cron-job-run-details', '23 3 * * *', 'select public.prune_cron_job_run_details()');
--   cron.alter_job(<schema-drift-monitor jobid>, schedule := '12 * * * *');  -- was '*/15 * * * *'
