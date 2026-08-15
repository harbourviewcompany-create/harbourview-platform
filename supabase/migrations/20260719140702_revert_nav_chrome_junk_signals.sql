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
-- version 20260719140702.
--
-- Rewriting this file cannot affect production: 20260719140702 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Rollback: update public.signals set reviewed = true, action = '' where action = 'reverted_navchrome_junk_2026_07_19';

update public.signals
set reviewed = false,
    action = 'reverted_navchrome_junk_2026_07_19'
where reviewed = true
  and (action = '' or action is null)
  and (
    headline ilike '%&nbsp%'
    or headline ilike '%Follow Us%'
    or headline ilike '%Posted by :%'
    or headline ilike 'Consultar %'
    or headline ilike 'Acceso %'
    or headline ilike 'Texte %'
    or headline ~ '^\['
    or (length(headline) - length(replace(headline,'|',''))) >= 2
  );
