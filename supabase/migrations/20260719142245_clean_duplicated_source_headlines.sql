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
-- version 20260719142245.
--
-- Rewriting this file cannot affect production: 20260719142245 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Rollback: original raw headline text is preserved in the `summary` column for every
-- affected row (summary held the same duplicated raw scrape text), so a prior value
-- can be recovered from summary if needed. No backup column added since this is a
-- narrow, easily-verified string transform on 14 rows.

update public.signals
set headline = trim(split_part(headline, ' - ', 1))
where reviewed = true
  and headline ilike '%&nbsp%';
