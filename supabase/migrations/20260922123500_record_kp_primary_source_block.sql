-- North Korea source gap remains fail-closed. Do not use South Korean narcotics law as DPRK evidence.
-- This migration registers an unresolved research task only after primary-source search failed to establish an accessible DPRK cannabis statute.
insert into public.jurisdiction_data_depth_tasks
(jurisdiction_key,dimension_key,jurisdiction_level,status,priority,evidence_required,notes)
select 'KP','verified_regulatory_evidence',jurisdiction_level,'blocked',100,true,
'Blocked: no accessible primary DPRK cannabis statute/regulatory source was established in this research pass. South Korean law and third-party descriptions are not valid substitutes for DPRK law.'
from public.v_jurisdiction_data_depth
where jurisdiction_key='KP'
and not exists(select 1 from public.jurisdiction_data_depth_tasks where jurisdiction_key='KP' and dimension_key='verified_regulatory_evidence' and status='blocked');