-- Expand clinical evidence + formulary seeds for higher-demand prescriber conditions/countries.

insert into public.clinical_formulary_products (
  slug, name, country_iso2, product_class, authorization_status,
  cannabinoid_profile, routes, authority, notes, primary_source_url,
  last_reviewed, review_status
) values
(
  'ca-medical-authorisation-class',
  'Canada medical authorisation product class',
  'CA', 'full-spectrum', 'authorised',
  'Medical licence holders — CBD/THC ratios vary',
  array['oral','inhaled','oromucosal'],
  'Health Canada',
  'Medical authorisation remains available alongside adult-use retail. Keep medical documentation distinct.',
  null,
  '2026-06-25', 'published'
),
(
  'co-medical-cannabis-class',
  'Colombia medical cannabis authorised products',
  'CO', 'other', 'authorised',
  'Varies by licensed manufacturer',
  array['oral','other'],
  'INVIMA / Ministry of Health',
  'Prescribing must stay within authorised product and distribution channels.',
  null,
  '2026-07-01', 'published'
),
(
  'il-imc-medical-cannabis',
  'Israel IMC medical cannabis',
  'IL', 'full-spectrum', 'authorised',
  'IMC-licensed products — multiple ratios',
  array['oral','inhaled'],
  'Ministry of Health / IMC',
  'Medical pathway under IMC framework. Confirm current product catalogue with primary authority.',
  null,
  '2026-07-01', 'published'
)
on conflict (slug) do update set
  notes = excluded.notes,
  last_reviewed = excluded.last_reviewed,
  review_status = excluded.review_status,
  updated_at = now();

do $$
begin
  if to_regclass('public.clinical_evidence_records') is null then
    return;
  end if;

  insert into public.clinical_evidence_records (
    slug, title, summary, condition_label, population, intervention, formulation,
    cannabinoids, intervention_class, outcome, evidence_type, evidence_strength,
    uncertainty, jurisdictions, profession_relevance,
    primary_source_title, primary_source_publisher, primary_source_url,
    publication_date, verified_at, review_status
  ) values
  (
    'ev-spasticity-ms-overview',
    'Cannabinoids for spasticity in multiple sclerosis — evidence overview',
    'Controlled trials and reviews support modest benefit of certain THC:CBD combinations for MS-related spasticity in selected patients, with trade-offs in adverse effects.',
    'multiple sclerosis spasticity',
    'adult',
    'THC:CBD oromucosal / oral',
    'oromucosal',
    array['THC','CBD'],
    'regulated-cannabinoid-drug',
    'spasticity severity reduction',
    'systematic-review',
    'moderate',
    'Effect sizes modest; patient selection and titration critical',
    array['global','GB','DE','CA'],
    array['physician','specialist','neurologist'],
    'Systematic reviews of MS spasticity trials',
    'Peer-reviewed literature',
    'https://pubmed.ncbi.nlm.nih.gov/',
    '2025-01-01',
    '2026-07-01T00:00:00Z',
    'published'
  ),
  (
    'ev-chemo-nausea-overview',
    'Cannabinoids for chemotherapy-induced nausea and vomiting',
    'Evidence supports cannabinoids as adjunctive options in refractory CINV in some settings; first-line antiemetic standards of care still apply.',
    'chemotherapy-induced nausea and vomiting',
    'adult',
    'THC-containing products / regulated cannabinoid drugs',
    'oral',
    array['THC'],
    'regulated-cannabinoid-drug',
    'nausea/vomiting control',
    'systematic-review',
    'moderate',
    'Modern multi-agent antiemetic regimens limit incremental benefit in many patients',
    array['global','US','CA','GB'],
    array['physician','oncologist'],
    'CINV cannabinoid systematic reviews',
    'Peer-reviewed literature',
    'https://pubmed.ncbi.nlm.nih.gov/',
    '2024-11-01',
    '2026-06-15T00:00:00Z',
    'published'
  ),
  (
    'ev-anxiety-cbd-overview',
    'CBD for anxiety symptoms — evidence snapshot',
    'Evidence for CBD in anxiety is mixed and formulation-dependent; high-quality trials remain limited relative to demand. Not a substitute for standard mental-health care.',
    'anxiety symptoms',
    'adult',
    'CBD',
    'oral',
    array['CBD'],
    'cannabinoid-isolate',
    'anxiety symptom reduction',
    'observational-study',
    'low',
    'Heterogeneous products and endpoints; risk of overstating benefit',
    array['global','BR','AU','CA'],
    array['physician','psychiatrist'],
    'Anxiety and CBD evidence reviews',
    'Peer-reviewed literature',
    'https://pubmed.ncbi.nlm.nih.gov/',
    '2025-03-01',
    '2026-07-10T00:00:00Z',
    'published'
  ),
  (
    'ev-sleep-cannabinoids-overview',
    'Cannabinoids and sleep disturbance — evidence snapshot',
    'Signals for sleep improvement exist in some populations but certainty is low; daytime sedation and tolerance are relevant safety considerations.',
    'sleep disturbance',
    'adult',
    'THC / CBD products',
    'oral / inhaled',
    array['THC','CBD'],
    'general-cannabis',
    'sleep quality / latency',
    'observational-study',
    'low',
    'Few long-term RCTs; confounding by concurrent symptoms common',
    array['global'],
    array['physician'],
    'Sleep and cannabinoid reviews',
    'Peer-reviewed literature',
    'https://pubmed.ncbi.nlm.nih.gov/',
    '2025-05-01',
    '2026-07-05T00:00:00Z',
    'published'
  )
  on conflict (slug) do update set
    summary = excluded.summary,
    evidence_strength = excluded.evidence_strength,
    verified_at = excluded.verified_at,
    review_status = excluded.review_status,
    updated_at = now();
end $$;
