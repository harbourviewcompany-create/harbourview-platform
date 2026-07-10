UPDATE education_modules
SET audience = audience || ARRAY['government_regulator']::text[]
WHERE 'regulator_policy' = ANY(audience)
  AND NOT ('government_regulator' = ANY(audience));