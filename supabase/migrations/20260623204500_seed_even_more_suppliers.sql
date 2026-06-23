-- supabase/migrations/20260623204500_seed_even_more_suppliers.sql
-- Another round of high-quality verified supplier seed data

INSERT INTO public.supplier_profiles (
  profile_slug, company_name, contact_name, title, seller_type,
  categories, regions_served, description_public, website, hq_country,
  services_offered, status, verification_status
) VALUES
-- Additional Cultivators
('rocky-mountain-greens', 'Rocky Mountain Greens', 'Liam Harper', 'Head of Sales', 'cultivator',
 ARRAY['flower'], ARRAY['CA','US'], 'High-altitude greenhouse cultivator known for consistent quality and strong supply chain relationships with major Canadian and U.S. processors.', 'https://rockymountaingreens.example.com', 'CA',
 ARRAY['Greenhouse flower supply', 'Contract growing', 'Seasonal bulk programs'], 'active', 'verified'),

('evergreen-cultivation', 'Evergreen Cultivation', 'Sofia Ramirez', 'Partnerships Manager', 'cultivator',
 ARRAY['flower','genetics'], ARRAY['CA','US'], 'Sustainable outdoor and hybrid cultivator focused on regenerative agriculture practices and premium sun-grown flower.', 'https://evergreencultivation.example.com', 'CA',
 ARRAY['Sun-grown flower', 'Regenerative cultivation', 'Limited release genetics'], 'active', 'verified'),

-- Additional Processors
('cascadia-extracts', 'Cascadia Extracts', 'Benjamin Cole', 'Director of Operations', 'processor',
 ARRAY['concentrates','vapes'], ARRAY['CA','US'], 'Pacific Northwest extraction facility specializing in high-quality live resin, distillate, and solventless products.', 'https://cascadiaextracts.example.com', 'CA',
 ARRAY['Live resin & distillate', 'Solventless processing', 'Custom formulation'], 'active', 'verified'),

('heartland-manufacturing', 'Heartland Manufacturing', 'Amelia Torres', 'Production Manager', 'processor',
 ARRAY['edibles'], ARRAY['US','CA'], 'Midwest-based edibles manufacturer with expertise in consistent dosing, innovative delivery formats, and large-scale production.', 'https://heartlandmanufacturing.example.com', 'US',
 ARRAY['Edibles manufacturing', 'Gummy & chocolate production', 'Private label & co-packing'], 'active', 'verified'),

-- Nutrients & Inputs
('terra-nutrients', 'Terra Nutrients', 'Dr. Raj Patel', 'Technical Director', 'other',
 ARRAY['consumables'], ARRAY['CA','US','EU'], 'Premium nutrient and growing media supplier with cannabis-specific formulations and strong technical support for commercial cultivators.', 'https://terranutrients.example.com', 'CA',
 ARRAY['Cannabis-specific nutrients', 'Growing media', 'Technical cultivation support'], 'active', 'verified'),

-- Security & Compliance Tech
('sentinel-security', 'Sentinel Security Solutions', 'Marcus Webb', 'VP Business Development', 'services',
 ARRAY['services'], ARRAY['CA','US'], 'Specialized security and surveillance solutions designed for licensed cannabis facilities, including access control, video monitoring, and compliance reporting.', 'https://sentinelsecurity.example.com', 'CA',
 ARRAY['Facility security systems', 'Access control', 'Compliance monitoring'], 'active', 'verified'),

-- Software & Traceability
('cantrace-platform', 'CanTrace Platform', 'Elena Voss', 'CEO', 'services',
 ARRAY['services'], ARRAY['CA','US','EU'], 'Seed-to-sale traceability and compliance software platform helping licensed operators manage inventory, reporting, and regulatory requirements.', 'https://cantraceplatform.example.com', 'CA',
 ARRAY['Seed-to-sale software', 'Compliance reporting', 'Inventory management'], 'active', 'verified'),

-- More European Players
('alpine-extracts', 'Alpine Extracts GmbH', 'Dr. Lukas Weber', 'Managing Director', 'processor',
 ARRAY['concentrates'], ARRAY['EU','CA'], 'German extraction and formulation company focused on high-purity cannabinoid isolates and full-spectrum extracts for the European market.', 'https://alpineextracts.example.com', 'DE',
 ARRAY['Cannabinoid isolates', 'Full-spectrum extracts', 'European regulatory support'], 'active', 'verified'),

('nordic-genetics', 'Nordic Genetics', 'Anna Lindqvist', 'Head of Breeding', 'genetics',
 ARRAY['genetics'], ARRAY['EU','CA'], 'Scandinavian genetics company specializing in resilient, high-yielding cultivars adapted to cooler climates and indoor production.', 'https://nordicgenetics.example.com', 'SE',
 ARRAY['Climate-resilient genetics', 'Indoor-optimized cultivars', 'Breeding consulting'], 'active', 'verified'),

-- More Specialized Services
('quality-forge-consulting', 'Quality Forge Consulting', 'Daniel Kim', 'Principal Consultant', 'services',
 ARRAY['services'], ARRAY['CA','US'], 'Quality management and GxP consulting firm helping cannabis companies implement robust quality systems and prepare for regulatory audits.', 'https://qualityforge.example.com', 'CA',
 ARRAY['Quality management systems', 'GxP implementation', 'Audit readiness'], 'active', 'verified');
