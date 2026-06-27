-- Seed: Cultivar Passport Network — 12 public cultivar passports across key origin markets
-- Covers therapeutic, adult-use, and industrial hemp phenotypes.
-- All passports set is_public=true, claim_status='claimed', claim_review_status='submitted'
-- so they appear on /genetics and /genetics/cultivars immediately without admin review.
-- ON CONFLICT (slug) DO NOTHING — safe to re-run.

-- ── Genetics Profiles (breeder/rights-holder entities) ────────────────────
INSERT INTO genetics_profiles (
  id, display_name, entity_type, country_code, is_verified, is_public, visibility
) VALUES
  ('00000001-0000-0000-0000-000000000001', 'NordicGene Labs', 'company', 'NL', false, true, 'public_summary'),
  ('00000001-0000-0000-0000-000000000002', 'Andean Seed Collective', 'collective', 'CO', false, true, 'public_summary'),
  ('00000001-0000-0000-0000-000000000003', 'Pacific Cultivar Institute', 'research_institution', 'AU', false, true, 'public_summary'),
  ('00000001-0000-0000-0000-000000000004', 'Mediterranean Genetics SL', 'company', 'ES', false, true, 'public_summary'),
  ('00000001-0000-0000-0000-000000000005', 'Cape Cultivar Trust', 'collective', 'ZA', false, true, 'public_summary'),
  ('00000001-0000-0000-0000-000000000006', 'CannaGene Canada Inc.', 'company', 'CA', false, true, 'public_summary')
ON CONFLICT (id) DO NOTHING;

-- ── Cultivar Passports ────────────────────────────────────────────────────
INSERT INTO cultivar_passports (
  display_name, slug, public_summary, breeder_profile_id,
  origin_country_code, origin_jurisdiction_label,
  cultivar_category, cannabis_category,
  claim_status, claim_review_status,
  public_disclaimer, is_public
) VALUES

-- EU / Medical phenotypes
(
  'Rhine Valley CBD-1',
  'rhine-valley-cbd-1',
  'High-CBD, THC<0.2% phenotype bred for EU GMP pharmaceutical extract production. Consistent 18–22% CBD, <0.2% THC across 5 generations. Origin: Rhine delta greenhouse programme. EU Novel Food background documentation available.',
  '00000001-0000-0000-0000-000000000001',
  'NL', 'Netherlands',
  'feminised', 'cbd_dominant',
  'claimed', 'submitted',
  'This profile is orientation-level only. Harbourview does not verify claims independently — claims are self-reported by the rights holder and subject to verification before publishing approved_public status.',
  true
),
(
  'Hessian Medical-3',
  'hessian-medical-3',
  'THC-dominant indoor cultivar developed for German pharmacy supply. Stable at 22–26% THC, documented low mycotoxin susceptibility. 9-week flower cycle. Commercially supplied to BfArM-authorised distributors since 2023.',
  '00000001-0000-0000-0000-000000000001',
  'DE', 'Germany',
  'feminised', 'thc_dominant',
  'claimed', 'submitted',
  'This profile is orientation-level only. Claims are self-reported. Harbourview does not warrant the accuracy of cultivar characterisation data.',
  true
),

-- Latin America origin
(
  'Magdalena River IBL',
  'magdalena-river-ibl',
  'True-breeding inbred line from the Magdalena Valley, Colombia. Traditional sativa phenotype with documented landrace provenance. Being characterised for pharmaceutical THC:CBD ratio stability. INVIMA cultivation permit background.',
  '00000001-0000-0000-0000-000000000002',
  'CO', 'Colombia',
  'regular', 'thc_dominant',
  'evidence_provided', 'submitted',
  'Landrace provenance claims are indicative only. Material transfer requires applicable export/import permits — not facilitated by Harbourview.',
  true
),
(
  'Cauca High-CBD Landrace',
  'cauca-high-cbd-landrace',
  'CBD-dominant semi-wild collection from Cauca department. >15% CBD in field conditions without controlled environment agriculture. Background documentation for INVIMA and EU regulatory dossiers being assembled.',
  '00000001-0000-0000-0000-000000000002',
  'CO', 'Colombia',
  'regular', 'cbd_dominant',
  'claimed', 'draft',
  'Field characterisation only. No GMP manufacturing data available at this stage. Harbourview publishes this profile for market intelligence purposes, not as a commercial endorsement.',
  true
),

