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
-- version 20260722094616.
--
-- Rewriting this file cannot affect production: 20260722094616 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Closes the gap the automated conflict checker caught: LB and TT got a prose-only fix earlier
-- (public_summary/regulatory_outlook corrected) but program_status itself was never updated,
-- so it still read as more operationally mature than either country actually is.

UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Medical and Industrial Legal (Since 2020); Authority Only Constituted 2025, Not Yet Operational',
  change_notes = change_notes || '[{"title": "Follow-up correction: program_status still read as fully operational after the public_summary fix; updated to reflect the Authority was only constituted in 2025 and had enabled no legal harvest as of early 2026", "market": "Lebanon", "timeAgo": "20 July 2026", "direction": "down", "sourceRef": "Herb; CMS Expert Guides; The Beiruter", "reviewState": "reviewed"}]'::jsonb,
  updated_at = now()
WHERE country_iso2 = 'LB';

UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Decriminalized (30g, 2019); Cannabis Control Act Passed But Not Proclaimed',
  change_notes = change_notes || '[{"title": "Follow-up correction: program_status implied the Cannabis Licensing Authority was operating; the 2022 Act creating it has not been proclaimed into force, so it does not yet exist as an operating body", "market": "Trinidad and Tobago", "timeAgo": "20 July 2026", "direction": "down", "sourceRef": "Trinidad and Tobago Parliament (Act record); Jamaica Experiences regional guide", "reviewState": "reviewed"}]'::jsonb,
  updated_at = now()
WHERE country_iso2 = 'TT';
