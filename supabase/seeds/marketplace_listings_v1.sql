-- Harbourview Marketplace Listings Seed V1
-- 24 representative listings across 6 categories
-- All set: status=published, public_visibility=true → appear in marketplace_public_listings_v1

insert into public.listings (
  title, slug, listing_type, category, subcategory,
  status, public_visibility, description,
  marketplace_section, product_type, region,
  condition, location_country, price_display,
  seller_type, is_featured, high_level_specs, review_status,
  verification_status, seller_authorization_status
) values

-- CANNABIS INVENTORY (4)
(
  'EU-GMP Certified Dried Flower — 100kg Lot',
  'eu-gmp-dried-flower-100kg-001',
  'supply', 'cannabis-inventory', 'flower',
  'published', true,
  'EU-GMP certified dried flower from a licensed Canadian producer. Full batch record, COA, and phytosanitary documentation available. Import-ready for German and UK markets.',
  'cannabis', 'Dried Flower', 'Europe', null, 'CA',
  'On enquiry', 'licensed_producer', true,
  '{"gmp_status":"EU-GMP","batch_size":"100kg","thc_range":"18-22%","cbd_range":"<0.5%","format":"dried flower","documents":"COA, batch record, phytosanitary cert"}',
  'published', 'verified', 'authorized'
),
(
  'Full-Spectrum CO₂ Oil — Refined Distillate 92% THC',
  'co2-distillate-92thc-de-spec-001',
  'supply', 'cannabis-inventory', 'extract',
  'published', true,
  'German-market specification CO₂ distillate. 92% THC, full terpene retention. Batch tested, COA available. Suitable for licensed import into regulated European markets.',
  'cannabis', 'Extract', 'Europe', null, 'NL',
  'On enquiry', 'licensed_producer', false,
  '{"thc_purity":"92%","method":"CO2 extraction","terpenes":"retained","volume_available":"50L","spec_market":"Germany/EU","documents":"COA, GMP declaration"}',
  'published', 'verified', 'authorized'
),
(
  'Dried Biomass — Trim Lot, Wholesale',
  'biomass-trim-lot-wholesale-001',
  'supply', 'cannabis-inventory', 'biomass',
  'published', true,
  'Drying-complete biomass and trim available for licensed extractors. Suitable for CO₂, ethanol or hydrocarbon extraction. Inspection available at licensed facility.',
  'cannabis', 'Biomass', 'North America', null, 'CA',
  'Wholesale — on enquiry', 'licensed_producer', false,
  '{"weight_available":"500kg","moisture":"<10%","format":"trim/biomass","extraction_suitability":"CO2, ethanol, hydrocarbon","inspection":"available"}',
  'published', 'unverified', 'unknown'
),
(
  'Feminised Seeds — Stabilised Commercial Cultivar',
  'feminised-seeds-commercial-cultivar-001',
  'supply', 'cannabis-inventory', 'genetics',
  'published', true,
  'Feminised seeds from a licensed breeding programme. Stabilised cultivar with 5 years of phenotype selection. Phytosanitary certificates and CITES documentation available.',
  'cannabis', 'Genetics', 'Europe', null, 'NL',
  'On enquiry', 'licensed_producer', false,
  '{"seed_type":"feminised","cultivar_stability":"5 generations","thc_expected":"~20%","documents":"phytosanitary cert, CITES","quantity":"commercial lot"}',
  'published', 'verified', 'authorized'
),

