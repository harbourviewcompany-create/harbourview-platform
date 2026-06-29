-- regulatory_signals.signals was missing columns that runWatch.ts and admin.ts write.
-- Without them every createDraftSignal INSERT throws 400, the error propagates out
-- of the source loop, persistRun is never called, and the cron produces nothing.

ALTER TABLE regulatory_signals.signals
  ADD COLUMN IF NOT EXISTS source_url          text,
  ADD COLUMN IF NOT EXISTS source_published_at timestamptz,
  ADD COLUMN IF NOT EXISTS private_summary     text,
  ADD COLUMN IF NOT EXISTS private_notes       text,
  ADD COLUMN IF NOT EXISTS reviewed_by         uuid,
  ADD COLUMN IF NOT EXISTS approved_by         uuid,
  ADD COLUMN IF NOT EXISTS published_by        uuid;

-- regulatory_signals.sources: add backoff counter so the watcher can skip
-- repeatedly-failing sources without hammering them every cron tick.
ALTER TABLE regulatory_signals.sources
  ADD COLUMN IF NOT EXISTS consecutive_failures integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN regulatory_signals.signals.source_url
  IS 'URL of the specific document that triggered this signal (from RSS/API item)';
COMMENT ON COLUMN regulatory_signals.signals.source_published_at
  IS 'When the triggering source document was published';
COMMENT ON COLUMN regulatory_signals.signals.private_summary
  IS 'Internal-only summary visible to admin/operator reviewers before publication';
COMMENT ON COLUMN regulatory_signals.signals.private_notes
  IS 'Internal review notes — not published to public feed';
COMMENT ON COLUMN regulatory_signals.signals.reviewed_by
  IS 'User who last reviewed this signal';
COMMENT ON COLUMN regulatory_signals.signals.approved_by
  IS 'User who approved this signal for publication';
COMMENT ON COLUMN regulatory_signals.signals.published_by
  IS 'User who published this signal to the public feed';
COMMENT ON COLUMN regulatory_signals.sources.consecutive_failures
  IS 'Count of consecutive fetch failures; used for exponential back-off in the watcher';
