-- supabase/migrations/20260622211500_create_supplier_profiles.sql
--
-- supplier_profiles: verified supplier directory for the regulated cannabis ecosystem
-- Mirrors the proven hv_professionals pattern (PR #759) with supplier-specific fields.
-- Public read access is strictly limited to fully verified + active profiles.

CREATE TABLE IF NOT EXISTS public.supplier_profiles (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_slug            text        NOT NULL UNIQUE,
  company_name            text        NOT NULL,
  contact_name            text,
  email                   text,                    -- stored temporarily in description_public for admin review
  title                   text,                    -- applicant's role/title at the company
  seller_type             text        NOT NULL,    -- cultivator | processor | distributor | equipment | genetics | lab_testing | packaging | services | other
  categories              text[]      NOT NULL DEFAULT '{}',  -- e.g. flower, edibles, vapes, concentrates, equipment, genetics
  regions_served          text[]      NOT NULL DEFAULT '{}',  -- ISO2 country/region codes
  description_public      text,
  website                 text,
  hq_country              text,
  services_offered        text[]      NOT NULL DEFAULT '{}',
  verification_status     text        NOT NULL DEFAULT 'pending',
  verified_at             timestamptz,
  status                  text        NOT NULL DEFAULT 'active',
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_supplier_verification   ON public.supplier_profiles (verification_status);
CREATE INDEX idx_supplier_seller_type    ON public.supplier_profiles (seller_type);
CREATE INDEX idx_supplier_regions        ON public.supplier_profiles USING gin (regions_served);
CREATE INDEX idx_supplier_categories     ON public.supplier_profiles USING gin (categories);

-- Row Level Security
ALTER TABLE public.supplier_profiles ENABLE ROW LEVEL SECURITY;

-- Public can only read fully verified and active supplier profiles
CREATE POLICY public_read_verified_suppliers ON public.supplier_profiles
  FOR SELECT USING (status = 'active' AND verification_status = 'verified');

-- Service role (used by server actions) has full access for inserts/updates
CREATE POLICY service_write_suppliers ON public.supplier_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Optional: comment for documentation
COMMENT ON TABLE public.supplier_profiles IS 'Verified supplier profiles for regulated cannabis market access. Applications start as pending and require manual admin verification.';