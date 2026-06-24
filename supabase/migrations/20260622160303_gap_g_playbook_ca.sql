INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'CA',
  'Canada',
  'moderate',
  6,
  'C$100K–C$400K',
  'Canada was the first G7 nation to federally legalise adult-use cannabis under the Cannabis Act (2018). The Cannabis Act creates two main frameworks: (1) a recreational/adult-use framework with federally licensed producers (LPs) selling to provincial retailers, and (2) a medical framework enabling Health Canada licensed dealers to import/export for medical and scientific purposes. Importers must hold a Health Canada Import/Export licence. All cultivars must be approved or sold as standard equivalency units. Canada is primarily an export market; imports are uncommon except for specific medical products not available domestically. Key licence classes include: Licence for Sale (medical), Micro-licence, Standard Cultivation, Standard Processing. Health Canada''s Cannabis Tracking and Licensing System (CTLS) manages all licences.',
  '[
    {"step": 1, "title": "Obtain or partner with Health Canada licence holder", "description": "Identify a Canadian entity holding a Health Canada Cannabis Licence with Import authority. Import licences require a physical Canadian location, security clearance for key personnel, and compliance with the Cannabis Regulations security requirements.", "estimated_weeks": 8, "required": true},
    {"step": 2, "title": "Apply for import permit via Health Canada CTLS", "description": "Submit an import permit application through the Cannabis Tracking and Licensing System (CTLS). Required: product details, quantity, origin country licence, purpose of import. Health Canada processes permits within 60 business days.", "estimated_weeks": 12, "required": true},
    {"step": 3, "title": "Ensure GMP compliance under Cannabis Regulations", "description": "All cannabis products sold in Canada must be produced under Good Production Practices (GPP). Foreign manufacturers must demonstrate equivalent GMP standards.", "estimated_weeks": 8, "required": true},
    {"step": 4, "title": "Navigate provincial distribution requirements", "description": "Adult-use cannabis is distributed through provincial Crown corporations (e.g., OCS in Ontario, SQDC in Quebec, AGLC in Alberta). Medical cannabis is distributed direct-to-patient by licensed sellers.", "estimated_weeks": 10, "required": true},
    {"step": 5, "title": "Comply with Cannabis Act packaging and labelling", "description": "Cannabis Act mandates plain packaging with standardised cannabis symbol, health warnings, THC/CBD content disclosure, and no promotional content. Packaging must be child-resistant and tamper-evident.", "estimated_weeks": 4, "required": true},
    {"step": 6, "title": "Implement Cannabis Tracking System (CTS) reporting", "description": "All licensed cannabis activity must be reported to Health Canada''s CTS. Monthly reporting of inventory, sales, and destruction. Non-compliance triggers licence suspension or revocation.", "estimated_weeks": 2, "required": true}
  ]'::jsonb,
  '[
    {"name": "Health Canada", "role": "Federal cannabis regulator: issues licences, import/export permits, enforces Cannabis Act and Cannabis Regulations", "website": "https://www.canada.ca/en/health-canada", "country": "CA"},
    {"name": "CBSA (Canada Border Services Agency)", "role": "Enforces import/export controls at border; inspects cannabis shipments against permit conditions", "website": "https://www.cbsa-asfc.gc.ca", "country": "CA"},
    {"name": "OCS (Ontario Cannabis Store)", "role": "Provincial Crown corporation managing adult-use cannabis wholesale and retail in Ontario", "website": "https://www.ocs.ca", "country": "CA"},
    {"name": "Provincial Liquor/Cannabis Boards", "role": "Each province has its own distribution authority for adult-use retail", "website": "https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis", "country": "CA"}
  ]'::jsonb,
  ARRAY[
    'Health Canada import permits take up to 60 business days; plan procurement cycle accordingly',
    'Provincial board supply agreements have long lead times and minimum volume requirements',
    'Plain packaging rules are strict; non-compliant packaging results in product seizure at border',
    'CTS reporting non-compliance triggers licence action; invest in compliance management systems early',
    'Recreational import pathway is complex; medical import is the more accessible route for foreign suppliers',
    'Key personnel security clearance processing can delay licence applications by 3-6 months'
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
