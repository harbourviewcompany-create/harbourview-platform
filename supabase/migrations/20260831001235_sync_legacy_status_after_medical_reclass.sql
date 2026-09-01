-- Follows the 30-country reclassification applied via api.set_regulatory_tier() (see
-- 20260901021633_document_medical_only_reclassification_via_rpc.sql). That call goes through
-- the guarded RPC and updates regulatory_tier directly; this migration keeps the legacy
-- market_access_status display column in sync with it, same derivation used throughout this
-- batch.
UPDATE public.countries
SET market_access_status = CASE regulatory_tier
  WHEN 'legal_commercial_access' THEN 'open'
  WHEN 'medical_limited_trade'   THEN 'regulated'
  WHEN 'domestic_only'           THEN 'emerging'
  WHEN 'cbd_hemp_only'           THEN 'limited'
  WHEN 'prohibited'              THEN 'restricted'
  ELSE 'unknown'
END::market_access_status
WHERE iso_alpha2 IN (
  'US-AL','US-AR','US-FL','US-HI','US-KY','US-LA','US-MS','US-NE','US-NH','US-ND','US-OK','US-PA','US-SD','US-TX','US-UT','US-WV',
  'BE','BR','DK','EE','FR','NO','SK','SI','GB','PR','PA','PY','CR','PE'
);
