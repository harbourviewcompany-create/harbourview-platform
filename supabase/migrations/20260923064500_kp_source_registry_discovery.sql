insert into public.source_registry (
source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,
jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class
) values (
'Republic of Korea Ministry of Justice — Unification Legal Affairs Database: DPRK statutes',
'https://www.unilaw.go.kr/','North Korea',true,'North Korea','KP','ko','monthly','discovery_only',
'KP',1,false,'research_database',true,
'Official Republic of Korea government legal-research database covering DPRK statutes, including the DPRK Drug Crime Prevention Act. Discovery/research source only; not treated as proof of current DPRK cannabis law.',
'other'
) on conflict (source_url) do update set
is_active=true,jurisdiction_code='KP',verification_notes=excluded.verification_notes,updated_at=now();

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
    evidence_basis='Official Republic of Korea government legal-research database registered for DPRK statutory discovery; not used as primary cannabis evidence.',
    last_evaluated_at=now()
where jurisdiction_key='KP' and dimension_key='source_registry';

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now()
where jurisdiction_key='KP' and dimension_key='source_registry'
and status in ('open','in_progress','blocked');
