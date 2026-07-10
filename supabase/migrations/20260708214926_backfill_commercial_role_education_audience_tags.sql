-- Same additive pattern as the medical role backfill: append the canonical RoleId
-- tag alongside existing legacy/synonym tags so getLiveEduTiles() actually surfaces
-- this content to the intended audience. Legacy tags are left in place.

UPDATE education_modules
SET audience = audience || ARRAY['importer']::text[]
WHERE 'buyer_importer' = ANY(audience)
  AND NOT ('importer' = ANY(audience));

UPDATE education_modules
SET audience = audience || ARRAY['investor_operator']::text[]
WHERE 'investor' = ANY(audience)
  AND NOT ('investor_operator' = ANY(audience));

UPDATE education_modules
SET audience = audience || ARRAY['distributor_wholesaler']::text[]
WHERE ('wholesaler_distributor' = ANY(audience) OR 'distributor' = ANY(audience))
  AND NOT ('distributor_wholesaler' = ANY(audience));

UPDATE education_modules
SET audience = audience || ARRAY['lab_qa']::text[]
WHERE 'lab' = ANY(audience)
  AND NOT ('lab_qa' = ANY(audience));

UPDATE education_modules
SET audience = audience || ARRAY['cultivator_producer']::text[]
WHERE 'licensed_producer' = ANY(audience)
  AND NOT ('cultivator_producer' = ANY(audience));