-- USED/SURPLUS EQUIPMENT (4)
(
  'Commercial LED Grow System — 200 Lights, Decommissioned',
  'led-grow-system-200-lights-decom-001',
  'equipment', 'used-surplus', 'cultivation',
  'published', true,
  'Decommissioned from a licensed indoor facility. Full inspection package, service logs, and light-hours documentation available. Suitable for relocation to a new licensed facility.',
  'equipment', 'Cultivation Equipment', 'North America', 'used', 'CA',
  'On enquiry — asset sale', 'licensed_facility', true,
  '{"light_count":200,"type":"full-spectrum LED","service_logs":"available","facility_licensed":"yes","inspection":"available at site","condition":"used — tested"}',
  'published', 'unverified', 'unknown'
),
(
  'CO₂ Extraction Line — Apeks 5L SCFX',
  'co2-extraction-apeks-5l-scfx-001',
  'equipment', 'used-surplus', 'extraction',
  'published', true,
  'Used CO₂ extraction unit with full maintenance history. Buyer inspection and verification workflow required before deal-room access. Priced for distressed-asset exit.',
  'equipment', 'Extraction Equipment', 'Europe', 'used', 'DE',
  'Asset pricing on enquiry', 'distressed_seller', false,
  '{"model":"Apeks 5L SCFX","throughput":"5L CO2","maintenance_history":"available","inspection_required":"yes","power":"three-phase 400V"}',
  'published', 'unverified', 'unknown'
),
(
  'Short-Path Distillation Train — 50L/day',
  'short-path-distillation-50L-001',
  'equipment', 'used-surplus', 'processing',
  'published', true,
  'Ethanol extraction and short-path distillation train. 50L/day throughput. Priced for fast exit from a closing facility. Full asset manifest and service records available.',
  'equipment', 'Processing Equipment', 'Europe', 'used', 'UK',
  'Fast-exit pricing', 'distressed_seller', false,
  '{"throughput":"50L/day","type":"short-path distillation","includes":"wiped film, cold trap","records":"available","exit_reason":"facility closure"}',
  'published', 'unverified', 'unknown'
),
(
  'HPLC + GC-MS Lab Instrumentation Package',
  'hplc-gc-ms-lab-package-001',
  'equipment', 'used-surplus', 'lab',
  'published', true,
  'Full laboratory instrumentation package from a closing testing facility. HPLC and GC-MS units with complete service history. Import documentation available for international buyers.',
  'equipment', 'Lab Equipment', 'Europe', 'used', 'DE',
  'Package pricing on enquiry', 'licensed_facility', false,
  '{"includes":"HPLC, GC-MS","service_history":"full records","condition":"calibrated — tested","import_docs":"available","reason":"lab closure"}',
  'published', 'unverified', 'unknown'
),

-- CONSUMABLES (4)
(
  'Child-Resistant Packaging — EU Specification, Stock Lot',
  'cr-packaging-eu-spec-stock-001',
  'supply', 'consumables', 'packaging',
  'published', true,
  'Stock lot of CR-compliant pouches and bottles meeting German and UK labelling regulations. Available for immediate dispatch. Samples provided on request.',
  'consumables', 'Packaging', 'Europe', null, 'DE',
  'In stock — volume pricing', 'distributor', true,
  '{"type":"CR pouches and bottles","compliance":"EU CR standards, German labelling","volume":"stock lot","samples":"available","dispatch":"immediate"}',
  'published', 'verified', 'authorized'
),
(
  'Sterile Substrate and Growth Media — Bulk',
  'sterile-substrate-growth-media-bulk-001',
  'supply', 'consumables', 'media',
  'published', true,
  'Coco coir, perlite, and nutrient pack combination. Licensed producer supply. Sterile-packaged and bulk-available. Suitable for medical-grade cultivation compliance.',
  'consumables', 'Growth Media', 'Europe', null, 'NL',
  'Bulk — volume pricing', 'licensed_distributor', false,
  '{"includes":"coco coir, perlite, nutrient packs","packaging":"sterile","minimum_order":"500kg","medical_grade":"suitable","certification":"available"}',
  'published', 'unverified', 'unknown'
),
(
  'GMP-Compliant Nutrient Line — Commercial Pack',
  'gmp-nutrient-line-commercial-001',
  'supply', 'consumables', 'nutrients',
  'published', true,
  'Nutrient concentrates formulated to support medical-grade cultivation compliance. GMP-documented production. Suitable for licensed cultivation facilities targeting EU export markets.',
  'consumables', 'Nutrients', 'North America', null, 'CA',
  'Commercial pricing', 'manufacturer', false,
  '{"formulation":"GMP-documented","format":"liquid concentrates","sizes":"5L, 20L, 200L","compliance":"medical cultivation","market":"EU export"}',
  'published', 'verified', 'authorized'
),
(
  'Pharmaceutical-Grade Ethanol — IDA 99.9%',
  'pharma-ethanol-ida-999-001',
  'supply', 'consumables', 'solvents',
  'published', true,
  'SDS, CoA, and import permit documentation available. Cold-chain delivery. Suitable for cannabis extraction and pharmaceutical applications. Licensed distributor with export experience.',
  'consumables', 'Solvents', 'Europe', null, 'NL',
  'Drum pricing on enquiry', 'licensed_distributor', false,
  '{"purity":"99.9% IDA","documents":"SDS, CoA, import permit","delivery":"cold chain","application":"extraction, pharmaceutical","minimum":"200L drum"}',
  'published', 'verified', 'authorized'
),

