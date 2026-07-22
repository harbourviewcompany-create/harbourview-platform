-- Per Tyler's decision (2026-07-22): Pipeline B (hv_classify_corpus_* /
-- hv_promote_signals / hv_dedup_assign) is canonical -- it's the one actually proven
-- in production and now has continuous automation enabled. Pipeline A
-- (signal_classifications / api.promote_classified_signals) was never wired to
-- anything and is now formally deprecated. Marker only -- no drop, no data touched,
-- fully reversible. See docs/control/STAGE3_PROMOTION.md for full context.
comment on table public.signal_classifications is
  'DEPRECATED 2026-07-22: unused staging table for Pipeline A (api.promote_classified_signals), '
  'never wired to production. Pipeline B (hv_classify_corpus_* writing directly to '
  'signals.quality_label + hv_promote_signals) is canonical. See docs/control/STAGE3_PROMOTION.md.';

comment on function api.promote_classified_signals(numeric, boolean, integer) is
  'DEPRECATED 2026-07-22: never wired to production, superseded by public.hv_promote_signals '
  '(Pipeline B). Do not call. See docs/control/STAGE3_PROMOTION.md.';
