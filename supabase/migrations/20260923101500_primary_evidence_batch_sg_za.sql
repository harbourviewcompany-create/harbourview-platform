-- Primary-source evidence batch 2: Singapore and South Africa.
-- Current first-party sources researched 2026-09-23.
-- Source hashes are intentionally not fabricated; source-engine capture is required
-- before these records can become executable claims.

insert into public.source_registry
(source_name,source_url,jurisdiction,country,iso,region,language,adapter,crawl_cadence,relevance_status,
 jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,regulator_class,notes)
values
('Singapore Central Narcotics Bureau — Anti-drug laws on cannabis','https://www.cnb.gov.sg/singapore-drug-situation/myths-and-facts-about-drugs/cannabis/singapore-s-anti-drug-laws-on-cannabis/','Singapore','Singapore','SG','Asia','en','html_snapshot','monthly','active','SG',1,false,'government_regulator',true,'drug_control_authority','Current July 2026 CNB statement identifies cannabis as a Class A controlled drug and describes prohibitions on trafficking, possession, consumption, import and export.'),
('Singapore Statutes Online — Misuse of Drugs Act 1973','https://sso.agc.gov.sg/Act/MDA1973','Singapore','Singapore','SG','Asia','en','html_snapshot','weekly','active','SG',1,false,'government_legislation',true,'legislature','Current version as of September 2026 includes offences for trafficking, manufacture, import/export, possession/consumption and cultivation of cannabis.'),
('South African Health Products Regulatory Authority — Cannabis licensing','https://www.sahpra.org.za/cannabis-licensing/','South Africa','South Africa','ZA','Africa','en','html_snapshot','monthly','active','ZA',1,false,'government_regulator',true,'health_authority','SAHPRA states its cannabis cultivation licensing mandate is limited to medicinal/research purposes and does not authorize non-medicinal commercial cultivation.'),
('South African Health Products Regulatory Authority — Licence application process','https://www.sahpra.org.za/licence-application-process/','South Africa','South Africa','ZA','Africa','en','html_snapshot','monthly','active','ZA',1,false,'government_regulator',true,'health_authority','Current SAHPRA licensing materials include a licence application to cultivate, manufacture or import cannabis for medicinal purposes and a current cultivation guideline.')
on conflict (source_url) do update set
  is_active=true,
  jurisdiction_code=excluded.jurisdiction_code,
  tier=excluded.tier,
  notes=excluded.notes,
  updated_at=now();

-- Recovery replay: retire older active direct evidence before the newer
-- authoritative SG/ZA rows are installed.
update public.regulatory_market_access_evidence
set active=false
where jurisdiction_iso2 in ('SG','ZA')
  and active=true
  and parent_iso2 is null;

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-sg-cnb-cannabis-20260923','SG','prohibited',
 'Singapore''s Central Narcotics Bureau states that cannabis is a Class A controlled drug under the Misuse of Drugs Act and that trafficking, possession, consumption, import and export are offences. The current Singapore Statutes Online version also contains a specific offence for cultivation of cannabis. No general commercial cannabis pathway is established by the current statutory and regulator sources.',
 'Singapore Central Narcotics Bureau',
 'https://www.cnb.gov.sg/singapore-drug-situation/myths-and-facts-about-drugs/cannabis/singapore-s-anti-drug-laws-on-cannabis/',
 '2026-07-03',now(),'2027-03-23',true),

('primary-evidence-za-sahpra-medical-cannabis-20260923','ZA','medical_limited_trade',
 'SAHPRA''s current licensing materials provide an application pathway to cultivate, manufacture or import cannabis for medicinal purposes, and its cultivation guideline states that medicinal cultivation and manufacture require SAHPRA licensing and Department of Health permits. SAHPRA also states that it does not issue licences for non-medicinal commercial cannabis cultivation. The 2026 Justice Department implementation statement separately confirms that commercial cultivation, buying and selling are outside the private-use Act and are being addressed by other departments. The evidence therefore supports a medical/research commercial pathway, not general adult-use commercial retail.',
 'South African Health Products Regulatory Authority (SAHPRA)',
 'https://www.sahpra.org.za/licence-application-process/',
 '2026-04-13',now(),'2027-03-23',true)
on conflict (evidence_key) do update set
  tier=excluded.tier,
  rationale=excluded.rationale,
  authority_name=excluded.authority_name,
  authority_url=excluded.authority_url,
  source_effective_date=excluded.source_effective_date,
  verified_at=excluded.verified_at,
  expires_at=excluded.expires_at,
  active=true;

-- Recovery replay: regulatory_market_access_evidence has no UUID id column
-- in the reconstructed schema, so no compatible regulatory_citations.entity_id
-- can be fabricated. Provenance remains on the evidence rows themselves.
