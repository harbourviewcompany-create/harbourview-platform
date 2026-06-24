INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'PT',
  'Portugal',
  'moderate',
  10,
  '€150K–€500K',
  'Portugal has a well-established medical cannabis framework and is one of Europe''s leading cannabis export nations. Law 33/2018 authorised the use of cannabis-based medicines. Decree-Law 8/2019 established the licensing framework for cultivation and production of cannabis for medicinal and scientific purposes. INFARMED (National Authority of Medicines and Health Products) is the primary regulator. Portugal permits EU-GMP certified manufacturers to produce cannabis for domestic use and export. INFARMED issues cultivation, production (extraction/manufacture), research, and import/export licences. Portugal has attracted significant investment from international cannabis companies due to its favourable climate, EU membership, EU-GMP infrastructure, and export-friendly regulations. Several EU-GMP certified facilities now operate in Portugal. Portugal is a primary export hub for medical cannabis to Germany, the UK, and Australia.',
  '[
    {"step": 1, "title": "Identify INFARMED-licensed Portuguese operator", "description": "For export-from-Portugal strategy: Partner with an INFARMED-licensed Portuguese cultivator/manufacturer with EU-GMP certification and export authorisation. Portugal has 15+ licensed operators as of 2024. Evaluate production capacity, product portfolio (flower, extract, API), EU-GMP scope, and existing customer relationships in target markets. For import-to-Portugal strategy: identify a Portuguese wholesaler with INFARMED import licence.", "estimated_weeks": 6, "required": true},
    {"step": 2, "title": "Apply for INFARMED cannabis licence (if establishing in Portugal)", "description": "INFARMED issues licences for: (1) Cultivation, (2) Production (extraction/transformation), (3) Import/Export, (4) Research. Applications submitted to INFARMED Cannabis Unit. Required: facility details, security plan, quality management system, qualified persons identification. INFARMED processing: 6-9 months. Licence types can be combined. Portugal actively encourages new licence applications.", "estimated_weeks": 36, "required": false},
    {"step": 3, "title": "Obtain EU-GMP certification from INFARMED or EMA network", "description": "EU-GMP certification is mandatory for export to EU markets. INFARMED conducts GMP inspections and issues GMP certificates valid across the EU. Initial GMP inspection from a greenfield facility: 12-18 months from application. INFARMED has a reputation for thorough, efficient GMP inspections. GMP certificate is required before any commercial export.", "estimated_weeks": 20, "required": true},
    {"step": 4, "title": "Apply for INFARMED export authorisation", "description": "Each export requires an INFARMED export authorisation. Required: EU-GMP certificate, destination country import authorisation, product specification, quantity. INFARMED processes export authorisations within 20 business days. INCB import/export certificates required for Schedule I substances. Portugal has bilateral cooperation agreements with Germany, UK, and Australia that streamline procedures.", "estimated_weeks": 4, "required": true},
    {"step": 5, "title": "Leverage Portugal''s EU hub advantages", "description": "Portugal''s EU membership enables seamless intra-EU shipments under EU-GMP mutual recognition. Products with EU marketing authorisation can be shipped to any EU member state without separate national authorisations. Portuguese costs (labour, land) are lower than northern European competitors. Portugal''s Atlantic climate supports year-round outdoor cultivation with lower energy costs.", "estimated_weeks": 2, "required": false},
    {"step": 6, "title": "Establish Portuguese distribution and quality infrastructure", "description": "Portugal has a mature pharmaceutical distribution network. Engage a Portuguese 3PL with EU-GDP certification and controlled substance handling experience. Lisbon (LIS) and Porto (OPO) airports are primary export hubs. Portuguese logistics costs are competitive. Ensure QP batch release can be performed in Portugal or under an EU QP agreement.", "estimated_weeks": 4, "required": true}
  ]'::jsonb,
  '[
    {"name": "INFARMED (National Authority of Medicines and Health Products)", "role": "Primary cannabis regulator: issues all cannabis licences (cultivation, production, import/export), conducts GMP inspections, issues GMP certificates", "website": "https://www.infarmed.pt", "country": "PT"},
    {"name": "SICAD (General Directorate for Intervention on Addictive Behaviours)", "role": "Coordinates national drug policy; relevant for research and public health aspects of cannabis", "website": "https://www.sicad.pt", "country": "PT"},
    {"name": "AT (Tax and Customs Authority)", "role": "Export customs clearance for controlled substances including cannabis", "website": "https://www.portaldasfinancas.gov.pt", "country": "PT"},
    {"name": "AICEP Portugal Global", "role": "Portuguese investment and trade agency; provides support for foreign investors establishing cannabis operations in Portugal", "website": "https://www.portugalglobal.pt", "country": "PT"}
  ]'::jsonb,
  ARRAY[
    'EU-GMP certification from greenfield takes 12-18 months; plan capital and timeline accordingly',
    'INFARMED licence processing of 6-9 months means market entry timeline of 18-24 months minimum for new establishments',
    'Portugal is primarily an export hub, not a large domestic market; business model should focus on EU and global export',
    'Bilateral cooperation with Germany, UK, and Australia provides procedural advantages; leverage these relationships',
    'Portuguese labour and land costs are competitive but EU-GMP infrastructure investment is still significant',
    'INFARMED export authorisation per shipment requires destination country permit in advance; coordinate with importers early'
  ],
  'published',
  '2026-06-22'
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name             = EXCLUDED.country_name,
  difficulty               = EXCLUDED.difficulty,
  typical_timeline_months  = EXCLUDED.typical_timeline_months,
  estimated_cost_range     = EXCLUDED.estimated_cost_range,
  legal_framework_summary  = EXCLUDED.legal_framework_summary,
  steps                    = EXCLUDED.steps,
  key_regulators           = EXCLUDED.key_regulators,
  common_pitfalls          = EXCLUDED.common_pitfalls,
  status                   = EXCLUDED.status,
  last_reviewed            = EXCLUDED.last_reviewed,
  updated_at               = now();
