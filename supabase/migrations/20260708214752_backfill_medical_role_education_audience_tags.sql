-- Additive backfill: append the canonical RoleId tag to education_modules.audience
-- for rows currently only tagged with a legacy/synonym string, so getLiveEduTiles()
-- (which filters on exact audience-array containment against the canonical RoleId)
-- actually surfaces this content to doctor_prescriber / clinic_healthcare_operator /
-- patient_caregiver_education users. Nothing is removed — legacy tags stay in place
-- in case anything else still reads them.

UPDATE education_modules
SET audience = audience || ARRAY['doctor_prescriber']::text[]
WHERE 'doctor' = ANY(audience)
  AND NOT ('doctor_prescriber' = ANY(audience));

UPDATE education_modules
SET audience = audience || ARRAY['clinic_healthcare_operator']::text[]
WHERE 'clinic' = ANY(audience)
  AND NOT ('clinic_healthcare_operator' = ANY(audience));

UPDATE education_modules
SET audience = audience || ARRAY['patient_caregiver_education']::text[]
WHERE 'patient_general' = ANY(audience)
  AND NOT ('patient_caregiver_education' = ANY(audience));