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
-- version 20260704093341.
--
-- Rewriting this file cannot affect production: 20260704093341 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Wire the admin Source Registry to the REAL 1134-row crawler source table
-- (source_registry) instead of the disconnected 12-row ia_sources seed table.
-- Shaped to exactly match what lib/intelligence-automation/db.ts::rowToSource()
-- already expects, so the only app change needed is repointing one path string.

create or replace view ia_sources_live as
select
  id::text as id,
  source_name as name,
  source_type as category,
  array_remove(array[country, region], null) as markets,
  case
    when network_status = 'online' and coalesce(consecutive_failures,0) = 0 then 'high'
    when network_status in ('online','degraded') and coalesce(consecutive_failures,0) <= 2 then 'medium'
    when coalesce(consecutive_failures,0) > 2 then 'low'
    else 'unverified'
  end as reliability,
  last_checked_at as last_checked,
  next_crawl_at as next_check,
  (select count(*)::int from ia_signals s where s.source_name = source_registry.source_name) as signal_yield,
  case
    when not is_active then 'paused'
    when relevance_status = 'blocked' then 'deprecated'
    when relevance_status = 'needs_review' or network_status = 'degraded' then 'needs_review'
    else 'active'
  end as status,
  notes
from source_registry;

grant select on ia_sources_live to service_role, authenticated, anon;
