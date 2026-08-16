-- Additional Clinical MVP seeds: conditions + pathway/monograph orientation.
-- Conservative: primary-source links; no invented dosing or graded efficacy claims.

-- ---------------------------------------------------------------------------
-- Extra condition terms
-- ---------------------------------------------------------------------------
insert into public.clinical_condition_terms (
  canonical_name, aliases, vocabulary_source, source_url, verified_at, review_status
) values
(
  'Pregnancy and lactation (cannabinoid exposure)',
  array['pregnancy', 'lactation', 'breastfeeding', 'cannabis in pregnancy'],
  'Harbourview clinical MVP vocabulary',
  'https://www.canada.ca/en/health-canada.html',
  '2026-08-16T12:15:00Z',
  'published'
),
(
  'Pediatric cannabinoid use',
  array['pediatric', 'children', 'paediatric cannabis', 'pediatric CBD'],
  'Harbourview clinical MVP vocabulary',
  'https://www.canada.ca/en/health-canada.html',
  '2026-08-16T12:15:00Z',
  'published'
)
on conflict (canonical_name) do update set
  aliases = excluded.aliases,
  source_url = excluded.source_url,
  verified_at = excluded.verified_at,
  review_status = excluded.review_status,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Evidence / pathway records
-- ---------------------------------------------------------------------------
insert into public.clinical_evidence_records (
  slug, title, summary,
  condition_term_id, condition_label, condition_aliases,
  population, intervention, formulation, cannabinoids, intervention_class,
  comparator, outcome,
  evidence_type, evidence_strength, evidence_strength_method, uncertainty, conflict_status,
  jurisdictions, profession_relevance,
  primary_source_title, primary_source_publisher, primary_source_url, primary_source_id,
  publication_date, effective_date, verified_at, supersession_state, review_status
) values

-- MS spasticity / nabiximols orientation (EU public product info hub)
(
  'eu-nabiximols-ms-spasticity-orientation',
  'Nabiximols (Sativex) — MS spasticity product-information orientation',
  'Nabiximols oromucosal spray (commonly known as Sativex in several markets) is authorized in multiple jurisdictions for symptom improvement in adult patients with moderate to severe spasticity due to multiple sclerosis who have not responded adequately to other anti-spasticity medication. Confirm the current local SmPC/label; this record does not encode a titration schedule.',
  (select id from public.clinical_condition_terms where canonical_name = 'Multiple sclerosis spasticity' limit 1),
  'Multiple sclerosis spasticity',
  array['MS spasticity', 'spasticity due to multiple sclerosis'],
  'Adults with MS-related spasticity as defined in local product information',
  'Nabiximols (THC/CBD oromucosal spray)',
  'Oromucosal spray',
  array['THC', 'CBD'],
  'regulated-cannabinoid-drug',
  null,
  'Authorized indication context per product information (verify locally)',
  'product-monograph', 'ungraded',
  'Product information is the primary regulatory source; formal evidence grading is not applied in this spine record.',
  'Authorization status and wording differ by country. Always use the local authorized product information.',
  'none',
  array['United Kingdom', 'Germany', 'Australia'],
  array['doctor','pharmacist','other'],
  'EMA / national product information for nabiximols-containing medicines',
  'European Medicines Agency / national competent authorities',
  'https://www.ema.europa.eu/en/medicines',
  'ema-nabiximols-orientation',
  null, null, '2026-08-16T12:15:00Z', 'current', 'published'
),

