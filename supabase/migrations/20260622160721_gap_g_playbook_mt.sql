INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'MT',
  'Malta',
  'moderate',
  9,
  '€120K–€450K',
  'Malta became the first EU member state to legalise adult-use cannabis in December 2021 (Act LII of 2021). The Malta Authority for the Responsible Use of Cannabis (ARUC) oversees the adult-use sector, including non-profit cannabis associations (maximum 500 members each). The Malta Medicines Authority (MMA) regulates medicinal cannabis products. Medical cannabis falls under the Medicines Act and requires MMA product registration. Malta is an EU member, meaning EU-GMP applies to all medicinal cannabis manufacturing. Importers must hold an MMA import licence. Malta''s small domestic market (population ~530,000) limits commercial scale, but its EU membership makes it a potential EU regulatory gateway for non-EU manufacturers seeking a European regulatory foothold. Malta has actively promoted itself as a European cannabis regulatory hub.',
  '[
    {"step": 1, "title": "Determine pathway: medical (MMA) vs. adult-use (ARUC)", "description": "Malta has distinct regulatory pathways for medicinal cannabis (MMA) and adult-use cannabis (ARUC). Medical pathway: full product registration, import licence, prescription requirement. Adult-use pathway: non-profit associations only, no commercial import permitted. For commercial export-to-Malta or EU gateway strategy, medical pathway is the relevant track.", "estimated_weeks": 2, "required": true},
    {"step": 2, "title": "Identify MMA-licensed Maltese importer", "description": "Engage a Maltese pharmaceutical wholesaler holding an MMA Wholesale Dealer Authorisation (WDA) and a controlled substance import licence. Malta has a small pharmaceutical sector; engage early as licensed importers are limited. The importer will act as the marketing authorisation holder or authorised representative.", "estimated_weeks": 6, "required": true},
    {"step": 3, "title": "Apply for MMA product registration or named-patient authorisation", "description": "Full MMA marketing authorisation follows EU procedures (national, mutual recognition, or decentralised). Processing: 12-18 months for full registration. Named-patient authorisation (similar to EU unlicensed use) is available for individual patients on prescription. For market entry, named-patient route is faster. Engage a Maltese regulatory affairs consultant for MMA submission.", "estimated_weeks": 16, "required": true},
    {"step": 4, "title": "Obtain EU-GMP certification and MMA import licence", "description": "EU-GMP is mandatory. MMA accepts EU-GMP certificates from any EU member state NCA. For non-EU manufacturers, apply for MMA GMP site clearance. MMA import licence application requires: manufacturer GMP certificate, product registration, importer WDA, controlled substance handling authorisation. Processing: 8-12 weeks.", "estimated_weeks": 12, "required": true},
    {"step": 5, "title": "Leverage Malta as EU regulatory gateway", "description": "Malta''s MMA participates in EU mutual recognition procedures (MRP) and decentralised procedures (DCP). A Maltese marketing authorisation can be extended to other EU member states via MRP/DCP without a full new application. This makes Malta an attractive reference member state for EU-wide cannabis product registration strategies. Engage a European regulatory affairs firm with MRP/DCP expertise.", "estimated_weeks": 8, "required": false},
    {"step": 6, "title": "Navigate ARUC framework if pursuing adult-use angle", "description": "ARUC-regulated cannabis associations are non-profit, membership-based, and cannot commercially import. Foreign companies cannot directly participate in the adult-use market. However, monitor ARUC framework evolution as Malta may develop commercial adult-use regulations in future. This step is for intelligence gathering only.", "estimated_weeks": 2, "required": false}
  ]'::jsonb,
  '[
    {"name": "MMA (Malta Medicines Authority)", "role": "Regulates medicinal cannabis: product registration, import licences, GMP oversight, wholesale dealer authorisations", "website": "https://medicinesauthority.gov.mt", "country": "MT"},
    {"name": "ARUC (Authority for the Responsible Use of Cannabis)", "role": "Regulates adult-use cannabis associations under Act LII of 2021", "website": "https://aruc.gov.mt", "country": "MT"},
    {"name": "Health Department Malta", "role": "Policy oversight of cannabis regulation; import/export of controlled substances under Dangerous Drugs Ordinance", "website": "https://deputyprimeminister.gov.mt/en/health", "country": "MT"}
  ]'::jsonb,
  ARRAY[
    'Maltese domestic market is small (~530K population); commercial viability depends on EU gateway strategy',
    'Limited number of MMA-licensed cannabis importers; engage early as capacity may be constrained',
    'Adult-use ARUC framework does not permit commercial imports; medical pathway is the only commercial route',
    'MMA mutual recognition strategy requires initial full dossier investment; ensure clinical data meets EMA standards',
    'Malta''s English-language regulatory environment and EU membership make it accessible; leverage for EU-wide strategy',
    'ARUC adult-use framework may evolve commercially; monitor for future opportunities'
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
