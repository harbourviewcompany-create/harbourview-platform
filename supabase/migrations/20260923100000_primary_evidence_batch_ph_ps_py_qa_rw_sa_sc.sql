-- Primary-source evidence batch: 291-jurisdiction depth tranche, 2026-09-23.
-- Scope: current jurisdiction-specific regulatory evidence only.
-- No source snapshot hashes are invented here. Rows remain non-executable until the
-- source engine captures and hashes the cited first-party sources.
-- Research sources verified against current first-party government/regulator pages:
-- Philippines DDB/FDA, Palestine MOH, Paraguay SENAD, Qatar MOI/Customs,
-- Rwanda FDA, Saudi Umm al-Qura/SFDA, Seychelles State House.
--
-- Product classification remains the Harbourview commercial market-access ontology.
-- Conflicting/incomplete source states must remain unresolved rather than inferred.

insert into public.source_registry
(source_name,source_url,jurisdiction,country,iso,region,language,adapter,crawl_cadence,relevance_status,
 jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,regulator_class,notes)
values
('Philippines Dangerous Drugs Board — Joint DDB-PDEA cannabis reclassification statement','https://ddb.gov.ph/joint-ddb-pdea-statement-on-the-reclassification-of-cannabis/','Philippines','Philippines','PH','Asia','en','html_snapshot','monthly','active','PH',1,false,'government_regulator',true,'national_drug_authority','Current DDB/PDEA statement confirms cannabis remains a dangerous drug and unauthorized cultivation, possession, use, sale, administration, dispensation, delivery, distribution and transport remain punishable.'),
('Palestine Ministry of Health — Laws','https://www.moh.gov.ps/portal/laws/','Palestine','Palestine','PS','Asia','ar','html_snapshot','monthly','active','PS',1,false,'government_regulator',true,'health_ministry','Ministry of Health legal index lists Law No. 7 of 2013 on narcotic drugs and psychotropic substances.'),
('Paraguay SENAD — Registro y Fiscalización','https://senad.gov.py/registro-y-fiscalizacion/','Paraguay','Paraguay','PY','Americas','es','html_snapshot','monthly','active','PY',1,false,'government_regulator',true,'national_drug_authority','Current 2026 SENAD page publishes registration forms for industrial hemp and medicinal cannabis and transport documentation.'),
('Qatar Ministry of Interior — Drug Enforcement Department','https://portal.moi.gov.qa/wps/portal/MOIInternet/departmentcommittees/drugenforcement/','Qatar','Qatar','QA','Asia','ar','html_snapshot','monthly','active','QA',1,false,'government_regulator',true,'national_drug_authority','Current MOI narcotics law states import, export, production, manufacture, cultivation, possession, trade and related activity are prohibited except under statutory conditions.'),
('Rwanda FDA — Guidelines for Importation and Exportation of Pharmaceutical Products','https://rwandafda.gov.rw/monitoring-tool/documents-management/uploads/1/Guidelines/1776078758_Guidelines%20for%20Importation%20and%20Exportation%20of%20Pharmaceutical%20Products.pdf','Rwanda','Rwanda','RW','Africa','en','html_snapshot','monthly','active','RW',1,false,'government_regulator',true,'health_regulator','Current Rwanda FDA guidance expressly provides cannabis/cannabis-product import/export licensing and cultivation/manufacturing eligibility for medical or research purposes.'),
('Saudi Arabia Umm al-Qura — Narcotic and psychotropic schedules','https://www.uqn.gov.sa/decisions-and-regulations/4001776','Saudi Arabia','Saudi Arabia','SA','Asia','ar','html_snapshot','monthly','active','SA',1,false,'government_regulator',true,'health_regulator','Current 2026 controlled-substance schedule expressly lists cannabis, cannabis resin, extracts and tinctures; herbal-source CBD compounds are generally prohibited except specified fully synthetic/approved pharmaceutical conditions.'),
('Seychelles State House — government position on recreational marijuana','https://www.statehouse.gov.sc/news/6726/state-house-clarifies-presidential-pardons-drug-policy-security-matters-and-related-issues','Seychelles','Seychelles','SC','Africa','en','html_snapshot','monthly','active','SC',1,false,'government_regulator',true,'executive_government','Government statement says no decision has been taken to legalize recreational marijuana; medical perspective is separately discussed.')
on conflict (source_url) do update set
  is_active=true,
  jurisdiction_code=excluded.jurisdiction_code,
  tier=excluded.tier,
  notes=excluded.notes,
  updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-ph-ddb-cannabis-20260923','PH','prohibited',
 'The Philippine Dangerous Drugs Board and PDEA state that cannabis remains a dangerous drug under Republic Act No. 9165 and that cultivation, possession, use, sale, administration, dispensation, delivery, distribution and transportation remain punishable. The April 2026 DDB statement also describes medical-cannabis legalization as an evolving policy discussion rather than an enacted general commercial pathway. No general commercial cannabis market-access pathway is established by the cited current government sources.',
 'Philippines Dangerous Drugs Board / Philippine Drug Enforcement Agency',
 'https://ddb.gov.ph/joint-ddb-pdea-statement-on-the-reclassification-of-cannabis/',
 '2026-04-29',now(),'2027-03-23',true),

('primary-evidence-ps-moh-narcotics-2013-20260923','PS','prohibited',
 'The Palestinian Ministry of Health current laws index identifies Law No. 7 of 2013 on narcotic drugs and psychotropic substances. The Ministry also publishes the applicable dangerous-drugs framework prohibiting unauthorized cultivation, manufacture, possession and trafficking of controlled drugs, including cannabis. No general commercial cannabis pathway is established by the cited Ministry sources; the jurisdiction remains unresolved for any specialized medical/research exception beyond the controlled-drug framework.',
 'Palestine Ministry of Health',
 'https://www.moh.gov.ps/portal/laws/',
 '2013-01-01',now(),'2027-03-23',true),

