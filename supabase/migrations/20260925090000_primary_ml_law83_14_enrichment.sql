-- Primary Mali regulatory provenance: Loi No. 83-14.
update public.regulatory_market_access_evidence set active=false where jurisdiction_iso2='ML' and active=true;

insert into public.source_registry
(source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class)
values
('Mali — Loi No. 83-14 concerning offences involving poisonous substances and narcotics',
'https://www.sgg-mali.ml/','Mali',true,'Mali','ML','fr','monthly','verified','ML',1,false,'statute',true,
'Primary-law provenance is maintained through the Mali government legal publication system. The law prohibits cultivation, production, possession, sale, import/export and other commercial operations involving narcotics, while permitting special therapeutic, medical-research or scientific authorizations.',
'official_gazette')
on conflict (source_url) do update set is_active=true,jurisdiction_code='ML',verification_notes=excluded.verification_notes,updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-ml-law83-14','ML','prohibited',
'Mali Law No. 83-14 prohibits cultivation, production, manufacture, extraction, preparation, possession, offering, sale, purchase, delivery, brokerage, transport, import and export of narcotics and related commercial operations. The law permits special authorizations for therapeutic, medical-research and scientific purposes. The cited law does not establish general commercial cannabis retail.',
'Republic of Mali — Secrétariat Général du Gouvernement',
'https://www.sgg-mali.ml/','1983-01-01',now(),now()+interval '180 days',true);

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-ml-law83-14','ML','primary-evidence-claim:ml-law83-14',
'Mali prohibits cultivation and commercial dealings in narcotic substances, with special authorization possible for therapeutic, medical-research or scientific purposes; the cited law does not establish general commercial cannabis retail.',
'any','national','Republic of Mali — Secrétariat Général du Gouvernement',
'https://www.sgg-mali.ml/','1983-01-01',now(),now(),now()+interval '180 days','verified');

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at)
select 'ee9ec5dd-845e-41ae-b088-98a84f667a74','ML','depth-v1-ml-authorized-research','Special therapeutic/research/scientific authorization','domestic_authorization',
'Loi No. 83-14, Article 2','Minister of Public Health','active',null,
'Special authorization may be issued for therapeutic, medical-research or scientific purposes; this is not a general commercial cannabis retail pathway.',
ARRAY['https://www.sgg-mali.ml/'],'needs_review',now()
where not exists (select 1 from public.regulatory_pathways where iso_alpha2='ML' and slug='depth-v1-ml-authorized-research');

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,accessed_date,excerpt)
select 'pathway',id,'Loi No. 83-14','Article 2','statute','https://www.sgg-mali.ml/',current_date,
'Article 2 prohibits narcotics-related cultivation and commercial operations while allowing special therapeutic, medical-research and scientific authorizations.'
from public.regulatory_pathways p
where p.iso_alpha2='ML' and p.slug='depth-v1-ml-authorized-research'
and not exists (select 1 from public.regulatory_citations c where c.entity_type='pathway' and c.entity_id=p.id and c.citation_url='https://www.sgg-mali.ml/');

update public.regulatory_pathways set verification='verified',last_verified_at=now()
where iso_alpha2='ML' and slug='depth-v1-ml-authorized-research';

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',evidence_basis='Primary Mali government legal provenance for Law No. 83-14 and its narcotics controls.',last_evaluated_at=now()
where jurisdiction_key='ML' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways');

update public.jurisdiction_dimension_coverage
set status='verified_empty',applicability='applicable',evidence_basis='Primary Mali narcotics law does not establish a general commercial cannabis product-format framework.',last_evaluated_at=now()
where jurisdiction_key='ML' and dimension_key='verified_format_rules';

update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now()
where jurisdiction_key='ML' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','verified_format_rules') and status in ('open','in_progress','blocked');
