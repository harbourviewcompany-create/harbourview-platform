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
-- version 20260719140626.
--
-- Rewriting this file cannot affect production: 20260719140626 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Rollback: update public.signals set reviewed = true, action = 'approved' where action = 'reverted_bulk_junk_2026_07_19' and id not like 'sig-%';
--          update public.signals set reviewed = true where id like 'sig-%' and action = 'reverted_bulk_junk_2026_07_19';
-- (original action values were 'approved' for the bulk-fragment batch, '' for the sig-* fixture rows;
--  this migration only flips reviewed and stamps action for traceability, no rows deleted)

update public.signals
set reviewed = false,
    action = 'reverted_bulk_junk_2026_07_19'
where reviewed = true
  and (
    (action = 'approved' and created_at = '2026-07-15 06:50:00.133216+00')
    or id like 'sig-%'
  );
