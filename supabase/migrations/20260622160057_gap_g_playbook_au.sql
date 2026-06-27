INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'AU',
  'Australia',
  'high',
  12,
  'A$200K–A$800K',
  'Australia regulates medicinal cannabis under the Narcotic Drugs Act 1967 and the Therapeutic Goods Act 1989. The Office of Drug Control (ODC) oversees cultivation, production, manufacture, import, and export licences and permits. The TGA regulates product access through: (1) ARTG registration/listing, (2) Special Access Scheme Category B (SAS-B), or (3) the Authorised Prescriber (AP) scheme. Importers must hold an ODC import licence and apply for a separate ODC import permit for each consignment. Australia is one of the world''s largest medical cannabis import markets with over 500 products notified. Most imported products access patients via SAS-B.',
  '[
    {"step": 1, "title": "Engage TGA-licensed importer/sponsor", "description": "Identify an Australian entity holding an ODC Importer Licence. This entity acts as the Australian sponsor responsible for TGA regulatory submissions and pharmacovigilance.", "estimated_weeks": 6, "required": true},
    {"step": 2, "title": "Prepare TGA product dossier and access pathway determination", "description": "Determine the appropriate access pathway: SAS Category B, ARTG registration, or Authorised Prescriber. For most imported products, SAS-B is the launch pathway.", "estimated_weeks": 8, "required": true},
    {"step": 3, "title": "Obtain TGA GMP clearance for overseas manufacturer", "description": "Apply via TGA overseas GMP verification process. TGA accepts EU-GMP certificates from recognised EU NCAs under MRA provisions. Processing: 3-6 months.", "estimated_weeks": 20, "required": true},
    {"step": 4, "title": "Apply for ODC import permit per consignment", "description": "Apply for an ODC import permit for each consignment via the ODC Online Services Portal. ODC processes permits within 15 business days.", "estimated_weeks": 3, "required": true},
    {"step": 5, "title": "Establish cold chain logistics to Australia", "description": "Validate cold chain for the product type. Australian Customs (ABF) will inspect under the Customs Act.", "estimated_weeks": 4, "required": true},
    {"step": 6, "title": "Launch prescriber network and SAS notification programme", "description": "Work with Australian distributor/sponsor to identify and educate prescribers eligible under SAS-B or AP scheme.", "estimated_weeks": 8, "required": true}
  ]'::jsonb,
  '[
    {"name": "TGA (Therapeutic Goods Administration)", "role": "Regulates therapeutic goods including medicinal cannabis: ARTG, SAS/AP pathways, GMP clearance", "website": "https://www.tga.gov.au", "country": "AU"},
    {"name": "ODC (Office of Drug Control)", "role": "Issues licences and permits for cultivation, manufacture, import, and export of narcotic drugs", "website": "https://www.odc.gov.au", "country": "AU"},
    {"name": "DAFF", "role": "Biosecurity controls on agricultural imports; relevant for dried cannabis flower", "website": "https://www.aff.gov.au", "country": "AU"},
    {"name": "ABF (Australian Border Force)", "role": "Customs and border enforcement; controls physical entry of goods including narcotics", "website": "https://www.abf.gov.au", "country": "AU"}
  ]'::jsonb,
  ARRAY[
    'TGA ARTG registration timelines of 12-24 months make SAS-B the only viable launch pathway',
    'SAS-B volume is unpredictable and depends on individual prescriber adoption',
    'TGA GMP clearance for overseas manufacturers can take 3-6 months',
    'ODC import permits are consignment-specific',
    'Dried cannabis flower may face DAFF biosecurity inspection delays',
    'Australian sponsors typically demand significant commercial terms given regulatory burden'
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
