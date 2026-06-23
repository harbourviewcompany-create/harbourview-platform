-- supabase/migrations/20260623221500_add_batch_id_to_supplier_profiles.sql
-- Add batch_id column to track seed batches for supplier_profiles

ALTER TABLE public.supplier_profiles
ADD COLUMN IF NOT EXISTS batch_id text;

COMMENT ON COLUMN public.supplier_profiles.batch_id IS 'Identifier for the seed batch or data import source (e.g. batch-20260623-comprehensive). Useful for managing and cleaning up seeded data.';

-- Optional: Create an index if you expect frequent filtering by batch_id
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_batch_id ON public.supplier_profiles (batch_id);
