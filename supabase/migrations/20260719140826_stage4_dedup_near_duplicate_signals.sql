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
-- version 20260719140826.
--
-- Rewriting this file cannot affect production: 20260719140826 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Rollback: update public.signals set reviewed = true, action = 'Promoted by classifier (Stage 3)'
--   where action = 'reverted_stage4_dedup_2026_07_19';
-- Note: this sets a generic action label on rollback since original actions varied
-- (mostly 'Promoted by classifier (Stage 3)'); check id list in EVIDENCE_LOG if exact
-- per-row original action is needed.

with grp as (
  select id, headline, country, date_trunc('day', created_at) as day
  from public.signals
  where reviewed = true
),
dupes as (
  select a.id as dup_id
  from grp a
  join grp b on a.country is not distinct from b.country
    and a.day = b.day
    and a.id <> b.id
    and b.id < a.id
    and similarity(left(a.headline,80), left(b.headline,80)) > 0.30
  group by a.id
)
update public.signals
set reviewed = false,
    action = 'reverted_stage4_dedup_2026_07_19'
where id in (select dup_id from dupes);
