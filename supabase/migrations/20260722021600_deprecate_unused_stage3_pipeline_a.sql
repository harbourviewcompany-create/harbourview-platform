-- Per Tyler's decision (2026-07-22): Pipeline B (hv_classify_corpus_* /
-- hv_promote_signals / hv_dedup_assign) is canonical -- it's the one actually proven
-- in production and now has continuous automation enabled. Pipeline A
-- (signal_classifications / api.promote_classified_signals) is not part of the live
-- promotion path and is now formally deprecated. Marker only -- no drop, no data
-- touched, fully reversible. See docs/control/STAGE3_PROMOTION.md for full context.
--
-- Revised 2026-07-22 (CodeRabbit review on PR #1126): the original wording said
-- Pipeline A was "never wired to anything," which is inaccurate and could read as
-- "safe to assume this table is empty/inert." signal_classifications holds 929 real
-- rows from a 2026-07-19/20 test window, and hv-classify's `mode=pool` is still real,
-- callable code that would write more rows here if invoked -- "deprecated" means
-- "not on the production promotion path," not "has no producer or no data."
comment on table public.signal_classifications is
  'DEPRECATED 2026-07-22: not wired to live promotion or cron automation (Pipeline A). '
  'Still holds 929 real staged rows from a 2026-07-19/20 test window, and hv-classify '
  'mode=pool could still write here if invoked manually -- do not assume this table is '
  'empty or inert. Pipeline B (hv_classify_corpus_* writing directly to '
  'signals.quality_label + hv_promote_signals) is the canonical production promotion '
  'path. See docs/control/STAGE3_PROMOTION.md.';

comment on function api.promote_classified_signals(numeric, boolean, integer) is
  'DEPRECATED 2026-07-22: not part of the live promotion path, superseded by '
  'public.hv_promote_signals (Pipeline B). No evidence this was ever invoked with '
  'p_dry_run=false. Do not wire to production without re-verifying against Pipeline B '
  'first. See docs/control/STAGE3_PROMOTION.md.';
