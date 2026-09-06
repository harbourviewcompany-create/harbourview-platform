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

-- Zero-state replay: both policies below were created out-of-band in production
-- and no repository migration creates either one (20260713120000 only names
-- education_modules_public_select in a comment). A bare ALTER POLICY therefore
-- fails with 42704 on a from-scratch replay driven by filename order, which is
-- how Supabase's native preview-branch integration replays.
--
-- These ALTERs only TIGHTEN an existing policy's USING clause. Guarding them on
-- the policy's existence is behaviour-preserving against production, where both
-- policies exist and the ALTER runs exactly as before. On a replay where the
-- policy is absent, skipping cannot widen access: RLS is default-deny, so a
-- policy that does not exist grants nothing. No policy definition is changed.
do $clinical_signoff_gate$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'education_modules'
      and policyname = 'education_modules_public_select'
  ) then
    execute $stmt$
      alter policy "education_modules_public_select" on public.education_modules
        using (
          publication_state = 'published'
          and (requires_clinical_signoff = false or reviewed_by is not null)
        )
    $stmt$;
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'education_module_sections'
      and policyname = 'public read sections of published modules'
  ) then
    execute $stmt$
      alter policy "public read sections of published modules" on public.education_module_sections
        using (
          exists (
            select 1 from education_modules m
            where m.id = education_module_sections.module_id
              and m.publication_state = 'published'
              and (m.requires_clinical_signoff = false or m.reviewed_by is not null)
          )
        )
    $stmt$;
  end if;
end
$clinical_signoff_gate$;
