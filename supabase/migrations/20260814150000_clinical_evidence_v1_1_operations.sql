-- Clinical Evidence V1.1 governed evidence-operations layer.
-- Private operational queues only; no production migration is applied by this change.

create table if not exists public.clinical_evidence_intake_queue (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.clinical_evidence_sources(id) on delete restrict,
  intake_status text not null default 'queued' check (intake_status in (
    'queued','snapshot-required','extraction-required','provenance-review','qualified-review','grading-review','conflict-review','publication-ready','published','superseded','deferred','rejected'
  )),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  intended_conditions text[] not null default '{}',
  intended_jurisdictions text[] not null default '{}',
  intended_publication_scope text not null default 'clinical-synthesis' check (intended_publication_scope in ('source-metadata','clinical-synthesis')),
  coverage_status text not null default 'source-identified' check (coverage_status in (
    'source-identified','snapshot-captured','extracted','reviewed','published','deferred','rejected'
  )),
  assigned_user_id uuid,
  review_due_at timestamptz,
  notes text,
  created_by_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_id)
);

create table if not exists public.clinical_evidence_operation_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in (
    'source','intake','snapshot','extraction','credential','review','grade','conflict','evidence-record','publication','corpus'
  )),
  entity_id uuid,
  event_type text not null,
  actor_user_id uuid,
  event_payload jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);

create or replace function public.clinical_operation_event_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  raise exception 'Clinical operation events are append-only';
end;
$function$;
revoke all on function public.clinical_operation_event_immutable() from public;
drop trigger if exists trg_clinical_operation_event_immutable on public.clinical_evidence_operation_events;
create trigger trg_clinical_operation_event_immutable
before update or delete on public.clinical_evidence_operation_events
for each row execute function public.clinical_operation_event_immutable();

create or replace function public.clinical_intake_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;
drop trigger if exists trg_clinical_intake_touch_updated_at on public.clinical_evidence_intake_queue;
create trigger trg_clinical_intake_touch_updated_at
before update on public.clinical_evidence_intake_queue
for each row execute function public.clinical_intake_touch_updated_at();

-- Credential verification state is private and only admin/operator may mutate it
-- through authenticated RLS. Service-role remains available to server-only admin actions.
alter table public.clinical_reviewer_credentials enable row level security;
alter table public.clinical_evidence_source_snapshots enable row level security;
alter table public.clinical_evidence_outcome_links enable row level security;
alter table public.clinical_evidence_grade_assessments enable row level security;
alter table public.clinical_evidence_publication_versions enable row level security;
alter table public.clinical_evidence_intake_queue enable row level security;
alter table public.clinical_evidence_operation_events enable row level security;

create policy clinical_reviewer_credentials_review_read on public.clinical_reviewer_credentials
  for select to authenticated using (public.clinical_evidence_has_review_role());
create policy clinical_reviewer_credentials_admin_write on public.clinical_reviewer_credentials
  for all to authenticated
  using (public.clinical_evidence_has_review_role(array['admin','operator']))
  with check (public.clinical_evidence_has_review_role(array['admin','operator']));

create policy clinical_source_snapshots_review_read on public.clinical_evidence_source_snapshots
  for select to authenticated using (public.clinical_evidence_has_review_role());
create policy clinical_outcome_links_review_access on public.clinical_evidence_outcome_links
  for all to authenticated using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());
create policy clinical_grade_assessments_review_access on public.clinical_evidence_grade_assessments
  for all to authenticated using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());
create policy clinical_publication_versions_review_read on public.clinical_evidence_publication_versions
  for select to authenticated using (public.clinical_evidence_has_review_role());
create policy clinical_intake_queue_review_access on public.clinical_evidence_intake_queue
  for all to authenticated using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());
create policy clinical_operation_events_review_access on public.clinical_evidence_operation_events
  for select to authenticated using (public.clinical_evidence_has_review_role());
