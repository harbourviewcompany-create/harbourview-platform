INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'GB',
  'United Kingdom',
  'high',
  12,
  '£150K–£600K',
  'The UK regulates medicinal cannabis under the Misuse of Drugs Act 1971 (MDA), the Misuse of Drugs Regulations 2001 (MDR), and the Human Medicines Regulations 2012 (HMR). Following rescheduling in November 2018, cannabis-based products for medicinal use in humans (CBPMs) were placed in Schedule 2 MDR, enabling specialist hospital doctors to prescribe them. The MHRA is the UK medicines regulator; the Home Office Drugs Licensing and Compliance Unit (DLCU) issues controlled drug (CD) import licences. Importers must hold an MHRA Wholesale Dealer Licence (WDL) with a Responsible Person (RP) and a Home Office CD import licence. Post-Brexit, the UK no longer accepts EU-GMP certificates automatically; MHRA issues its own GMP certificates or accepts certificates from mutual recognition partners. The NHS prescribing pathway is complex: CBPMs must be prescribed by a GMC-registered specialist on a named-patient basis. Private clinic prescribing has grown significantly since 2018.',
  '[
    {"step": 1, "title": "Identify UK importer/distributor with WDL and CD licence", "description": "Engage a UK-based wholesale dealer holding both an MHRA WDL and a Home Office CD import licence. The entity must have a Responsible Person (RP) qualified under MHRA Good Distribution Practice (GDP). Verify their MHRA inspection history and CD licence scope.", "estimated_weeks": 6, "required": true},
    {"step": 2, "title": "Obtain MHRA GMP certification for manufacturing site", "description": "Post-Brexit, MHRA issues its own GMP certificates. Submit application to MHRA for overseas site GMP certification or site inspection. MHRA has MRAs with several countries including Australia, New Zealand, and Switzerland. Processing time 3-6 months. Without MHRA GMP certification, product cannot be imported for medicinal use.", "estimated_weeks": 20, "required": true},
    {"step": 3, "title": "Apply for Home Office CD import licence", "description": "The importer applies to the Home Office DLCU for a controlled drug import licence. Required documents: product details, manufacturer licence, importer WDL, intended use. Licences are typically granted for 12 months and renewed annually. Per-shipment import certificates may also be required under INCB provisions.", "estimated_weeks": 8, "required": true},
    {"step": 4, "title": "Determine product access pathway: NHS vs. private", "description": "NHS pathway requires NICE Technology Appraisal or inclusion in NHS formulary - currently only Epidyolex has full NHS approval. Most CBPMs access patients via named-patient private prescriptions from GMC-registered specialists. Engage a UK medical affairs partner to build specialist prescriber network in neurology, oncology, and pain.", "estimated_weeks": 10, "required": true},
    {"step": 5, "title": "Register product with MHRA or use unlicensed pathway", "description": "Full MHRA marketing authorisation (via national procedure) is a 12-24 month process requiring clinical data. Most CBPMs are supplied as unlicensed specials under the named-patient mechanism. MHRA requires notification of unlicensed imports. Ensure product meets UK labelling requirements including English-language PIL.", "estimated_weeks": 8, "required": true},
    {"step": 6, "title": "Establish pharmacovigilance and MHRA Yellow Card reporting", "description": "Implement UK pharmacovigilance system with a UK-qualified Pharmacovigilance Contact Person. Ensure MHRA Yellow Card adverse event reporting is in place. UK post-Brexit divergence from EMA pharmacovigilance rules means separate UK PSUR cycle may be required.", "estimated_weeks": 4, "required": true}
  ]'::jsonb,
  '[
    {"name": "MHRA (Medicines and Healthcare products Regulatory Agency)", "role": "UK medicines regulator: product authorisation, GMP certification, WDL licensing, pharmacovigilance oversight", "website": "https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency", "country": "GB"},
    {"name": "Home Office DLCU", "role": "Issues controlled drug import/export licences under the Misuse of Drugs Act 1971", "website": "https://www.gov.uk/government/organisations/home-office", "country": "GB"},
    {"name": "NICE", "role": "National Institute for Health and Care Excellence; conducts technology appraisals for NHS formulary inclusion", "website": "https://www.nice.org.uk", "country": "GB"},
    {"name": "NHS England", "role": "Commissioning and formulary management for NHS prescribing of CBPMs", "website": "https://www.england.nhs.uk", "country": "GB"}
  ]'::jsonb,
  ARRAY[
    'NHS prescribing pathway is extremely restricted; private clinic market is the primary commercial route',
    'Post-Brexit MHRA GMP certification diverges from EU-GMP; do not assume EU certificate is accepted',
    'Home Office CD import licence renewal must be managed proactively; lapse causes supply chain disruption',
    'Named-patient prescribing means volume is highly dependent on specialist prescriber adoption rates',
    'MHRA unlicensed special rules limit promotional activity; engage regulatory counsel before any UK marketing',
    'UK pharmacovigilance requirements have diverged from EMA post-Brexit; maintain separate UK PSUR cycle'
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
