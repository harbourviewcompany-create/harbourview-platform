-- Clinical formulary layer + seed published evidence from Harbourview clinical fixtures.
-- Extends the existing clinical_evidence_records spine; does not create a parallel evidence system.
-- Boundaries: public, non-patient, provenance-bearing only. Not marketplace product marketing.

-- ── Formulary products (jurisdiction-authorised reference) ─────────────────
create table if not exists public.clinical_formulary_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country_iso2 text not null,
  product_class text not null
    check (product_class in (
      'cbd-dominant', 'thc-dominant', 'balanced', 'isolate',
      'full-spectrum', 'pharmaceutical', 'other'
    )),
  authorization_status text not null
    check (authorization_status in (
      'authorised', 'import-authorised', 'compounding-permitted',
      'restricted', 'not-authorised', 'unknown'
    )),
  cannabinoid_profile text not null,
  routes text[] not null default '{}',
  authority text not null,
  notes text not null default '',
  primary_source_url text,
  last_reviewed date not null,
  review_status text not null default 'under-review'
    check (review_status in ('published', 'under-review', 'retired')),
  reviewed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_formulary_source_https
    check (primary_source_url is null or primary_source_url ~ '^https://')
);

create index if not exists clinical_formulary_country_idx
  on public.clinical_formulary_products (country_iso2);
create index if not exists clinical_formulary_review_idx
  on public.clinical_formulary_products (review_status);

alter table public.clinical_formulary_products enable row level security;

-- Public read of published formulary only (anon + authenticated)
drop policy if exists clinical_formulary_public_read on public.clinical_formulary_products;
create policy clinical_formulary_public_read
  on public.clinical_formulary_products
  for select
  to anon, authenticated
  using (review_status = 'published');

-- Service role / authenticated staff write left to existing admin patterns
grant select on public.clinical_formulary_products to anon, authenticated;

-- ── Seed formulary (idempotent by slug) ────────────────────────────────────
insert into public.clinical_formulary_products (
  slug, name, country_iso2, product_class, authorization_status,
  cannabinoid_profile, routes, authority, notes, primary_source_url,
  last_reviewed, review_status
) values
(
  'br-anvisa-cbd-oral-class',
  'ANVISA-authorised CBD oral products (class)',
  'BR', 'cbd-dominant', 'authorised',
  'CBD-dominant; THC limits per product registration',
  array['oral','oromucosal'],
  'ANVISA',
  'Only products with current ANVISA authorisation may be prescribed and dispensed. Verify the live register before relying on any specific SKU.',
  'https://www.gov.br/anvisa',
  '2026-07-20', 'published'
),
(
  'br-import-authorisation-pathway',
  'Individual import authorisation pathway',
  'BR', 'other', 'import-authorised',
  'Varies by authorised product',
  array['oral','oromucosal','other'],
  'ANVISA',
  'Import authorisation remains an important access route for some patients when domestic authorised products are insufficient.',
  'https://www.gov.br/anvisa',
  '2026-07-20', 'published'
),
(
  'gb-cbpm-unlicensed-class',
  'UK CBPMs (unlicensed specialist pathway)',
  'GB', 'full-spectrum', 'authorised',
  'Flower, oils, capsules — ratios vary by product',
  array['inhaled','oral','oromucosal'],
  'MHRA / specialist prescribing framework',
  'Unlicensed CBPMs dominate UK medical use. Specialist initiation is the default.',
  null,
  '2026-06-30', 'published'
),
(
  'au-sas-b-medicinal-cannabis',
  'TGA SAS-B / Authorised Prescriber medicinal cannabis products',
  'AU', 'other', 'authorised',
  'Wide range of CBD/THC ratios and forms',
  array['oral','inhaled','oromucosal','topical'],
  'Therapeutic Goods Administration (TGA)',
  'Product choice is broad under SAS-B and Authorised Prescriber schemes. State controlled-drug rules still apply.',
  null,
  '2026-07-05', 'published'
),
(
  'de-medical-cannabis-pharmacy',
  'German medical cannabis (pharmacy-dispensed)',
  'DE', 'full-spectrum', 'authorised',
  'Flowers and extracts under medical framework',
  array['inhaled','oral'],
  'BfArM / narcotics-medicines framework',
  'Medical pathway is distinct from adult-use rules.',
  null,
  '2026-07-10', 'published'
)
on conflict (slug) do update set
  name = excluded.name,
  authorization_status = excluded.authorization_status,
  notes = excluded.notes,
  last_reviewed = excluded.last_reviewed,
  review_status = excluded.review_status,
  updated_at = now();