-- Canada MS spasticity orientation (no product claim)
(
  'ca-ms-spasticity-cannabinoid-orientation',
  'Canada — MS-related spasticity and cannabinoid medicines: orientation',
  'Spasticity related to multiple sclerosis is a clinical context in which cannabinoid-based medicines are sometimes considered. In Canada, product authorization, medical access rules, and professional standards must be confirmed against current Health Canada and provincial materials. This record does not identify a specific authorized product for MS spasticity in Canada.',
  (select id from public.clinical_condition_terms where canonical_name = 'Multiple sclerosis spasticity' limit 1),
  'Multiple sclerosis spasticity',
  array['MS spasticity', 'multiple sclerosis-related spasticity'],
  'Adults with MS-related spasticity (clinical context only)',
  'Cannabinoid / cannabis-based medicines (product-specific)',
  null,
  array['THC', 'CBD'],
  'regulated-cannabinoid-drug',
  null,
  null,
  'regulatory-guidance', 'ungraded',
  'Orientation only; not a systematic review.',
  'Does not encode dosing or claim that a specific product is authorized for this use in Canada.',
  'none',
  array['Canada'],
  array['doctor','nurse_practitioner','pharmacist','other'],
  'Information for Health Care Practitioners - Medical Use of Cannabis',
  'Health Canada',
  'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/information-medical-practitioners.html',
  'ca-ms-spasticity-orientation',
  null, null, '2026-08-16T12:15:00Z', 'current', 'published'
),

-- CINV / nabilone Canada (register-linked orientation)
(
  'ca-nabilone-cinv-orientation',
  'Canada — nabilone (Cesamet) product-register orientation for CINV context',
  'Nabilone is a marketed synthetic cannabinoid in Canada. Health Canada’s Drug and Health Product Register provides product metadata for CESAMET (nabilone). Clinicians should consult the current product monograph for authorized indications (historically including severe nausea and vomiting associated with cancer therapy) and full safety information. This spine record does not restate dosing.',
  (select id from public.clinical_condition_terms where canonical_name = 'Chemotherapy-induced nausea and vomiting' limit 1),
  'Chemotherapy-induced nausea and vomiting',
  array['CINV', 'chemotherapy induced nausea'],
  'As defined in the current Canadian product monograph',
  'Nabilone (Cesamet)',
  'Oral capsule',
  array['nabilone'],
  'regulated-cannabinoid-drug',
  null,
  'Authorized indication context per Canadian product information (verify current monograph)',
  'product-monograph', 'ungraded',
  'Product register / monograph is the primary source; formal evidence grading is not applied here.',
  'Confirm DIN-specific monograph text before prescribing. Suspected adverse reactions should be reported through Health Canada channels.',
  'none',
  array['Canada'],
  array['doctor','nurse_practitioner','pharmacist','other'],
  'CESAMET — Drug and Health Product Register',
  'Health Canada',
  'https://hpr-rps.hres.ca/details.php?drugproductid=385&query=',
  'ca-cesamet-cinv-orientation',
  null, null, '2026-08-16T12:15:00Z', 'current', 'published'
),

-- Pregnancy / lactation safety orientation (Canada)
(
  'ca-cannabis-pregnancy-lactation-orientation',
  'Canada — cannabis exposure in pregnancy and lactation: safety orientation',
  'Health Canada and public health authorities advise against cannabis use in pregnancy and while breastfeeding because of potential risks to fetal and infant development. This record points clinicians to federal safety framing; it is not a substitute for specialist obstetric or pediatric advice.',
  (select id from public.clinical_condition_terms where canonical_name = 'Pregnancy and lactation (cannabinoid exposure)' limit 1),
  'Pregnancy and lactation (cannabinoid exposure)',
  array['pregnancy', 'lactation', 'breastfeeding'],
  'People who are pregnant, planning pregnancy, or breastfeeding',
  'Cannabis / cannabinoids (any route)',
  null,
  array['THC', 'CBD'],
  'general-cannabis',
  null,
  'Safety / exposure risk framing per public authority materials',
  'regulatory-guidance', 'ungraded',
  'Public health guidance; not a graded interventional evidence review.',
  'Individual clinical decisions require professional judgment and up-to-date local guidance.',
  'none',
  array['Canada'],
  array['doctor','nurse_practitioner','pharmacist','nurse','midwife','other'],
  'Health Canada — Cannabis and your health / medical use materials',
  'Health Canada',
  'https://www.canada.ca/en/health-canada/topics/accessing-cannabis-for-medical-purposes/cannabis-medical-purposes.html',
  'ca-pregnancy-lactation-orientation',
  null, null, '2026-08-16T12:15:00Z', 'current', 'published'
),

