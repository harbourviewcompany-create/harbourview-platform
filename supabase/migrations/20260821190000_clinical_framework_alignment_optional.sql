-- Optional commercial / regulatory framework alignment on clinical evidence spine.
-- Additive only. Does not change review_status, RLS, or clinical conclusions.
-- framework_alignment is jsonb; claim-map is a separate operator table.

alter table if exists public.clinical_evidence_records
  add column if not exists framework_alignment jsonb;

comment on column public.clinical_evidence_records.framework_alignment is
  'Optional FrameworkAlignment JSON (IMDRF N41, DTA domains, DTx RWE phases, commercial stage-gates, FDA RWE relevance/reliability, ALCOA+). Operator mapping only; never used for clinical inference.';

create table if not exists public.clinical_evidence_claim_map (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  claim_statement text not null,
  condition_label text not null,
  cannabinoid_focus text[] not null default '{}',
  -- Fixture ids (e.g. ev-dravet-cbd) or live record UUIDs as text; resolved at read time.
  evidence_record_ids text[] not null default '{}',
  target_stage_gates text[] not null default '{}',
  target_imdrf_pillars text[] not null default '{}',
  target_dta_domains text[] not null default '{}',
  status text not null default 'gap'
    check (status in ('supported', 'partial', 'gap', 'not_applicable')),
  gap_summary text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_by uuid
);

comment on table public.clinical_evidence_claim_map is
  'Operator claim-map linking commercial/clinical claim statements to evidence records and stage-gates. Not a clinical decision surface.';

alter table public.clinical_evidence_claim_map enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'clinical_evidence_claim_map'
      and policyname = 'claim_map_select_authenticated'
  ) then
    create policy claim_map_select_authenticated
      on public.clinical_evidence_claim_map
      for select
      to authenticated
      using (true);
  end if;
end $$;

-- Service role used by admin API for writes; no broad authenticated write policy.
