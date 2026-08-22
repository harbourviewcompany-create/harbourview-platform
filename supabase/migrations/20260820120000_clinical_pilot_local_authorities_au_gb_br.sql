-- Clinical pilot local_authorities for AU, GB, BR.
-- Additive only. Does not touch CA/DE/NL/UY/MT (batch1).
-- Authority names aligned with lib/clinical/authorityRegistry.ts (2026-08-16 verification).
-- Not medical advice. Links / org-chart context for Clinical + local-intel cross-links only.
-- Production apply remains owner-gated (do not treat as auto-deploy).

-- Australia (AU): TGA primary medicinal cannabis pathways; ODC for controlled import context.
insert into public.local_authorities (country_code, org_tier, authority_type, authority_name, authority_role, display_order, confidence_label)
select v.country_code, v.org_tier, v.authority_type, v.authority_name, v.authority_role, v.display_order, v.confidence_label
from (values
  ('AU','top','primary',   'Therapeutic Goods Administration (TGA)', 'Unapproved therapeutic goods / medicinal cannabis pathways (SAS, Authorised Prescriber)', 0, 'Verified: authorityRegistry + tga.gov.au, Aug 2026'),
  ('AU','mid','oversight', 'Office of Drug Control (ODC)',           'Import/export and controlled-substance licensing context for medicinal cannabis', 0, 'Verified: authorityRegistry + health.gov.au ODC context, Aug 2026')
) as v(country_code, org_tier, authority_type, authority_name, authority_role, display_order, confidence_label)
where not exists (
  select 1 from public.local_authorities la
  where la.country_code = v.country_code
    and la.authority_name = v.authority_name
);

-- United Kingdom (GB): MHRA medicines framework; Home Office controlled-drugs policy context.
insert into public.local_authorities (country_code, org_tier, authority_type, authority_name, authority_role, display_order, confidence_label)
select v.country_code, v.org_tier, v.authority_type, v.authority_name, v.authority_role, v.display_order, v.confidence_label
from (values
  ('GB','top','primary',   'Medicines and Healthcare products Regulatory Agency (MHRA)', 'Medicines framework for cannabis-based products for medicinal use (CBPMs)', 0, 'Verified: authorityRegistry + gov.uk medicinal cannabis collection, Aug 2026'),
  ('GB','mid','oversight', 'Home Office', 'Controlled drugs / specialist CBPM prescribing policy context', 0, 'Verified: authorityRegistry + gov.uk, Aug 2026')
) as v(country_code, org_tier, authority_type, authority_name, authority_role, display_order, confidence_label)
where not exists (
  select 1 from public.local_authorities la
  where la.country_code = v.country_code
    and la.authority_name = v.authority_name
);

-- Brazil (BR): ANVISA product authorization and import pathways.
insert into public.local_authorities (country_code, org_tier, authority_type, authority_name, authority_role, display_order, confidence_label)
select v.country_code, v.org_tier, v.authority_type, v.authority_name, v.authority_role, v.display_order, v.confidence_label
from (values
  ('BR','top','primary', 'Agência Nacional de Vigilância Sanitária (ANVISA)', 'Authorization and regulation of cannabis-derived products and import pathways', 0, 'Verified: authorityRegistry + gov.br/anvisa, Aug 2026')
) as v(country_code, org_tier, authority_type, authority_name, authority_role, display_order, confidence_label)
where not exists (
  select 1 from public.local_authorities la
  where la.country_code = v.country_code
    and la.authority_name = v.authority_name
);

-- Coverage markers only for countries that already have a coverage row, or insert pending-style available note.
insert into public.local_intel_coverage (country_code, coverage_status, last_reviewed_at, notes)
select c.country_code, 'available', now(),
  'Initial clinical-pilot pass: national-level competent authority verified against clinical authority registry (Aug 2026). Subdivision detail not researched.'
from (values ('AU'), ('GB'), ('BR')) as c(country_code)
where not exists (
  select 1 from public.local_intel_coverage lic where lic.country_code = c.country_code
);

update public.local_intel_coverage
set coverage_status = 'available',
    last_reviewed_at = now(),
    notes = coalesce(notes, '') ||
      case when notes is null or notes = '' then '' else ' ' end ||
      'Clinical pilot authority pass (AU/GB/BR registry-aligned) Aug 2026.'
where country_code in ('AU', 'GB', 'BR')
  and coverage_status is distinct from 'not_applicable';
