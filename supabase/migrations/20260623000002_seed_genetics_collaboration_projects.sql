-- seed: genetics_collaboration_projects — 10 public collaboration projects
-- visibility = 'public_summary' so they appear on /genetics/collaboration
-- ON CONFLICT (slug) DO NOTHING — safe to re-run

INSERT INTO genetics_collaboration_projects (
  title, slug, project_type, visibility, status,
  country_code, jurisdiction_label,
  public_summary, evidence_needed
) VALUES

(
  'EU-GMP Equivalence Documentation for Colombian Cultivars',
  'eu-gmp-equivalence-colombia',
  'verification_project',
  'public_summary',
  'open',
  'CO', 'Colombia',
  'Seeking EU-licensed manufacturing partner to co-develop the GMP equivalence documentation package for Colombian-origin cannabis. INVIMA cultivation licence in place; manufacturing GMP certification pathway is the active bottleneck for European export.',
  'EU-GMP certified manufacturing partner; QP availability for batch certification; prior experience with third-country manufacturing equivalence submissions to EMA or a national medicines authority.'
),

(
  'High-CBD Phenotype Stability Trial — Northern Europe',
  'cbd-stability-trial-northern-europe',
  'trial_project',
  'public_summary',
  'open',
  'NL', 'Netherlands',
  'Multi-site phenotype stability assessment for a CBD-dominant cultivar across controlled indoor environments in the Netherlands, Germany, and Denmark. Seeking licensed research cultivation partners with GMP or GACP-certified facilities.',
  'GMP or GACP-certified cultivation research facility; analytical testing capability (HPLC cannabinoid profiling); willingness to share batch CoA data under an MTA framework.'
),

(
  'South African Landrace Provenance Documentation',
  'sa-landrace-provenance-documentation',
  'research_collaboration',
  'public_summary',
  'open',
  'ZA', 'South Africa',
  'Academic and commercial provenance documentation project for sativa-dominant landraces from the Drakensberg and Lesotho corridor. Seeking partnership with a South African research institution or licensed cultivator for formal genetic characterisation.',
  'South African institutional ethics clearance or licensed cultivation permit; access to landrace material with documented origin; willingness to participate in published genetic characterisation.'
),

(
  'Pharmaceutical Terpene Profile Standardisation — Australian Phenotypes',
  'pharma-terpene-standardisation-australia',
  'research_collaboration',
  'public_summary',
  'open',
  'AU', 'Australia',
  'Collaboration to develop standardised terpene profiling methodology and batch specification ranges for Australian-licensed cultivars targeting TGA therapeutic goods pathways. Seeking accredited analytical partner.',
  'ISO 17025 accredited cannabis analytical laboratory; GC-MS terpene profiling capability; experience with TGA therapeutic goods documentation.'
),

(
  'Minor Cannabinoid Extraction Yield Optimisation',
  'minor-cannabinoid-extraction-yield',
  'research_collaboration',
  'public_summary',
  'open',
  'CA', 'Canada',
  'Seeking a Health Canada-licensed extraction facility partner to co-develop and document optimised extraction parameters for CBG, CBN, and THCV isolation from multi-cannabinoid cultivars. Data to be published under a joint research MTA.',
  'Health Canada extraction licence; CO2 or ethanol extraction with fraction separation capability; analytical HPLC capability or access; willingness to publish methodology under co-authorship framework.'
),

(
  'Israeli Cultivar Import Compliance Package for German Market',
  'israel-germany-import-compliance-package',
  'licensing_discussion',
  'public_summary',
  'open',
  'IL', 'Israel',
  'Developing a replicable compliance documentation package for IMCA-licensed Israeli cultivar export to German BfArM-authorised importers. Seeking a German-side import partner with narcotics import authorisation and experience with third-country EU-GMP recognition.',
  'BfArM-authorised German importer; experience with narcotics import certificates for non-EU-manufactured cannabis; willingness to co-develop import process documentation for future corridors.'
),

(
  'Hemp-Derived CBD Novel Food Dossier — EU Pathway',
  'hemp-cbd-novel-food-eu-dossier',
  'licensing_discussion',
  'public_summary',
  'open',
  'PT', 'Portugal / EU',
  'Seeking co-applicants for a joint EU Novel Food authorisation submission for standardised hemp-derived CBD isolate. Portuguese Infarmed and EFSA submission experience preferred. Open to consortium approach across 3–5 EU cultivators.',
  'EFSA submission experience or regulatory affairs partner with EU Novel Food track record; analytical data package for CBD isolate (identity, characterisation, stability, safety); EU-licensed cultivar origin documentation.'
),

(
  'New Zealand Balanced THC:CBD Export Feasibility Study',
  'nz-balanced-cultivar-export-feasibility',
  'verification_project',
  'public_summary',
  'open',
  'NZ', 'New Zealand',
  'Feasibility study for New Zealand near-1:1 balanced cultivar export to UK specials import pathway. Seeking a UK MHRA-registered importer or specials wholesaler to assess documentation requirements and co-develop export package.',
  'UK MHRA specials import authorisation; experience with Schedule 2 controlled drug import from non-EU countries; willingness to share import process documentation framework.'
),

(
  'GACP Certification Support for Thai Licensed Cultivators',
  'gacp-certification-thailand',
  'licensing_discussion',
  'public_summary',
  'open',
  'TH', 'Thailand',
  'Technical assistance project supporting Thai FDA-licensed cultivators in preparing for EU GACP certification. Seeking European GACP consultancy or certification body with experience in tropical-climate cultivation facilities.',
  'Demonstrated EU GACP inspection or audit experience; ability to conduct remote pre-inspection gap analysis; familiarity with Thai FDA cultivation licence framework.'
),

(
  'Cultivar Passport Cross-Registry Harmonisation Initiative',
  'cultivar-passport-cross-registry',
  'research_collaboration',
  'public_summary',
  'open',
  NULL, 'Global / Multi-jurisdiction',
  'Open initiative to develop a harmonised minimum data standard for cultivar passport registration across national genetics registries. Seeking participation from industry associations, national plant variety offices, and licensed breeder organisations across at least 3 jurisdictions.',
  'Institutional affiliation with a national plant variety office, breeders'' association, or accredited genetics research body; commitment to 3-meeting participation over 6 months; willingness to publish harmonised standard under Creative Commons.'
)

ON CONFLICT (slug) DO NOTHING;
