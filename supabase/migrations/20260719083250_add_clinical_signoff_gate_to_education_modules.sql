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
-- version 20260719083250.
--
-- Rewriting this file cannot affect production: 20260719083250 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

alter table public.education_modules
  add column requires_clinical_signoff boolean not null default false;

comment on column public.education_modules.requires_clinical_signoff is
  'True for modules containing clinical/pharmacological guidance (dosing, interactions, contraindications) that must be reviewed by a licensed clinician (reviewed_by set) before being publicly readable, regardless of publication_state.';