-- NEW PRODUCTS (4)
(
  'Oil Capsule Lot — Private Label Ready, GMP',
  'oil-capsule-lot-private-label-001',
  'supply', 'new-products', 'formulation',
  'published', true,
  'Standardised THC:CBD capsules, GMP-compliant. White-label documentation and finished product dossier included. Suitable for pharmacy channel partners entering regulated markets.',
  'new-products', 'Formulation', 'Europe', null, 'DE',
  'On enquiry — private label', 'licensed_manufacturer', true,
  '{"format":"oil capsules","ratio":"THC:CBD 1:1","gmp":"EU-GMP","private_label":"available","dossier":"complete","channel":"pharmacy"}',
  'published', 'verified', 'authorized'
),
(
  'Rooted Cuttings — Tissue-Cultured, Certified Pathogen-Free',
  'rooted-cuttings-tissue-cultured-001',
  'supply', 'new-products', 'genetics',
  'published', true,
  'Tissue-cultured cuttings from established commercial cultivars. Certified pathogen-free with phytosanitary certificate. Available for licensed cultivation facilities.',
  'new-products', 'Genetics', 'Europe', null, 'NL',
  'Minimum order — on enquiry', 'licensed_breeder', false,
  '{"type":"rooted cuttings","method":"tissue culture","certification":"pathogen-free","documents":"phytosanitary cert","quantity":"commercial lots"}',
  'published', 'verified', 'authorized'
),
(
  'Medical Vaporiser — CE-Marked, Import-Ready',
  'medical-vaporiser-ce-marked-001',
  'supply', 'new-products', 'devices',
  'published', true,
  'CE-marked vaporiser device with full device dossier. Suitable for pharmacy channel distribution in regulated European markets. Import documentation available.',
  'new-products', 'Device', 'Europe', null, 'DE',
  'Distributor pricing on enquiry', 'licensed_distributor', false,
  '{"marking":"CE","dossier":"complete","channel":"pharmacy","markets":"Germany, UK, Netherlands","import_docs":"available"}',
  'published', 'verified', 'authorized'
),
(
  'Export-Ready Feminised Seeds — Phytosanitary + CITES',
  'export-ready-seeds-phyto-cites-001',
  'supply', 'new-products', 'genetics',
  'published', true,
  'Feminised seeds from a licensed breeding programme. Export-ready lot with phytosanitary certificates and CITES documentation complete. Available for immediate despatch.',
  'new-products', 'Genetics', 'Europe', null, 'NL',
  'On enquiry', 'licensed_breeder', false,
  '{"type":"feminised seeds","documents":"phytosanitary cert, CITES","export_ready":"yes","quantity":"commercial","dispatch":"immediate"}',
  'published', 'verified', 'authorized'
),

-- SERVICES (4)
(
  'GDP Cold-Chain Import Handoff — EU Gateway',
  'gdp-cold-chain-import-eu-001',
  'supply', 'services', 'logistics',
  'published', true,
  'Licensed GDP logistics operator covering DE, NL, UK ports of entry. Full track-and-trace, temperature-controlled transport, and customs brokerage included. EU-GMP product experience.',
  'services', 'Logistics', 'Europe', null, 'NL',
  'Service engagement — on enquiry', 'licensed_operator', true,
  '{"coverage":"Germany, Netherlands, UK","gdp":"licensed","temperature":"cold-chain","customs":"included","track_trace":"full","gmp_experience":"yes"}',
  'published', 'verified', 'authorized'
),
(
  'GMP Gap Analysis and Audit Readiness',
  'gmp-gap-analysis-audit-readiness-001',
  'supply', 'services', 'compliance',
  'published', true,
  'Pre-audit consulting and gap analysis for EU-GMP certification. Experienced with BfArM, MHRA, and TGA requirements. Remote and on-site delivery available.',
  'services', 'Compliance', 'Europe', null, 'DE',
  'Consulting engagement — on enquiry', 'consulting_firm', false,
  '{"service":"GMP gap analysis","authorities":"BfArM, MHRA, TGA","delivery":"remote or on-site","turnaround":"4-6 weeks","output":"gap report, remediation roadmap"}',
  'published', 'verified', 'authorized'
),
(
  'ISO 17025 Batch Testing — Third-Party COA',
  'iso-17025-batch-testing-coa-001',
  'supply', 'services', 'lab',
  'published', true,
  'Independent ISO 17025 accredited laboratory offering batch testing with a full COA. Potency, pesticides, heavy metals, mycotoxins, residual solvents, and microbiological testing available.',
  'services', 'Lab Services', 'Europe', null, 'DE',
  'Per-sample pricing', 'accredited_lab', false,
  '{"accreditation":"ISO 17025","tests":"potency, pesticides, heavy metals, mycotoxins, residual solvents, microbiology","turnaround":"5-10 business days","COA":"full accredited"}',
  'published', 'verified', 'authorized'
),
(
  'Regulatory Counsel — Import Permit and Licensing',
  'regulatory-counsel-import-permit-001',
  'supply', 'services', 'legal',
  'published', true,
  'Experienced regulatory law firm specialising in cannabis import permits, product licensing, and market access across Germany, UK, and Brazil. Confidential intake available.',
  'services', 'Legal', 'Global', null, 'DE',
  'Retainer or matter basis', 'legal_firm', false,
  '{"specialisation":"import permits, product licensing","markets":"Germany, UK, Brazil","engagement":"retainer or matter","confidential":"yes"}',
  'published', 'verified', 'authorized'
),

