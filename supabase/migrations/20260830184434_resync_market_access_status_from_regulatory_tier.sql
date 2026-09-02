-- Reconstructed from production. Verbatim statements for version 20260830184434.
-- Root cause: market_access_status (drives the globe choropleth legend: MARKET ACCESS)
-- had drifted out of sync with regulatory_tier (the actively-reviewed, always-populated
-- source of truth: 0 NULLs across 291 countries, tracked with review/source metadata).
-- Same regulatory_tier value was mapping to up to 5 different market_access_status values
-- across countries (e.g. legal_commercial_access -> unknown for 34 countries, regulated
-- for 11, emerging for 9, restricted for 5, limited for 2), producing incorrect map colors.
--
-- Fix: derive market_access_status deterministically from regulatory_tier's 5 clean tiers,
-- 1:1 with the 5-swatch legend, and add a trigger so future regulatory_tier edits can never
-- drift out of sync with the map again.

UPDATE public.countries
SET market_access_status = CASE regulatory_tier
  WHEN 'legal_commercial_access' THEN 'open'
  WHEN 'medical_limited_trade'   THEN 'regulated'
  WHEN 'domestic_only'           THEN 'emerging'
  WHEN 'cbd_hemp_only'           THEN 'limited'
  WHEN 'prohibited'              THEN 'restricted'
  ELSE 'unknown'
END::market_access_status
WHERE regulatory_tier IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_market_access_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.market_access_status := CASE NEW.regulatory_tier
    WHEN 'legal_commercial_access' THEN 'open'
    WHEN 'medical_limited_trade'   THEN 'regulated'
    WHEN 'domestic_only'           THEN 'emerging'
    WHEN 'cbd_hemp_only'           THEN 'limited'
    WHEN 'prohibited'              THEN 'restricted'
    ELSE 'unknown'
  END::market_access_status;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_market_access_status ON public.countries;
CREATE TRIGGER trg_sync_market_access_status
  BEFORE INSERT OR UPDATE OF regulatory_tier ON public.countries
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_market_access_status();
