-- Reconstructed from production. Verbatim statements for version 20260901021633.
-- Documents a reclassification that was originally applied via ad-hoc
-- api.set_regulatory_tier() calls (not through apply_migration), so it never
-- got a tracked version or a repo migration file until now. Idempotent: only
-- touches rows that don't already have the target tier, so safe to run even
-- though the underlying data change already happened.
--
-- Same class of fix as the rest of this batch: these 30 jurisdictions were
-- tagged domestic_only (implying a real domestic legal market) when their own
-- rationale describes a narrow medical-prescription-only program with no
-- adult-use/decrim/home-cultivation dimension.
DO $$
DECLARE
  iso text;
  target_isos text[] := array[
    'US-AL','US-AR','US-FL','US-HI','US-KY','US-LA','US-MS','US-NE','US-NH','US-ND',
    'US-OK','US-PA','US-SD','US-TX','US-UT','US-WV',
    'BE','BR','DK','EE','FR','NO','SK','SI','GB','PR','PA','PY','CR','PE'
  ];
BEGIN
  FOREACH iso IN ARRAY target_isos LOOP
    IF EXISTS (
      SELECT 1 FROM public.countries
      WHERE iso_alpha2 = iso AND regulatory_tier IS DISTINCT FROM 'medical_limited_trade'
    ) THEN
      PERFORM api.set_regulatory_tier(
        iso, 'medical_limited_trade', 'claude-diagnostic',
        'Reclassified: rationale describes narrow medical-prescription-only program (no adult-use/decrim/home-cultivation); was miscategorized under domestic_only, overstating market access on the globe.'
      );
    END IF;
  END LOOP;
END $$;

UPDATE public.countries
SET market_access_status = CASE regulatory_tier
  WHEN 'legal_commercial_access' THEN 'open'
  WHEN 'medical_limited_trade'   THEN 'regulated'
  WHEN 'domestic_only'           THEN 'emerging'
  WHEN 'cbd_hemp_only'           THEN 'limited'
  WHEN 'prohibited'              THEN 'restricted'
  ELSE 'unknown'
END::market_access_status
WHERE market_access_status IS DISTINCT FROM (CASE regulatory_tier
  WHEN 'legal_commercial_access' THEN 'open'
  WHEN 'medical_limited_trade'   THEN 'regulated'
  WHEN 'domestic_only'           THEN 'emerging'
  WHEN 'cbd_hemp_only'           THEN 'limited'
  WHEN 'prohibited'              THEN 'restricted'
  ELSE 'unknown'
END::market_access_status);
