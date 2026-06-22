-- Seed: 14 representative supplier profiles for the Harbourview Supplier Directory
-- Covers all 6 public category buckets shown on /supplier-directory
-- Status = 'approved' so they appear on the public directory immediately.
-- Contact details are illustrative/anonymised for demo purposes — replace with real
-- verified supplier contacts before going to market.
-- Uses ON CONFLICT (company_name) DO NOTHING so re-running is safe.

INSERT INTO supplier_profiles (
  company_name, contact_name, contact_email,
  seller_type, region, categories, description, status
)
VALUES

-- ── Producers & LPs ─────────────────────────────────────────────────────────
(
  'NordicMed Botanicals',
  'Operations Team',
  'operations@nordicmed-example.com',
  'licensed_producer',
  'europe',
  ARRAY['supplier_directory'],
  'EU-GMP certified indoor cultivator based in Portugal. Supplies dried flower and extracts to German, Dutch, and Czech pharmacy channels. Minimum order 5 kg. Export documentation handled in-house.',
  'approved'
),
(
  'Andean Origins SAS',
  'Export Desk',
  'export@andeanorigins-example.com',
  'licensed_producer',
  'latin_america',
  ARRAY['supplier_directory'],
  'INVIMA-licensed cultivator and extractor in Colombia. EU-GMP certification in progress (target Q3 2026). Currently supplying Latin American pharmacy distribution. Seeking EU import partners.',
  'approved'
),
(
  'Pacific Cultivar Co.',
  'Business Development',
  'bd@pacificcultivar-example.com',
  'licensed_producer',
  'asia_pacific',
  ARRAY['supplier_directory'],
  'ODC-licensed Australian cultivator. TGA-compliant dried flower and oil. Serving domestic therapeutic channels and pursuing UK MHRA import partnerships. GMP certificate available on request.',
  'approved'
),

-- ── Equipment & Machinery ────────────────────────────────────────────────────
(
  'CannaFlow Systems GmbH',
  'Sales',
  'sales@cannaflow-example.com',
  'other',
  'europe',
  ARRAY['cultivation_equipment', 'processing_equipment'],
  'German-engineered extraction and post-processing equipment. Closed-loop ethanol and CO₂ systems for GMP-compliant facilities. CE-marked. Serving licensed producers in DE, NL, PT, and export markets.',
  'approved'
),
(
  'ThermoGrow Controls',
  'Technical Sales',
  'technical@thermogrow-example.com',
  'other',
  'north_america',
  ARRAY['cultivation_equipment'],
  'Precision climate control and LED lighting systems for pharmaceutical-grade indoor cultivation. UL-listed. Ships to licensed facilities in Canada, US, and EU. Remote monitoring and compliance-data export included.',
  'approved'
),

-- ── Consumables & Inputs ─────────────────────────────────────────────────────
(
  'PharmaFlux Inputs',
  'Supply Chain',
  'supply@pharmaflux-example.com',
  'distributor',
  'europe',
  ARRAY['consumables', 'packaging'],
  'Wholesale distributor of GMP-grade cultivation inputs, grow media, nutrients, and lab consumables for licensed cannabis facilities across the EU. Same-day dispatch from Netherlands warehouse.',
  'approved'
),
(
  'BioSeal Packaging',
  'Sales Desk',
  'sales@bioseal-example.com',
  'other',
  'north_america',
  ARRAY['packaging'],
  'Child-resistant and tamper-evident packaging for pharmaceutical and adult-use cannabis. FDA 21 CFR and EU EN 862 compliant. Custom print runs from 5,000 units. Serves licensed producers in CA, US, EU.',
  'approved'
),

-- ── Logistics & Distribution ─────────────────────────────────────────────────
(
  'MedRoute International',
  'Compliance & Operations',
  'compliance@medroute-example.com',
  'distributor',
  'europe',
  ARRAY['logistics'],
  'Specialised narcotics-authorised freight forwarder for medicinal cannabis. IATA DGR chapter 2 and narcotics handling certified. Manages S1-to-S2 import documentation for UK corridors. EU-wide cold chain network.',
  'approved'
),
(
  'ArcticChill Logistics',
  'Business Development',
  'bd@arcticchill-example.com',
  'distributor',
  'global',
  ARRAY['logistics'],
  'Cold-chain 3PL specialising in pharmaceutical and botanical products. GDP-compliant temperature monitoring, excursion management, and documentation from source through final-mile delivery. Air and sea freight.',
  'approved'
),

-- ── Services & Advisory ──────────────────────────────────────────────────────
(
  'RegPath Consulting',
  'Director of Client Services',
  'clients@regpath-example.com',
  'other',
  'global',
  ARRAY['professional_services', 'services'],
  'Regulatory affairs and market access consultancy for cannabis operators entering EU, UK, and ANZ markets. Services include EU-GMP gap analysis, import licence applications, and narcotics permit management.',
  'approved'
),
(
  'CannaTrade Legal',
  'Client Relations',
  'enquiries@cannatrade-example.com',
  'other',
  'europe',
  ARRAY['professional_services'],
  'Boutique law firm advising on cannabis import/export permits, distributor agreements, and cross-border regulatory compliance across 12 EU jurisdictions. Offices in Amsterdam, Berlin, and Lisbon.',
  'approved'
),

-- ── Technology & Data ────────────────────────────────────────────────────────
(
  'Traceflow Technologies',
  'Partnerships',
  'partners@traceflow-example.com',
  'other',
  'global',
  ARRAY['services'],
  'Seed-to-sale compliance software with API integration for EU GACP and GMP record-keeping, lot tracking, and regulatory reporting. SaaS, configurable per jurisdiction. Currently supporting operators in 9 countries.',
  'approved'
),
(
  'LabIndex Analytics',
  'Client Success',
  'success@labindex-example.com',
  'other',
  'europe',
  ARRAY['labs_testing'],
  'ISO 17025 accredited cannabis analytical testing laboratory. Full panel testing: cannabinoid potency, terpene profiling, residual solvents, mycotoxins, heavy metals, and microbiological safety. EU GMP batch release.',
  'approved'
),
(
  'ComplianceVault AI',
  'Sales',
  'sales@compliancevault-example.com',
  'other',
  'global',
  ARRAY['services'],
  'Regulatory document management and compliance workflow platform. Version-controlled SOPs, audit trail, CAPA management, and regulatory change monitoring for cannabis GMP facilities. GDPR-compliant EU data residency.',
  'approved'
)

ON CONFLICT (company_name) DO NOTHING;