create policy clinical_operation_events_review_insert on public.clinical_evidence_operation_events
  for insert to authenticated with check (public.clinical_evidence_has_review_role());

grant select on public.clinical_reviewer_credentials to authenticated;
grant select on public.clinical_evidence_source_snapshots to authenticated;
grant select, insert, update on public.clinical_evidence_outcome_links to authenticated;
grant select, insert, update on public.clinical_evidence_grade_assessments to authenticated;
grant select on public.clinical_evidence_publication_versions to authenticated;
grant select, insert, update on public.clinical_evidence_intake_queue to authenticated;
grant select, insert on public.clinical_evidence_operation_events to authenticated;
grant all on public.clinical_reviewer_credentials to service_role;
grant all on public.clinical_evidence_source_snapshots to service_role;
grant all on public.clinical_evidence_outcome_links to service_role;
grant all on public.clinical_evidence_grade_assessments to service_role;
grant all on public.clinical_evidence_publication_versions to service_role;
grant all on public.clinical_evidence_intake_queue to service_role;
grant all on public.clinical_evidence_operation_events to service_role;

-- Private queue projections for the analyst/reviewer workbench.
create or replace view api.clinical_evidence_freshness_queue
with (security_invoker = true) as
select
  e.id,
  e.slug,
  e.title,
  e.review_status,
  e.freshness_status,
  e.review_due_at,
  e.source_currentness_checked_at,
  e.freshness_reason,
  s.source_key,
  s.currentness as source_currentness,
  s.source_url
from public.clinical_evidence_records e
left join public.clinical_evidence_sources s on s.id = e.primary_source_registry_id
where e.freshness_status <> 'current'
   or (e.review_due_at is not null and e.review_due_at <= now() + interval '30 days');

revoke all on api.clinical_evidence_freshness_queue from public, anon;
grant select on api.clinical_evidence_freshness_queue to authenticated, service_role;

create or replace view api.clinical_evidence_review_queue
with (security_invoker = true) as
select
  q.id as intake_id,
  q.intake_status,
  q.priority,
  q.coverage_status,
  q.intended_conditions,
  q.intended_jurisdictions,
  q.intended_publication_scope,
  q.assigned_user_id,
  q.review_due_at,
  q.notes,
  s.id as source_id,
  s.source_key,
  s.source_type,
  s.title as source_title,
  s.publisher,
  s.source_url,
  s.doi,
  s.pmid,
  s.din,
  s.source_version,
  s.currentness,
  s.latest_snapshot_id,
  s.retrieved_at
from public.clinical_evidence_intake_queue q
join public.clinical_evidence_sources s on s.id = q.source_id;

revoke all on api.clinical_evidence_review_queue from public, anon;
grant select on api.clinical_evidence_review_queue to authenticated, service_role;

create index if not exists idx_clinical_intake_status_priority
  on public.clinical_evidence_intake_queue(intake_status, priority, updated_at);
create index if not exists idx_clinical_operation_events_entity
  on public.clinical_evidence_operation_events(entity_type, entity_id, recorded_at desc);
create index if not exists idx_clinical_records_freshness_due
  on public.clinical_evidence_records(freshness_status, review_due_at);

