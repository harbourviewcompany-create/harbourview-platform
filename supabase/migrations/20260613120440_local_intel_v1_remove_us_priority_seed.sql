-- Remove the US/Florida seed data from local_intel_v1. Seeding one country as
-- "available" while the other 190 sit at pending_research wrongly implied the
-- US is a priority/template jurisdiction. Reset US to the same pending_research
-- baseline as every other country until real per-country research is done for
-- all 191 jurisdictions on an equal footing.

delete from public.local_authorities        where country_code = 'US';
delete from public.local_subdivisions_intel  where country_code = 'US';
delete from public.local_operating_notes     where country_code = 'US';
delete from public.local_evidence_coverage   where country_code = 'US';
delete from public.local_open_questions      where country_code = 'US';

update public.local_intel_coverage
set coverage_status = 'pending_research', last_reviewed_at = null, notes = null
where country_code = 'US';
