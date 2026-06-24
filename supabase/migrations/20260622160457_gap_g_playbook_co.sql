INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'CO',
  'Colombia',
  'moderate',
  8,
  '$80K–$300K',
  'Colombia is one of the world''s leading cannabis export markets, with a favourable regulatory framework under Law 1787 of 2016 and Decree 613 of 2017, regulated by the Ministry of Justice and Law (MinJusticia) and the Ministry of Health (MinSalud). The Colombian Institute for Drug Surveillance (INVIMA) oversees cannabis-derived products for therapeutic use. Colombia distinguishes between psychoactive cannabis (THC >1%) and non-psychoactive cannabis (THC ≤1%). Licences are issued for cultivation (seeds, cuttings, plants), manufacture of cannabis derivatives, and export. Colombia has positioned itself as a low-cost producer for the global medical cannabis market. Export volumes have grown significantly since 2019. Colombian companies may export dried flower, extracts, and APIs. The regulatory framework is considered among the most export-friendly globally.',
  '[
    {"step": 1, "title": "Identify licensed Colombian export partner or establish local entity", "description": "Engage a MinJusticia-licensed cannabis company with active export authorisation. Colombian export licences are company-specific; foreign companies typically partner with or acquire Colombian licensed entities rather than applying directly. Verify licence scope: psychoactive vs non-psychoactive, cultivation vs manufacture, and export authorisation status. Colombia has 30+ licensed exporters as of 2024.", "estimated_weeks": 6, "required": true},
    {"step": 2, "title": "Register product with INVIMA for export", "description": "Cannabis-derived products for therapeutic use must be registered with INVIMA. For export, INVIMA issues a Certificate of Free Sale (CFS) confirming the product is legally manufactured and marketed in Colombia. The CFS is required by most destination country regulators. INVIMA registration processing: 3-6 months for new products.", "estimated_weeks": 16, "required": true},
    {"step": 3, "title": "Apply for MinJusticia export authorisation per shipment", "description": "Each export shipment requires an export authorisation (cupo de exportación) from MinJusticia. Required: INVIMA registration, destination country import permit, product details, quantity. MinJusticia coordinates with INCB for international shipment certificates. Processing: 4-6 weeks per shipment. Plan export pipeline to manage permit lead times.", "estimated_weeks": 6, "required": true},
    {"step": 4, "title": "Ensure BPM/GMP compliance for Colombian manufacturing", "description": "Colombian manufacturers must comply with Colombian GMP (BPM - Buenas Prácticas de Manufactura) under INVIMA oversight. For European market access, EU-GMP certification is additionally required. INVIMA inspects manufacturing facilities periodically. Ensure batch records, SOPs, and quality systems meet both Colombian BPM and destination country GMP requirements.", "estimated_weeks": 12, "required": true},
    {"step": 5, "title": "Establish export logistics from Colombia", "description": "Colombian cannabis exports typically route through Bogotá El Dorado International Airport (BOG). DIAN (Colombian Customs) manages export clearance for controlled substances. Cold chain logistics must meet product specifications. Engage a Colombian freight forwarder with experience in controlled substance exports. Ensure all INCB documentation is complete before customs submission.", "estimated_weeks": 3, "required": true},
    {"step": 6, "title": "Manage FTA advantages and pricing strategy", "description": "Colombia has Free Trade Agreements with the EU (in force since 2013), the US, Canada, and other markets. These FTAs may reduce tariffs on cannabis derivatives. Consult with Colombian trade counsel to determine applicable FTA tariff codes and rules of origin requirements. Colombian production cost advantages can be significant vs other producing countries.", "estimated_weeks": 4, "required": false}
  ]'::jsonb,
  '[
    {"name": "MinJusticia (Ministry of Justice and Law)", "role": "Issues cannabis cultivation, manufacture, and export licences under Law 1787/2016", "website": "https://www.minjusticia.gov.co", "country": "CO"},
    {"name": "INVIMA (Colombian Institute for Drug Surveillance)", "role": "Regulates cannabis-derived therapeutic products: registration, CFS issuance, GMP inspection", "website": "https://www.invima.gov.co", "country": "CO"},
    {"name": "MinSalud (Ministry of Health)", "role": "Policy oversight of medical cannabis therapeutic use and clinical guidelines", "website": "https://www.minsalud.gov.co", "country": "CO"},
    {"name": "DIAN (Colombian Customs Authority)", "role": "Export customs clearance for cannabis products; enforces controlled substance export controls", "website": "https://www.dian.gov.co", "country": "CO"}
  ]'::jsonb,
  ARRAY[
    'INVIMA product registration can take 3-6 months; begin before confirming export contracts',
    'MinJusticia export authorisation per shipment adds 4-6 weeks to each export cycle; plan accordingly',
    'EU-GMP certification is required for European markets but not mandatory under Colombian law; budget for dual compliance',
    'Colombian partner exclusivity demands can be aggressive; negotiate carefully on territory and duration',
    'Currency risk (COP/USD volatility) affects pricing stability; consider USD-denominated contracts',
    'Political and regulatory environment changes can affect licence validity; maintain close relationships with MinJusticia'
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
