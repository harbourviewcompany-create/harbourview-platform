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
-- version 20260715085610.
--
-- Rewriting this file cannot affect production: 20260715085610 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Zero-state replay: CREATE OR REPLACE VIEW can add trailing columns but cannot
-- drop or reorder existing ones, and on a from-scratch replay the api.signals
-- view built by earlier history has a different column set than the one below,
-- so the replace fails with "cannot drop columns from view". Against production
-- the replace succeeded because the live view already matched. Drop first so the
-- statement is correct from either starting state; the definition that follows
-- is unchanged. Production is unaffected: 20260715085610 is already recorded in
-- schema_migrations, so `supabase db push` skips it. Supabase's native
-- preview-branch integration is what replays by filename order here -- it does
-- not run scripts/prepare-production-faithful-migration-replay.mjs, whose
-- REPLAY_ZERO_STATE_SKIPS list already names this file.
drop view if exists api.signals;
create view api.signals
  with (security_invoker = on)
  as
select
  id,
  date,
  cat,
  pri,
  score,
  headline,
  summary,
  source,
  url,
  verification,
  tier,
  lang,
  company,
  country,
  in_network,
  lane_r,
  lane_e,
  lane_t,
  top_lane,
  query_pack,
  commercial_impact,
  reviewed,
  action,
  created_at,
  embedding_1024,
  embedding_model,
  embedded_at,
  reviewed_by,
  reviewed_at
from public.signals;
