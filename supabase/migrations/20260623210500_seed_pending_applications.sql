-- supabase/migrations/20260623210500_seed_pending_applications.sql
-- Seed some pending (unverified) supplier applications to demonstrate the full intake workflow

INSERT INTO public.supplier_profiles (
  profile_slug, company_name, contact_name, title, seller_type,
  categories, regions_served, description_public, website, hq_country,
  services_offered, status, verification_status
) VALUES
('new-horizon-cultivation', 'New Horizon Cultivation', 'Tyler Grant', 'Founder', 'cultivator',
 ARRAY['flower'], ARRAY['CA'], 'Newly licensed cultivator looking to establish wholesale relationships and contract growing partnerships in Western Canada.', 'https://newhorizoncultivation.example.com', 'CA',
 ARRAY['Wholesale flower', 'Contract growing'], 'pending', 'pending'),

('precision-extracts-inc', 'Precision Extracts Inc.', 'Dr. Nadia Patel', 'CEO', 'processor',
 ARRAY['concentrates','vapes'], ARRAY['CA','US'], 'Startup extraction company seeking white-label and contract manufacturing opportunities with established brands.', 'https://precisionextracts.example.com', 'CA',
 ARRAY['Contract extraction', 'White label production'], 'pending', 'pending'),

('growtech-solutions', 'GrowTech Solutions', 'Marcus Lee', 'Director of Sales', 'equipment',
 ARRAY['equipment'], ARRAY['CA','US'], 'New equipment provider specializing in affordable automated irrigation and fertigation systems for mid-size cultivators.', 'https://growtechsolutions.example.com', 'US',
 ARRAY['Irrigation systems', 'Fertigation equipment', 'Installation support'], 'pending', 'pending'),

('canada-genetics-hub', 'Canada Genetics Hub', 'Sarah Mitchell', 'Business Development', 'genetics',
 ARRAY['genetics'], ARRAY['CA'], 'Emerging genetics company offering locally adapted cultivars and tissue culture services for Canadian licensed producers.', 'https://canadageneticshub.example.com', 'CA',
 ARRAY['Local genetics', 'Tissue culture services'], 'pending', 'pending'),

('metro-testing-lab', 'Metro Testing Lab', 'Dr. Omar Hassan', 'Founder', 'lab_testing',
 ARRAY['testing'], ARRAY['CA'], 'Newly established testing laboratory seeking partnerships with cultivators and processors in major Canadian markets.', 'https://metrotestinglab.example.com', 'CA',
 ARRAY['Potency testing', 'Contaminant screening'], 'pending', 'pending');
