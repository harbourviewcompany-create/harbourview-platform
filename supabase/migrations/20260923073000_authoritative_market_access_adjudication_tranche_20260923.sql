-- Authoritative adjudication tranche: current first-party regulatory sources researched 2026-09-23.
-- This tranche only publishes conclusions directly supported by the cited authority.
-- No legacy tier is carried forward without current evidence.

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select
 'primary-evidence-pr-20260923',
 'PR',
 'medical_limited_trade',
 'Puerto Rico maintains an active Medical Cannabis Regulatory Board and a current medical-cannabis licensing framework. The Department of Health describes licensed establishments, cultivation, manufacturing, transportation and laboratory licensing and identifies Regulation 9038 and Law 42-2017 as the governing framework. The cited current authority does not establish a general adult-use commercial market.',
 'Puerto Rico Department of Health — Junta Reglamentadora del Cannabis Medicinal',
 'https://www.salud.pr.gov/CMS/364',
 '2017-07-09',
 now(),
 now() + interval '180 days',
 true
where not exists (select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-pr-20260923');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select
 'primary-evidence-ba-20260923',
 'BA',
 'medical_limited_trade',
 'Bosnia and Herzegovina transferred cannabis from the prohibited table to the table of substances and plants under strict control in December 2025, opening the legal basis for medical use. The competent Ministry stated in July 2026 that implementing amendments needed for prescribing and dispensing cannabis medicines had not yet been completed; the September 2026 follow-up confirms further regulatory and professional steps are still required for practical medical application. This supports a strictly controlled medical pathway, not general adult-use commerce.',
 'Ministry of Civil Affairs of Bosnia and Herzegovina — Cannabis regulatory updates',
 'https://www.mcp.gov.ba/en/portal/post/ukinuta-potpuna-zabrana-kanabis-u-bih-prelazi-u-kategoriju-strogo-nadziranih-tvari-1774352662152',
 '2025-12-29',
 now(),
 now() + interval '180 days',
 true
where not exists (select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-ba-20260923');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select
 'primary-evidence-la-20260923',
 'LA',
 'prohibited',
 'The Lao Trade Portal identifies marijuana as a prohibited narcotic for import and export under the Law on Narcotic and its 2021 amendment. The cited official trade-control record states marijuana is not allowed to be imported or exported and classifies the measure as prohibited goods. The underlying law also provides criminal penalties for commercial cultivation, possession, production and trade.',
 'Lao Trade Portal — Ministry of Industry and Commerce',
 'https://www.laotradeportal.gov.la/en-gb/search-measure/view/7',
 '2021-08-09',
 now(),
 now() + interval '180 days',
 true
where not exists (select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-la-20260923');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select
 'primary-evidence-be-20260923',
 'BE',
 'prohibited',
 'Belgian Federal Justice states that possession or cultivation of cannabis remains an offence. The limited prosecutorial-priority rule for an adult possessing up to 3 grams or one plant for personal use is not a commercial licensing pathway. The cited official authority therefore does not establish lawful commercial cannabis market access.',
 'Belgian Federal Public Service Justice — Cannabis',
 'https://www.justice.belgium.be/fr/themes_et_dossiers/securite_et_criminalite/drogues/cannabis',
 '2026-09-23',
 now(),
 now() + interval '180 days',
 true
where not exists (select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-be-20260923');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select
 'primary-evidence-lc-20260923',
 'LC',
 'legal_commercial_access',
 'Saint Lucia’s Regulated Substances Authority states that its Cannabis Licence authorizes cultivation, processing, distribution, retail, research, export and industrial-hemp activities. In April 2026 the Authority also announced selection of a national seed-to-sale traceability platform covering cultivation, processing, distribution, testing and retail for licensed operators. These first-party sources establish an operational regulated commercial cannabis framework.',
 'Saint Lucia Regulated Substances Authority',
 'https://rsa.govt.lc/',
 '2026-04-28',
 now(),
 now() + interval '180 days',
 true
where not exists (select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-lc-20260923');

select * from api.refresh_verified_market_access_tiers('primary-evidence-pr-20260923');
select * from api.refresh_verified_market_access_tiers('primary-evidence-ba-20260923');
select * from api.refresh_verified_market_access_tiers('primary-evidence-la-20260923');
select * from api.refresh_verified_market_access_tiers('primary-evidence-be-20260923');
select * from api.refresh_verified_market_access_tiers('primary-evidence-lc-20260923');
