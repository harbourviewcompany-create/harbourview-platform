-- Reconstructed from the exact statement stored in production
-- supabase_migrations.schema_migrations for version 20260720093632.
-- Repository-only history repair: production already records this version as applied.

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
