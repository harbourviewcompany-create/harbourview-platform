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
-- version 20260719231817.
--
-- Rewriting this file cannot affect production: 20260719231817 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Light-touch update, unlike the Namibia correction: Kenya's cc_jurisdiction_briefings core
-- claims (prohibited status; export-licensing activity under discussion) were not disproven --
-- only independently unverifiable by me after 4 search rounds. Not rewriting content I can't
-- confirm is wrong. Adding the one fact I did fully verify (the 15 Jul 2026 court ruling, which
-- this entry doesn't yet mention) as a change note, and refreshing last_reviewed_date.

UPDATE public.cc_jurisdiction_briefings
SET
  change_notes = change_notes || '[
    {"title": "High Court dismisses Rastafari Society of Kenya religious-exemption petition; petitioners file notice of appeal to Court of Appeal", "market": "Kenya", "timeAgo": "15 July 2026", "direction": "neutral", "sourceRef": "The Star (Kenya) -- the-star.co.ke/news/2026-07-15-court-upholds-ban-on-bhang-urges-future-debate", "reviewState": "reviewed"}
  ]'::jsonb,
  last_reviewed_date = '2026-07-19',
  updated_at = now()
WHERE country_iso2 = 'KE';