-- BUSINESS OPPORTUNITIES (4)
(
  'Licensed Cultivation Facility — Distressed Exit',
  'licensed-cultivation-distressed-exit-001',
  'supply', 'business-opportunities', 'acquisition',
  'published', true,
  'Full-scale indoor licensed cultivation facility with existing EU-GMP certification and inventory. Asset sale due to shareholder restructure. NDA required before operational detail.',
  'opportunities', 'Acquisition', 'Europe', null, 'DE',
  'On enquiry — NDA first', 'distressed_seller', true,
  '{"type":"full facility acquisition","gmp":"EU-GMP certified","inventory":"included","reason":"shareholder restructure","nda":"required","access":"qualified buyers only"}',
  'published', 'unverified', 'unknown'
),
(
  'Import Distribution JV — DACH Market Entry',
  'import-distribution-jv-dach-001',
  'supply', 'business-opportunities', 'partnership',
  'published', true,
  'Established licensed importer seeking a supply-side partner for Germany, Austria, and Switzerland market coverage. Existing import licences and pharmacy relationships in place.',
  'opportunities', 'Partnership', 'Europe', null, 'DE',
  'JV terms — on enquiry', 'licensed_importer', false,
  '{"markets":"Germany, Austria, Switzerland","structure":"JV or supply agreement","existing_licences":"import licences in place","channel":"pharmacy relationships active","seeking":"licensed supply partner"}',
  'published', 'unverified', 'unknown'
),
(
  'GMP Processing Facility — Lease Assignment',
  'gmp-processing-facility-lease-001',
  'supply', 'business-opportunities', 'lease',
  'published', true,
  'GMP-grade processing and extraction space available for lease assignment. Equipment partially included. Licensed facility in a regulated EU jurisdiction. Immediate availability.',
  'opportunities', 'Lease', 'Europe', null, 'NL',
  'Lease terms on enquiry', 'licensed_facility', false,
  '{"type":"lease assignment","grade":"GMP","equipment":"partial inclusion","jurisdiction":"EU regulated","availability":"immediate","size":"commercial scale"}',
  'published', 'unverified', 'unknown'
),
(
  'Retail Dispensary Licence — Transfer Ready',
  'retail-dispensary-licence-transfer-001',
  'supply', 'business-opportunities', 'licence-transfer',
  'published', true,
  'Existing retail dispensary licence available for assignment. Legal counsel required. Located in a pilot jurisdiction. Timeline and transfer conditions available under NDA.',
  'opportunities', 'Licence Transfer', 'Europe', null, 'DE',
  'On enquiry — legal counsel required', 'licence_holder', false,
  '{"type":"licence transfer","licence":"retail dispensary","jurisdiction":"EU pilot jurisdiction","legal_required":"yes","nda":"required","timeline":"disclosed under NDA"}',
  'published', 'unverified', 'unknown'
)

on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  public_visibility = excluded.public_visibility,
  review_status = excluded.review_status,
  high_level_specs = excluded.high_level_specs,
  is_featured = excluded.is_featured,
  updated_at = now();
