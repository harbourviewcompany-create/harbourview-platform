-- Primary-source evidence batch: Australia, Morocco, Lesotho.
-- Researched 2026-09-23 from government/regulator sources.
-- Source hashes are deliberately absent until source-engine capture.

insert into public.source_registry
(source_name,source_url,jurisdiction,country,iso,region,language,adapter,crawl_cadence,relevance_status,
 jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,regulator_class,notes)
values
('Australia Office of Drug Control — Grow, produce or manufacture cannabis','https://www.odc.gov.au/medicinal-cannabis/grow-produce-or-manufacture-cannabis-australia','Australia','Australia','AU','Oceania','en','html_snapshot','monthly','active','AU',1,false,'government_regulator',true,'national_drug_authority','Current ODC guidance, updated 30 June 2026, requires a licence and permit to grow, produce or manufacture cannabis for medicinal or research purposes.'),
('Australia Office of Drug Control — Medicinal cannabis','https://www.odc.gov.au/medicinal-cannabis','Australia','Australia','AU','Oceania','en','html_snapshot','monthly','active','AU',1,false,'government_regulator',true,'national_drug_authority','ODC states medicinal cannabis cultivation, manufacture, import and export are tightly controlled and recreational cultivation/importation is prohibited.'),
('Morocco National Agency for the Regulation of Cannabis Activities — Law 13-21','https://www.anrac.gov.ma/fr/loi1321/','Morocco','Morocco','MA','Africa','fr','html_snapshot','monthly','active','MA',1,false,'government_regulator',true,'cannabis_regulator','ANRAC publishes Law 13-21 and implementing texts governing cultivation, nurseries, seed/plant import/export, processing, manufacturing, transport, marketing, packaging, labelling and controls.'),
('Morocco ANRAC — Frequently Asked Questions','https://www.anrac.gov.ma/en/faq/','Morocco','Morocco','MA','Africa','en','html_snapshot','monthly','active','MA',1,false,'government_regulator',true,'cannabis_regulator','Current ANRAC FAQ identifies authorized activities, authorized provinces, traceability, medical/pharmaceutical/industrial purposes, THC rules, marketing/export and authorization requirements.'),
('Lesotho Government — Morama Holdings cannabis licence','https://www.gov.ls/wp-content/uploads/2022/04/PRIME-MINISTERS-REMARKS-DURING-THE-OPENING-OF-MORAMA-HOLDINGS.-22.03.31.pdf','Lesotho','Lesotho','LS','Africa','en','html_snapshot','monthly','active','LS',1,false,'government_publication',true,'government','Government publication states Morama Holdings holds a full cannabinoid and hemp cultivation, manufacturing and export sales licence under section 12 of the Drugs Act 2008.'),
('Lesotho Government — cannabis investment licences','https://www.gov.ls/development/poverty-reduction-economic-growth-mcc/','Lesotho','Lesotho','LS','Africa','en','html_snapshot','quarterly','active','LS',1,false,'government_publication',true,'government','Government statement reports 12 operational cannabis investment licences and cannabis investments accessing European markets.')
on conflict (source_url) do update set
 is_active=true,jurisdiction_code=excluded.jurisdiction_code,tier=excluded.tier,notes=excluded.notes,updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-au-odc-medical-cannabis-20260923','AU','medical_limited_trade',
 'The Australian Office of Drug Control states that cultivation, production and manufacture of cannabis require a medicinal cannabis licence and relevant permits and must be for medicinal or scientific purposes. ODC also states medicinal cannabis cultivation, manufacture, import and export are tightly controlled and that cultivation/importation for recreational use is prohibited. This establishes a regulated medicinal/research commercial pathway, not a general adult-use commercial market.',
 'Australian Government Office of Drug Control',
 'https://www.odc.gov.au/medicinal-cannabis/grow-produce-or-manufacture-cannabis-australia',
 '2026-06-30',now(),'2027-03-23',true),
('primary-evidence-ma-anrac-licensed-cannabis-20260923','MA','medical_limited_trade',
 'Morocco''s ANRAC states that Law 13-21 authorizes cultivation and production, nurseries, seed and plant import/export, processing, manufacturing, transport, marketing, export and import of cannabis products. ANRAC states authorized products are for medical, pharmaceutical or industrial purposes and cultivation is geographically restricted to designated provinces. The framework therefore establishes a licensed commercial cannabis supply chain without establishing general adult-use retail.',
 'Morocco National Agency for the Regulation of Cannabis Activities (ANRAC)',
 'https://www.anrac.gov.ma/en/faq/',
 '2021-08-31',now(),'2027-03-23',true),
('primary-evidence-ls-cannabis-licensing-20260923','LS','medical_limited_trade',
 'Lesotho government publications document a licensed cannabis cultivation, manufacturing and export sector. A Prime Minister''s Office publication states Morama Holdings holds a cannabinoid and hemp cultivation, manufacturing and export sales licence under section 12 of the Drugs Act 2008, while a government statement reports 12 operational cannabis investment licences and access to European markets. The cited evidence supports regulated commercial cultivation/manufacturing/export, but does not establish a general domestic adult-use retail pathway.',
 'Government of Lesotho',
 'https://www.gov.ls/wp-content/uploads/2022/04/PRIME-MINISTERS-REMARKS-DURING-THE-OPENING-OF-MORAMA-HOLDINGS.-22.03.31.pdf',
 '2022-03-31',now(),'2027-03-23',true)
on conflict (evidence_key) do update set
 tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,authority_url=excluded.authority_url,
 source_effective_date=excluded.source_effective_date,verified_at=excluded.verified_at,expires_at=excluded.expires_at,active=true;

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'regulatory_market_access_evidence',e.id,
 case e.jurisdiction_iso2
  when 'AU' then 'Office of Drug Control medicinal cannabis licensing framework'
  when 'MA' then 'ANRAC Law 13-21 / authorized cannabis activities'
  when 'LS' then 'Lesotho Government cannabis cultivation, manufacturing and export licence'
 end,
 null,'official',e.authority_url,e.source_effective_date,current_date,e.rationale
from public.regulatory_market_access_evidence e
where e.evidence_key in (
 'primary-evidence-au-odc-medical-cannabis-20260923',
 'primary-evidence-ma-anrac-licensed-cannabis-20260923',
 'primary-evidence-ls-cannabis-licensing-20260923'
)
and not exists (
 select 1 from public.regulatory_citations r
 where r.entity_type='regulatory_market_access_evidence'
 and r.entity_id=e.id and r.citation_url=e.authority_url
);
