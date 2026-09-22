insert into public.jurisdiction_data_depth_tasks
(jurisdiction_key,dimension_key,jurisdiction_level,status,priority,evidence_required,notes)
select 'VA','verified_regulatory_evidence',jurisdiction_level,'blocked',100,true,
'Blocked: no cannabis-specific primary legal/regulatory provision located for the Holy See; broad Vatican narcotics law is registered as primary provenance but is not treated as cannabis-specific evidence. Secondary evidence was deactivated.'
from public.v_jurisdiction_data_depth
where jurisdiction_key='VA'
and not exists(select 1 from public.jurisdiction_data_depth_tasks where jurisdiction_key='VA' and dimension_key='verified_regulatory_evidence');