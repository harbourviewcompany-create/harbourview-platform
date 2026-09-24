-- Reconcile the v1/v2 contract-version transition for the persisted 291x32 matrix.
-- No regulatory facts are created. Existing matrix rows are retained and relabeled
-- to the exact v2 contract after the v1 contract migration has established them.

update public.jurisdiction_data_depth_dimensions
set contract_version='2026-09-23.v2';

update public.jurisdiction_data_depth_dimension_state
set contract_version='2026-09-23.v2'
where contract_version='2026-09-22.v1';

update public.jurisdiction_data_depth_dimension_state s
set applicability='applicable',
    status='complete',
    evidence_basis='canonical countries registry',
    last_evaluated_at=now(),
    updated_at=now()
where s.contract_version='2026-09-23.v2'
  and s.dimension_key='identity';

update public.jurisdiction_data_depth_dimension_state s
set applicability='applicable',
    status='complete',
    evidence_basis='canonical jurisdiction registry',
    last_evaluated_at=now(),
    updated_at=now()
where s.contract_version='2026-09-23.v2'
  and s.dimension_key='hierarchy';

update public.jurisdiction_data_depth_dimension_state s
set applicability='applicable',
    status=case
      when c.verified_regulatory_tier is not null
       and c.regulatory_tier_evidence_key is not null then 'complete'
      else 'missing'
    end,
    evidence_count=case when c.regulatory_tier_evidence_key is not null then 1 else 0 end,
    primary_source_count=case when c.regulatory_tier_evidence_key is not null then 1 else 0 end,
    evidence_basis=case
      when c.regulatory_tier_evidence_key is not null then 'countries.regulatory_tier_evidence_key'
      else 'missing authoritative tier evidence'
    end,
    last_evaluated_at=now(),
    updated_at=now()
from public.countries c
where s.jurisdiction_key=c.iso_alpha2
  and s.dimension_key='regulatory_tier'
  and s.contract_version='2026-09-23.v2';

alter table public.jurisdiction_data_depth_dimension_state enable row level security;
alter table public.jurisdiction_data_depth_dimension_state force row level security;