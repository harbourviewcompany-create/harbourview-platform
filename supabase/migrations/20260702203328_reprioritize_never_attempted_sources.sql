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
-- version 20260702203328.
--
-- Rewriting this file cannot affect production: 20260702203328 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Restores NULLS-FIRST top-priority queue position for sources that have
-- literally never been attempted (zero source_snapshots rows, online status,
-- zero consecutive_failures) but were incorrectly holding a stale non-null
-- next_crawl_at from a May 16 bulk-import batch. Under the hardcoded
-- cadence_hours=24 bug (see task-queue.ts fix, same date), these 144 rows
-- were perpetually outcompeted by the 1000+ already-successful sources that
-- kept cycling back to "due" every 24h regardless of their real cadence.
-- Scope deliberately excludes sources with real recorded failures (403/404/
-- parse errors etc.) — those reflect genuine problems, not queue starvation,
-- and should not be silently re-prioritized without separate investigation.

update public.source_registry sr
set next_crawl_at = null
where sr.adapter in ('html_snapshot', 'rss')
  and sr.network_status = 'online'
  and sr.consecutive_failures = 0
  and not exists (
    select 1 from public.source_snapshots ss where ss.source_id = sr.id
  );