('primary-evidence-py-senad-medicinal-cannabis-20260923','PY','medical_limited_trade',
 'Paraguay''s National Anti-Drug Secretariat (SENAD) currently publishes 2026 registration and fiscal-control forms specifically for medicinal cannabis, including registration of medicinal cannabis and transport documentation, while its legal framework separately addresses industrial non-psychoactive hemp. The cited first-party source therefore supports a regulated medicinal/commercial-control pathway, not general adult-use retail access.',
 'Paraguay Secretaría Nacional Antidrogas (SENAD)',
 'https://senad.gov.py/registro-y-fiscalizacion/',
 '2026-01-01',now(),'2027-03-23',true),

('primary-evidence-qa-moi-controlled-cannabis-20260923','QA','prohibited',
 'Qatar''s Ministry of Interior Drug Enforcement Department states that narcotic drugs and dangerous psychotropic substances are subject to prohibitions covering import, export, production, manufacture, cultivation, possession, trade, purchase, sale, transport and delivery except where permitted under the law. The current government-controlled schedule framework does not establish a general commercial cannabis market pathway.',
 'Qatar Ministry of Interior — Drug Enforcement Department',
 'https://portal.moi.gov.qa/wps/portal/MOIInternet/departmentcommittees/drugenforcement/',
 '1998-01-01',now(),'2027-03-23',true),

('primary-evidence-rw-fda-medical-cannabis-20260923','RW','medical_limited_trade',
 'Rwanda FDA''s current pharmaceutical import/export guidance expressly provides regulatory pathways for cannabis and cannabis products for medical or research purposes. The guidance requires medical-cannabis product registration and identifies manufacturing/processing licences for finished cannabis products and cultivation licences for unprocessed cannabis, with controlled import/export licensing. This supports a regulated medical/research commercial pathway rather than general adult-use access.',
 'Rwanda Food and Drugs Authority',
 'https://rwandafda.gov.rw/monitoring-tool/documents-management/uploads/1/Guidelines/1776078758_Guidelines%20for%20Importation%20and%20Exportation%20of%20Pharmaceutical%20Products.pdf',
 '2026-05-01',now(),'2027-03-23',true),

('primary-evidence-sa-ummalqura-cannabis-20260923','SA','prohibited',
 'Saudi Arabia''s current controlled-substance schedules list cannabis, cannabis resin, extracts and tinctures as narcotic drugs. The September 2026 government publication also states that herbal-source CBD compounds are prohibited subject to narrow pharmaceutical exceptions. No general commercial cannabis cultivation, processing, retail or trade pathway is established by the cited current government schedule.',
 'Saudi Arabia Umm al-Qura / Ministry of Health and Saudi Food and Drug Authority joint schedule',
 'https://www.uqn.gov.sa/decisions-and-regulations/4001776',
 '2026-09-04',now(),'2027-03-23',true),

('primary-evidence-sc-government-marijuana-20260923','SC','prohibited',
 'The Seychelles State House reported the government position that no decision had been taken to legalize recreational marijuana. The cited current government statement does not establish a commercial adult-use pathway. Medical access requires separate primary-source adjudication before any narrower medical tier can be assigned.',
 'State House Seychelles — Office of the President',
 'https://www.statehouse.gov.sc/news/6726/state-house-clarifies-presidential-pardons-drug-policy-security-matters-and-related-issues',
 '2026-01-01',now(),'2027-03-23',true)
on conflict (evidence_key) do update set
  tier=excluded.tier,
  rationale=excluded.rationale,
  authority_name=excluded.authority_name,
  authority_url=excluded.authority_url,
  source_effective_date=excluded.source_effective_date,
  verified_at=excluded.verified_at,
  expires_at=excluded.expires_at,
  active=true;

-- Add explicit citation records tied to the newly adjudicated evidence.
insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select
  'regulatory_market_access_evidence',
  e.id,
  case e.jurisdiction_iso2
    when 'PH' then 'DDB/PDEA cannabis reclassification statement'
    when 'PS' then 'Palestine Ministry of Health narcotics-law index'
    when 'PY' then 'SENAD Registro y Fiscalización'
    when 'QA' then 'Qatar Drug Enforcement Department narcotics law'
    when 'RW' then 'Rwanda FDA pharmaceutical import/export guidance'
    when 'SA' then 'Umm al-Qura controlled-substance schedules'
    when 'SC' then 'State House Seychelles government statement'
  end,
  null,
  'official',
  e.authority_url,
  e.source_effective_date,
  current_date,
  e.rationale
from public.regulatory_market_access_evidence e
where e.evidence_key in (
  'primary-evidence-ph-ddb-cannabis-20260923',
  'primary-evidence-ps-moh-narcotics-2013-20260923',
  'primary-evidence-py-senad-medicinal-cannabis-20260923',
  'primary-evidence-qa-moi-controlled-cannabis-20260923',
  'primary-evidence-rw-fda-medical-cannabis-20260923',
  'primary-evidence-sa-ummalqura-cannabis-20260923',
  'primary-evidence-sc-government-marijuana-20260923'
)
and not exists (
  select 1 from public.regulatory_citations rc
  where rc.entity_type='regulatory_market_access_evidence'
    and rc.entity_id=e.id
    and rc.citation_url=e.authority_url
);

-- Preserve fail-closed execution semantics: these new rows have no captured
-- source hash yet, so the claim layer must remain partial until the source engine
-- captures the cited documents.
