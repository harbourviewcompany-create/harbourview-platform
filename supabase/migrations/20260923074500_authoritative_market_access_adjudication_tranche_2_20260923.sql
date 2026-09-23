-- Authoritative adjudication tranche 2: first-party sources researched 2026-09-23.
insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-ae-20260923','AE','cbd_hemp_only',
 'The UAE enacted a 2025 federal decree-law regulating industrial and medical uses of industrial hemp while expressly prohibiting recreational/personal use and requiring licensing. Separately, the federal narcotics law restricts cannabis/narcotics except authorized medical/scientific cases. The cited current framework therefore supports controlled industrial/medical hemp activity, not a general commercial adult-use cannabis market.',
 'UAE Government — UAE Legislation',
 'https://uaelegislation.gov.ae/en/legislations/3886/download',
 '2025-12-18',now(),now()+interval '180 days',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-ae-20260923');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-pk-20260923','PK','medical_limited_trade',
 'Pakistan has an enacted Cannabis Control and Regulatory Authority framework and a current national cannabis policy covering cultivation, extraction, manufacturing and a regulated marketplace for industrial and medicinal purposes. The official policy states medicinal cannabis and derivatives are distributed through regulated outlets on prescription and that industrial CBD products below the stated THC threshold may enter specified markets. Entertainment use remains illegal.',
 'Government of Pakistan — Cannabis Control & Regulatory Authority',
 'https://www.ccra.gov.pk/storage/gallery/Cannabis_Policy%202025.pdf',
 '2025-01-01',now(),now()+interval '180 days',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-pk-20260923');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-bt-20260923','BT','prohibited',
 'Bhutan’s Attorney General publishes the Narcotic Drugs, Psychotropic Substances and Substance Abuse Act and its 2018 amendment. The amendment expressly criminalizes illicit trafficking in cannabis and derivatives, including possession, import, export, sale, purchase, transport, distribution and supply above prescribed quantities. No lawful general commercial cannabis pathway is established by the cited current legal framework.',
 'Office of the Attorney General of Bhutan',
 'https://oag.gov.bt/wp-content/uploads/2024/07/Narcotic-Drugs-Psychotropic-Substance-and-Substance-Abuse-Amendment-Act-2018.pdf',
 '2018-07-01',now(),now()+interval '180 days',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-bt-20260923');

select * from api.refresh_verified_market_access_tiers('primary-evidence-ae-20260923');
select * from api.refresh_verified_market_access_tiers('primary-evidence-pk-20260923');
select * from api.refresh_verified_market_access_tiers('primary-evidence-bt-20260923');
