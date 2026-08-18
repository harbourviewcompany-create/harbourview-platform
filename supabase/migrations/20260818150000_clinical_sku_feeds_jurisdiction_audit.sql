-- National formulary SKU feeds (ANVISA / TGA), clinical jurisdiction profiles, stricter audit.

-- ── Feed run ledger ─────────────────────────────────────────────────────────
create table if not exists public.clinical_sku_feed_runs (
  id uuid primary key default gen_random_uuid(),
  authority text not null check (authority in ('ANVISA', 'TGA', 'OTHER')),
  country_iso2 text not null,
  status text not null check (status in ('success', 'partial', 'degraded', 'failed')),
  source_url text,
  http_status integer,
  rows_upserted integer not null default 0,
  rows_retired integer not null default 0,
  error_message text,
  raw_fingerprint text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists clinical_sku_feed_runs_authority_idx
  on public.clinical_sku_feed_runs (authority, started_at desc);

alter table public.clinical_sku_feed_runs enable row level security;
-- service role only for writes; admins can read via service client

-- ── National SKU rows (product-level where available) ───────────────────────
create table if not exists public.clinical_formulary_skus (
  id uuid primary key default gen_random_uuid(),
  country_iso2 text not null,
  authority text not null,
  registration_code text,
  brand_name text,
  product_name text not null,
  strength_label text,
  dosage_form text,
  route text,
  cannabinoid_profile text,
  thc_limit text,
  cbd_content text,
  authorization_status text not null default 'authorised'
    check (authorization_status in (
      'authorised', 'import-authorised', 'compounding-permitted',
      'restricted', 'not-authorised', 'unknown', 'listed', 'suspended'
    )),
  source_url text,
  source_type text not null default 'authority_register_snapshot'
    check (source_type in (
      'authority_register_live',
      'authority_register_snapshot',
      'class_reference',
      'manual_curated'
    )),
  feed_run_id uuid references public.clinical_sku_feed_runs(id) on delete set null,
  last_seen_at timestamptz not null default now(),
  review_status text not null default 'published'
    check (review_status in ('published', 'under-review', 'retired')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_iso2, authority, registration_code, product_name)
);

create index if not exists clinical_formulary_skus_country_idx
  on public.clinical_formulary_skus (country_iso2, review_status);
create index if not exists clinical_formulary_skus_reg_idx
  on public.clinical_formulary_skus (registration_code);

alter table public.clinical_formulary_skus enable row level security;

drop policy if exists clinical_skus_public_read on public.clinical_formulary_skus;
create policy clinical_skus_public_read
  on public.clinical_formulary_skus
  for select
  to anon, authenticated
  using (review_status = 'published');

grant select on public.clinical_formulary_skus to anon, authenticated;

-- ── Clinical jurisdiction profiles (Command Clinical, not weekly market briefings)
create table if not exists public.clinical_jurisdiction_profiles (
  id uuid primary key default gen_random_uuid(),
  country_iso2 text not null unique,
  country_name text not null,
  flag text,
  status text not null default 'loaded'
    check (status in ('loaded', 'partial', 'unavailable')),
  legal_pathway text not null,
  adult_use boolean not null default false,
  summary text not null,
  primary_authority_name text not null,
  primary_authority_role text not null,
  primary_authority_url text,
  professional_regulator_name text,
  professional_regulator_role text,
  professional_regulator_url text,
  key_rules text[] not null default '{}',
  access_notes text not null default '',
  who_may_prescribe text,
  pathway_roles text,
  pathway_restrictions text[] not null default '{}',
  pathway_notes text,
  last_reviewed date not null,
  review_status text not null default 'under-review'
    check (review_status in ('published', 'under-review', 'retired')),
  reviewed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_jurisdiction_authority_https
    check (primary_authority_url is null or primary_authority_url ~ '^https://')
);

alter table public.clinical_jurisdiction_profiles enable row level security;

drop policy if exists clinical_jurisdiction_public_read on public.clinical_jurisdiction_profiles;
create policy clinical_jurisdiction_public_read
  on public.clinical_jurisdiction_profiles
  for select
  to anon, authenticated
  using (review_status = 'published');

grant select on public.clinical_jurisdiction_profiles to anon, authenticated;

-- Seed clinical jurisdiction profiles from curated Command briefings
insert into public.clinical_jurisdiction_profiles (
  country_iso2, country_name, flag, status, legal_pathway, adult_use, summary,
  primary_authority_name, primary_authority_role, primary_authority_url,
  professional_regulator_name, professional_regulator_role,
  key_rules, access_notes, who_may_prescribe, pathway_roles, pathway_restrictions, pathway_notes,
  last_reviewed, review_status
) values
(
  'BR', 'Brazil', '🇧🇷', 'loaded',
  'Medical Legal (CBD and THC Products); No Adult-Use', false,
  'Medical cannabis is regulated by ANVISA. Patients access authorised cannabis-derived products via physician prescription. Adult-use remains prohibited. Domestic cultivation frameworks have expanded under recent ANVISA resolutions; import authorisation pathways also exist.',
  'ANVISA (Agência Nacional de Vigilância Sanitária)', 'Product authorisation, quality, import rules',
  'https://www.gov.br/anvisa',
  'Conselho Federal de Medicina (CFM)', 'Professional standards for physicians',
  array['Only authorised cannabis products may be prescribed and dispensed','Prescriptions must specify approved products','Import authorisation remains an important access route for some patients'],
  'Confirm product registration and import rules on the live ANVISA register before relying on any SKU.',
  'Licensed physicians under CFM standards may prescribe authorised products.',
  'Physicians',
  array['Must use authorised products','Patient documentation required'],
  'Verify current CFM guidance and ANVISA product status.',
  '2026-07-20', 'published'
),
(
  'AU', 'Australia', '🇦🇺', 'loaded',
  'Medical cannabis via SAS-B / Authorised Prescriber; Adult-use limited by state', false,
  'Medicinal cannabis is accessed primarily through TGA Special Access Scheme Category B and Authorised Prescriber pathways. Many products are unregistered; ARTG-listed products are a minority. State controlled-drug rules still apply.',
  'Therapeutic Goods Administration (TGA)', 'Access schemes, product quality, advertising controls',
  'https://www.tga.gov.au',
  'AHPRA / state medical boards', 'Professional registration and prescribing standards',
  array['SAS-B and AP are the dominant pathways','Scheduling and state rules still apply','Product availability changes frequently'],
  'Confirm current TGA pathway requirements and state controlled-substance rules.',
  'Appropriately registered medical practitioners under SAS-B or Authorised Prescriber arrangements.',
  'Medical practitioners',
  array['Pathway-specific documentation','State controlled-drug compliance'],
  'Always verify the live TGA medicinal cannabis hub and state rules.',
  '2026-07-05', 'published'
),
(
  'GB', 'United Kingdom', '🇬🇧', 'loaded',
  'Medical cannabis (unlicensed CBPMs) via specialist pathway', false,
  'Since 2018 specialists may prescribe unlicensed cannabis-based products for medicinal use (CBPMs). Unlicensed products dominate. Adult-use remains prohibited.',
  'MHRA / Home Office controlled drugs framework', 'Product and controlled-drug regulation',
  'https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency',
  'GMC', 'Professional standards',
  array['Specialist initiation is the default','Unlicensed CBPMs dominate medical use','Shared care arrangements vary'],
  'Confirm specialist pathway and product quality documentation.',
  'Specialist physicians; follow current GMC and controlled-drug guidance.',
  'Specialists',
  array['Unlicensed product responsibilities','Controlled drug record-keeping'],
  'Verify current NHS/specialist formulary practice locally.',
  '2026-06-30', 'published'
),
(
  'DE', 'Germany', '🇩🇪', 'loaded',
  'Medical cannabis under narcotics-medicines framework; adult-use regulated separately', true,
  'Medical cannabis is established under the medical framework with pharmacy dispensing. Adult-use rules are separate and must not be conflated with clinical practice.',
  'BfArM / narcotics-medicines framework', 'Medical cannabis oversight',
  'https://www.bfarm.de',
  'State medical chambers', 'Professional standards',
  array['Medical pathway distinct from adult-use','Reimbursement often requires documentation','Pharmacy dispensing'],
  'Confirm current BfArM guidance and insurer documentation expectations.',
  'Physicians under applicable professional and narcotics rules.',
  'Physicians',
  array['Documentation for reimbursement','Narcotics handling rules'],
  'Keep medical and adult-use channels distinct in clinical documentation.',
  '2026-07-10', 'published'
),
(
  'CA', 'Canada', '🇨🇦', 'loaded',
  'Medical authorisation under Cannabis Act; adult-use parallel', true,
  'Medical cannabis operates under the federal Cannabis Act with provincial/territorial overlays. Patients may obtain medical authorisations from healthcare practitioners. Adult-use is legal and regulated separately.',
  'Health Canada', 'Federal cannabis framework',
  'https://www.canada.ca/en/health-canada.html',
  'Provincial/territorial professional colleges', 'Professional standards',
  array['Medical authorisation documentation distinct from adult-use','Provincial rules vary','Licensed producers supply medical channel'],
  'Confirm provincial college guidance and Health Canada medical access rules.',
  'Healthcare practitioners authorised under applicable provincial rules.',
  'Healthcare practitioners',
  array['Provincial variation','Documentation requirements'],
  'Do not treat adult-use retail products as automatic medical equivalents.',
  '2026-06-25', 'published'
),
(
  'CO', 'Colombia', '🇨🇴', 'loaded',
  'Medical cannabis under national health regulation', false,
  'Medical cannabis operates under national regulatory frameworks with licensed manufacturing and distribution channels. Clinical use must remain within authorised product pathways.',
  'INVIMA / Ministry of Health', 'Product and health regulation',
  null,
  'Professional medical authorities', 'Professional standards',
  array['Authorised product channels only','Prescribing within licensed frameworks'],
  'Confirm current INVIMA and Ministry guidance before relying on product availability.',
  'Licensed physicians under applicable national rules.',
  'Physicians',
  array['Licensed channel requirements'],
  'Verify primary authority before material clinical decisions.',
  '2026-07-01', 'published'
)
on conflict (country_iso2) do update set
  summary = excluded.summary,
  legal_pathway = excluded.legal_pathway,
  primary_authority_url = excluded.primary_authority_url,
  key_rules = excluded.key_rules,
  access_notes = excluded.access_notes,
  last_reviewed = excluded.last_reviewed,
  review_status = excluded.review_status,
  updated_at = now();

-- ── Clinical admin audit (stricter, append-only) ────────────────────────────
create table if not exists public.clinical_admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  actor_email text,
  actor_roles text[] not null default '{}',
  action text not null,
  entity_type text not null,
  entity_id text not null,
  before_state jsonb,
  after_state jsonb,
  notes text,
  ip_address text,
  user_agent text,
  request_id text,
  created_at timestamptz not null default now()
);

create index if not exists clinical_admin_audit_actor_idx
  on public.clinical_admin_audit_log (actor_user_id, created_at desc);
create index if not exists clinical_admin_audit_entity_idx
  on public.clinical_admin_audit_log (entity_type, entity_id, created_at desc);

alter table public.clinical_admin_audit_log enable row level security;

-- No update/delete policies — append-only via service role
revoke update, delete on public.clinical_admin_audit_log from public, anon, authenticated;
grant select on public.clinical_admin_audit_log to authenticated;

drop policy if exists clinical_admin_audit_admin_read on public.clinical_admin_audit_log;
create policy clinical_admin_audit_admin_read
  on public.clinical_admin_audit_log
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.role = any (array['admin'::text, 'operator'::text])
    )
  );

comment on table public.clinical_admin_audit_log is
  'Append-only clinical admin actions (publish/retire/feed). Service role INSERT only.';

comment on table public.clinical_formulary_skus is
  'National product-level formulary SKUs from authority feeds or curated snapshots. Published rows only are public.';
