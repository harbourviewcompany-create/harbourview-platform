INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'UY',
  'Uruguay',
  'high',
  18,
  '$200K–$800K',
  'Uruguay was the first country in the world to fully legalise and regulate adult-use cannabis nationally (Law 19.172, 2013). The regulatory framework is administered by the Institute for the Regulation and Control of Cannabis (IRCCA) under the National Drug Board (JND). Uruguay''s cannabis market is a closed domestic system: cannabis can only be accessed by Uruguayan residents through three channels: (1) licensed pharmacies, (2) cannabis clubs (membership associations), and (3) home growing. Foreigners and tourists cannot legally purchase cannabis. However, Uruguay also permits a medical/industrial cannabis sector with export potential. Law 19.172 and subsequent decrees allow IRCCA-licensed companies to cultivate and manufacture cannabis for export. Uruguay is positioned as a potential export hub to Europe, leveraging its agricultural infrastructure and low production costs.',
  '[
    {"step": 1, "title": "Understand the Uruguayan export framework", "description": "Uruguay permits cannabis exports under IRCCA licence. Export-oriented operations require a separate IRCCA export authorisation in addition to the cultivation/manufacturing licence. The Uruguayan government has been actively promoting cannabis exports since 2020. Engage a Uruguayan cannabis regulatory attorney to map current export licence requirements and any recent regulatory updates.", "estimated_weeks": 4, "required": true},
    {"step": 2, "title": "Identify or establish IRCCA-licensed Uruguayan partner", "description": "Partner with an IRCCA-licensed Uruguayan operator holding export authorisation. Alternatively, establish a Uruguayan subsidiary and apply for an IRCCA licence (processing time: 6-12 months). Uruguay has a small number of licensed operators with export capacity. Key operators include companies backed by international cannabis groups.", "estimated_weeks": 12, "required": true},
    {"step": 3, "title": "Apply for IRCCA export authorisation", "description": "The Uruguayan operator applies to IRCCA for export authorisation per product and destination. Required: destination country import permit, product specifications, manufacturing licence, quality certificates. IRCCA coordinates with the Uruguayan Ministry of Foreign Affairs for INCB procedures. Processing: 6-10 weeks.", "estimated_weeks": 10, "required": true},
    {"step": 4, "title": "Achieve GMP certification for Uruguayan manufacturing", "description": "Uruguayan manufacturers must comply with IRCCA quality standards. For European markets, EU-GMP certification is additionally required. The Uruguayan Ministry of Public Health (MSP) oversees pharmaceutical GMP. EU-GMP inspections of Uruguayan sites have been conducted by European NCAs. Budget 12-18 months for full EU-GMP certification from a Uruguayan facility.", "estimated_weeks": 24, "required": true},
    {"step": 5, "title": "Establish export logistics and customs", "description": "Uruguayan cannabis exports route through Montevideo Carrasco International Airport (MVD) or Montevideo port. Uruguay Customs (DNA) handles controlled substance export clearance. Engage a Uruguayan freight forwarder with experience in pharmaceutical export. Cold chain requirements must meet both Uruguayan and destination country standards.", "estimated_weeks": 3, "required": true},
    {"step": 6, "title": "Navigate bilateral trade and INCB procedures", "description": "Uruguay is an INCB signatory. All cannabis exports require INCB import/export authorisations. Uruguay''s bilateral cannabis trade agreements with Germany, Israel, and other markets streamline some procedures. Monitor IRCCA and JND policy updates as the export framework is still maturing.", "estimated_weeks": 4, "required": true}
  ]'::jsonb,
  '[
    {"name": "IRCCA (Institute for Regulation and Control of Cannabis)", "role": "Primary cannabis regulatory authority: licences, export authorisations, quality standards, operator oversight", "website": "https://www.ircca.gub.uy", "country": "UY"},
    {"name": "JND (National Drug Board)", "role": "Policy oversight of cannabis regulation; supervises IRCCA", "website": "https://www.infodrogas.gub.uy", "country": "UY"},
    {"name": "MSP (Ministry of Public Health)", "role": "Pharmaceutical regulation including GMP standards for cannabis manufacturing", "website": "https://www.gub.uy/ministerio-salud-publica", "country": "UY"},
    {"name": "DNA (Uruguayan Customs)", "role": "Export customs clearance for controlled substances", "website": "https://www.aduana.gub.uy", "country": "UY"}
  ]'::jsonb,
  ARRAY[
    'Uruguayan export framework is still maturing; regulatory requirements change periodically',
    'EU-GMP certification from Uruguayan facilities is achievable but requires significant investment and time',
    'Limited number of IRCCA-licensed exporters; competition for supply partnerships is intense',
    'Adult-use domestic market is a closed system for residents only; do not attempt to access domestic retail channels',
    'Bilateral trade relationships with Germany and Israel create preferential pathways; leverage these connections',
    'Uruguay''s small pharmaceutical sector means limited local regulatory expertise; engage international regulatory consultants'
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
