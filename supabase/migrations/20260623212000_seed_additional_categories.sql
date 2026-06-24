-- supabase/migrations/20260623212000_seed_additional_categories.sql
-- Seed suppliers in additional/underserved categories

INSERT INTO public.supplier_profiles (
  profile_slug, company_name, contact_name, title, seller_type,
  categories, regions_served, description_public, website, hq_country,
  services_offered, status, verification_status
) VALUES
-- Nutrients & Growing Media
('vita-grow-solutions', 'VitaGrow Solutions', 'Dr. Emily Carter', 'Technical Director', 'other',
 ARRAY['consumables'], ARRAY['CA','US','EU'], 'Premium organic and synthetic nutrient lines specifically formulated for cannabis, along with high-quality growing media and soil amendments.', 'https://vitagrowsolutions.example.com', 'CA',
 ARRAY['Cannabis nutrients', 'Growing media', 'Cultivation consulting'], 'active', 'verified'),

('root-science', 'Root Science', 'Michael Torres', 'Founder', 'other',
 ARRAY['consumables'], ARRAY['CA','US'], 'Specialized root zone and microbial products designed to improve plant health, nutrient uptake, and soil biology in cannabis cultivation.', 'https://rootscience.example.com', 'US',
 ARRAY['Microbial inoculants', 'Root zone enhancers', 'Biological crop support'], 'active', 'verified'),

-- Specialized Packaging
('eco-pack-cannabis', 'EcoPack Cannabis', 'Laura Kim', 'Sales Director', 'packaging',
 ARRAY['packaging'], ARRAY['CA','US'], 'Sustainable, child-resistant, and fully compliant packaging solutions with custom printing and innovative formats for flower, edibles, and concentrates.', 'https://ecopackcannabis.example.com', 'CA',
 ARRAY['Sustainable packaging', 'Child-resistant solutions', 'Custom labeling & printing'], 'active', 'verified'),

-- Security & Surveillance
('guardian-cannabis-security', 'Guardian Cannabis Security', 'David Ruiz', 'VP Operations', 'services',
 ARRAY['services'], ARRAY['CA','US'], 'Comprehensive security solutions for licensed cannabis facilities including 24/7 monitoring, access control, intrusion detection, and compliance reporting systems.', 'https://guardiancannabis.example.com', 'CA',
 ARRAY['24/7 monitoring', 'Access control systems', 'Compliance security solutions'], 'active', 'verified'),

-- Software & Technology
('flowstate-software', 'FlowState Software', 'Jennifer Walsh', 'CEO', 'services',
 ARRAY['services'], ARRAY['CA','US','EU'], 'Modern seed-to-sale and ERP platform built specifically for cannabis operators, with strong compliance, inventory, and reporting capabilities.', 'https://flowstatesoftware.example.com', 'CA',
 ARRAY['Seed-to-sale platform', 'ERP & inventory management', 'Compliance reporting'], 'active', 'verified'),

('canna-pos-pro', 'CannaPOS Pro', 'Ryan Patel', 'Founder', 'services',
 ARRAY['services'], ARRAY['CA','US'], 'Specialized point-of-sale and retail management software for licensed cannabis dispensaries and retail operations.', 'https://cannapospro.example.com', 'US',
 ARRAY['Retail POS systems', 'Inventory & compliance tools', 'Customer loyalty programs'], 'active', 'verified'),

-- Transportation & Logistics
('secure-transit-logistics', 'Secure Transit Logistics', 'Carlos Mendoza', 'Director of Operations', 'distributor',
 ARRAY['logistics'], ARRAY['CA','US'], 'Licensed and insured cannabis transportation and logistics company offering secure, temperature-controlled shipping across Canada and the U.S.', 'https://securetransitlogistics.example.com', 'CA',
 ARRAY['Temperature-controlled transport', 'Secure logistics', 'Cross-border shipping'], 'active', 'verified'),

-- Construction & Facility Build-out
('cannabuild-pro', 'CannaBuild Pro', 'Andrew Sinclair', 'Principal', 'services',
 ARRAY['services'], ARRAY['CA','US'], 'Specialized construction and facility build-out company experienced in designing and building compliant cannabis cultivation and processing facilities.', 'https://cannabuildpro.example.com', 'CA',
 ARRAY['Facility construction', 'Clean room & processing build-outs', 'Turnkey project management'], 'active', 'verified'),

-- Waste Management & Environmental
('green-cycle-waste', 'GreenCycle Waste Solutions', 'Dr. Priya Nair', 'Environmental Director', 'services',
 ARRAY['services'], ARRAY['CA','US'], 'Specialized cannabis waste management and environmental compliance services, including organic waste processing and regulatory reporting.', 'https://greencyclewaste.example.com', 'CA',
 ARRAY['Cannabis waste processing', 'Environmental compliance', 'Sustainable disposal solutions'], 'active', 'verified'),

-- Insurance & Financial Services
('canna-shield-insurance', 'CannaShield Insurance', 'Robert Lang', 'Managing Partner', 'services',
 ARRAY['services'], ARRAY['CA','US'], 'Specialized insurance brokerage offering cannabis-specific coverage including property, liability, product liability, and crop insurance for licensed operators.', 'https://cannashieldinsurance.example.com', 'CA',
 ARRAY['Cannabis property & liability', 'Product liability', 'Crop insurance'], 'active', 'verified');
