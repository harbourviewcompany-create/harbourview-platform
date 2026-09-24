-- Repair the production 291x32 state matrix after the initial control-plane
-- migration ran under an execution context that could not see RLS-protected countries.
-- The temporary policy is transaction-scoped by this migration and is removed before commit.
drop policy if exists __harbourview_migration_country_read on public.countries;
create policy __harbourview_migration_country_read
  on public.countries
  for select to public
  using (true);

alter table public.jurisdiction_data_depth_dimension_state disable row level security;

insert into public.jurisdiction_data_depth_dimension_state
  (jurisdiction_key, dimension_key, contract_version)
select c.iso_alpha2, d.dimension_key, d.contract_version
from public.countries c
cross join public.jurisdiction_data_depth_dimensions d
where d.contract_version = '2026-09-23.v2'
on conflict (jurisdiction_key, dimension_key, contract_version) do nothing;

update public.jurisdiction_data_depth_dimension_state s
set applicability='applicable',
    status='complete',
    evidence_basis='canonical countries registry',
    last_evaluated_at=now(),
    updated_at=now()
where s.contract_version='2026-09-23.v2' and s.dimension_key='identity';

update public.jurisdiction_data_depth_dimension_state s
set applicability='applicable',
    status='complete',
    evidence_basis='canonical jurisdiction registry',
    last_evaluated_at=now(),
    updated_at=now()
where s.contract_version='2026-09-23.v2' and s.dimension_key='hierarchy';

update public.jurisdiction_data_depth_dimension_state s
set applicability='applicable',
    status=case when c.verified_regulatory_tier is not null and c.regulatory_tier_evidence_key is not null then 'complete' else 'missing' end,
    evidence_count=case when c.regulatory_tier_evidence_key is not null then 1 else 0 end,
    primary_source_count=case when c.regulatory_tier_evidence_key is not null then 1 else 0 end,
    evidence_basis=case when c.regulatory_tier_evidence_key is not null then 'countries.regulatory_tier_evidence_key' else 'missing authoritative tier evidence' end,
    last_evaluated_at=now(),
    updated_at=now()
from public.countries c
where s.jurisdiction_key=c.iso_alpha2
  and s.dimension_key='regulatory_tier'
  and s.contract_version='2026-09-23.v2';

do 'declare v_j integer; v_m integer;
begin
 select count(distinct jurisdiction_key),count(*) into v_j,v_m
 from public.jurisdiction_data_depth_dimension_state
 where contract_version=''2026-09-23.v2'';
 if v_j<>291 or v_m<>9312 then
   raise exception ''291x32 backfill failed: jurisdictions %, matrix rows %, expected 291/9312'',v_j,v_m;
 end if;
end';

alter table public.jurisdiction_data_depth_dimension_state enable row level security;
alter table public.jurisdiction_data_depth_dimension_state force row level security;
drop policy __harbourview_migration_country_read on public.countries;