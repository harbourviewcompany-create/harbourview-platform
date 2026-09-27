-- Primary Vanuatu regulatory provenance: Industrial Hemp and Medical Cannabis Act 2021.
update public.regulatory_market_access_evidence set active=false where jurisdiction_iso2='VU' and active=true;

insert into public.source_registry (
source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class
) values (
'Vanuatu Parliament — Industrial Hemp and Medical Cannabis Act 2021 / 2025 amendment record',
'https://parliament.gov.vu/index.php/parliamentary-business/acts-of-parliament/acts',
'Vanuatu',true,'Vanuatu','VU','en','monthly','verified','VU',1,false,'statute',true,
'Official Parliament source lists the Industrial Hemp and Medical Cannabis Act 2021 and the 2025 amendment bill. The 2021 Act establishes licensing and regulation for industrial hemp and medical cannabis; the 2025 amendment record concerns financial/compliance management.',
'legislature'
) on conflict (source_url) do update set is_active=true,jurisdiction_code='VU',verification_notes=excluded.verification_notes,updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values (
'primary-evidence-vu-hemp-medical-2021','VU','medical_limited_trade',
'Vanuatu has a dedicated Industrial Hemp and Medical Cannabis Act No. 31 of 2021 establishing a regulated licensing framework for industrial hemp and medical cannabis. The Act addresses cultivation, harvesting, seed importation, processing/manufacturing, testing and export licensing. The separate Dangerous Drugs framework continues to prohibit ordinary cannabis cultivation and dealing outside authorized channels; this does not establish general adult-use retail.',
'Parliament of Vanuatu','https://parliament.gov.vu/index.php/parliamentary-business/acts-of-parliament/acts',
'2021-12-10',now(),now()+interval '180 days',true);

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values (
'primary-evidence-vu-hemp-medical-2021','VU','primary-evidence-claim:vu-hemp-medical-2021',
'Vanuatu has a statutory licensing framework for industrial hemp and medical cannabis covering activities including cultivation, seed importation, processing/manufacturing and export; ordinary cannabis remains subject to the Dangerous Drugs Act and is not established as general adult-use retail.',
'any','national','Parliament of Vanuatu','https://parliament.gov.vu/index.php/parliamentary-business/acts-of-parliament/acts',
'2021-12-10',now(),now(),now()+interval '180 days','verified');

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at)
select '58526c26-b97d-410d-aa39-3e1a3b6e66b0','VU','depth-v1-vu-medical-hemp','Industrial hemp and medical cannabis licensing','domestic_authorization',
'Industrial Hemp and Medical Cannabis Act No. 31 of 2021',
'Vanuatu Ministry of Agriculture, Livestock, Forestry and Biosecurity / statutory advisory framework','active','2021-12-10',
'Licensed industrial hemp and medical cannabis activities are regulated by statute, including cultivation, seed importation, processing/manufacturing and export. This is not an adult-use retail pathway.',
ARRAY['https://parliament.gov.vu/index.php/parliamentary-business/acts-of-parliament/acts'],'needs_review',now()
where not exists (select 1 from public.regulatory_pathways where iso_alpha2='VU' and slug='depth-v1-vu-medical-hemp');

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',id,'Industrial Hemp and Medical Cannabis Act No. 31 of 2021','Part 6 / section 26','statute',
'https://parliament.gov.vu/index.php/parliamentary-business/acts-of-parliament/acts','2021-12-10',current_date,
'The Act provides for regulations covering cultivation, harvesting, seed importation, processing/manufacturing, testing and export, and establishes licensing requirements.'
from public.regulatory_pathways p
where p.iso_alpha2='VU' and p.slug='depth-v1-vu-medical-hemp'
and not exists (select 1 from public.regulatory_citations c where c.entity_type='pathway' and c.entity_id=p.id and c.citation_url='https://parliament.gov.vu/index.php/parliamentary-business/acts-of-parliament/acts');

update public.regulatory_pathways set verification='verified',last_verified_at=now()
where iso_alpha2='VU' and slug='depth-v1-vu-medical-hemp';

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
evidence_basis='Primary Vanuatu Parliament source identifies the Industrial Hemp and Medical Cannabis Act 2021 licensing framework.',
last_evaluated_at=now()
where jurisdiction_key='VU' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways');

update public.jurisdiction_dimension_coverage
set status='verified_empty',applicability='applicable',
evidence_basis='Primary Act establishes licensing activities but does not establish general commercial cannabis product-format rules.',
last_evaluated_at=now()
where jurisdiction_key='VU' and dimension_key='verified_format_rules';

update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now()
where jurisdiction_key='VU'
and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','verified_format_rules')
and status in ('open','in_progress','blocked');
