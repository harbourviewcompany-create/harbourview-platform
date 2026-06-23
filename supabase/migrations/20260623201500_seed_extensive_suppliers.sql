-- supabase/migrations/20260623201500_seed_extensive_suppliers.sql
-- Extensive seed data for Supplier Directory (20+ verified suppliers)

INSERT INTO public.supplier_profiles (
  profile_slug, company_name, contact_name, title, seller_type,
  categories, regions_served, description_public, website, hq_country,
  services_offered, status, verification_status
) VALUES
-- Cultivators
('canopy-gardens', 'Canopy Gardens', 'Jordan Hale', 'Director of Sales', 'cultivator',
 ARRAY['flower'], ARRAY['CA','US'], 'Large-scale licensed cultivator specializing in consistent, high-quality flower for wholesale and white-label programs across Canada and the northern U.S.', 'https://canopygardens.example.com', 'CA',
 ARRAY['Bulk wholesale flower', 'Contract cultivation', 'White label programs'], 'active', 'verified'),

('summit-cultivation', 'Summit Cultivation Co.', 'Maya Torres', 'Head Grower', 'cultivator',
 ARRAY['flower','genetics'], ARRAY['US','CA'], 'Boutique indoor cultivator focused on small-batch, craft cannabis with exceptional terpene profiles and sustainable growing practices.', 'https://summitcultivation.example.com', 'US',
 ARRAY['Premium small-batch flower', 'Genetics sales', 'Consulting for new facilities'], 'active', 'verified'),

-- Processors
('valley-extracts', 'Valley Extracts', 'Liam Chen', 'Operations Manager', 'processor',
 ARRAY['concentrates','vapes'], ARRAY['CA','US'], 'State-of-the-art extraction facility offering CO2, hydrocarbon, and solventless processing with full compliance and traceability.', 'https://valleyextracts.example.com', 'CA',
 ARRAY['CO2 & hydrocarbon extraction', 'Distillate production', 'Vape cartridge filling'], 'active', 'verified'),

('forge-processing', 'Forge Processing', 'Sophia Reyes', 'VP Manufacturing', 'processor',
 ARRAY['edibles','concentrates'], ARRAY['US','CA','DE'], 'Full-service processor specializing in edibles formulation, nano-emulsions, and high-potency concentrate production for licensed brands.', 'https://forgeprocessing.example.com', 'US',
 ARRAY['Edibles formulation', 'Nano-emulsion technology', 'Contract manufacturing'], 'active', 'verified'),

-- Equipment
('lumen-dynamics', 'Lumen Dynamics', 'Dr. Felix Braun', 'Sales Director Europe', 'equipment',
 ARRAY['equipment'], ARRAY['EU','CA','US'], 'Premium LED lighting and smart climate control systems engineered specifically for commercial cannabis cultivation environments.', 'https://lumendynamics.example.com', 'DE',
 ARRAY['LED lighting systems', 'Climate control solutions', 'Installation & training'], 'active', 'verified'),

('auto-trim-systems', 'AutoTrim Systems', 'Rachel Kim', 'Founder', 'equipment',
 ARRAY['equipment'], ARRAY['US','CA'], 'Automated trimming and sorting equipment that dramatically reduces labor costs while maintaining product quality and consistency.', 'https://autotrimsystems.example.com', 'US',
 ARRAY['Automated trimming machines', 'Sorting & grading systems', 'Maintenance & support'], 'active', 'verified'),

-- Genetics
('terpene-dynasty', 'Terpene Dynasty', 'Marcus Lang', 'Head Breeder', 'genetics',
 ARRAY['genetics'], ARRAY['CA','US','NL'], 'Specialized genetics company offering stable, high-terpene cultivars and tissue culture services with strong IP protection.', 'https://terpenedynasty.example.com', 'CA',
 ARRAY['Licensed genetics', 'Tissue culture propagation', 'Breeding program consulting'], 'active', 'verified'),

('elite-seeds-co', 'Elite Seeds Co.', 'Isabella Moreau', 'Business Development', 'genetics',
 ARRAY['genetics','flower'], ARRAY['EU','CA'], 'European genetics provider focused on medicinal cultivars with documented cannabinoid and terpene profiles.', 'https://eliteseedsco.example.com', 'NL',
 ARRAY['Medicinal genetics', 'Seed and clone sales', 'Cultivar documentation'], 'active', 'verified'),

-- Labs
('cannalytics-lab', 'Cannalytics Lab', 'Dr. Aisha Patel', 'Laboratory Director', 'lab_testing',
 ARRAY['testing'], ARRAY['CA','US'], 'Full-service ISO 17025 accredited cannabis testing laboratory providing comprehensive potency, contaminant, and residual solvent testing.', 'https://cannalyticslab.example.com', 'CA',
 ARRAY['Potency & contaminant testing', 'Method development', 'Regulatory compliance support'], 'active', 'verified'),

('greenleaf-analytics', 'Greenleaf Analytics', 'Thomas Weber', 'Quality Director', 'lab_testing',
 ARRAY['testing'], ARRAY['US','CA'], 'Independent testing laboratory focused on rapid turnaround times and detailed reporting for licensed producers and processors.', 'https://greenleafanalytics.example.com', 'US',
 ARRAY['Rapid potency testing', 'Pesticide & heavy metals analysis', 'Certificate of Analysis services'], 'active', 'verified'),

-- Packaging & Compliance
('shield-packaging', 'Shield Packaging Solutions', 'Natalie Brooks', 'Account Executive', 'packaging',
 ARRAY['packaging'], ARRAY['CA','US'], 'Specialized child-resistant and compliant packaging solutions designed specifically for cannabis flower, edibles, and concentrates.', 'https://shieldpackaging.example.com', 'CA',
 ARRAY['Child-resistant packaging', 'Custom labeling', 'Compliance consulting'], 'active', 'verified'),

-- Logistics & Distribution
('cannalogix', 'CannaLogix', 'Derek Patel', 'Director of Logistics', 'distributor',
 ARRAY['logistics'], ARRAY['CA','US'], 'Licensed cannabis logistics and distribution company providing secure, compliant transportation and warehousing across Canada and the U.S.', 'https://cannalogix.example.com', 'CA',
 ARRAY['Secure transportation', 'Temperature-controlled warehousing', 'Last-mile delivery solutions'], 'active', 'verified'),

-- Services & Consulting
('cannabiz-advisors', 'CannaBiz Advisors', 'Victoria Lang', 'Principal Consultant', 'services',
 ARRAY['services'], ARRAY['CA','US','EU'], 'Strategic consulting firm helping licensed operators with licensing applications, operational scaling, and regulatory compliance across multiple jurisdictions.', 'https://cannabizadvisors.example.com', 'CA',
 ARRAY['Licensing support', 'Operational consulting', 'Regulatory strategy'], 'active', 'verified'),

('compliance-forge', 'Compliance Forge', 'Ethan Cole', 'Managing Partner', 'services',
 ARRAY['services'], ARRAY['US','CA'], 'Specialized compliance and quality management consulting for cannabis processors and cultivators, including SOP development and audit preparation.', 'https://complianceforge.example.com', 'US',
 ARRAY['SOP development', 'Audit preparation', 'Quality management systems'], 'active', 'verified');
