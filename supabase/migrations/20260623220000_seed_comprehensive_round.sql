-- supabase/migrations/20260623220000_seed_comprehensive_round.sql
-- Large comprehensive seed across all major supplier categories

INSERT INTO public.supplier_profiles (
  profile_slug, company_name, contact_name, title, seller_type,
  categories, regions_served, description_public, website, hq_country,
  services_offered, status, verification_status
) VALUES
-- Cultivators
('highland-grove', 'Highland Grove Farms', 'Connor MacLeod', 'Sales Lead', 'cultivator',
 ARRAY['flower'], ARRAY['CA','US'], 'Premium greenhouse and hybrid cultivator known for consistent quality and strong supply partnerships with major processors.', 'https://highlandgrove.example.com', 'CA',
 ARRAY['Greenhouse flower', 'Contract cultivation', 'Bulk wholesale'], 'active', 'verified'),

('desert-bloom-cultivation', 'Desert Bloom Cultivation', 'Isabella Cruz', 'Operations Manager', 'cultivator',
 ARRAY['flower'], ARRAY['US'], 'Southwest US cultivator specializing in sun-grown and greenhouse flower with excellent consistency and scale.', 'https://desertbloom.example.com', 'US',
 ARRAY['Sun-grown flower', 'Greenhouse production', 'Large volume supply'], 'active', 'verified'),

-- Processors
('peak-extraction', 'Peak Extraction Co.', 'Derek Lang', 'Head of Production', 'processor',
 ARRAY['concentrates','vapes'], ARRAY['CA','US'], 'High-capacity extraction facility offering CO2, hydrocarbon, and solventless processing with strong compliance focus.', 'https://peakextraction.example.com', 'CA',
 ARRAY['Multi-method extraction', 'Distillate & live resin', 'Contract manufacturing'], 'active', 'verified'),

('prairie-processors', 'Prairie Processors', 'Hannah Mueller', 'VP Manufacturing', 'processor',
 ARRAY['edibles'], ARRAY['CA','US'], 'Large-scale edibles manufacturer with expertise in consistent dosing and innovative product formats.', 'https://prairieprocessors.example.com', 'CA',
 ARRAY['Edibles production', 'Gummy & chocolate lines', 'Private label services'], 'active', 'verified'),

-- Equipment
('growlight-pro', 'GrowLight Pro', 'Dr. Felix Hoffman', 'Technical Director', 'equipment',
 ARRAY['equipment'], ARRAY['CA','US','EU'], 'Advanced full-spectrum LED lighting systems with smart controls for commercial cannabis cultivation.', 'https://growlightpro.example.com', 'DE',
 ARRAY['LED cultivation lighting', 'Smart controls', 'Energy efficiency solutions'], 'active', 'verified'),

('harvest-tech', 'Harvest Tech Solutions', 'Miguel Santos', 'Founder', 'equipment',
 ARRAY['equipment'], ARRAY['CA','US'], 'Automated harvesting, trimming, and post-harvest processing equipment for commercial cannabis operations.', 'https://harvesttech.example.com', 'CA',
 ARRAY['Automated trimming', 'Harvesting equipment', 'Post-harvest systems'], 'active', 'verified'),

-- Genetics
('apex-genetics', 'Apex Genetics', 'Dr. Lena Park', 'Lead Breeder', 'genetics',
 ARRAY['genetics'], ARRAY['CA','US'], 'Commercial genetics provider offering stable, high-performing cultivars with strong IP protection and documentation.', 'https://apexgenetics.example.com', 'CA',
 ARRAY['Commercial genetics', 'Stable cultivars', 'IP-protected strains'], 'active', 'verified'),

-- Labs
('frontier-testing', 'Frontier Testing Labs', 'Dr. Amina Khalil', 'Laboratory Director', 'lab_testing',
 ARRAY['testing'], ARRAY['CA','US'], 'Full-service cannabis testing laboratory with fast turnaround and comprehensive contaminant and potency panels.', 'https://frontiertesting.example.com', 'CA',
 ARRAY['Comprehensive testing', 'Fast turnaround', 'Regulatory support'], 'active', 'verified'),

