-- supabase/migrations/20260623210000_seed_specialized_international_suppliers.sql
-- More specialized and international verified suppliers

INSERT INTO public.supplier_profiles (
  profile_slug, company_name, contact_name, title, seller_type,
  categories, regions_served, description_public, website, hq_country,
  services_offered, status, verification_status
) VALUES
-- Specialized Equipment
('photon-dynamics', 'Photon Dynamics', 'Dr. Hans Mueller', 'Technical Sales Director', 'equipment',
 ARRAY['equipment'], ARRAY['EU','CA','US'], 'Advanced LED and full-spectrum lighting systems with integrated smart controls for precision cannabis cultivation.', 'https://photondynamics.example.com', 'DE',
 ARRAY['Precision LED systems', 'Smart cultivation controls', 'Energy efficiency consulting'], 'active', 'verified'),

('post-harvest-pro', 'PostHarvest Pro', 'Maria Santos', 'Founder', 'equipment',
 ARRAY['equipment'], ARRAY['CA','US','LATAM'], 'Specialized post-harvest processing equipment including high-capacity dryers, curing systems, and automated packaging lines.', 'https://postharvestpro.example.com', 'CA',
 ARRAY['Industrial drying systems', 'Automated packaging lines', 'Post-harvest workflow design'], 'active', 'verified'),

-- International / Specialized
('mediterranean-extracts', 'Mediterranean Extracts', 'Luca Rossi', 'CEO', 'processor',
 ARRAY['concentrates'], ARRAY['EU','CA'], 'Italian extraction company focused on high-quality full-spectrum and broad-spectrum cannabinoid extracts for the European wellness and medical markets.', 'https://mediterraneanextracts.example.com', 'IT',
 ARRAY['Full-spectrum extracts', 'Broad-spectrum isolates', 'European market entry support'], 'active', 'verified'),

('boreal-genetics', 'Boreal Genetics', 'Dr. Ingrid Larsson', 'Lead Scientist', 'genetics',
 ARRAY['genetics'], ARRAY['EU','CA','US'], 'Northern European genetics company specializing in high-CBD and balanced cannabinoid profiles with excellent stability for commercial production.', 'https://borealgenetics.example.com', 'SE',
 ARRAY['High-CBD genetics', 'Stable commercial cultivars', 'Breeding program collaboration'], 'active', 'verified'),

('pacific-testing', 'Pacific Testing Group', 'Dr. Kenji Tanaka', 'Laboratory Director', 'lab_testing',
 ARRAY['testing'], ARRAY['CA','US','JP'], 'International cannabis testing laboratory with locations in Canada and the U.S., offering advanced analytical services and regulatory support for global operators.', 'https://pacifictesting.example.com', 'CA',
 ARRAY['Advanced analytical testing', 'International regulatory support', 'Method development'], 'active', 'verified'),

-- More Specialized Services
('facility-forge', 'Facility Forge', 'Robert Kline', 'Principal', 'services',
 ARRAY['services'], ARRAY['CA','US'], 'Specialized cannabis facility design and build consulting, helping operators optimize layouts, workflows, and compliance from the ground up.', 'https://facilityforge.example.com', 'CA',
 ARRAY['Facility design consulting', 'Workflow optimization', 'Turnkey project support'], 'active', 'verified'),

('brand-elevate', 'Brand Elevate', 'Jessica Lang', 'Managing Partner', 'services',
 ARRAY['services'], ARRAY['CA','US'], 'Cannabis brand development and marketing strategy firm helping licensed operators build compliant, differentiated consumer brands.', 'https://brandelevate.example.com', 'US',
 ARRAY['Brand strategy', 'Compliant marketing', 'Packaging & positioning'], 'active', 'verified');
