-- supabase/migrations/20260623214000_seed_store_lighting_fixtures.sql
-- Seed suppliers specializing in store lighting fixtures and retail lighting for cannabis dispensaries

INSERT INTO public.supplier_profiles (
  profile_slug, company_name, contact_name, title, seller_type,
  categories, regions_served, description_public, website, hq_country,
  services_offered, status, verification_status
) VALUES
-- Retail Lighting Specialists
('lumen-retail', 'Lumen Retail Lighting', 'Elena Vargas', 'Sales Director', 'equipment',
 ARRAY['equipment'], ARRAY['CA','US'], 'Specialized LED lighting solutions and custom fixtures designed to beautifully and compliantly illuminate cannabis retail displays and product showcases.', 'https://lumenretail.example.com', 'CA',
 ARRAY['LED retail display lighting', 'Custom light fixtures', 'Store lighting design'], 'active', 'verified'),

('glow-fixtures', 'Glow Fixtures', 'Marcus Hale', 'Founder', 'equipment',
 ARRAY['equipment'], ARRAY['CA','US'], 'Premium retail lighting fixtures and integrated display lighting systems engineered specifically for cannabis dispensaries and high-end retail environments.', 'https://glowfixtures.example.com', 'US',
 ARRAY['Integrated display lighting', 'Premium retail fixtures', 'Energy-efficient solutions'], 'active', 'verified'),

('retail-illumination-pro', 'Retail Illumination Pro', 'Dr. Sophia Lang', 'Technical Director', 'equipment',
 ARRAY['equipment'], ARRAY['CA','US','EU'], 'Full-service retail lighting company offering design, custom fixtures, and installation for cannabis stores with focus on product presentation and customer experience.', 'https://retaililluminationpro.example.com', 'CA',
 ARRAY['Lighting design services', 'Custom fixture manufacturing', 'Professional installation'], 'active', 'verified'),

-- Display & Merchandising Lighting
('showcase-lighting', 'Showcase Lighting Systems', 'David Kim', 'VP Sales', 'equipment',
 ARRAY['equipment'], ARRAY['CA','US'], 'Specialized lighting systems for secure display cases and retail showcases with adjustable color temperature and high CRI for accurate product representation.', 'https://showcaselighting.example.com', 'CA',
 ARRAY['Display case lighting', 'High-CRI LED systems', 'Adjustable color temperature'], 'active', 'verified'),

('merch-light-pro', 'MerchLight Pro', 'Isabella Torres', 'Product Manager', 'equipment',
 ARRAY['equipment'], ARRAY['CA','US'], 'Merchandising-focused lighting solutions including track lighting, accent lights, and shelf lighting systems designed to highlight products in cannabis retail settings.', 'https://merchlightpro.example.com', 'US',
 ARRAY['Track & accent lighting', 'Shelf illumination', 'Product highlighting systems'], 'active', 'verified'),

-- Full Store Lighting Solutions
('canna-store-lighting', 'CannaStore Lighting', 'Robert Chen', 'Principal', 'equipment',
 ARRAY['equipment'], ARRAY['CA','US'], 'Complete store lighting solutions for cannabis dispensaries including ambient, task, and accent lighting with energy efficiency and compliance considerations.', 'https://cannastorelighting.example.com', 'CA',
 ARRAY['Full store lighting design', 'Energy-efficient systems', 'Installation & maintenance'], 'active', 'verified'),

('premium-retail-light', 'Premium Retail Light', 'Dr. Anna Schmidt', 'Director of Design', 'equipment',
 ARRAY['equipment'], ARRAY['EU','CA'], 'European-designed premium lighting fixtures and systems tailored for high-end cannabis retail with elegant aesthetics and superior light quality.', 'https://premiumretaillight.example.com', 'DE',
 ARRAY['Premium lighting fixtures', 'European design', 'High-end retail solutions'], 'active', 'verified');
