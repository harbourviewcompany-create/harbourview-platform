-- Primary-source evidence batch: Thailand, Japan, New Zealand.
-- Researched 2026-09-23 from first-party regulator/government sources.
-- No source hashes are fabricated; source capture remains a separate execution gate.

insert into public.source_registry
(source_name,source_url,jurisdiction,country,iso,region,language,adapter,crawl_cadence,relevance_status,
 jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,regulator_class,notes)
values
('Thailand Department of Thai Traditional and Alternative Medicine — Controlled Herb (Cannabis) 2025','https://www.dtam.moph.go.th/sub-law/42864/','Thailand','Thailand','TH','Asia','th','html_snapshot','monthly','active','TH',1,false,'government_regulator',true,'health_regulator','Ministerial controlled-herb cannabis notification published December 2025; current 2026 rules place cannabis under medical controls and require regulated commercial permissions.'),
('Thailand Ministry of Public Health — Medical Cannabis Division legal framework','https://med-cannabis.dtam.moph.go.th/law-dmc/','Thailand','Thailand','TH','Asia','th','html_snapshot','monthly','active','TH',1,false,'government_regulator',true,'health_regulator','Current legal index lists the 2026 regulation governing research, export, sale and processing of controlled herbs for commercial purposes and a 2026 enforcement framework.'),
('Japan Ministry of Health, Labour and Welfare — Cannabis law reform implementation','https://www.mhlw.go.jp/stf/newpage_43079.html','Japan','Japan','JP','Asia','ja','html_snapshot','monthly','active','JP',1,false,'government_legislation',true,'health_regulator','MHLW implementation notice states the amended cannabis laws took effect in stages on 12 December 2024 and 1 March 2025, including medicinal-pharmaceutical use and licensed cultivation categories.'),
('New Zealand Ministry of Health — Medicinal Cannabis Scheme','https://www.health.govt.nz/regulation-legislation/medicinal-cannabis/information-for-consumers','New Zealand','New Zealand','NZ','Oceania','en','html_snapshot','monthly','active','NZ',1,false,'government_regulator',true,'health_regulator','Current Medicinal Cannabis Scheme permits regulated cultivation and manufacture in New Zealand and prescription-only supply subject to minimum quality standards.'),
('New Zealand Ministry of Health — Hemp regulatory changes 2026','https://www.health.govt.nz/regulation-legislation/hemp','New Zealand','New Zealand','NZ','Oceania','en','html_snapshot','monthly','active','NZ',1,false,'government_regulator',true,'health_regulator','From 28 May 2026 the industrial hemp licensing scheme was replaced by permission-based regulations; hemp is defined at no more than 1 percent THC by dry weight.')
on conflict (source_url) do update set
  is_active=true,
  jurisdiction_code=excluded.jurisdiction_code,
  tier=excluded.tier,
  notes=excluded.notes,
  updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-th-dtam-medical-commercial-20260923','TH','medical_limited_trade',
 'Thailand''s Department of Thai Traditional and Alternative Medicine identifies cannabis as a controlled herb and its current 2026 legal index lists a regulation governing research, export, sale and processing of controlled herbs for commercial purposes. The Ministry of Public Health also states the 2026 framework is intended to strengthen control of medical cannabis and prevent unauthorized recreational use. This supports a regulated medical/commercial pathway rather than unrestricted adult-use retail.',
 'Thailand Department of Thai Traditional and Alternative Medicine / Ministry of Public Health',
 'https://med-cannabis.dtam.moph.go.th/law-dmc/',
 '2026-04-30',now(),'2027-03-23',true),
('primary-evidence-jp-mhlw-cannabis-reform-20260923','JP','medical_limited_trade',
 'Japan''s Ministry of Health, Labour and Welfare states that the cannabis-law reform entered into force in stages on 12 December 2024 and 1 March 2025. The reform permits licensed cultivation categories for industrial raw material and pharmaceutical raw material while establishing controls under the Narcotics and Psychotropics Control framework, and enables use of cannabis-derived pharmaceutical products under the amended regime. The cited government framework does not establish a general adult-use commercial market.',
 'Japan Ministry of Health, Labour and Welfare',
 'https://www.mhlw.go.jp/stf/newpage_43079.html',
 '2025-03-01',now(),'2027-03-23',true),
('primary-evidence-nz-moh-medicinal-cannabis-20260923','NZ','medical_limited_trade',
 'New Zealand''s Ministry of Health states that the Medicinal Cannabis Scheme has operated since 1 April 2020, enables medicinal cannabis to be grown and manufactured in New Zealand, and permits prescription-only supply subject to minimum quality standards. The Ministry also confirms the 2026 hemp reforms are a separate permission-based regime for hemp at no more than 1 percent THC. The cited framework therefore supports regulated medicinal commercial activity, not general adult-use cannabis retail.',
 'New Zealand Ministry of Health — Medicinal Cannabis Agency',
 'https://www.health.govt.nz/regulation-legislation/medicinal-cannabis/information-for-consumers',
 '2020-04-01',now(),'2027-03-23',true)
on conflict (evidence_key) do update set
 tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,authority_url=excluded.authority_url,
 source_effective_date=excluded.source_effective_date,verified_at=excluded.verified_at,expires_at=excluded.expires_at,active=true;

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'regulatory_market_access_evidence',e.id,
 case e.jurisdiction_iso2
  when 'TH' then 'Thailand Ministry of Public Health / DTAM 2026 controlled-herb commercial regulation'
  when 'JP' then 'MHLW Cannabis-law reform implementation notice'
  when 'NZ' then 'New Zealand Medicinal Cannabis Scheme'
 end,
 null,'official',e.authority_url,e.source_effective_date,current_date,e.rationale
from public.regulatory_market_access_evidence e
where e.evidence_key in (
 'primary-evidence-th-dtam-medical-commercial-20260923',
 'primary-evidence-jp-mhlw-cannabis-reform-20260923',
 'primary-evidence-nz-moh-medicinal-cannabis-20260923'
)
and not exists (
 select 1 from public.regulatory_citations r
 where r.entity_type='regulatory_market_access_evidence'
 and r.entity_id=e.id and r.citation_url=e.authority_url
);
