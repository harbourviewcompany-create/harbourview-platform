-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260714232829.
--
-- Rewriting this file cannot affect production: 20260714232829 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Supports the new SOURCE_ENGINE review queue: tracks who reviewed a
-- signal and when, matching the accountability pattern already used in
-- regulatory_signals.signals (reviewed_by/last_reviewed_at).
ALTER TABLE public.signals
  ADD COLUMN IF NOT EXISTS reviewed_by TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.signals.action IS
  'Review decision for SOURCE_ENGINE signals: approved | rejected | null (not yet reviewed). Set via the engine review queue at /admin/signals/queue.';
COMMENT ON COLUMN public.signals.reviewed_by IS 'Admin user id who last reviewed this signal.';
COMMENT ON COLUMN public.signals.reviewed_at IS 'When this signal was last reviewed (approved or rejected).';
