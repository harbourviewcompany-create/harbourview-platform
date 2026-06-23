-- supabase/migrations/20260623213500_seed_retail_equipment_suppliers.sql
-- Seed suppliers focused on retail equipment and technology for cannabis dispensaries

INSERT INTO public.supplier_profiles (
  profile_slug, company_name, contact_name, title, seller_type,
  categories, regions_served, description_public, website, hq_country,
  services_offered, status, verification_status
) VALUES
-- Retail Display & Merchandising
('canna-display-pro', 'CannaDisplay Pro', 'Rachel Kim', 'Sales Director', 'equipment',
 ARRAY['equipment'], ARRAY['CA','US'], 'Specialized retail display cases, shelving, and merchandising solutions designed specifically for cannabis dispensaries with compliant product presentation.', 'https://cannadisplaypro.example.com', 'CA',
 ARRAY['Retail display cases', 'Merchandising systems', 'Store layout design'], 'active', 'verified'),

('premium-showcases', 'Premium Showcases', 'Daniel Park', 'Founder', 'equipment',
 ARRAY['equipment'], ARRAY['CA','US'], 'High-end secure display cases and counters built for cannabis retail with integrated lighting, locking systems, and elegant design.', 'https://premiumshowcases.example.com', 'US',
 ARRAY['Secure display cases', 'Retail counters', 'Custom store fixtures'], 'active', 'verified'),

-- Retail Security Equipment
('retail-vault-systems', 'Retail Vault Systems', 'Marcus Thompson', 'VP Sales', 'equipment',
 ARRAY['equipment'], ARRAY['CA','US'], 'Specialized safes, vaults, and secure storage solutions designed for high-value cannabis inventory in retail environments.', 'https://retailvaultsystems.example.com', 'CA',
 ARRAY['Retail safes & vaults', 'Secure storage solutions', 'Installation & service'], 'active', 'verified'),

-- POS & Retail Technology
('dispensary-tech', 'Dispensary Tech Solutions', 'Priya Sharma', 'CEO', 'services',
 ARRAY['services'], ARRAY['CA','US'], 'Complete retail technology provider offering POS systems, inventory management, customer loyalty programs, and compliance tools for cannabis dispensaries.', 'https://dispensarytech.example.com', 'CA',
 ARRAY['POS systems', 'Loyalty programs', 'Inventory management software'], 'active', 'verified'),

('kiosk-retail', 'Kiosk Retail Systems', 'Alex Rivera', 'Director of Product', 'equipment',
 ARRAY['equipment'], ARRAY['CA','US'], 'Interactive customer kiosks, digital menu boards, and self-service technology solutions for modern cannabis retail experiences.', 'https://kioskretailsystems.example.com', 'US',
 ARRAY['Interactive kiosks', 'Digital menu boards', 'Self-service retail tech'], 'active', 'verified'),

-- Payment & Compliance Hardware
('compliant-pay-tech', 'Compliant Pay Tech', 'Jennifer Walsh', 'Founder', 'services',
 ARRAY['services'], ARRAY['CA','US'], 'Cannabis-compliant payment processing hardware and software solutions including age verification systems and secure transaction equipment.', 'https://compliantpaytech.example.com', 'CA',
 ARRAY['Age verification systems', 'Secure payment hardware', 'Compliance payment solutions'], 'active', 'verified'),

-- Retail Operations Equipment
('cannastore-pro', 'CannaStore Pro', 'Michael Chen', 'VP Operations', 'equipment',
 ARRAY['equipment'], ARRAY['CA','US'], 'Comprehensive retail operations equipment provider including scales, packaging stations, labeling systems, and back-of-house workflow solutions for dispensaries.', 'https://cannastorepro.example.com', 'CA',
 ARRAY['Retail scales & packaging', 'Labeling systems', 'Back-of-house equipment'], 'active', 'verified');
