-- Root cause of "still wrong" globe colors: the globe renders off countries.regulatory_tier
-- (confirmed directly in lib/globe/supabaseGlobeData.ts + lib/globe/globe-materials.ts — it
-- explicitly does NOT use market_access_status). regulatory_tier itself contains classification
-- errors where the assigned tier contradicts the tier's own stored rationale text. Found by
-- diffing regulatory_tier against the rationale headline for every row.
--
-- Category 1: rationale headline is flatly "Prohibited" (no legal channel of any kind
-- described) but the row was NOT tagged prohibited. Two of these (Kenya, Kosovo) were showing
-- bright green ("legal_commercial_access") for countries whose own evidence says cannabis is
-- illegal there.
UPDATE public.countries SET regulatory_tier = 'prohibited'
WHERE country_name IN ('Belarus','China','Namibia','United Arab Emirates','Andorra','Kenya','Kosovo','Cuba','El Salvador','Honduras','Nicaragua','Venezuela');

-- Category 2: rationale describes a real, operating medical-legal framework (TGA-licensed
-- medical cannabis, government prescription programmes) but the row was filed under
-- cbd_hemp_only (a narrower tier that means only CBD/industrial hemp is legal, not medical
-- cannabis prescribing).
UPDATE public.countries SET regulatory_tier = 'medical_limited_trade'
WHERE country_name IN ('Botswana','Serbia','Queensland','Tasmania','Western Australia');

-- Category 3: Malta's own rationale describes full adult-use personal legalisation (2021
-- Cannabis Reform Act — possession, home cultivation, cannabis associations), which is a
-- materially broader legal domestic market than "CBD/hemp only".
UPDATE public.countries SET regulatory_tier = 'domestic_only'
WHERE country_name = 'Malta';

-- Keep market_access_status (legacy display fallback) consistent with these corrections too.
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