-- Pediatric boundary (Canada)
(
  'ca-pediatric-cannabinoid-orientation',
  'Canada — pediatric cannabinoid use: professional orientation',
  'Pediatric use of cannabis or cannabinoid medicines requires specialist judgment, product-specific authorization status, and heightened safety monitoring. Federal practitioner materials and product monographs remain the primary references. This record does not provide pediatric dosing.',
  (select id from public.clinical_condition_terms where canonical_name = 'Pediatric cannabinoid use' limit 1),
  'Pediatric cannabinoid use',
  array['pediatric', 'children', 'paediatric'],
  'Children and adolescents (clinical context only)',
  'Cannabinoid / cannabis-based medicines (product-specific)',
  null,
  array['CBD', 'THC'],
  'regulated-cannabinoid-drug',
  null,
  null,
  'regulatory-guidance', 'ungraded',
  'Orientation only; pediatric epilepsy product labels (where authorized) must be checked separately.',
  'Do not extrapolate adult product information to children without authorized labeling and specialist oversight.',
  'none',
  array['Canada'],
  array['doctor','nurse_practitioner','pharmacist','other'],
  'Information for Health Care Practitioners - Medical Use of Cannabis',
  'Health Canada',
  'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/information-medical-practitioners.html',
  'ca-pediatric-orientation',
  null, null, '2026-08-16T12:15:00Z', 'current', 'published'
),

-- Australia SAS pathway detail
(
  'au-sas-authorised-prescriber-pathway',
  'Australia — SAS Category B and Authorised Prescriber pathways',
  'Unapproved medicinal cannabis products in Australia are commonly accessed via the Special Access Scheme (SAS) or Authorised Prescriber (AP) pathways under TGA oversight. Import may additionally require ODC licensing. Confirm current TGA process documentation before applying.',
  null,
  null,
  array['SAS Category B', 'Authorised Prescriber', 'SAS'],
  null,
  'Medicinal cannabis (unapproved goods pathways)',
  null,
  array[]::text[],
  'general-cannabis',
  null,
  null,
  'regulatory-guidance', 'ungraded',
  'Regulator process orientation; not clinical efficacy evidence.',
  'State and territory requirements may add steps beyond TGA pathways.',
  'none',
  array['Australia'],
  array['doctor','nurse_practitioner','pharmacist','other'],
  'TGA — Special Access Scheme',
  'Therapeutic Goods Administration',
  'https://www.tga.gov.au/products/unapproved-therapeutic-goods/special-access-scheme',
  'tga-sas-ap-pathway',
  null, null, '2026-08-16T12:15:00Z', 'current', 'published'
),

-- Germany G-BA / reimbursement orientation
(
  'de-gkv-reimbursement-orientation',
  'Germany — statutory insurance (GKV) context for medical cannabis',
  'In Germany, medical cannabis may be prescribed within the narcotics framework; reimbursement by statutory health insurance depends on legal criteria and often involves insurer processes and G-BA-related rules. Verify current SGB V / G-BA and insurer requirements for the individual case.',
  null,
  null,
  array['GKV', 'reimbursement', 'G-BA'],
  null,
  'Medical cannabis (reimbursement context)',
  null,
  array[]::text[],
  'general-cannabis',
  null,
  null,
  'regulatory-guidance', 'ungraded',
  'Coverage orientation only; not a guarantee of reimbursement.',
  'Insurer decisions and documentation requirements vary.',
  'none',
  array['Germany'],
  array['doctor','pharmacist','other'],
  'G-BA — Gemeinsamer Bundesausschuss',
  'G-BA',
  'https://www.g-ba.de/english/',
  'de-gkv-orientation',
  null, null, '2026-08-16T12:15:00Z', 'current', 'published'
),

