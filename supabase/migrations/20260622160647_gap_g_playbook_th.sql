INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'TH',
  'Thailand',
  'moderate',
  10,
  '$150K–$500K',
  'Thailand made history in June 2022 by removing cannabis from its narcotics list under the Narcotic Plants Act, making it the first Asian country to broadly liberalise cannabis. However, the regulatory framework remains in flux. The Thai FDA (TFDA) under the Ministry of Public Health regulates cannabis extracts with THC >0.2% as controlled substances. Cannabis flower (inflorescences) are controlled separately. Medical cannabis products require TFDA registration. The government has issued licences for cultivation, extraction, and manufacture. Thailand aims to become an ASEAN medical cannabis hub. As of 2024, recreational use remains restricted to medical and wellness purposes; the Thai government has indicated it intends to restrict adult-use and focus on medical/wellness tourism. Import and export of cannabis are regulated under TFDA oversight. Foreign investment in the Thai cannabis sector is permitted through BOI-promoted structures.',
  '[
    {"step": 1, "title": "Assess current regulatory status and obtain Thai legal counsel", "description": "Thai cannabis regulations are evolving rapidly. Engage a Bangkok-based regulatory attorney with current TFDA experience before committing capital. Verify current status of: cannabis flower classification, THC/CBD threshold updates, import/export regulations, and any new government policies since 2024. Regulatory position as of filing date may differ from current reality.", "estimated_weeks": 4, "required": true},
    {"step": 2, "title": "Identify TFDA-licensed Thai partner or establish Thai entity", "description": "Foreign companies must either partner with a TFDA-licensed Thai operator or establish a Thai entity. Foreign ownership restrictions may apply under the Foreign Business Act (FBA). BOI promotion may exempt certain cannabis businesses from FBA restrictions. Partner selection should consider TFDA licence scope, manufacturing capacity, and GMP status.", "estimated_weeks": 8, "required": true},
    {"step": 3, "title": "Register cannabis products with TFDA", "description": "Cannabis-derived products with THC >0.2% require TFDA registration as controlled substances. Extracts, tinctures, and pharmaceutical preparations require full product registration including clinical safety data. CBD products below THC threshold have a streamlined registration path. TFDA processing: 6-12 months for full registration.", "estimated_weeks": 20, "required": true},
    {"step": 4, "title": "Obtain TFDA import/export authorisation", "description": "Cannabis import/export requires TFDA authorisation under the Narcotic Plants Act and the Drug Act. For imports: product registration, manufacturer GMP certificate, importer licence. For exports: Thai manufacturer licence, TFDA export permit, destination country import authorisation. INCB procedures apply for international shipments. TFDA processes permits within 30-60 days.", "estimated_weeks": 8, "required": true},
    {"step": 5, "title": "Leverage BOI investment incentives", "description": "The Board of Investment (BOI) promotes medical cannabis businesses with incentives: corporate tax exemption (3-8 years), import duty exemption on machinery, and FBA exemption enabling majority foreign ownership. Apply for BOI promotion under Category 7.34 (medical cannabis) or relevant category. BOI application processing: 3-6 months. BOI promotion significantly reduces establishment costs.", "estimated_weeks": 16, "required": false},
    {"step": 6, "title": "Build Thai medical community and wellness tourism strategy", "description": "Thailand''s medical cannabis market is driven by wellness tourism (cannabis clinics, integrated health tourism) and domestic medical prescriptions. Build relationships with Thai medical practitioners and cannabis clinics. Engage Thai traditional medicine practitioners (TTM) for formulation opportunities. Wellness tourism channel offers faster revenue than pharmaceutical registration.", "estimated_weeks": 8, "required": false}
  ]'::jsonb,
  '[
    {"name": "TFDA (Thai Food and Drug Administration)", "role": "Regulates cannabis products: product registration, import/export permits, manufacturer licensing under Ministry of Public Health", "website": "https://www.fda.moph.go.th", "country": "TH"},
    {"name": "Ministry of Public Health (MOPH)", "role": "Policy oversight of cannabis regulation; issues Ministerial Notifications updating cannabis classification", "website": "https://www.moph.go.th", "country": "TH"},
    {"name": "BOI (Board of Investment)", "role": "Investment promotion including tax incentives and FBA exemptions for medical cannabis businesses", "website": "https://www.boi.go.th", "country": "TH"},
    {"name": "Customs Department Thailand", "role": "Export/import customs clearance for cannabis and controlled substances", "website": "https://www.customs.go.th", "country": "TH"}
  ]'::jsonb,
  ARRAY[
    'Thai cannabis regulations changed rapidly since 2022; always verify current regulatory status before proceeding',
    'Government policy direction on recreational vs medical use is unstable; focus on medical/wellness positioning',
    'Foreign Business Act restrictions on foreign ownership may apply; BOI promotion or Thai partnership is typically required',
    'TFDA product registration for THC-containing products requires clinical data which can be expensive and time-consuming',
    'Wellness tourism channel offers faster market entry than pharmaceutical registration but lower scale',
    'BOI application processing adds 3-6 months; begin early to capture tax incentives'
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
