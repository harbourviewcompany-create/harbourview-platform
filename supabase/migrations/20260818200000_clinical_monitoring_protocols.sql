-- Governed clinical monitoring protocol dataset.
-- Closes the "Governed monitoring protocol dataset" open item noted in
-- docs/control/CLINICAL_MOBILE_EVIDENCE_EXPLORER_20260818.md.
-- Mirrors the clinical_medication_interactions pattern: public-read RLS
-- gated on review_status = 'published', fixture fallback in the app layer.

create table if not exists public.clinical_monitoring_protocols (
  id uuid primary key default gen_random_uuid(),
  protocol_name text not null,
  context text not null,
  cannabinoid text,
  monitoring_parameter text not null,
  baseline_required boolean not null default false,
  follow_up_interval text,
  rationale text,
  evidence_certainty text not null
    check (evidence_certainty in ('high', 'moderate', 'low', 'very-low', 'ungraded', 'conflicted')),
  primary_source_title text not null,
  primary_source_url text,
  verified_at timestamptz not null default now(),
  review_status text not null default 'under-review'
    check (review_status in ('published', 'under-review', 'retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_monitoring_source_https
    check (primary_source_url is null or primary_source_url ~ '^https://')
);

create index if not exists clinical_monitoring_context_idx
  on public.clinical_monitoring_protocols (context);
create index if not exists clinical_monitoring_review_idx
  on public.clinical_monitoring_protocols (review_status);

alter table public.clinical_monitoring_protocols enable row level security;

drop policy if exists clinical_monitoring_public_read on public.clinical_monitoring_protocols;
create policy clinical_monitoring_public_read
  on public.clinical_monitoring_protocols
  for select
  to anon, authenticated
  using (review_status = 'published');

grant select on public.clinical_monitoring_protocols to anon, authenticated;

insert into public.clinical_monitoring_protocols (
  protocol_name, context, cannabinoid, monitoring_parameter, baseline_required,
  follow_up_interval, rationale, evidence_certainty,
  primary_source_title, primary_source_url, verified_at, review_status
) values
(
  'CBD initiation — hepatic monitoring', 'cbd-initiation', 'CBD',
  'Liver function tests (ALT, AST, bilirubin)', true,
  '4-6 weeks after initiation or dose increase, then every 3 months for the first year',
  'Transaminase elevations are dose-related and more frequent with concomitant valproate; baseline values allow attribution of any rise',
  'moderate',
  'Pharmaceutical CBD safety data / product labels',
  'https://www.accessdata.fda.gov/scripts/cder/daf/',
  '2026-08-01T00:00:00Z', 'published'
),
(
  'THC initiation — psychiatric screening', 'thc-initiation', 'THC',
  'Personal and family history of psychosis, mania or severe mood disorder', true,
  'Reassess at each dose titration step',
  'THC is associated with dose-dependent psychotomimetic effects and can precipitate or worsen psychotic and manic episodes in predisposed individuals',
  'moderate',
  'Cannabinoid psychiatric safety reviews',
  'https://pubmed.ncbi.nlm.nih.gov/',
  '2026-08-01T00:00:00Z', 'published'
),
(
  'Concurrent anticoagulant — INR monitoring', 'concurrent-anticoagulant', 'CBD',
  'International normalised ratio (INR)', true,
  'Within 1 week of starting, stopping, or changing CBD dose; per usual anticoagulant schedule thereafter',
  'Possible CYP-mediated interaction can shift INR outside therapeutic range with warfarin and other vitamin K antagonists',
  'low',
  'Case series and interaction references',
  'https://pubmed.ncbi.nlm.nih.gov/',
  '2026-07-01T00:00:00Z', 'published'
),
(
  'Paediatric epilepsy — growth and hepatic monitoring', 'pediatric', 'CBD',
  'Weight/height trend, LFTs, and concomitant antiepileptic drug levels', true,
  'Every 4-6 weeks during titration, then every 3 months',
  'Paediatric patients on adjunct CBD for refractory epilepsy show higher transaminase elevation rates, especially with concomitant valproate; growth monitoring supports dose-per-weight review',
  'moderate',
  'Paediatric CBD epilepsy trial safety data',
  'https://www.accessdata.fda.gov/scripts/cder/daf/',
  '2026-08-01T00:00:00Z', 'published'
),
(
  'Older adults — falls and sedation monitoring', 'elderly', null,
  'Orthostatic blood pressure, gait/balance, and sedation score', true,
  'At each visit during the first 4 weeks, then every 3 months',
  'Older adults have higher sensitivity to CNS and postural effects of cannabinoids and higher baseline falls risk',
  'moderate',
  'Geriatric cannabinoid safety reviews',
  'https://pubmed.ncbi.nlm.nih.gov/',
  '2026-08-01T00:00:00Z', 'published'
),
(
  'Pregnancy and lactation — use avoidance and screening', 'pregnancy-lactation', null,
  'Pregnancy status confirmation and infant feeding plan review', true,
  'At every visit for the duration of pregnancy or lactation',
  'Cannabinoids cross the placenta and are present in breast milk; guidance is to avoid use given uncertain developmental safety data',
  'low',
  'Obstetric and lactation cannabinoid safety guidance',
  'https://pubmed.ncbi.nlm.nih.gov/',
  '2026-07-01T00:00:00Z', 'published'
),
(
  'Driving and safety-critical work counselling', 'thc-initiation', 'THC',
  'Documented counselling on impairment window and safety-critical duties', true,
  'At initiation and at every dose increase',
  'THC impairs psychomotor performance and reaction time for a period after use that does not reliably track subjective intoxication',
  'high',
  'Cannabis impairment and driving studies',
  'https://pubmed.ncbi.nlm.nih.gov/',
  '2026-08-01T00:00:00Z', 'published'
),
(
  'High-dose THC — cardiovascular monitoring', 'high-dose-thc', 'THC',
  'Heart rate and blood pressure', false,
  'At initiation and after each dose increase for patients with cardiovascular disease',
  'THC can cause dose-dependent tachycardia and orthostatic hypotension, with rare reports of precipitating cardiac events in susceptible patients',
  'low',
  'Cardiovascular cannabinoid safety case reports',
  'https://pubmed.ncbi.nlm.nih.gov/',
  '2026-07-15T00:00:00Z', 'published'
),
(
  'Hepatic or renal impairment — dose and level monitoring', 'organ-impairment', null,
  'Renal function (eGFR) or hepatic function panel prior to and during titration', true,
  'Before initiation, then every 4-6 weeks during titration',
  'Reduced clearance in hepatic or renal impairment can increase cannabinoid and interacting-drug exposure beyond levels seen in trial populations',
  'ungraded',
  'Pharmacokinetic labelling in organ impairment',
  'https://www.accessdata.fda.gov/scripts/cder/daf/',
  '2026-08-01T00:00:00Z', 'published'
),
(
  'Long-term use — cannabis use disorder screening', 'thc-initiation', 'THC',
  'Brief validated screening for problematic use patterns (e.g. tolerance, withdrawal, escalating use)', false,
  'At 3 months, then at least annually for ongoing therapy',
  'Regular high-dose THC use carries a measurable risk of dependence; periodic screening supports early identification and dose or regimen review',
  'moderate',
  'Cannabis use disorder prevalence and screening literature',
  'https://pubmed.ncbi.nlm.nih.gov/',
  '2026-08-01T00:00:00Z', 'published'
)
on conflict do nothing;