-- ── Seed evidence records into existing spine (published, idempotent by slug)
-- Only insert if table exists (spine migration already applied in production).
do $$
begin
  if to_regclass('public.clinical_evidence_records') is null then
    raise notice 'clinical_evidence_records missing — skip evidence seed';
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
    'ev-neuropathic-pain-overview',
    'Cannabinoids for chronic neuropathic pain — overview of controlled evidence',
    'Multiple RCTs and systematic reviews support a modest analgesic effect of THC-containing products in neuropathic pain, with higher rates of adverse events than placebo. CBD-dominant products have weaker and more heterogeneous evidence.',
    'chronic neuropathic pain',
    'adult',
    'THC / CBD / balanced cannabinoid products',
    'oral / oromucosal',
    array['THC','CBD'],
    'cannabis-derived-formulation',
    'pain intensity reduction',
    'systematic-review',
    'moderate',
    'Heterogeneous formulations and limited long-term comparative data',
    array['BR','global'],
    array['physician','specialist'],
    'Systematic reviews of RCTs (various, 2018–2025)',
    'Peer-reviewed literature synthesis',
    'https://pubmed.ncbi.nlm.nih.gov/',
    '2025-11-01',
    '2026-07-15T00:00:00Z',
    'published'
  ),
  (
    'ev-cbd-epilepsy-dravet-lgs',
    'CBD in treatment-resistant epilepsy (Dravet / Lennox-Gastaut context)',
    'High-quality evidence supports purified CBD as adjunctive therapy for seizures in Dravet syndrome and Lennox-Gastaut syndrome. Evidence for other epilepsy syndromes and non-purified extracts is weaker.',
    'treatment-resistant epilepsy',
    'paediatric / adult',
    'purified CBD',
    'oral',
    array['CBD'],
    'regulated-cannabinoid-drug',
    'seizure frequency reduction',
    'randomized-trial',
    'high',
    'Most robust data are for purified pharmaceutical CBD, not broad-spectrum extracts',
    array['BR','global'],
    array['physician','specialist','paediatrician'],
    'Pivotal RCTs and regulatory assessments',
    'FDA/EMA/ANVISA-related assessments',
    'https://www.gov.br/anvisa',
    '2024-06-01',
    '2026-06-20T00:00:00Z',
    'published'
  ),
  (
    'ev-safety-monitoring-overview',
    'Common adverse effects and monitoring considerations',
    'THC-related effects (psychoactivity, sedation, tachycardia) and CBD-related effects (somnolence, GI disturbance, potential hepatic enzyme elevation) are the dominant safety themes. Elderly and polypharmacy patients require particular caution.',
    'general medical cannabis use',
    'adult / elderly',
    'THC and CBD products',
    null,
    array['THC','CBD'],
    'general-cannabis',
    'adverse event profile',
    'clinical-guideline',
    'moderate',
    'Real-world adverse event reporting remains incomplete in many jurisdictions',
    array['global'],
    array['physician','pharmacist'],
    'Guideline consensus and pharmacovigilance summaries',
    'Professional society / regulator summaries',
    'https://pubmed.ncbi.nlm.nih.gov/',
    '2025-09-01',
    '2026-07-01T00:00:00Z',
    'published'
  ),
  (
    'ev-cannabinoid-drug-interactions',
    'Cannabinoid–drug interaction overview (CYP focus)',
    'CBD is a more significant CYP inhibitor (notably CYP3A4, CYP2C19, CYP2C9) than THC in most clinical contexts. Clinically relevant interactions have been documented with clobazam and certain narrow-therapeutic-index drugs.',
    'polypharmacy / concomitant medication',
    'adult / elderly',
    'CBD / THC',
    null,
    array['CBD','THC'],
    'cannabinoid-isolate',
    'drug–drug interaction risk',
    'pharmacovigilance-signal',
    'moderate',
    'Most data are from PK studies or case series rather than large RCTs',
    array['global'],
    array['physician','pharmacist'],
    'Pharmacokinetic studies and interaction resources',
    'Clinical pharmacology literature',
    'https://pubmed.ncbi.nlm.nih.gov/',
    '2025-08-01',
    '2026-06-15T00:00:00Z',
    'published'
  )
  on conflict (slug) do update set
    summary = excluded.summary,
    evidence_strength = excluded.evidence_strength,
    verified_at = excluded.verified_at,
    review_status = excluded.review_status,
    updated_at = now();
end $$;

comment on table public.clinical_formulary_products is
  'Jurisdiction-authorised cannabis product reference for clinical command. Not marketplace listings. Published rows only are public.';
