-- Add drug_interaction_reference claim type and CPD fields to education_modules.
-- drug_interaction_reference is high-liability content (prescriber-facing) requiring
-- primary source or professional body verification before publication.

alter type education_claim_type add value if not exists 'drug_interaction_reference';

alter table education_modules
  add column if not exists cpd_accreditation_body text,
  add column if not exists cpd_credit_hours numeric(5,2),
  add column if not exists cpd_jurisdiction text;
