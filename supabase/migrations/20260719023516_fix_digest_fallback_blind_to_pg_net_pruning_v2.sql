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
-- version 20260719023516.
--
-- Rewriting this file cannot affect production: 20260719023516 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


alter table public._digest_jobs add column if not exists status_code int;
alter table public._editorial_digest_jobs add column if not exists status_code int;

comment on column public._digest_jobs.status_code is
  'HTTP status of the collected LLM response, persisted at collection time so tier-degradation checks survive net._http_response pruning. 0 = no response ever arrived (timed out / lost).';
comment on column public._editorial_digest_jobs.status_code is
  'HTTP status of the collected LLM response, persisted at collection time so tier-degradation checks survive net._http_response pruning. 0 = no response ever arrived (timed out / lost).';

select 1 as idempotency_confirmed;
