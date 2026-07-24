-- Enables continuous automation for the Stage 3 promotion pipeline (Pipeline B in
-- docs/control/STAGE3_PROMOTION.md), per Tyler's explicit go-ahead. Both jobs were
-- built and wired (see 20260722020100_hv_quality_promote_explicit_confidence_floor.sql
-- for the just-fixed 0.65 confidence floor they now run under) but left inactive
-- pending this decision. This migration only flips their `active` flag -- job bodies
-- are unchanged.
--
-- hv-quality-pipeline (*/2 min): translate/classify/embed/entity dispatch+harvest.
-- hv-quality-promote  (*/10 min): dedup + promote (hv_promote_signals(0.65)).
--
-- Revised 2026-07-22 (CodeRabbit review on PR #1126): the original version of this
-- file hardcoded jobid 47/48, discovered live at write time. Job IDs are
-- database-local and not guaranteed stable across a recreated/differently
-- provisioned database, so a raw `cron.alter_job(47, ...)` could fail or silently
-- enable the wrong job elsewhere. Rewritten to resolve by jobname via
-- `select ... into strict`, which itself raises if zero or more than one row
-- matches -- the "assert exactly one match" behavior comes for free. No change to
-- what actually happens on this project: jobid 47/48 already are
-- hv-quality-pipeline/hv-quality-promote, verified before and after.
--
-- Rollback (by name, not ID):
--   do $$
--   declare v_id bigint;
--   begin
--     select jobid into strict v_id from cron.job where jobname = 'hv-quality-pipeline';
--     perform cron.alter_job(v_id, active => false);
--     select jobid into strict v_id from cron.job where jobname = 'hv-quality-promote';
--     perform cron.alter_job(v_id, active => false);
--   end $$;
do $$
declare
  v_pipeline_id bigint;
  v_promote_id bigint;
begin
  select jobid into strict v_pipeline_id from cron.job where jobname = 'hv-quality-pipeline';
  select jobid into strict v_promote_id from cron.job where jobname = 'hv-quality-promote';
  perform cron.alter_job(v_pipeline_id, active => true);
  perform cron.alter_job(v_promote_id, active => true);
end $$;
