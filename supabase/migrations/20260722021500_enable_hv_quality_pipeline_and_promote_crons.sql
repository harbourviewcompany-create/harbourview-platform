-- Enables continuous automation for the Stage 3 promotion pipeline (Pipeline B in
-- docs/control/STAGE3_PROMOTION.md), per Tyler's explicit go-ahead. Both jobs were
-- built and wired (see 20260722020100_hv_quality_promote_explicit_confidence_floor.sql
-- for the just-fixed 0.65 confidence floor they now run under) but left inactive
-- pending this decision. This migration only flips their `active` flag -- job bodies
-- are unchanged.
--
-- hv-quality-pipeline (jobid 47, */2 min): translate/classify/embed/entity dispatch+harvest.
-- hv-quality-promote  (jobid 48, */10 min): dedup + promote (hv_promote_signals(0.65)).
--
-- Rollback: select cron.alter_job(47, active => false); select cron.alter_job(48, active => false);
select cron.alter_job(47, active => true);
select cron.alter_job(48, active => true);
