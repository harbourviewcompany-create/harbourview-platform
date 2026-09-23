-- Authoritative adjudication tranche 4: first-party sources researched 2026-09-23.
insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-ee-20260923','EE','medical_limited_trade',
 'Estonia''s State Agency of Medicines classifies cannabis and its processed products as Schedule I narcotic substances, permitted for medical, scientific or crime-prevention purposes. The same authority lists cannabidiol (CBD) medicinal products among registered medicines and maintains current narcotic/psychotropic substance controls. This establishes a controlled medical pathway rather than general adult-use commercial access.',
 'Ravimiamet — State Agency of Medicines of Estonia',
 'https://www.ravimiamet.ee/en/node/83',
 '2026-08-19',now(),now()+interval '180 days',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-ee-20260923');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-my-20260923','medical_limited_trade',
 'medical_limited_trade',
 'Malaysia''s Ministry of Health states that cannabis is controlled under the Dangerous Drugs Act 1952, Poisons Act 1952 and Sale of Drugs Act 1952, including controls on import, export, sale, supply, manufacture, cultivation, possession and use. For human medical products, the Ministry states importation and related manufacture, sale, supply, possession and use can occur by appropriately licensed or authorized persons, and that cannabis-based medical products require product registration before manufacture, sale, supply, import, possession or administration. The current Ministry FAQ also records that no cannabis-based human medical product was registered at the time of publication, so this is a tightly controlled medical legal pathway rather than a general commercial market.',
 'Ministry of Health Malaysia — Pharmaceutical Services Programme',
 'https://pharmacy.moh.gov.my/ms/entri/soalan-lazim-kanabis-cannabis.html',
 '2020-03-06',now(),now()+interval '180 days',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-my-20260923');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-lb-20260923','LB','medical_limited_trade',
 'Lebanon enacted Law No. 178 of 2020 regulating the cultivation of cannabis for medical and industrial use. The law establishes a government-controlled licensing framework for cultivation for those purposes and does not legalize general adult-use cannabis commerce. The current adjudication therefore remains limited to controlled medical/industrial activity.',
 'Lebanese Republic — Law No. 178 of 2020',
 'https://www.loc.gov/item/global-legal-monitor/2020-06-16/lebanon-law-legalizing-cannabis-cultivation-for-medical-and-industrial-purposes/',
 '2020-06-04',now(),now()+interval '180 days',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-lb-20260923');

select * from api.refresh_verified_market_access_tiers('primary-evidence-ee-20260923');
select * from api.refresh_verified_market_access_tiers('primary-evidence-my-20260923');
select * from api.refresh_verified_market_access_tiers('primary-evidence-lb-20260923');
