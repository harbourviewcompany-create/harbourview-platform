-- Primary Latvia regulatory provenance: consolidated narcotics law with 2026 amendments.
update public.regulatory_market_access_evidence set active=false where jurisdiction_iso2='LV' and active=true;

insert into public.source_registry (
source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class)
values (
'Latvia — Law on Legal Circulation of Narcotic and Psychotropic Substances and Medicinal Products',
'https://likumi.lv/ta/id/40283','Latvia',true,'Latvia','LV','lv','monthly','verified','LV',1,false,'statute',true,
'Official consolidated law. 2026 amendments entered into force 2026-03-06. Industrial Cannabis sativa subsp. sativa cultivation is permitted under statutory conditions; cannabis indica cultivation is prohibited; research/medical handling of scheduled substances requires State Medicines Agency authorization.',
'legislature')
on conflict (source_url) do update set is_active=true,jurisdiction_code='LV',verification_notes=excluded.verification_notes,updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values (
'primary-evidence-lv-law-2026','LV','cbd_hemp_only',
'Latvia''s official narcotics law prohibits cultivation of Cannabis sativa subsp. indica while permitting Cannabis sativa subsp. sativa for industrial and horticultural purposes subject to statutory seed/production conditions. The 2026 amendment also maintains authorization pathways for scheduled substances used in medical, veterinary, scientific and industrial contexts. The cited law does not establish adult-use cannabis retail.',
'Republic of Latvia — Saeima / Likumi.lv','https://likumi.lv/ta/id/40283','2026-03-06',now(),now()+interval '180 days',true);

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values (
'primary-evidence-lv-law-2026','LV','primary-evidence-claim:lv-law-2026',
'Latvia permits cultivation of Cannabis sativa subsp. sativa for industrial and horticultural purposes under statutory conditions, while Cannabis sativa subsp. indica cultivation is prohibited; scheduled-substance handling for specified medical, veterinary, scientific and industrial purposes is subject to authorization.',
'any','national','Republic of Latvia — Saeima / Likumi.lv','https://likumi.lv/ta/id/40283','2026-03-06',now(),now(),now()+interval '180 days','verified');

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at)
select 'a4e3067f-de8f-40a8-9633-24271c893c51','LV','depth-v1-lv-industrial-hemp','Authorized industrial hemp cultivation','domestic_authorization',
'Law on Legal Circulation of Narcotic and Psychotropic Substances and Medicinal Products, Section 6',
'Latvian authorities / State Medicines Agency where scheduled-substance authorization applies','active',null,
'Industrial Cannabis sativa subsp. sativa cultivation is permitted subject to statutory seed and production conditions; this is not an adult-use retail pathway.',
ARRAY['https://likumi.lv/ta/id/40283'],'needs_review',now()
where not exists (select 1 from public.regulatory_pathways where iso_alpha2='LV' and slug='depth-v1-lv-industrial-hemp');

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',id,'Law on Legal Circulation of Narcotic and Psychotropic Substances and Medicinal Products','Section 6','statute',
'https://likumi.lv/ta/id/40283','2026-03-06',current_date,
'Section 6 permits Cannabis sativa subsp. sativa cultivation for industrial and horticultural purposes under statutory conditions.'
from public.regulatory_pathways p
where p.iso_alpha2='LV' and p.slug='depth-v1-lv-industrial-hemp'
and not exists (select 1 from public.regulatory_citations c where c.entity_type='pathway' and c.entity_id=p.id and c.citation_url='https://likumi.lv/ta/id/40283');

update public.regulatory_pathways set verification='verified',last_verified_at=now()
where iso_alpha2='LV' and slug='depth-v1-lv-industrial-hemp';

insert into public.regulatory_calendar
(iso2,event_type,title,expected_date,confidence,source_url,source_label,status)
select 'LV','effective','2026 amendments to Latvia narcotics law enter into force','2026-03-06','confirmed',
'https://likumi.lv/ta/id/40283','Republic of Latvia — Saeima / Likumi.lv','effective'
where not exists (select 1 from public.regulatory_calendar where iso2='LV' and title='2026 amendments to Latvia narcotics law enter into force');

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
evidence_basis='Primary Latvia law and 2026 amendments; industrial hemp and authorized scheduled-substance handling are expressly addressed.',
last_evaluated_at=now()
where jurisdiction_key='LV' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','regulatory_calendar');

update public.jurisdiction_dimension_coverage
set status='verified_empty',applicability='applicable',
evidence_basis='Primary Latvia law does not establish a general adult-use commercial cannabis product-format framework.',
last_evaluated_at=now()
where jurisdiction_key='LV' and dimension_key='verified_format_rules';

update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now()
where jurisdiction_key='LV' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','regulatory_calendar','verified_format_rules')
and status in ('open','in_progress','blocked');
