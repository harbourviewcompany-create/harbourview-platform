-- Reconstructed from production. Verbatim statements for version 20260830185137.
-- Root cause of "still wrong" globe colors: the globe renders off countries.regulatory_tier
-- (confirmed directly in lib/globe/supabaseGlobeData.ts + lib/globe/globe-materials.ts — it
-- explicitly does NOT use market_access_status). regulatory_tier itself contains classification
-- errors where the assigned tier contradicts the tier's own stored rationale text. Found by
-- diffing regulatory_tier against the rationale headline for every row.

UPDATE public.countries SET regulatory_tier = 'prohibited'
WHERE country_name IN ('Belarus','China','Namibia','United Arab Emirates','Andorra','Kenya','Kosovo','Cuba','El Salvador','Honduras','Nicaragua','Venezuela');

UPDATE public.countries SET regulatory_tier = 'medical_limited_trade'
WHERE country_name IN ('Botswana','Serbia','Queensland','Tasmania','Western Australia');

UPDATE public.countries SET regulatory_tier = 'domestic_only'
WHERE country_name = 'Malta';

UPDATE public.countries
SET market_access_status = CASE regulatory_tier
  WHEN 'legal_commercial_access' THEN 'open'
  WHEN 'medical_limited_trade'   THEN 'regulated'
  WHEN 'domestic_only'           THEN 'emerging'
  WHEN 'cbd_hemp_only'           THEN 'limited'
  WHEN 'prohibited'              THEN 'restricted'
  ELSE 'unknown'
END::market_access_status
WHERE country_name IN ('Belarus','China','Namibia','United Arab Emirates','Andorra','Kenya','Kosovo','Cuba','El Salvador','Honduras','Nicaragua','Venezuela','Botswana','Serbia','Queensland','Tasmania','Western Australia','Malta');
