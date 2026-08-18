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
-- version 20260704171645.
--
-- Rewriting this file cannot affect production: 20260704171645 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


-- The *_owner_all policies on genetics_service_providers, genetics_collaboration_projects,
-- and genetics_evidence_items (grant_read variant) each contain an
-- `EXISTS (SELECT 1 FROM genetics_profiles ...)` subquery. Postgres requires
-- table-level SELECT on every relation referenced by ANY applicable policy
-- in order to plan the query at all -- even when that specific policy's
-- predicate would evaluate false for the row. anon had zero grant on
-- genetics_profiles, so anon's queries against those 3 tables hard-failed
-- with "permission denied for table genetics_profiles" rather than just
-- returning an RLS-filtered empty/partial set -- this masked the previous
-- migration's new public-read policies entirely (confirmed via `set role
-- anon` test query).
--
-- Safe to grant: genetics_profiles keeps its own owner-scoped RLS
-- (genetics_profiles_owner_all: owner_user_id = auth.uid() OR
-- is_genetics_admin_or_reviewer()), so anon still sees zero profile rows
-- directly -- this grant only unblocks query planning for the other
-- tables' EXISTS subqueries, it does not expose profile data.
GRANT SELECT ON public.genetics_profiles TO anon;
GRANT SELECT ON api.genetics_profiles TO anon;

NOTIFY pgrst, 'reload schema';
