INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'IL',
  'Israel',
  'high',
  14,
  '$300K–$1.2M',
  'Israel has one of the most established medical cannabis programmes globally, with roots dating to the 1990s. The Israeli Medical Cannabis Agency (IMCA, formerly YAKAR) under the Ministry of Health oversees all cultivation, manufacturing, distribution, and export. Exports became legal in 2020 under Amendment 9 to the Dangerous Drugs Ordinance. Israel operates a closed, regulated supply chain: only IMCA-licensed operators can export. Importers seeking Israeli supply must partner with an IMCA Export Licence holder. Products must meet Israeli standards (GCC-approved GAP/GMP) and the IMCA Technical Requirements for export. Israel exports primarily to Europe (Germany, UK, Australia). The regulatory environment is highly relationship-driven; IMCA maintains close oversight of all operators.',
  '[
    {"step": 1, "title": "Identify IMCA-licensed Israeli exporter", "description": "Only companies holding an IMCA Export Licence may legally export cannabis from Israel. Identify potential partners through the IMCA operator registry. Evaluate their product portfolio (flower grades, extract types), GMP status, available capacity, and track record with European regulators. Israel has a small number of licensed exporters; competition for capacity is high.", "estimated_weeks": 8, "required": true},
    {"step": 2, "title": "Verify IMCA Technical Requirements compliance", "description": "Israeli export products must meet IMCA Technical Requirements: pesticide residue limits, heavy metals, microbiological standards, THC/CBD content tolerances, and packaging specifications. Obtain product certificates of analysis (COA) validated against IMCA standards. Products must also hold a GCC-approved GAP or GMP certificate from the Israeli operator.", "estimated_weeks": 4, "required": true},
    {"step": 3, "title": "Apply for IMCA Export Permit", "description": "The Israeli exporter applies to IMCA for an export permit for each consignment. Required: buyer country import authorisation, product details, quantity, importer licence. IMCA coordinates with destination country regulator via INCB procedures. Processing time: 4-8 weeks. IMCA may request additional documentation from the destination country regulator.", "estimated_weeks": 8, "required": true},
    {"step": 4, "title": "Secure destination country import authorisation", "description": "Obtain the relevant import authorisation in the destination country (e.g., BfArM permit for Germany, ODC permit for Australia). The Israeli exporter typically requires a copy of this permit before submitting to IMCA. Coordinate closely between Israeli exporter and destination country importer to ensure permit documents are issued simultaneously.", "estimated_weeks": 16, "required": true},
    {"step": 5, "title": "Establish logistics and customs coordination", "description": "Israeli cannabis exports typically route via Ben Gurion Airport (TLV). Cold chain requirements must meet both Israeli and destination country standards. Israeli Customs Authority (ICA) must clear the export. Freight forwarders must be pre-approved by the Israeli exporter''s IMCA licence conditions. Insurance must cover controlled substance cargo.", "estimated_weeks": 3, "required": true},
    {"step": 6, "title": "Manage ongoing IMCA compliance and reporting", "description": "IMCA requires post-shipment confirmation from the destination country importer confirming receipt. Maintain ongoing communication with IMCA regarding product performance, quality incidents, and regulatory changes in destination markets. IMCA may conduct audits of export records. Israeli exporters are required to report all export activity quarterly.", "estimated_weeks": 2, "required": true}
  ]'::jsonb,
  '[
    {"name": "IMCA (Israeli Medical Cannabis Agency)", "role": "Sole regulatory authority for medical cannabis in Israel: licences, export permits, product standards, operator oversight", "website": "https://www.health.gov.il/English/Topics/cannabis", "country": "IL"},
    {"name": "Ministry of Health Israel", "role": "Policy and regulatory oversight of IMCA; issues Dangerous Drugs Ordinance amendments", "website": "https://www.health.gov.il", "country": "IL"},
    {"name": "Israel Customs Authority", "role": "Export customs clearance for controlled substances including cannabis", "website": "https://www.gov.il/en/departments/israel_customs", "country": "IL"}
  ]'::jsonb,
  ARRAY[
    'IMCA export capacity is constrained; popular Israeli exporters have waitlists; plan 6-12 months ahead',
    'IMCA Technical Requirements are updated periodically; ensure COA standards match current version',
    'Destination country permit must be in hand before IMCA will process export permit; coordinate timelines carefully',
    'Israeli exporters may have exclusivity arrangements with European distributors in certain markets; verify before contracting',
    'IMCA relationship management is critical; appoint a local Israeli regulatory affairs contact',
    'Post-shipment confirmation to IMCA is mandatory; failure to report receipt triggers export privilege suspension'
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
