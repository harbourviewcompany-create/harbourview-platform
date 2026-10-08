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
-- Replay guard added 2026-08-05. In production both jobs already existed when
-- this migration ran, so resolving them with `into strict` was correct and its
-- assert-exactly-one behaviour is deliberate (see the note above). Zero-state
-- replay differs: nothing schedules hv-quality-pipeline until
-- 20260730030414_ship_hv_classify_v1_at_current_recall_enable_quality_pipeline.sql,
-- eight days later in replay order, so `into strict` raises no_data_found here
-- and the whole replay stops.
--
-- The guard only decides whether to run, never what to do. When both jobs are
-- present -- production, and any environment past 20260730030414 -- the
-- original strict resolution and activation run unchanged. When they are
-- absent the migration is a documented no-op, and 20260730030414 goes on to
-- schedule them.
do $$
declare
  v_pipeline_id bigint;
  v_promote_id bigint;
begin
  if to_regclass('cron.job') is null then
    raise notice 'pg_cron not present; skipping hv quality cron activation';
    return;
  end if;

  if not exists (select 1 from cron.job where jobname = 'hv-quality-pipeline')
     or not exists (select 1 from cron.job where jobname = 'hv-quality-promote')
  then
    raise notice 'hv quality cron jobs not scheduled yet; skipping activation';
    return;
  end if;

  select jobid into strict v_pipeline_id from cron.job where jobname = 'hv-quality-pipeline';
  select jobid into strict v_promote_id from cron.job where jobname = 'hv-quality-promote';
  perform cron.alter_job(v_pipeline_id, active => true);
  perform cron.alter_job(v_promote_id, active => true);
end $$;