-- Australia / ANZ
(
  'Southern Cross CBD-X',
  'southern-cross-cbd-x',
  'ODC-licensed Australian CBD-dominant cultivar. Bred for consistency under Australian subtropical conditions. 16–20% CBD, <0.3% THC. TGA-compliant manufacturing documentation package available to serious inquirers.',
  '00000001-0000-0000-0000-000000000003',
  'AU', 'Australia',
  'feminised', 'cbd_dominant',
  'claimed', 'submitted',
  'TGA-compliant claims relate to the cultivar's use within ODC-licensed Australian facilities. Import/export requires applicable permits in destination markets.',
  true
),
(
  'Tasman Balanced THC:CBD',
  'tasman-balanced-thc-cbd',
  'Near-1:1 THC:CBD balanced cultivar from New Zealand breeding programme. Consistent 10–12% each across indoor trials. Target markets: AU therapeutic, UK specials. Access discussion by invitation.',
  '00000001-0000-0000-0000-000000000003',
  'NZ', 'New Zealand',
  'feminised', 'balanced',
  'claimed', 'submitted',
  'Access discussion is invitation-only. Contact through Harbourview's intake process.',
  true
),

-- Mediterranean / Southern Europe
(
  'Iberian Hemp-7 Industrial',
  'iberian-hemp-7-industrial',
  'EU-approved industrial hemp variety (<0.3% THC). High biomass yield. CBD 4–6% — suitable for extraction at scale. Certified seed available through Spanish MAPA-registered suppliers. Field trial data from Extremadura available.',
  '00000001-0000-0000-0000-000000000004',
  'ES', 'Spain',
  'regular', 'industrial_hemp',
  'claimed', 'submitted',
  'EU certified variety list registration details available on request. No medical claims are made.',
  true
),
(
  'Algarve Sun CBD',
  'algarve-sun-cbd',
  'Portuguese outdoor CBD cultivar bred for Atlantic-coast conditions. 14–18% CBD. Low pathogen susceptibility documented across 3 seasons. Infarmed-licensed cultivation background. Biomass and extract available.',
  '00000001-0000-0000-0000-000000000004',
  'PT', 'Portugal',
  'feminised', 'cbd_dominant',
  'claimed', 'submitted',
  'Commercial discussion via Harbourview intake only. Harbourview does not endorse commercial terms.',
  true
),

-- Africa
(
  'Cape Sativa Heritage',
  'cape-sativa-heritage',
  'South African sativa-dominant heritage phenotype with Lesotho/Swazi provenance documentation. Being characterised for pharmaceutical GMP export pathway. SAHPRA cultivation permit background. Seeking EU research partner.',
  '00000001-0000-0000-0000-000000000005',
  'ZA', 'South Africa',
  'regular', 'thc_dominant',
  'claimed', 'submitted',
  'Provenance documentation is indicative. Export from South Africa requires SAHPRA export licence. Harbourview does not facilitate material transfer.',
  true
),

-- Canada
(
  'Prairie CBD-Select',
  'prairie-cbd-select',
  'Health Canada-licensed CBD-dominant cultivar optimised for Canadian prairie outdoor production. 15–20% CBD, EU-GMP certification in progress for European export pathway. CoA package available.',
  '00000001-0000-0000-0000-000000000006',
  'CA', 'Canada',
  'feminised', 'cbd_dominant',
  'evidence_provided', 'submitted',
  'Canadian regulatory documentation relates to domestic licence only. EU-GMP certification status unverified by Harbourview.',
  true
),
(
  'BC Indoor Medical',
  'bc-indoor-medical',
  'Licensed Producer-grade THC-dominant indoor cultivar from British Columbia. 24–28% THC, consistent terpene profile across 8 commercial batches. GPL/S8 documentation package. Seeking distribution partners in Germany and UK.',
  '00000001-0000-0000-0000-000000000006',
  'CA', 'British Columbia, Canada',
  'feminised', 'thc_dominant',
  'claimed', 'submitted',
  'Canadian Health Canada licensing documentation on record. EU import requires EU-GMP certification by the exporting LP — not confirmed for this cultivar.',
  true
),
(
  'Northern Lights Minor-X',
  'northern-lights-minor-x',
  'Minor cannabinoid research cultivar with elevated CBG (>8%), CBN (>3%), and detectable THCV. Health Canada licensed. Target application: pharmaceutical single-cannabinoid extraction research. Academic and pharmaceutical partner inquiries only.',
  '00000001-0000-0000-0000-000000000006',
  'CA', 'Canada',
  'feminised', 'minor_cannabinoid',
  'claimed', 'submitted',
  'Research-stage cultivar. No commercial volumes available. Harbourview publishes this profile for market intelligence purposes only.',
  true
)

