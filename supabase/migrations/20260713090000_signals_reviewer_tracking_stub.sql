-- Applied directly to production via Supabase MCP (Jul 13 2026 session).
-- Supports the new /admin/signals/queue engine review queue (see the app
-- code in the same commit): tracks who reviewed a SOURCE_ENGINE signal and
-- when, matching the accountability pattern already used in
-- regulatory_signals.signals (reviewed_by/last_reviewed_at). signals.action
-- (pre-existing, previously entirely unused) now stores the review
-- decision as plain text: 'approved' | 'rejected' | null.
ALTER TABLE public.signals
  ADD COLUMN IF NOT EXISTS reviewed_by TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.signals.action IS
  'Review decision for SOURCE_ENGINE signals: approved | rejected | null (not yet reviewed). Set via the engine review queue at /admin/signals/queue.';
COMMENT ON COLUMN public.signals.reviewed_by IS 'Admin user id who last reviewed this signal.';
COMMENT ON COLUMN public.signals.reviewed_at IS 'When this signal was last reviewed (approved or rejected).';
