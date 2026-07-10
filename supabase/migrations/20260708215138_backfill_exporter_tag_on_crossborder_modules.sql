-- Reviewed individually (not a mechanical synonym fix like the earlier backfills):
-- these 5 modules cover cross-border trade content that applies to exporters too,
-- but only had importer-side tags (or, in Health Canada's case, no trade-role tag
-- at all despite being literally titled "Export Requirements"). Additive only.

UPDATE education_modules
SET audience = audience || ARRAY['exporter']::text[]
WHERE slug IN (
  'canada-export-health-canada',
  'country-intel-tier1',
  'german-market-entry',
  'prohibition-risk-map',
  'supply-chain-intelligence'
)
AND NOT ('exporter' = ANY(audience));