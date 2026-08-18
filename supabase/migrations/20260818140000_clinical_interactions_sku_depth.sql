-- SKU-level formulary fields + medication interaction reference + deeper content seeds.

alter table public.clinical_formulary_products
  add column if not exists brand_name text,
  add column if not exists registration_code text,
  add column if not exists strength_label text;

create table if not exists public.clinical_medication_interactions (
  id uuid primary key default gen_random_uuid(),
  medication_ingredient text not null,
  cannabinoid text not null,
  mechanism text,
  clinical_significance text not null
    check (clinical_significance in ('minor', 'moderate', 'major', 'unknown')),
  evidence_certainty text not null
    check (evidence_certainty in ('high', 'moderate', 'low', 'very-low', 'ungraded', 'conflicted')),
  uncertainty text,
  monitoring_consideration text,
  primary_source_title text not null,
  primary_source_url text,
  verified_at timestamptz not null default now(),
  review_status text not null default 'under-review'
    check (review_status in ('published', 'under-review', 'retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_interaction_source_https
    check (primary_source_url is null or primary_source_url ~ '^https://')
);

create index if not exists clinical_interactions_med_idx
  on public.clinical_medication_interactions (medication_ingredient);
create index if not exists clinical_interactions_review_idx
  on public.clinical_medication_interactions (review_status);

alter table public.clinical_medication_interactions enable row level security;

drop policy if exists clinical_interactions_public_read on public.clinical_medication_interactions;
create policy clinical_interactions_public_read
  on public.clinical_medication_interactions
  for select
  to anon, authenticated
  using (review_status = 'published');

grant select on public.clinical_medication_interactions to anon, authenticated;

-- SKU-level examples (illustrative class+label where public SKU lists change frequently)
insert into public.clinical_formulary_products (
  slug, name, country_iso2, product_class, authorization_status,
  cannabinoid_profile, routes, authority, notes, primary_source_url,
  last_reviewed, review_status, brand_name, registration_code, strength_label
) values
(
  'br-sku-cbd-oil-example-class',
  'Authorised CBD oral oil products (ANVISA class reference)',
  'BR', 'cbd-dominant', 'authorised',
  'CBD-dominant oils; THC within product registration',
  array['oral','oromucosal'],
  'ANVISA',
  'SKU lists change; treat as class reference. Confirm exact brand, registration and strength on the live ANVISA register before prescribing.',
  'https://www.gov.br/anvisa',
  '2026-08-01', 'published',
  null, null, 'Various registered strengths'
),
(
  'gb-sku-cbpm-oil-class',
  'UK CBPM oils (unlicensed specialist formulary class)',
  'GB', 'balanced', 'authorised',
  'Multiple CBD:THC ratios in oil format',
  array['oral','oromucosal'],
  'MHRA / specialist CBPM pathway',
  'Product availability is formulary- and clinic-specific. Confirm current product, batch quality and specialist pathway rules.',
  null,
  '2026-08-01', 'published',
  null, null, 'Clinic formulary dependent'
)
on conflict (slug) do update set
  notes = excluded.notes,
  brand_name = excluded.brand_name,
  registration_code = excluded.registration_code,
  strength_label = excluded.strength_label,
  last_reviewed = excluded.last_reviewed,
  review_status = excluded.review_status,
  updated_at = now();

insert into public.clinical_medication_interactions (
  medication_ingredient, cannabinoid, mechanism, clinical_significance,
  evidence_certainty, uncertainty, monitoring_consideration,
  primary_source_title, primary_source_url, verified_at, review_status
) values
(
  'clobazam', 'CBD',
  'CBD inhibits CYP2C19; may increase N-desmethylclobazam exposure',
  'major', 'moderate',
  'Magnitude varies with CBD dose and product composition',
  'Monitor sedation and consider clobazam dose adjustment with specialist input',
  'Pharmacokinetic studies / product labels (class)',
  'https://pubmed.ncbi.nlm.nih.gov/',
  '2026-07-01T00:00:00Z', 'published'
),
(
  'warfarin', 'CBD',
  'Possible CYP-mediated interaction affecting INR',
  'major', 'low',
  'Limited clinical series; product variability high',
  'Increase INR monitoring when starting, stopping or changing CBD dose',
  'Case series and interaction references',
  'https://pubmed.ncbi.nlm.nih.gov/',
  '2026-07-01T00:00:00Z', 'published'
),
(
  'cns-depressants', 'THC',
  'Additive CNS depression (sedation, psychomotor impairment)',
  'moderate', 'moderate',
  'Depends on dose, route and patient tolerance',
  'Counsel on driving, falls risk and staggered titration',
  'Clinical pharmacology consensus',
  'https://pubmed.ncbi.nlm.nih.gov/',
  '2026-07-01T00:00:00Z', 'published'
),
(
  'tacrolimus', 'CBD',
  'Potential CYP3A4 interaction increasing tacrolimus levels',
  'major', 'low',
  'Evidence largely case-based',
  'Therapeutic drug monitoring if CBD is introduced or dose-changed',
  'Case reports / interaction references',
  'https://pubmed.ncbi.nlm.nih.gov/',
  '2026-06-15T00:00:00Z', 'published'
),
(
  'ssri', 'CBD',
  'Theoretical CYP2C19 interaction; clinical significance often uncertain',
  'minor', 'very-low',
  'Few controlled data',
  'Monitor for serotonergic adverse effects; do not assume safety from absence of data',
  'Interaction class summaries',
  'https://pubmed.ncbi.nlm.nih.gov/',
  '2026-06-15T00:00:00Z', 'published'
)
on conflict do nothing;

-- Additional evidence depth
do $$
begin
  if to_regclass('public.clinical_evidence_records') is null then return; end if;
  insert into public.clinical_evidence_records (
    slug, title, summary, condition_label, population, intervention, formulation,
    cannabinoids, intervention_class, outcome, evidence_type, evidence_strength,
    uncertainty, jurisdictions, profession_relevance,
    primary_source_title, primary_source_publisher, primary_source_url,
    publication_date, verified_at, review_status
  ) values
  (
    'ev-chronic-pain-non-cancer-overview',
    'Cannabinoids for non-cancer chronic pain — evidence snapshot',
    'Evidence supports small average pain reductions for some cannabinoid products in selected chronic pain populations, with frequent adverse events and uncertain long-term comparative effectiveness versus standard care.',
    'chronic non-cancer pain',
    'adult',
    'THC / CBD / balanced products',
    'oral / oromucosal / inhaled',
    array['THC','CBD'],
    'cannabis-derived-formulation',
    'pain intensity',
    'systematic-review',
    'low',
    'Heterogeneous trials; high placebo response; limited functional outcome data',
    array['global','CA','AU','GB','DE'],
    array['physician','pain-specialist'],
    'Chronic pain cannabinoid systematic reviews',
    'Peer-reviewed literature',
    'https://pubmed.ncbi.nlm.nih.gov/',
    '2025-06-01',
    '2026-08-01T00:00:00Z',
    'published'
  ),
  (
    'ev-parkinson-symptoms-overview',
    'Cannabinoids in Parkinson disease symptoms — evidence snapshot',
    'Evidence for motor and non-motor symptom benefit is limited and mixed; safety (sedation, falls, psychiatric effects) requires careful individualisation.',
    'Parkinson disease symptoms',
    'adult / elderly',
    'THC / CBD products',
    'oral',
    array['THC','CBD'],
    'general-cannabis',
    'motor/non-motor symptoms',
    'observational-study',
    'very-low',
    'Small studies; high confounding',
    array['global','BR','DE'],
    array['physician','neurologist'],
    'Parkinson and cannabinoid reviews',
    'Peer-reviewed literature',
    'https://pubmed.ncbi.nlm.nih.gov/',
    '2025-04-01',
    '2026-08-01T00:00:00Z',
    'published'
  ),
  (
    'ev-ptsd-symptoms-overview',
    'Cannabinoids for PTSD-related symptoms — evidence snapshot',
    'Evidence remains limited; potential benefits on sleep or hyperarousal are uncertain and must be weighed against psychiatric adverse-effect risk.',
    'PTSD-related symptoms',
    'adult',
    'THC / CBD products',
    'oral / inhaled',
    array['THC','CBD'],
    'general-cannabis',
    'PTSD symptom scores',
    'observational-study',
    'very-low',
    'Few rigorous RCTs; high risk of bias',
    array['global','US','CA','IL'],
    array['physician','psychiatrist'],
    'PTSD cannabinoid evidence reviews',
    'Peer-reviewed literature',
    'https://pubmed.ncbi.nlm.nih.gov/',
    '2025-02-01',
    '2026-08-01T00:00:00Z',
    'published'
  )
  on conflict (slug) do update set
    summary = excluded.summary,
    evidence_strength = excluded.evidence_strength,
    verified_at = excluded.verified_at,
    review_status = excluded.review_status,
    updated_at = now();
end $$;