-- Packaging
('secure-pack-solutions', 'SecurePack Solutions', 'Natalie Brooks', 'Account Executive', 'packaging',
 ARRAY['packaging'], ARRAY['CA','US'], 'Child-resistant and compliant packaging with custom printing and innovative formats for cannabis products.', 'https://securepacksolutions.example.com', 'CA',
 ARRAY['Child-resistant packaging', 'Custom printing', 'Innovative formats'], 'active', 'verified'),

-- Logistics
('cannaflow-logistics', 'CannaFlow Logistics', 'Thomas Reed', 'Director of Operations', 'distributor',
 ARRAY['logistics'], ARRAY['CA','US'], 'Licensed cannabis logistics provider offering secure, compliant transportation and warehousing solutions.', 'https://cannaflowlogistics.example.com', 'CA',
 ARRAY['Secure transportation', 'Warehousing', 'Last-mile delivery'], 'active', 'verified'),

-- Nutrients
('bio-root-nutrients', 'BioRoot Nutrients', 'Dr. Rajiv Patel', 'Technical Director', 'other',
 ARRAY['consumables'], ARRAY['CA','US'], 'Organic and biological nutrient lines formulated specifically for cannabis with strong technical support.', 'https://biorootnutrients.example.com', 'CA',
 ARRAY['Organic nutrients', 'Biological amendments', 'Cultivation support'], 'active', 'verified'),

-- Security
('fortress-cannabis', 'Fortress Cannabis Security', 'Marcus Webb', 'VP Sales', 'services',
 ARRAY['services'], ARRAY['CA','US'], 'Comprehensive security and surveillance solutions for cultivation, processing, and retail cannabis facilities.', 'https://fortresscannabis.example.com', 'CA',
 ARRAY['Facility security', 'Surveillance systems', 'Access control'], 'active', 'verified'),

-- Software
('traceflow-platform', 'TraceFlow Platform', 'Elena Voss', 'CEO', 'services',
 ARRAY['services'], ARRAY['CA','US','EU'], 'Modern seed-to-sale and compliance platform with strong inventory, reporting, and regulatory tools.', 'https://traceflowplatform.example.com', 'CA',
 ARRAY['Seed-to-sale software', 'Compliance tools', 'Inventory management'], 'active', 'verified'),

-- Construction
('buildwise-cannabis', 'BuildWise Cannabis', 'Andrew Sinclair', 'Principal', 'services',
 ARRAY['services'], ARRAY['CA','US'], 'Specialized construction and facility build-out company experienced in compliant cannabis facilities.', 'https://buildwisecannabis.example.com', 'CA',
 ARRAY['Facility construction', 'Clean room build-outs', 'Turnkey projects'], 'active', 'verified'),

-- Waste
('eco-cycle-cannabis', 'EcoCycle Cannabis', 'Dr. Priya Nair', 'Environmental Lead', 'services',
 ARRAY['services'], ARRAY['CA','US'], 'Cannabis-specific waste management and environmental compliance services.', 'https://ecocyclecannabis.example.com', 'CA',
 ARRAY['Waste processing', 'Environmental compliance', 'Sustainable disposal'], 'active', 'verified'),

-- Insurance
('cannasure-group', 'CannaSure Group', 'Robert Lang', 'Managing Partner', 'services',
 ARRAY['services'], ARRAY['CA','US'], 'Cannabis-specialized insurance brokerage offering property, liability, and product coverage.', 'https://cannasuregroup.example.com', 'CA',
 ARRAY['Property & liability', 'Product liability', 'Crop insurance'], 'active', 'verified'),

-- Retail Tech
('retail-core-systems', 'RetailCore Systems', 'Jennifer Walsh', 'Founder', 'services',
 ARRAY['services'], ARRAY['CA','US'], 'Comprehensive retail technology platform including POS, loyalty, and compliance tools for dispensaries.', 'https://retailcoresystems.example.com', 'CA',
 ARRAY['Retail POS', 'Loyalty programs', 'Compliance tools'], 'active', 'verified');
