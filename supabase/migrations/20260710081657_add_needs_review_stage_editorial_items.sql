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
-- version 20260710081657.
--
-- Rewriting this file cannot affect production: 20260710081657 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


ALTER TABLE editorial_items DROP CONSTRAINT IF EXISTS editorial_items_stage_check;
ALTER TABLE editorial_items ADD CONSTRAINT editorial_items_stage_check
  CHECK (stage IN ('qualified','rejected','archived','needs_review'));

-- needs_review items are raw/unprocessed — not shown in the public digest
-- feed (public read policy already scopes to stage='qualified' only), but
-- need their own index for an eventual review queue.
CREATE INDEX IF NOT EXISTS idx_editorial_items_needs_review ON editorial_items (created_at DESC) WHERE stage = 'needs_review';