-- UK specialist-only reminder
(
  'gb-specialist-only-prescribing',
  'United Kingdom — specialist-only CBPM prescribing constraint',
  'Under current UK arrangements, cannabis-based products for medicinal use (CBPMs) are prescribed by specialists on the GMC specialist register (not general practice by default). Supply is typically via specialist pharmacies. Confirm current MHRA/Home Office guidance.',
  null,
  null,
  array['specialist prescribing', 'CBPM', 'GMC specialist register'],
  null,
  'CBPMs',
  null,
  array[]::text[],
  'general-cannabis',
  null,
  null,
  'regulatory-guidance', 'ungraded',
  'Regulatory constraint orientation; not clinical efficacy evidence.',
  'NHS formulary access remains limited for most CBPMs.',
  'none',
  array['United Kingdom'],
  array['doctor','pharmacist','other'],
  'Medicinal cannabis: information and resources',
  'GOV.UK / MHRA',
  'https://www.gov.uk/government/collections/medicinal-cannabis-information-and-resources',
  'gb-specialist-only',
  null, null, '2026-08-16T12:15:00Z', 'current', 'published'
),

-- CBD class orientation (multi-jurisdiction caution)
(
  'multi-cbd-product-class-orientation',
  'Cannabidiol (CBD) products — class orientation across jurisdictions',
  'CBD appears in prescription medicines, authorized medical-cannabis frameworks, and consumer products depending on jurisdiction. Authorization status, scheduling, and quality requirements differ sharply. Always identify the specific product’s regulatory status and local label before clinical use.',
  null,
  null,
  array['CBD', 'cannabidiol'],
  null,
  'Cannabidiol (class-level)',
  null,
  array['CBD'],
  'cannabinoid-isolate',
  null,
  null,
  'regulatory-guidance', 'ungraded',
  'Class orientation; not interchangeable across products or countries.',
  'Consumer CBD products are not equivalent to authorized prescription CBD medicines.',
  'none',
  array['Canada', 'Germany', 'Australia', 'United Kingdom', 'United States'],
  array['doctor','nurse_practitioner','pharmacist','other'],
  'Jurisdiction-specific regulator materials (FDA/EMA/TGA/Health Canada/MHRA as applicable)',
  'Multiple competent authorities',
  'https://www.fda.gov/news-events/public-health-focus/fda-regulation-cannabis-and-cannabis-derived-products-including-cannabidiol-cbd',
  'multi-cbd-class-orientation',
  null, null, '2026-08-16T12:15:00Z', 'current', 'published'
)

on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  condition_term_id = excluded.condition_term_id,
  condition_label = excluded.condition_label,
  condition_aliases = excluded.condition_aliases,
  population = excluded.population,
  intervention = excluded.intervention,
  formulation = excluded.formulation,
  cannabinoids = excluded.cannabinoids,
  intervention_class = excluded.intervention_class,
  evidence_type = excluded.evidence_type,
  uncertainty = excluded.uncertainty,
  jurisdictions = excluded.jurisdictions,
  profession_relevance = excluded.profession_relevance,
  primary_source_title = excluded.primary_source_title,
  primary_source_publisher = excluded.primary_source_publisher,
  primary_source_url = excluded.primary_source_url,
  primary_source_id = excluded.primary_source_id,
  verified_at = excluded.verified_at,
  review_status = excluded.review_status,
  updated_at = now();

insert into public.clinical_evidence_change_events (
  evidence_record_id, event_type, title, summary, materiality, jurisdictions,
  profession_relevance, occurred_at, verified_at, primary_source_title,
  primary_source_publisher, primary_source_url, primary_source_id, review_status
)
select
  r.id,
  'published',
  'Additional MVP clinical orientation records published',
  'Published MS spasticity, CINV/nabilone, pregnancy/lactation, pediatric, and multi-jurisdiction pathway orientation records. Source-linked only; no dosing protocols.',
  'medium',
  r.jurisdictions,
  r.profession_relevance,
  '2026-08-16T12:15:00Z',
  '2026-08-16T12:15:00Z',
  r.primary_source_title,
  r.primary_source_publisher,
  r.primary_source_url,
  r.primary_source_id,
  'published'
from public.clinical_evidence_records r
where r.slug = 'ca-nabilone-cinv-orientation'
  and not exists (
    select 1 from public.clinical_evidence_change_events e
    where e.primary_source_id = 'ca-cesamet-cinv-orientation'
      and e.event_type = 'published'
      and e.occurred_at = '2026-08-16T12:15:00Z'
  );
