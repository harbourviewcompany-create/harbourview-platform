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
-- version 20260718020048.
--
-- Rewriting this file cannot affect production: 20260718020048 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


-- Stage 1 of docs/INTELLIGENCE_ARCHITECTURE_SPEC.md: unified source registry.
-- Decision (owner-approved): EXTEND the existing live source_registry (1,471 rows,
-- already has language/tier/country/cadence) in place rather than create a new
-- intel_sources table — avoids spawning a third parallel estate, honoring the
-- spec's "one registry" principle. This migration adds ONLY the missing dimension:
-- content_type[] (the routing dimension). No backfill, no behavior change here.
-- Verified safe: source-engine-fetch crawls only is_active=true AND
-- relevance_status='active' rows, so this nullable column changes nothing until
-- populated. Additive + reversible. Rollback:
--   alter table public.source_registry drop column content_type;

alter table public.source_registry
  add column if not exists content_type text[];

comment on column public.source_registry.content_type is
  'Stage 1 routing dimension: one or more of regulatory|market|story|equipment|research. Drives Signals/Digest/Market routing (spec 4.3). NULL = not yet classified.';
