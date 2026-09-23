-- Authoritative adjudication tranche 6: Brazil and Singapore.
-- Both are classified from current first-party 2026 regulatory/legal sources.
-- No adult-use commercial market is inferred from medical-only pathways.

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-br-20260923','BR','medical_limited_trade',
 'Brazil''s national health regulator Anvisa updated the cannabis framework in 2026. RDC 1.015/2026 governs authorization for manufacture and import of cannabis products for human medical use, while RDCs 1.012/2026 and 1.013/2026 establish controlled cultivation pathways exclusively for research and medicinal/pharmaceutical purposes. Anvisa also states that cultivation requires prior Special Authorization and that cannabis remains prohibited except for expressly authorized activities. The 2026 framework therefore supports controlled medical/pharmaceutical production, import and related trade, not general adult-use commercial access.',
 'Agência Nacional de Vigilância Sanitária (Anvisa)',
 'https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/rdcs-no-1-012-2026-e-no-1-013-2026',
 '2026-08-24',now(),now()+interval '180 days',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-br-20260923');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-sg-20260923','SG','prohibited',
 'Singapore''s current Misuse of Drugs Act framework expressly regulates trafficking, manufacture, import/export, possession, consumption and cultivation of cannabis as controlled-drug offences. The Central Narcotics Bureau''s current cannabis guidance describes cannabis as a Class A controlled drug under the Act and states that Singapore maintains strict cannabis prohibition. The current legislation was amended during 2026 and remains in force as of September 2026. No general commercial cannabis pathway is established by the current framework.',
 'Central Narcotics Bureau / Attorney-General''s Chambers of Singapore',
 'https://www.cnb.gov.sg/singapore-drug-situation/myths-and-facts-about-drugs/cannabis/singapore-s-anti-drug-laws-on-cannabis/',
 '2026-07-03',now(),now()+interval '180 days',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-sg-20260923');

select * from api.refresh_verified_market_access_tiers('primary-evidence-br-20260923');
select * from api.refresh_verified_market_access_tiers('primary-evidence-sg-20260923');