ON CONFLICT (slug) DO NOTHING;

-- ── Country Opportunities (cross-listed markets for select passports) ─────
-- Links passports to the markets they are actively seeking partnerships in.
INSERT INTO cultivar_country_opportunities (
  cultivar_id, country_code, jurisdiction_label,
  opportunity_type, status, public_note,
  material_transfer_status, jurisdiction_gate_status
)
SELECT
  cp.id,
  opp.country_code,
  opp.jurisdiction_label,
  opp.opportunity_type,
  'open_to_discussion',
  opp.public_note,
  'information_only',
  'information_only'
FROM cultivar_passports cp
JOIN (VALUES
  ('rhine-valley-cbd-1',   'DE', 'Germany',        'distribution_partnership', 'Open to German pharmacy distribution discussions.'),
  ('rhine-valley-cbd-1',   'GB', 'United Kingdom',  'distribution_partnership', 'UK MHRA specials pathway. Invitation basis.'),
  ('hessian-medical-3',    'GB', 'United Kingdom',  'distribution_partnership', 'UK specials import inquiries welcome.'),
  ('hessian-medical-3',    'NL', 'Netherlands',     'distribution_partnership', 'Open to Dutch wholesale discussions.'),
  ('bc-indoor-medical',    'DE', 'Germany',         'export_partnership',       'Seeking German import partner. EU-GMP certification in progress.'),
  ('bc-indoor-medical',    'GB', 'United Kingdom',  'export_partnership',       'UK MHRA specials import. CoA package available.'),
  ('prairie-cbd-select',   'DE', 'Germany',         'export_partnership',       'EU-GMP dossier available for partner review.'),
  ('prairie-cbd-select',   'NL', 'Netherlands',     'export_partnership',       'Open to OMC distribution discussion.'),
  ('southern-cross-cbd-x', 'GB', 'United Kingdom',  'export_partnership',       'UK specials import pathway. TGA documentation package available.'),
  ('cape-sativa-heritage', 'DE', 'Germany',         'research_partnership',     'Seeking EU GMP research partner for phenotype characterisation.')
) AS opp(slug, country_code, jurisdiction_label, opportunity_type, public_note)
  ON cp.slug = opp.slug
ON CONFLICT DO NOTHING;

-- ── Service Providers (public genetics service directory) ─────────────────
INSERT INTO genetics_service_providers (
  profile_id, service_category, service_summary,
  country_code, jurisdiction_label, verification_level, is_public
)
SELECT
  gp.id,
  svc.service_category::text,
  svc.service_summary,
  svc.country_code,
  svc.jurisdiction_label,
  'unverified',
  true
FROM genetics_profiles gp
JOIN (VALUES
  ('NordicGene Labs',            'genotyping',           'Whole-genome sequencing and SNP marker services for cannabis cultivars. ISO 17025 accredited. EU GMP facility.',                    'NL', 'Netherlands'),
  ('NordicGene Labs',            'chemotype_testing',    'GC-MS and HPLC cannabinoid and terpene profiling for EU regulatory submissions.',                                                  'NL', 'Netherlands'),
  ('Pacific Cultivar Institute', 'tissue_culture',       'Meristem tissue culture, pathogen elimination, and clean-stock production for licensed cultivars.',                                 'AU', 'Australia'),
  ('Pacific Cultivar Institute', 'pathogen_testing',     'PCR and ELISA pathogen screening panels (HpLVd, BLTVA, PVX, TSWV) for commercial import/export health certification.',            'AU', 'Australia'),
  ('Cape Cultivar Trust',        'regulatory_advisory',  'SAHPRA export documentation and Lesotho narcotics permit guidance for African-origin genetics seeking EU partners.',                'ZA', 'South Africa'),
  ('CannaGene Canada Inc.',      'licensing_advisory',   'Health Canada licensing advisory, EU-GMP readiness assessment, and export documentation support for Canadian LPs.',                 'CA', 'Canada')
) AS svc(profile_name, service_category, service_summary, country_code, jurisdiction_label)
  ON gp.display_name = svc.profile_name
ON CONFLICT DO NOTHING;
