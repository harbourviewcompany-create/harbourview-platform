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
-- version 20260719083306.
--
-- Rewriting this file cannot affect production: 20260719083306 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Repository-only addendum (not part of the verbatim production statements
-- above): education_modules_public_select has no CREATE POLICY anywhere in
-- the tracked migration history -- it was evidently created directly against
-- production outside a migration (dashboard, or an untracked psql session).
-- A from-scratch replay reaches this ALTER with the policy never having
-- existed, and fails with "policy ... does not exist" (42704).
--
-- The FOR/TO scope below is not recoverable from history, but is not a
-- guess: 20260831012629_consolidate_redundant_rls_policies_batch1.sql
-- (six weeks later) drops this exact policy and folds it into
-- education_modules_select with `for select to anon, authenticated` and a
-- USING clause whose first disjunct is byte-identical to the one this file
-- sets below -- confirming both the role scope and that this policy's
-- lifetime ends at that consolidation regardless. See
-- docs/control/RECONSTRUCTED_MIGRATION_IDEMPOTENCY_AUDIT_2026-08-31.md,
-- instance 4.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'education_modules'
      and policyname = 'education_modules_public_select'
  ) then
    create policy "education_modules_public_select" on public.education_modules
      for select to anon, authenticated
      using (true);
  end if;
end $$;

alter policy "education_modules_public_select" on public.education_modules
  using (
    publication_state = 'published'
    and (requires_clinical_signoff = false or reviewed_by is not null)
  );

alter policy "public read sections of published modules" on public.education_module_sections
  using (
    exists (
      select 1 from education_modules m
      where m.id = education_module_sections.module_id
        and m.publication_state = 'published'
        and (m.requires_clinical_signoff = false or m.reviewed_by is not null)
    )
  );
