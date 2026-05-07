-- Harbourview Regulatory Signals V1
-- Parallel regulatory intelligence system. Does not reuse marketplace Signal Engine,
-- marketplace_candidates, or public.source_registry.

create schema if not exists regulatory_signals;

create table if not exists regulatory_signals.sources (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_type text not null,
  source_tier text not null,
  country_code text,
  country_name text,
  region text,
  jurisdiction text,
  regulator_name text,
  base_url text not null,
  watch_url text,
  rss_url text,
  contact_url text,
  language_code text,
  crawl_allowed boolean not null default false,
  is_active boolean not null default true,
  validation_notes text,
  internal_notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint regulatory_sources_source_name_not_empty check (length(trim(source_name)) > 0),
  constraint regulatory_sources_base_url_not_empty check (length(trim(base_url)) > 0),
  constraint regulatory_sources_tier_check check (source_tier in ('tier_1_official', 'tier_2_professional', 'tier_3_secondary')),
  constraint regulatory_sources_type_check check (source_type in ('regulator','government_ministry','legislature','official_gazette','court','customs_authority','health_authority','drug_control_authority','enforcement_authority','consultation_portal','international_body','professional_body','law_firm_update','trade_association','specialist_publication','local_media','trade_media'))
);

create table if not exists regulatory_signals.evidence (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references regulatory_signals.sources(id) on delete set null,
  evidence_title text not null,
  evidence_url text not null,
  canonical_url text,
  source_tier text not null,
  source_type text not null,
  country_code text,
  country_name text,
  region text,
  jurisdiction text,
  regulator_name text,
  published_at timestamptz,
  captured_at timestamptz not null default now(),
  raw_excerpt text,
  evidence_summary text,
  language_code text,
  content_hash text,
  storage_path text,
  pdf_storage_path text,
  screenshot_storage_path text,
  validation_status text not null default 'unvalidated',
  validation_notes text,
  duplicate_of uuid references regulatory_signals.evidence(id) on delete set null,
  captured_by uuid references auth.users(id) on delete set null,
  validated_by uuid references auth.users(id) on delete set null,
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint regulatory_evidence_title_not_empty check (length(trim(evidence_title)) > 0),
  constraint regulatory_evidence_url_not_empty check (length(trim(evidence_url)) > 0),
  constraint regulatory_evidence_validation_status_check check (validation_status in ('unvalidated', 'validated', 'needs_review', 'rejected', 'duplicate')),
  constraint regulatory_evidence_tier_check check (source_tier in ('tier_1_official', 'tier_2_professional', 'tier_3_secondary'))
);

create table if not exists regulatory_signals.signals (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  headline text not null,
  signal_type text not null,
  review_status text not null default 'captured',
  confidence text not null default 'medium',
  impact_level text not null default 'moderate',
  country_code text,
  country_name text,
  region text,
  jurisdiction text,
  regulator_name text,
  signal_date date not null,
  source_published_at timestamptz,
  captured_at timestamptz not null default now(),
  source_tier text not null,
  source_type text not null,
  source_url text not null,
  canonical_source_url text,
  source_id uuid references regulatory_signals.sources(id) on delete set null,
  primary_evidence_id uuid references regulatory_signals.evidence(id) on delete set null,
  private_summary text not null,
  commercial_relevance text,
  compliance_relevance text,
  uncertainty_note text,
  public_summary text,
  public_implication text,
  public_safe boolean not null default false,
  publish_to_public boolean not null default false,
  last_reviewed_at timestamptz,
  next_review_due_at timestamptz,
  expires_at timestamptz,
  published_at timestamptz,
  private_notes text,
  analyst_notes text,
  rejection_reason text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  published_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint regulatory_signals_slug_not_empty check (length(trim(slug)) > 0),
  constraint regulatory_signals_headline_not_empty check (length(trim(headline)) > 0),
  constraint regulatory_signals_private_summary_not_empty check (length(trim(private_summary)) > 0),
  constraint regulatory_signals_source_url_not_empty check (length(trim(source_url)) > 0),
  constraint regulatory_signals_type_check check (signal_type in ('regulatory_change','policy_announcement','import_export_pathway','licensing_market_access','prescription_patient_access','hemp_cbd_controlled_cannabinoids','enforcement_compliance_action','consultation_pending_rule_change','court_agency_decision','controlled_substance_scheduling','customs_trade_requirement','quality_standard_requirement')),
  constraint regulatory_signals_review_status_check check (review_status in ('captured','triaged','needs_source_validation','in_review','approved_private','approved_public','published','rejected','archived','expired')),
  constraint regulatory_signals_confidence_check check (confidence in ('low', 'medium', 'high', 'official_confirmed')),
  constraint regulatory_signals_impact_level_check check (impact_level in ('low', 'moderate', 'high', 'critical')),
  constraint regulatory_signals_publication_gate check (
    review_status <> 'published'
    or (
      public_safe = true
      and publish_to_public = true
      and public_summary is not null
      and length(trim(public_summary)) > 0
      and public_implication is not null
      and length(trim(public_implication)) > 0
      and canonical_source_url is not null
      and length(trim(canonical_source_url)) > 0
      and published_at is not null
    )
  )
);

create table if not exists regulatory_signals.signal_evidence_links (
  signal_id uuid not null references regulatory_signals.signals(id) on delete cascade,
  evidence_id uuid not null references regulatory_signals.evidence(id) on delete cascade,
  relationship text not null default 'supporting',
  created_at timestamptz not null default now(),
  primary key (signal_id, evidence_id),
  constraint regulatory_signal_evidence_relationship_check check (relationship in ('primary', 'supporting', 'context', 'contradictory'))
);

