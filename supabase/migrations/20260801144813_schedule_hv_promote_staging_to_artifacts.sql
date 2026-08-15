-- Schedule the staging -> artifacts promoter.
--
-- hv_promote_staging_to_artifacts has never been scheduled: no cron.job command
-- references it, no SQL function calls it, and no repo code invokes it. Staging
-- rows accumulated until someone ran it by hand (60 promoted 2026-08-01 12:10).
--
-- Verified before scheduling: a manual run drains cleanly, and staging currently
-- sits at 0 pending / 1,059 promoted / 32 duplicate_review.
--
-- Batch of 50 hourly at :20, off the shared :00 and away from hv-quality-promote
-- (:10/:40) and hv-pipeline-alerts (:47) to spread Nano's disk I/O.
--
-- SCOPE NOTE: this feeds `hv_artifacts`, NOT `public.signals`. The live Intel
-- feed reads `signals` (reviewed=true), so this does not by itself make the feed
-- live -- see the trg_promote_snapshot gap recorded in EVIDENCE_LOG.md.
--
-- Approved by Tyler 2026-08-01 against an explicit four-item scope.

select cron.schedule(
  'hv-promote-staging',
  '20 * * * *',
  'select public.hv_promote_staging_to_artifacts(50);'
)
where not exists (select 1 from cron.job where jobname = 'hv-promote-staging');