INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'DE',
  'Germany',
  'very_high',
  18,
  '€500K–€2M+ first year',
  'Germany distinguishes between medical cannabis (governed by the Betäubungsmittelgesetz/BtMG and the 2024 Cannabisgesetz/CanG) and the 2024 non-medical adult-use framework. Medical cannabis imports require a BfArM narcotic import authorisation under §3 BtMG. All medicinal products must comply with EU-GMP (EudraLex Vol. 4). Exporters based outside the EU must hold a GMP certificate recognised by the relevant EU competent authority plus an export permit from their country of origin (e.g. DEA Form 161 for US exporters). German wholesale and distribution requires a Wholesale Distribution Authorisation (WDA) held by the local importer. Products must meet German Arzneimittelgesetz (AMG) packaging and labelling requirements, including German-language patient information leaflets. The 2024 CanG introduced a social-club (Anbauvereinigungen) adult-use framework but does not create a commercial import pathway for non-medical cannabis.',
  '[
    {"step": 1, "title": "Identify German importer/distributor partner", "description": "Engage a German pharmaceutical wholesaler holding both a WDA and a BtM handling authorisation.", "estimated_weeks": 8, "required": true},
    {"step": 2, "title": "Obtain EU-GMP certificate for manufacturing site", "description": "Commission an EU-GMP audit of the origin manufacturing site.", "estimated_weeks": 24, "required": true},
    {"step": 3, "title": "Apply for BfArM §3 BtMG narcotic import authorisation", "description": "The German importer submits the import authorisation application to BfArM.", "estimated_weeks": 16, "required": true},
    {"step": 4, "title": "Register product or confirm dispensing pathway", "description": "Confirm with German importer which pathway applies to the product form.", "estimated_weeks": 12, "required": true},
    {"step": 5, "title": "Establish quality agreement and batch release process", "description": "Execute a Quality Technical Agreement (QTA) between exporting manufacturer and German QP.", "estimated_weeks": 6, "required": true},
    {"step": 6, "title": "Execute first commercial shipments under validated cold chain", "description": "Obtain per-shipment INCB import/export certificates.", "estimated_weeks": 4, "required": true}
  ]'::jsonb,
  '[
    {"name": "BfArM", "role": "Primary regulator for narcotic import authorisations", "website": "https://www.bfarm.de", "country": "DE"},
    {"name": "Paul-Ehrlich-Institut (PEI)", "role": "Regulates biological medicinal products", "website": "https://www.pei.de", "country": "DE"},
    {"name": "BAFA", "role": "German export licensing authority", "website": "https://www.bafa.de", "country": "DE"},
    {"name": "ZLG", "role": "Coordinates GMP inspections across German Länder", "website": "https://www.zlg.de", "country": "DE"}
  ]'::jsonb,
  ARRAY[
    'BfArM processing delays frequently exceed published 12-week timelines',
    'Batch release failures due to EU-GMP non-conformances',
    'Distributor exclusive territory conflicts',
    'German-specific packaging and labelling rules under AMG §10–11',
    'CanG 2024 adult-use clubs do not create a commercial import pathway',
    'Import authorisation is product- and importer-specific'
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
