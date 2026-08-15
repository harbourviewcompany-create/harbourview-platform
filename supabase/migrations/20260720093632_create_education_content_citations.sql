-- Reconstructed from production on 2026-08-14.
--
-- This file previously contained no DDL at all. It carried a short comment
-- saying it had been applied directly to production via Supabase MCP and
-- existed only to satisfy local/remote migration history parity, followed by
-- a single `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing
-- nothing, so `supabase db reset --local` could not rebuild the schema this
-- migration is supposed to create. The statements below are the verbatim text
-- production actually ran, read back from
-- supabase_migrations.schema_migrations.statements for version 20260720093632.
--
-- Rewriting this file cannot affect production: 20260720093632 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.

create table public.education_content_citations (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.education_modules(id) on delete cascade,
  section_id uuid references public.education_module_sections(id) on delete cascade,
  claim text not null,
  source_type text not null check (source_type in ('case_report','review_article','consensus_guideline','pharmacokinetic_study','regulatory_pathway','mechanistic_theoretical','other')),
  source_title text,
  source_url text,
  confidence_tier text not null check (confidence_tier in ('well_established','moderate_evidence','theoretical_mechanistic','single_source')),
  open_question boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

comment on table public.education_content_citations is
  'Per-claim evidence trail for education content, especially requires_clinical_signoff=true modules. Lets a reviewer start from a fully-sourced draft (claim -> source -> confidence tier) instead of unaided prose. open_question flags claims needing clinician judgment specifically, not just fact-checking.';

alter table public.education_content_citations enable row level security;

create policy "education_content_citations_staff_all" on public.education_content_citations
  for all
  using (
    exists (select 1 from user_roles where user_roles.user_id = auth.uid() and user_roles.role = any(array['admin','operator','analyst']))
  );

create policy "education_content_citations_service_write" on public.education_content_citations
  for all
  using (auth.role() = 'service_role');
