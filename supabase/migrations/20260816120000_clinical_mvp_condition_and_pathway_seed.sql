-- Clinical MVP seed: condition vocabulary + source-linked pathway / monograph records.
-- Deliberately conservative: primary-source links only; no invented dosing protocols.
-- publication framing stays regulatory-guidance / product-monograph / clinical-guideline.

-- ---------------------------------------------------------------------------
-- Condition terms (published) — enables known-condition vs no-match UX
-- ---------------------------------------------------------------------------
insert into public.clinical_condition_terms (
  canonical_name, aliases, vocabulary_source, source_url, verified_at, review_status
) values
(
  'Dravet syndrome',
  array['Dravet', 'Dravel', 'severe myoclonic epilepsy of infancy', 'SMEI'],
  'Harbourview clinical MVP vocabulary',
  'https://www.fda.gov/drugs/drug-approvals-and-databases',
  '2026-08-16T12:00:00Z',
  'published'
),
(
  'Lennox-Gastaut syndrome',
  array['Lennox-Gastaut', 'LGS'],
  'Harbourview clinical MVP vocabulary',
  'https://www.fda.gov/drugs/drug-approvals-and-databases',
  '2026-08-16T12:00:00Z',
  'published'
),
(
  'Multiple sclerosis spasticity',
  array['MS spasticity', 'spasticity due to multiple sclerosis', 'multiple sclerosis-related spasticity'],
  'Harbourview clinical MVP vocabulary',
  'https://www.ema.europa.eu/en',
  '2026-08-16T12:00:00Z',
  'published'
),
(
  'Chemotherapy-induced nausea and vomiting',
  array['CINV', 'chemotherapy induced nausea', 'chemotherapy-induced nausea'],
  'Harbourview clinical MVP vocabulary',
  'https://www.canada.ca/en/health-canada.html',
  '2026-08-16T12:00:00Z',
  'published'
)
on conflict (canonical_name) do update set
  aliases = excluded.aliases,
  vocabulary_source = excluded.vocabulary_source,
  source_url = excluded.source_url,
  verified_at = excluded.verified_at,
  review_status = excluded.review_status,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Evidence records — source-metadata / regulatory framing only
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
-- Dravet / CBD product-monograph orientation (US label as primary public source)
(
  'us-epidiolex-label-dravet-orientation',
  'Epidiolex (cannabidiol) US prescribing information — Dravet syndrome indication context',
  'US FDA prescribing information lists Dravet syndrome among approved indications for Epidiolex (cannabidiol). This record orients clinicians to the primary label; it does not restate full dosing tables or replace the current label.',
  (select id from public.clinical_condition_terms where canonical_name = 'Dravet syndrome' limit 1),
  'Dravet syndrome',
  array['Dravet', 'Dravel', 'SMEI'],
  'Patients with Dravet syndrome as defined in the current product label',
  'Cannabidiol (Epidiolex)',
  'Oral solution',
  array['CBD'],
  'regulated-cannabinoid-drug',
  null,
  'Authorized indication context per US prescribing information',
  'product-monograph', 'ungraded',
  'Product labelling is a primary regulatory source; formal clinical-certainty grading is not applied in this spine record.',
  'Always verify the current FDA label (or local authorized product information) before prescribing. This record does not encode a dosing protocol.',
  'none',
  array['United States'],
  array['doctor','nurse_practitioner','pharmacist','other'],
  'EPIDIOLEX (cannabidiol) oral solution — Prescribing Information',
  'U.S. Food and Drug Administration',
  'https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm',
  'fda-epidiolex-label',
  null, null, '2026-08-16T12:00:00Z', 'current', 'published'
),
-- LGS
(
  'us-epidiolex-label-lgs-orientation',
  'Epidiolex (cannabidiol) US prescribing information — Lennox-Gastaut syndrome indication context',
  'US FDA prescribing information lists Lennox-Gastaut syndrome among approved indications for Epidiolex (cannabidiol). Orient to the primary label; do not treat this summary as a complete monograph.',
  (select id from public.clinical_condition_terms where canonical_name = 'Lennox-Gastaut syndrome' limit 1),
  'Lennox-Gastaut syndrome',
  array['LGS', 'Lennox-Gastaut'],
  'Patients with Lennox-Gastaut syndrome as defined in the current product label',
  'Cannabidiol (Epidiolex)',
  'Oral solution',
  array['CBD'],
  'regulated-cannabinoid-drug',
  null,
  'Authorized indication context per US prescribing information',
  'product-monograph', 'ungraded',
  'Product labelling is a primary regulatory source; formal clinical-certainty grading is not applied in this spine record.',
  'Always verify the current FDA label (or local authorized product information) before prescribing.',
  'none',
  array['United States'],
  array['doctor','nurse_practitioner','pharmacist','other'],
  'EPIDIOLEX (cannabidiol) oral solution — Prescribing Information',
  'U.S. Food and Drug Administration',
  'https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm',
  'fda-epidiolex-label-lgs',
  null, null, '2026-08-16T12:00:00Z', 'current', 'published'
),
-- Canada medical access pathway (extends existing CA regulatory set)
(
  'ca-medical-access-pathway-overview',
  'Canada — medical access pathway overview for health professionals',
  'Federal medical access to cannabis operates under the Cannabis Act and Cannabis Regulations. Practitioners should use current Health Canada practitioner materials and applicable provincial/territorial professional guidance. This record does not authorize a specific product or dose.',
  null,
  null,
  array['medical access', 'authorization', 'medical document'],
  null,
  'Cannabis for medical purposes (federal framework)',
  null,
  array[]::text[],
  'general-cannabis',
  null,
  null,
  'regulatory-guidance', 'ungraded',
  'Primary government guidance; clinical evidence certainty is not graded by the source.',
  'Provincial and territorial professional rules may add requirements not captured here.',
  'none',
  array['Canada'],
  array['doctor','nurse_practitioner','pharmacist','other'],
  'Information for Health Care Practitioners - Medical Use of Cannabis',
  'Health Canada',
  'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/information-medical-practitioners.html',
  'health-canada-medical-practitioners-pathway',
  null, null, '2026-08-16T12:00:00Z', 'current', 'published'
),
-- Germany pathway
(
  'de-medical-cannabis-pathway-overview',
  'Germany — medical cannabis regulatory pathway orientation',
  'Medical cannabis in Germany is regulated within the narcotics and medicines framework under BfArM oversight. Reimbursement and prescribing conditions involve statutory health insurance rules and G-BA decisions. Verify current BfArM and payer requirements before acting.',
  null,
  null,
  array['medical cannabis', 'BtM', 'GKV'],
  null,
  'Medical cannabis (German framework)',
  null,
  array[]::text[],
  'general-cannabis',
  null,
  null,
  'regulatory-guidance', 'ungraded',
  'Competent-authority orientation only; not a substitute for Fachinformation or G-BA decisions.',
  'Product-specific and insurer-specific rules change; confirm at source.',
  'none',
  array['Germany'],
  array['doctor','pharmacist','other'],
  'BfArM — Federal Institute for Drugs and Medical Devices',
  'BfArM',
  'https://www.bfarm.de/EN/Home/_node.html',
  'bfarm-medical-cannabis-orientation',
  null, null, '2026-08-16T12:00:00Z', 'current', 'published'
),
-- Australia pathway
(
  'au-medicinal-cannabis-pathway-overview',
  'Australia — medicinal cannabis access pathway orientation (TGA/ODC)',
  'Medicinal cannabis access in Australia is governed by the TGA (product scheduling and SAS/Authorised Prescriber pathways) and the ODC (import/cultivation licences). Prescribers should confirm the current TGA pathway for the product and indication.',
  null,
  null,
  array['SAS', 'Authorised Prescriber', 'medicinal cannabis'],
  null,
  'Medicinal cannabis (Australian framework)',
  null,
  array[]::text[],
  'general-cannabis',
  null,
  null,
  'regulatory-guidance', 'ungraded',
  'Primary regulator orientation; state/territory endorsement rules may also apply.',
  'Does not replace TGA SAS/AP process documentation or product-specific information.',
  'none',
  array['Australia'],
  array['doctor','nurse_practitioner','pharmacist','other'],
  'TGA — Medicinal cannabis',
  'Therapeutic Goods Administration',
  'https://www.tga.gov.au/products/unapproved-therapeutic-goods/medicinal-cannabis',
  'tga-medicinal-cannabis-orientation',
  null, null, '2026-08-16T12:00:00Z', 'current', 'published'
),
-- UK pathway
(
  'gb-cbpm-pathway-overview',
  'United Kingdom — CBPM specialist prescribing pathway orientation',
  'Cannabis-based products for medicinal use (CBPMs) are controlled drugs. Prescribing is restricted under current UK rules to specialist practitioners. Confirm MHRA and Home Office guidance and specialist pharmacy supply arrangements before acting.',
  null,
  null,
  array['CBPM', 'cannabis-based products for medicinal use'],
  null,
  'CBPMs (UK framework)',
  null,
  array[]::text[],
  'general-cannabis',
  null,
  null,
  'regulatory-guidance', 'ungraded',
  'Competent-authority orientation only; not NHS formulary advice.',
  'Most CBPM supply remains private; NHS access pathways remain limited.',
  'none',
  array['United Kingdom'],
  array['doctor','pharmacist','other'],
  'Medicinal cannabis: information and resources',
  'GOV.UK / MHRA',
  'https://www.gov.uk/government/collections/medicinal-cannabis-information-and-resources',
  'uk-cbpm-orientation',
  null, null, '2026-08-16T12:00:00Z', 'current', 'published'
),
-- Interaction boundary notice (explicit non-capability)
(
  'global-no-structured-interaction-checker',
  'Structured drug–cannabinoid interaction checking is not available in this workspace',
  'Harbourview Clinical Command does not currently provide a structured interaction database or automated interaction severity engine. Use primary product information and local medicines information services.',
  null,
  null,
  array['interactions', 'drug interaction'],
  null,
  null,
  null,
  array[]::text[],
  'not-applicable',
  null,
  null,
  'other', 'ungraded',
  'Capability boundary notice; not a clinical study.',
  'Absence of a structured checker is intentional until a governed dataset exists.',
  'none',
  array['Canada', 'Germany', 'Australia', 'United Kingdom', 'United States'],
  array['doctor','nurse_practitioner','pharmacist','other'],
  'Harbourview Clinical Command capability boundary',
  'Harbourview',
  'https://www.canada.ca/en/health-canada/topics/accessing-cannabis-for-medical-purposes/cannabis-medical-purposes.html',
  'hv-no-interaction-checker',
  null, null, '2026-08-16T12:00:00Z', 'current', 'published'
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
  evidence_strength = excluded.evidence_strength,
  evidence_strength_method = excluded.evidence_strength_method,
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

-- Change event: Dravet vocabulary + label orientation published
insert into public.clinical_evidence_change_events (
  evidence_record_id, event_type, title, summary, materiality, jurisdictions,
  profession_relevance, occurred_at, verified_at, primary_source_title,
  primary_source_publisher, primary_source_url, primary_source_id, review_status
)
select
  r.id,
  'published',
  'Dravet syndrome evidence orientation published',
  'Published condition vocabulary (including common misspelling Dravel) and FDA label-orientation record for cannabidiol in Dravet syndrome. No dosing protocol is encoded.',
  'medium',
  array['United States'],
  array['doctor','nurse_practitioner','pharmacist','other'],
  '2026-08-16T12:00:00Z',
  '2026-08-16T12:00:00Z',
  r.primary_source_title,
  r.primary_source_publisher,
  r.primary_source_url,
  r.primary_source_id,
  'published'
from public.clinical_evidence_records r
where r.slug = 'us-epidiolex-label-dravet-orientation'
  and not exists (
    select 1 from public.clinical_evidence_change_events e
    where e.primary_source_id = 'fda-epidiolex-label'
      and e.event_type = 'published'
      and e.occurred_at = '2026-08-16T12:00:00Z'
  );
