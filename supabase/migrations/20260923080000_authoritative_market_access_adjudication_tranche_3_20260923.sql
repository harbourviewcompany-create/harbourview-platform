-- Authoritative adjudication tranche 3: first-party current sources.
insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-gh-20260923','GH','medical_limited_trade',
 'Ghana operates a controlled cannabis regulatory programme for low-THC cannabis. The Narcotics Control Commission states that cultivation, processing, distribution and trade are permitted under licensing for medical, research and industrial purposes, with a THC ceiling of 0.3%, while recreational cannabis remains illegal. In July 2026 NACOC reported issuance of cultivation licences to two companies under this framework.',
 'Narcotics Control Commission of Ghana',
 'https://www.ncc.gov.gh/cannabis-regulations/',
 '2026-02-26',now(),now()+interval '180 days',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-gh-20260923');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-zm-20260923','ZM','medical_limited_trade',
 'Zambia''s Cannabis Act 2021 expressly regulates cultivation, manufacture, production, storage, distribution, import and export of cannabis for medicinal, scientific or research purposes and establishes a licensing authority. The cited Act does not establish general adult-use retail commerce.',
 'National Assembly of Zambia — Cannabis Act, 2021',
 'https://www.parliament.gov.zm/node/9003',
 '2021-12-23',now(),now()+interval '180 days',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-zm-20260923');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-vu-20260923','VU','prohibited',
 'Vanuatu courts continue to enforce the Dangerous Drugs Act against unlawful possession of cannabis. Two Supreme Court decisions in 2026 record convictions for unlawful possession of cannabis under section 2(62) of the Dangerous Drugs Act [Cap 12], with substantial criminal penalties. The cited current authority does not establish a lawful commercial cannabis market.',
 'Supreme Court of Vanuatu',
 'https://courts.gov.vu/court-activity/judgments/2853',
 '2026-07-09',now(),now()+interval '180 days',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-vu-20260923');

select * from api.refresh_verified_market_access_tiers('primary-evidence-gh-20260923');
select * from api.refresh_verified_market_access_tiers('primary-evidence-zm-20260923');
select * from api.refresh_verified_market_access_tiers('primary-evidence-vu-20260923');
