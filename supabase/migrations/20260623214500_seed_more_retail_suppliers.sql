-- supabase/migrations/20260623214500_seed_more_retail_suppliers.sql
-- Additional retail-focused suppliers for cannabis dispensaries

INSERT INTO public.supplier_profiles (
  profile_slug, company_name, contact_name, title, seller_type,
  categories, regions_served, description_public, website, hq_country,
  services_offered, status, verification_status
) VALUES
-- More Retail POS & Management
('retail-flow-pos', 'RetailFlow POS', 'Amanda Chen', 'VP Product', 'services',
 ARRAY['services'], ARRAY['CA','US'], 'Modern point-of-sale and retail management platform built for cannabis dispensaries with integrated compliance, inventory tracking, and customer loyalty features.', 'https://retailflowpos.example.com', 'CA',
 ARRAY['POS systems', 'Inventory management', 'Loyalty & CRM tools'], 'active', 'verified'),

('omnichannel-retail', 'OmniChannel Retail', 'James Patel', 'Founder', 'services',
 ARRAY['services'], ARRAY['CA','US'], 'Integrated retail technology platform connecting in-store POS with online ordering, delivery, and curbside pickup for cannabis retailers.', 'https://omnichannelretail.example.com', 'US',
 ARRAY['Omnichannel retail platform', 'E-commerce integration', 'Delivery management'], 'active', 'verified'),

-- Retail Security & Compliance
('store-shield-security', 'StoreShield Security', 'Carlos Rivera', 'Director of Sales', 'equipment',
 ARRAY['equipment'], ARRAY['CA','US'], 'Retail-focused security solutions including high-resolution surveillance, panic buttons, and integrated alarm systems designed for cannabis dispensaries.', 'https://storeshieldsecurity.example.com', 'CA',
 ARRAY['Retail surveillance systems', 'Panic & alarm systems', 'Access control for retail'], 'active', 'verified'),

('age-verify-pro', 'AgeVerify Pro', 'Dr. Lisa Wong', 'Product Director', 'services',
 ARRAY['services'], ARRAY['CA','US'], 'Advanced age verification and ID scanning solutions with biometric options and seamless integration into retail POS workflows.', 'https://ageverifypro.example.com', 'CA',
 ARRAY['Age verification systems', 'ID scanning hardware', 'Compliance integration'], 'active', 'verified'),

-- Customer Experience & Digital Retail
('digital-menu-pro', 'Digital Menu Pro', 'Tyler Brooks', 'CEO', 'equipment',
 ARRAY['equipment'], ARRAY['CA','US'], 'Interactive digital menu boards, customer-facing kiosks, and digital signage solutions that enhance the in-store cannabis retail experience.', 'https://digitalmenupro.example.com', 'US',
 ARRAY['Digital menu boards', 'Interactive kiosks', 'Digital signage solutions'], 'active', 'verified'),

('loyalty-engine', 'Loyalty Engine', 'Natalie Cruz', 'Head of Growth', 'services',
 ARRAY['services'], ARRAY['CA','US'], 'Cannabis-specific customer loyalty and rewards platform with points, tiers, personalized offers, and seamless POS integration.', 'https://loyaltyengine.example.com', 'CA',
 ARRAY['Loyalty & rewards programs', 'Customer analytics', 'Personalized marketing'], 'active', 'verified'),

-- Retail Operations & Back-of-House
('pack-station-pro', 'PackStation Pro', 'Kevin Morales', 'Operations Director', 'equipment',
 ARRAY['equipment'], ARRAY['CA','US'], 'Specialized packaging stations, labeling systems, and workflow equipment designed to improve speed and accuracy in cannabis retail back-of-house operations.', 'https://packstationpro.example.com', 'CA',
 ARRAY['Packaging stations', 'Labeling & printing systems', 'Workflow optimization equipment'], 'active', 'verified'),

('inventory-scan-tech', 'Inventory Scan Tech', 'Rachel Singh', 'Founder', 'equipment',
 ARRAY['equipment'], ARRAY['CA','US'], 'RFID and barcode scanning solutions for fast, accurate inventory management and cycle counting in cannabis retail environments.', 'https://inventoryscantech.example.com', 'US',
 ARRAY['RFID & barcode systems', 'Inventory cycle counting', 'Real-time stock visibility'], 'active', 'verified');
