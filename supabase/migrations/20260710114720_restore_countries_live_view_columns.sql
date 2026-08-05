-- Restore production-owned country columns that predate the regulatory-tier
-- API view but were never captured in repository migration history. Existing
-- production projects are unchanged because every operation is idempotent.
DO $market_access_status_type$
BEGIN
  IF to_regtype('public.market_access_status') IS NULL THEN
    CREATE TYPE public.market_access_status AS ENUM (
      'open',
      'active',
      'regulated',
      'emerging',
      'limited',
      'restricted',
      'review-required',
      'unknown'
    );
  END IF;
END
$market_access_status_type$;

ALTER TABLE public.countries
  ADD COLUMN IF NOT EXISTS map_region_key text,
  ADD COLUMN IF NOT EXISTS compliance_risk_status public.market_access_status NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS education_status public.market_access_status NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS marketplace_availability_status public.market_access_status NOT NULL DEFAULT 'unknown';
