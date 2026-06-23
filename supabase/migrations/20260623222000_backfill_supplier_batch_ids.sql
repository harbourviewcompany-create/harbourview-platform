-- supabase/migrations/20260623222000_backfill_supplier_batch_ids.sql
-- Backfill batch_id on previously seeded suppliers

-- Comprehensive round
UPDATE public.supplier_profiles
SET batch_id = 'batch-20260623-comprehensive'
WHERE batch_id IS NULL
  AND profile_slug IN (
    'highland-grove', 'desert-bloom-cultivation', 'peak-extraction', 'prairie-processors',
    'growlight-pro', 'harvest-tech', 'apex-genetics', 'frontier-testing',
    'secure-pack-solutions', 'cannaflow-logistics', 'bio-root-nutrients',
    'fortress-cannabis', 'traceflow-platform', 'buildwise-cannabis',
    'eco-cycle-cannabis', 'cannasure-group', 'retail-core-systems'
  );

-- Retail equipment batches
UPDATE public.supplier_profiles
SET batch_id = 'batch-20260623-retail'
WHERE batch_id IS NULL
  AND profile_slug IN (
    'canna-display-pro', 'premium-showcases', 'retail-vault-systems',
    'dispensary-tech', 'kiosk-retail', 'compliant-pay-tech', 'cannastore-pro',
    'retail-flow-pos', 'omnichannel-retail', 'store-shield-security',
    'age-verify-pro', 'digital-menu-pro', 'loyalty-engine', 'pack-station-pro',
    'inventory-scan-tech', 'lumen-retail', 'glow-fixtures', 'retail-illumination-pro',
    'showcase-lighting', 'merch-light-pro', 'canna-store-lighting', 'premium-retail-light'
  );

-- Additional categories
UPDATE public.supplier_profiles
SET batch_id = 'batch-20260623-additional-categories'
WHERE batch_id IS NULL
  AND profile_slug IN (
    'vita-grow-solutions', 'root-science', 'eco-pack-cannabis',
    'guardian-cannabis-security', 'flowstate-software', 'canna-pos-pro',
    'secure-transit-logistics', 'cannabuild-pro', 'green-cycle-waste',
    'canna-shield-insurance'
  );

-- Earlier seed batches (general verified)
UPDATE public.supplier_profiles
SET batch_id = 'batch-20260623-verified'
WHERE batch_id IS NULL
  AND status = 'active' AND verification_status = 'verified';

-- Pending applications
UPDATE public.supplier_profiles
SET batch_id = 'batch-20260623-pending'
WHERE batch_id IS NULL
  AND status = 'pending';
