-- Fix: insert missing Australia country-level briefing row
-- The MarketOverviewSheet queries jurisdiction_type='country' AND country_iso2='AU'.
-- This row was never seeded; subnational states exist but the parent country does not.

INSERT INTO cc_jurisdiction_briefings (
  jurisdiction_slug,
  jurisdiction_type,
  country_iso2,
  state_iso2,
  program_status,
  public_summary,
  patient_access,
  physician_access,
  market_dynamics,
  regulatory_outlook,
  regulatory_body,
  data_source_summary,
  verification_summary,
  update_cadence,
  coverage_summary,
  last_reviewed_date,
  watch_regions,
  change_notes,
  review_state
)
SELECT
  'australia',
  'country',
  'AU',
  NULL,
  'Medical Legal',
  'Australia operates a nationally regulated medical cannabis framework administered by the Therapeutic Goods Administration (TGA) and the Office of Drug Control (ODC). The Special Access Scheme (SAS) and Authorised Prescriber (AP) pathway enable patients to access unapproved cannabis medicines. The April 2021 SAS-B reforms were transformative — they streamlined prescriber approval, eliminated mandatory specialist referral for most products, and produced a rapid expansion of patient numbers from ~30,000 in early 2021 to over 350,000 registered patients nationally by mid-2026. Adult-use cannabis remains federally prohibited under the Criminal Code Act 1995, though the ACT territory enacted personal decriminalisation in 2020 (personal possession up to 50g, cultivation up to 2 plants). Australia is a net exporter of medical cannabis oil and dried flower, with licensed producers exporting to Germany, the UK, and New Zealand.',
  'Patients access medical cannabis through GP or specialist SAS-B approvals (most products) or through Authorised Prescriber arrangements. SAS-B approvals are now largely self-managed by practitioners via the TGA''s Electronic SAS portal. Patient registration is maintained by individual approved prescribers; there is no national patient card system. Products range from CBD isolates and THC/CBD oils to dried flower for vaporisation. Pharmacy dispensing is the standard delivery mechanism. Many patients use dedicated cannabis clinics for initial consultations; telehealth is widely used across all states and territories.',
  'Since the April 2021 SAS reforms, any Australian-registered medical practitioner (GP or specialist) may prescribe most medical cannabis products under SAS-B without prior TGA individual approval. Products on the Therapeutic Goods Register (TGR) — predominantly CBD products — require no SAS approval. High-THC products and novel formulations still require SAS-B application. Authorised Prescriber status, available to specialists treating defined patient populations, allows repeated prescribing without individual SAS applications.',
  'Australia''s medical cannabis market was valued at approximately A$750M–900M in 2025 and is growing at 25–35% annually. Approximately 180+ licensed producers, importers, and manufacturers hold ODC licences. Dominant domestic players include Little Green Pharma, Cannatrek, Cann Group, and BOD Science. International supply from Canada, the Netherlands, and Israel supplements domestic production. The dried flower segment has grown fastest since vaporisation-device availability expanded. Cost remains a significant patient access barrier: typical patient spend is A$150–400/month, largely uncovered by Medicare.',
  'The TGA continues to refine the SAS framework. A formal review of medical cannabis scheduling is underway; rescheduling THC from Schedule 8 to a lower schedule for medical products is under active policy consideration as of mid-2026. Adult-use legalisation at the federal level remains politically sensitive — the Greens advocate for it; Labor has not committed; the Coalition opposes it.',
  'Therapeutic Goods Administration (TGA); Office of Drug Control (ODC); Department of Health and Aged Care',
  'TGA SAS patient and prescriber data; ODC licensed producer, importer, and manufacturer lists; TGA Therapeutic Goods Register; ABS health survey data; KPMG/Arcview Australia market research',
  'Current as of Q2 2026; verified against TGA official guidance and ODC licence register',
  'Quarterly',
  'Full country-level briefing covering the SAS-B framework, 350,000+ patient base, A$750M–900M market, export activity, and federal adult-use policy landscape',
  DATE '2026-06-28',
  '[]'::jsonb,
  '[]'::jsonb,
  'reviewed'
WHERE NOT EXISTS (
  SELECT 1 FROM cc_jurisdiction_briefings
  WHERE country_iso2 = 'AU' AND jurisdiction_type = 'country'
);
