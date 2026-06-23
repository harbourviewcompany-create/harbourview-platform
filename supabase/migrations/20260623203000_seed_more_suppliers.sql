-- supabase/migrations/20260623203000_seed_more_suppliers.sql
-- Additional batch of verified suppliers for a more exhaustive directory

INSERT INTO public.supplier_profiles (
  profile_slug, company_name, contact_name, title, seller_type,
  categories, regions_served, description_public, website, hq_country,
  services_offered, status, verification_status
) VALUES
-- More Cultivators
('prairie-grove-farms', 'Prairie Grove Farms', 'Ethan Caldwell', 'Sales Manager', 'cultivator',
 ARRAY['flower'], ARRAY['CA','US'], 'Large outdoor and greenhouse cultivator in the Canadian prairies, known for consistent supply and strong relationships with licensed processors across Western Canada.', 'https://prairiegrovefarms.example.com', 'CA',
 ARRAY['Bulk outdoor flower', 'Greenhouse production', 'Long-term supply contracts'], 'active', 'verified'),

('coastal-greens', 'Coastal Greens Ltd.', 'Olivia Bennett', 'Director of Partnerships', 'cultivator',
 ARRAY['flower','genetics'], ARRAY['CA','US'], 'West Coast cultivator specializing in premium craft flower and unique genetic crosses with excellent bag appeal and terpene profiles.', 'https://coastalgreens.example.com', 'CA',
 ARRAY['Craft flower wholesale', 'Limited edition genetics', 'Brand collaboration'], 'active', 'verified'),

-- More Processors
('summit-extraction', 'Summit Extraction Labs', 'Nathaniel Cross', 'Head of Production', 'processor',
 ARRAY['concentrates','vapes'], ARRAY['US','CA'], 'High-capacity extraction and manufacturing facility offering hydrocarbon, CO2, and rosin processing with strong focus on quality and compliance.', 'https://summitextraction.example.com', 'US',
 ARRAY['Hydrocarbon & CO2 extraction', 'Rosin production', 'Vape and cartridge manufacturing'], 'active', 'verified'),

('midwest-manufacturing', 'Midwest Manufacturing Co.', 'Hannah Schmidt', 'Operations Lead', 'processor',
 ARRAY['edibles'], ARRAY['US','CA'], 'Specialized edibles manufacturer focused on consistent dosing, innovative formats, and scalable production for national brands.', 'https://midwestmanufacturing.example.com', 'US',
 ARRAY['Edibles production', 'Gummy & chocolate manufacturing', 'Private label services'], 'active', 'verified'),

-- More Equipment
('climate-forge', 'Climate Forge', 'Lucas Rivera', 'VP Sales', 'equipment',
 ARRAY['equipment'], ARRAY['US','CA','EU'], 'Advanced HVAC and environmental control systems designed specifically for large-scale cannabis cultivation facilities.', 'https://climateforge.example.com', 'US',
 ARRAY['HVAC & dehumidification', 'Environmental controls', 'Facility design support'], 'active', 'verified'),

('trim-tech-pro', 'TrimTech Pro', 'Isabel Vargas', 'Founder & CEO', 'equipment',
 ARRAY['equipment'], ARRAY['CA','US'], 'Automated post-harvest processing equipment including high-speed trimmers, buckers, and sorting systems for commercial operations.', 'https://trimtechpro.example.com', 'CA',
 ARRAY['Automated trimming equipment', 'Buckers and sorters', 'Post-harvest workflow solutions'], 'active', 'verified'),

-- More Genetics
('northern-lights-genetics', 'Northern Lights Genetics', 'Alexander Voss', 'Lead Geneticist', 'genetics',
 ARRAY['genetics'], ARRAY['CA','US','EU'], 'Specialized in cold-climate adapted and high-resin cultivars with strong medicinal profiles and stable genetics.', 'https://northernlightgenetics.example.com', 'CA',
 ARRAY['Cold-climate genetics', 'High-resin cultivars', 'Breeding program support'], 'active', 'verified'),

-- More Labs
('apex-analytics', 'Apex Analytics', 'Dr. Marcus Hale', 'Laboratory Director', 'lab_testing',
 ARRAY['testing'], ARRAY['US','CA'], 'Fast-turnaround cannabis testing laboratory with advanced instrumentation and detailed reporting for producers and processors.', 'https://apexanalytics.example.com', 'US',
 ARRAY['Comprehensive testing panels', 'Rapid turnaround', 'Regulatory documentation'], 'active', 'verified'),

-- Distribution & Wholesale
('horizon-distribution', 'Horizon Distribution', 'Priya Malhotra', 'Director of Sales', 'distributor',
 ARRAY['logistics'], ARRAY['CA','US'], 'Licensed cannabis distributor providing compliant warehousing, logistics, and wholesale distribution services across multiple provinces and states.', 'https://horizondistribution.example.com', 'CA',
 ARRAY['Wholesale distribution', 'Temperature-controlled storage', 'Order fulfillment'], 'active', 'verified'),

-- More Services
('regulatory-bridge', 'Regulatory Bridge Consulting', 'David Moreau', 'Principal', 'services',
 ARRAY['services'], ARRAY['CA','US','EU'], 'Experienced regulatory consulting firm helping companies navigate licensing, compliance, and market entry in complex cannabis jurisdictions.', 'https://regulatorybridge.example.com', 'CA',
 ARRAY['Licensing applications', 'Compliance audits', 'Market entry strategy'], 'active', 'verified'),

('operations-elevate', 'Operations Elevate', 'Chloe Bennett', 'Managing Director', 'services',
 ARRAY['services'], ARRAY['CA','US'], 'Operational excellence consulting focused on scaling cultivation and processing facilities while maintaining compliance and quality standards.', 'https://operationselevate.example.com', 'CA',
 ARRAY['Facility scaling', 'Process optimization', 'Team training programs'], 'active', 'verified');
