-- supabase/migrations/20260623221000_seed_more_pending_applications.sql
-- Additional pending (unverified) supplier applications

INSERT INTO public.supplier_profiles (
  profile_slug, company_name, contact_name, title, seller_type,
  categories, regions_served, description_public, website, hq_country,
  services_offered, status, verification_status
) VALUES
('summit-grove-cultivation', 'Summit Grove Cultivation', 'Ethan Caldwell', 'Founder', 'cultivator',
 ARRAY['flower'], ARRAY['CA'], 'Newly licensed cultivator seeking wholesale partnerships and long-term supply contracts with established processors.', 'https://summitgrovecultivation.example.com', 'CA',
 ARRAY['Wholesale flower supply', 'Contract growing'], 'pending', 'pending'),

('extract-pro-inc', 'Extract Pro Inc.', 'Dr. Nadia Patel', 'CEO', 'processor',
 ARRAY['concentrates'], ARRAY['CA','US'], 'Startup extraction company looking for white-label and contract manufacturing opportunities.', 'https://extractpro.example.com', 'CA',
 ARRAY['Contract extraction', 'White label services'], 'pending', 'pending'),

('smart-grow-equipment', 'SmartGrow Equipment', 'Lucas Rivera', 'Director of Sales', 'equipment',
 ARRAY['equipment'], ARRAY['CA','US'], 'New provider of smart irrigation and environmental control systems for mid-size cultivators.', 'https://smartgrowequipment.example.com', 'US',
 ARRAY['Smart irrigation systems', 'Environmental controls'], 'pending', 'pending'),

('canada-breeder-hub', 'Canada Breeder Hub', 'Sarah Mitchell', 'Business Development', 'genetics',
 ARRAY['genetics'], ARRAY['CA'], 'Emerging genetics company offering locally adapted cultivars and tissue culture services.', 'https://canadabreederhub.example.com', 'CA',
 ARRAY['Local genetics', 'Tissue culture services'], 'pending', 'pending'),

('metro-analytics-lab', 'Metro Analytics Lab', 'Dr. Omar Hassan', 'Founder', 'lab_testing',
 ARRAY['testing'], ARRAY['CA'], 'New testing laboratory seeking partnerships with cultivators and processors in major markets.', 'https://metroanalyticslab.example.com', 'CA',
 ARRAY['Potency & contaminant testing'], 'pending', 'pending'),

('secure-pack-canada', 'SecurePack Canada', 'Laura Kim', 'Sales Manager', 'packaging',
 ARRAY['packaging'], ARRAY['CA'], 'New packaging company specializing in compliant, child-resistant solutions for cannabis products.', 'https://securepackcanada.example.com', 'CA',
 ARRAY['Child-resistant packaging', 'Custom labeling'], 'pending', 'pending'),

('canna-transit-logistics', 'CannaTransit Logistics', 'Carlos Mendoza', 'Operations Lead', 'distributor',
 ARRAY['logistics'], ARRAY['CA'], 'New licensed logistics company offering secure transportation services across Western Canada.', 'https://cannatransitlogistics.example.com', 'CA',
 ARRAY['Secure transportation', 'Temperature-controlled delivery'], 'pending', 'pending'),

('growth-consulting-group', 'Growth Consulting Group', 'Victoria Lang', 'Principal', 'services',
 ARRAY['services'], ARRAY['CA','US'], 'New consulting firm helping operators with licensing, scaling, and regulatory compliance.', 'https://growthconsulting.example.com', 'CA',
 ARRAY['Licensing support', 'Operational consulting'], 'pending', 'pending'),

('retail-tech-startup', 'RetailTech Startup', 'Ryan Patel', 'Founder', 'services',
 ARRAY['services'], ARRAY['CA','US'], 'Early-stage company developing modern POS and loyalty solutions for cannabis dispensaries.', 'https://retailtechstartup.example.com', 'CA',
 ARRAY['Retail POS systems', 'Loyalty platforms'], 'pending', 'pending');