create table if not exists regulatory_signals.review_events (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null references regulatory_signals.signals(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  actor_id uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  constraint regulatory_review_events_type_check check (event_type in ('created','triaged','source_validation_requested','review_started','approved_private','approved_public','published','rejected','archived','expired','updated'))
);

create table if not exists regulatory_signals.publication_events (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null references regulatory_signals.signals(id) on delete cascade,
  action text not null,
  public_url text,
  actor_id uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  constraint regulatory_publication_events_action_check check (action in ('published', 'unpublished', 'republished', 'archived', 'expired'))
);

create index if not exists regulatory_sources_country_idx on regulatory_signals.sources(country_code, source_tier);
create index if not exists regulatory_evidence_country_idx on regulatory_signals.evidence(country_code, published_at desc);
create index if not exists regulatory_signals_public_idx on regulatory_signals.signals(review_status, public_safe, publish_to_public, signal_date desc);
create index if not exists regulatory_signals_country_idx on regulatory_signals.signals(country_code, signal_date desc);
create index if not exists regulatory_signals_type_idx on regulatory_signals.signals(signal_type, signal_date desc);

create or replace view regulatory_signals.public_signals as
select
  id,
  slug,
  headline,
  signal_type,
  confidence,
  impact_level,
  country_code,
  country_name,
  region,
  jurisdiction,
  regulator_name,
  signal_date,
  source_tier,
  source_type,
  canonical_source_url,
  public_summary,
  public_implication,
  published_at,
  last_reviewed_at
from regulatory_signals.signals
where review_status = 'published'
  and public_safe = true
  and publish_to_public = true;

alter table regulatory_signals.sources enable row level security;
alter table regulatory_signals.evidence enable row level security;
alter table regulatory_signals.signals enable row level security;
alter table regulatory_signals.signal_evidence_links enable row level security;
alter table regulatory_signals.review_events enable row level security;
alter table regulatory_signals.publication_events enable row level security;

revoke all on schema regulatory_signals from anon;
revoke all on schema regulatory_signals from authenticated;
grant usage on schema regulatory_signals to authenticated;

revoke all on regulatory_signals.sources from anon;
revoke all on regulatory_signals.evidence from anon;
revoke all on regulatory_signals.signals from anon;
revoke all on regulatory_signals.signal_evidence_links from anon;
revoke all on regulatory_signals.review_events from anon;
revoke all on regulatory_signals.publication_events from anon;

revoke all on regulatory_signals.sources from authenticated;
revoke all on regulatory_signals.evidence from authenticated;
revoke all on regulatory_signals.signals from authenticated;
revoke all on regulatory_signals.signal_evidence_links from authenticated;
revoke all on regulatory_signals.review_events from authenticated;
revoke all on regulatory_signals.publication_events from authenticated;

grant select, insert, update, delete on regulatory_signals.sources to authenticated;
grant select, insert, update, delete on regulatory_signals.evidence to authenticated;
grant select, insert, update, delete on regulatory_signals.signals to authenticated;
grant select, insert, update, delete on regulatory_signals.signal_evidence_links to authenticated;
grant select, insert, update, delete on regulatory_signals.review_events to authenticated;
grant select, insert, update, delete on regulatory_signals.publication_events to authenticated;
grant select on regulatory_signals.public_signals to anon;
grant select on regulatory_signals.public_signals to authenticated;

drop policy if exists regulatory_sources_admin_operator_only on regulatory_signals.sources;
drop policy if exists regulatory_evidence_admin_operator_only on regulatory_signals.evidence;
drop policy if exists regulatory_signals_admin_operator_only on regulatory_signals.signals;
drop policy if exists regulatory_signal_evidence_links_admin_operator_only on regulatory_signals.signal_evidence_links;
drop policy if exists regulatory_review_events_admin_operator_only on regulatory_signals.review_events;
drop policy if exists regulatory_publication_events_admin_operator_only on regulatory_signals.publication_events;

create policy regulatory_sources_admin_operator_only on regulatory_signals.sources for all to authenticated using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator'))) with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator')));
create policy regulatory_evidence_admin_operator_only on regulatory_signals.evidence for all to authenticated using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator'))) with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator')));
create policy regulatory_signals_admin_operator_only on regulatory_signals.signals for all to authenticated using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator'))) with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator')));
create policy regulatory_signal_evidence_links_admin_operator_only on regulatory_signals.signal_evidence_links for all to authenticated using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator'))) with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator')));
create policy regulatory_review_events_admin_operator_only on regulatory_signals.review_events for all to authenticated using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator'))) with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator')));
create policy regulatory_publication_events_admin_operator_only on regulatory_signals.publication_events for all to authenticated using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator'))) with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator')));

comment on schema regulatory_signals is 'Parallel Harbourview regulatory intelligence subsystem. Not marketplace Signal Engine.';
comment on table regulatory_signals.sources is 'Private source registry for regulatory and policy monitoring.';
comment on table regulatory_signals.evidence is 'Private evidence records for regulatory Signals. Raw excerpts and storage paths are never public.';
comment on table regulatory_signals.signals is 'Private master regulatory Signals table. Public output must use public_signals projection only.';
comment on view regulatory_signals.public_signals is 'Public-safe projection of published regulatory Signals only.';