-- ---------------------------------------------------------------------------
-- V1.1 systematic Canadian coverage expansion.
-- These sources are source-registry + private intake records only. Nothing below
-- publishes a clinical conclusion, assigns a grade, or creates an efficacy record.
-- ---------------------------------------------------------------------------
insert into public.clinical_evidence_sources (
  source_key, source_type, title, publisher, source_url, jurisdiction, doi, pmid,
  source_version, published_on, retrieved_at, currentness, currentness_checked_at
) values
(
  'pubmed-40238954', 'systematic-review',
  'Living Systematic Review on Cannabis and Other Plant-Based Treatments for Chronic Pain: 2024 Update',
  'AHRQ / NCBI Bookshelf indexed in PubMed',
  'https://pubmed.ncbi.nlm.nih.gov/40238954/', array['Global'], null, '40238954',
  '2024 update', null, '2026-08-14T15:00:00Z', 'current', '2026-08-14T15:00:00Z'
),
(
  'pubmed-39953210', 'systematic-review',
  'Efficacy of cannabinoids for the prophylaxis of chemotherapy-induced nausea and vomiting-a systematic review and meta-analysis',
  'PubMed / indexed journal article',
  'https://pubmed.ncbi.nlm.nih.gov/39953210/', array['Global'], null, '39953210',
  '2025', null, '2026-08-14T15:00:00Z', 'current', '2026-08-14T15:00:00Z'
),
(
  'pubmed-38478773', 'clinical-guideline',
  'Cannabis and Cannabinoids in Adults With Cancer: ASCO Guideline',
  'American Society of Clinical Oncology / PubMed',
  'https://pubmed.ncbi.nlm.nih.gov/38478773/', array['Global'], null, '38478773',
  '2024', '2024-03-13', '2026-08-14T15:00:00Z', 'current', '2026-08-14T15:00:00Z'
),
(
  'pubmed-38171632', 'meta-analysis',
  'Cannabis for medical use versus opioids for chronic non-cancer pain: a systematic review and network meta-analysis of randomised clinical trials',
  'BMJ Open / PubMed',
  'https://pubmed.ncbi.nlm.nih.gov/38171632/', array['Global'], '10.1136/bmjopen-2022-068182', '38171632',
  '2024', '2024-01-03', '2026-08-14T15:00:00Z', 'current', '2026-08-14T15:00:00Z'
)
on conflict (source_key) do update set
  title = excluded.title,
  publisher = excluded.publisher,
  source_url = excluded.source_url,
  jurisdiction = excluded.jurisdiction,
  doi = coalesce(excluded.doi, public.clinical_evidence_sources.doi),
  pmid = excluded.pmid,
  source_version = excluded.source_version,
  published_on = coalesce(excluded.published_on, public.clinical_evidence_sources.published_on),
  retrieved_at = excluded.retrieved_at,
  currentness = excluded.currentness,
  currentness_checked_at = excluded.currentness_checked_at,
  updated_at = now();

insert into public.clinical_evidence_intake_queue (
  source_id, intake_status, priority, intended_conditions, intended_jurisdictions,
  intended_publication_scope, coverage_status, notes
)
select s.id, x.intake_status, x.priority, x.conditions, array['Canada'], 'clinical-synthesis', 'source-identified', x.notes
from public.clinical_evidence_sources s
join (values
  ('pubmed-40238954','snapshot-required','high',array['chronic pain'], 'Living systematic-review candidate. Private/ungraded until snapshot, structured extraction, provenance review and qualified clinical review are complete.'),
  ('pubmed-38171632','snapshot-required','normal',array['chronic non-cancer pain'], 'Network meta-analysis candidate. Private/ungraded; do not infer comparative recommendation from source identification alone.'),
  ('pubmed-39953210','snapshot-required','normal',array['chemotherapy-induced nausea and vomiting'], 'Systematic review/meta-analysis candidate. Private/ungraded pending review against current oncology context.'),
  ('pubmed-38478773','snapshot-required','high',array['cancer symptom management','chemotherapy-induced nausea and vomiting'], 'Professional guideline candidate. Private until provenance and qualified review determine exact claim-level applicability to Canada.')
) as x(source_key,intake_status,priority,conditions,notes)
  on x.source_key = s.source_key
on conflict (source_id) do update set
  priority = excluded.priority,
  intended_conditions = excluded.intended_conditions,
  intended_jurisdictions = excluded.intended_jurisdictions,
  notes = excluded.notes,
  updated_at = now();

comment on table public.clinical_evidence_intake_queue is
  'Private V1.1 evidence operations queue. Source identification never implies a clinical conclusion or grade.';
comment on table public.clinical_evidence_operation_events is
  'Private append-only operations audit trail for source, review, grading, conflict and publication workflow events.';
