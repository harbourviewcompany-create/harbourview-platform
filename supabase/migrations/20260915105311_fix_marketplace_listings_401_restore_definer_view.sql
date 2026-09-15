-- Reconstructed from production by auto-reconcile-migration-drift.mjs.
-- This version was applied directly against production (outside
-- apply_migration) and had no corresponding repository file, which is
-- exactly what "Compare repository and live migration ledgers" checks for.
-- Statements below are verbatim from supabase_migrations.schema_migrations
-- for version 20260915105311. Adding this file cannot affect production: the
-- version is already applied, so a future `supabase db push` skips it.
-- Auto-generated -- review before merging, same as any other PR.

-- api.marketplace_public_listings_v1 is a pure column-projection with no WHERE
-- clause of its own; all the "what's actually public" filtering lives in
-- public.marketplace_public_listings_v1 (status=approved AND public_visibility
-- AND not archived). Under security_invoker=true, Postgres checks the anon/
-- authenticated caller's own grants against that underlying object -- which
-- have never existed (only postgres/service_role) -- producing 42501 on every
-- request. Reverting to definer mode (owner=postgres) matches how this exact
-- view family was resolved before in this repo (restore_public_dto_definer_views.sql)
-- and is safe here specifically because the object it selects from already
-- does its own narrow, correct filtering.
alter view api.marketplace_public_listings_v1 set (security_invoker = false);
