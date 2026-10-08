-- Harbourview Clinical Evidence Spine — production-shape reconciliation
-- Forward-only repair for the live 2026-08-18 production schema.
-- Preserves all existing rows. Existing graded/synthesis rows without credential-bound
-- review provenance are moved to under-review; no clinical-synthesis row is published here.

begin;

-- ---------------------------------------------------------------------------
-- 1. Reconcile the existing evidence-record contract without renaming live columns.
-- Canonical live names remain condition_label, cannabinoids, jurisdictions.
-- ---------------------------------------------------------------------------
alter table public.clinical_evidence_records
  add column if not exists source_registry_id text,
  add column if not exists grading_method_key text,
  add column if not exists publication_scope text,
  add column if not exists freshness_status text not null default 'current',
  add column if not exists review_due_at timestamptz,
  add column if not exists source_currentness_checked_at timestamptz,
  add column if not exists freshness_reason text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.clinical_evidence_records'::regclass
      and conname = 'clinical_evidence_records_publication_scope_check'
  ) then
    alter table public.clinical_evidence_records
      add constraint clinical_evidence_records_publication_scope_check
      check (publication_scope in ('source-metadata','clinical-synthesis'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.clinical_evidence_records'::regclass
      and conname = 'clinical_evidence_records_freshness_status_check'
  ) then
    alter table public.clinical_evidence_records
      add constraint clinical_evidence_records_freshness_status_check
      check (freshness_status in ('current','stale','review-required','source-degraded'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Credential-bound review provenance required for future synthesis publish.
-- These tables are missing from the live production schema.
-- ---------------------------------------------------------------------------
create table if not exists public.clinical_reviewer_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  profession text not null check (profession in ('clinician','pharmacist')),
  jurisdiction text not null,
  credential_reference text not null,
  verification_source_url text not null,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','expired','revoked','rejected')),
  verified_by_user_id uuid,
  verified_at timestamptz,
  valid_from date,
  valid_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, profession, jurisdiction, credential_reference),
  constraint clinical_reviewer_credential_url_https
    check (verification_source_url ~ '^https://'),
  constraint clinical_reviewer_credential_verified_fields
    check (verification_status <> 'verified' or verified_at is not null)
);

create table if not exists public.clinical_evidence_reviews (
  id uuid primary key default gen_random_uuid(),
  evidence_record_id uuid not null
    references public.clinical_evidence_records(id) on delete cascade,
  review_type text not null
    check (review_type in ('provenance','clinical','methodology')),
  reviewer_type text not null
    check (reviewer_type in ('system','analyst','clinician','pharmacist')),
  reviewer_user_id uuid,
  reviewer_credential_id uuid
    references public.clinical_reviewer_credentials(id) on delete restrict,
  reviewer_identity text not null,
  decision text not null
    check (decision in ('approved','needs-changes','rejected')),
  grading_method_key text,
  assigned_evidence_strength text
    check (assigned_evidence_strength is null or assigned_evidence_strength in (
      'high','moderate','low','very-low','ungraded','conflicted'
    )),
  rationale text not null,
  reviewed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_clinical_evidence_reviews_record
  on public.clinical_evidence_reviews(evidence_record_id, review_type, decision, reviewed_at desc);

create or replace function public.clinical_reviewer_credential_is_valid(
  p_credential_id uuid,
  p_user_id uuid,
  p_reviewer_type text,
  p_reviewed_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select exists (
    select 1
    from public.clinical_reviewer_credentials c
    where c.id = p_credential_id
      and c.user_id = p_user_id
      and c.profession = p_reviewer_type
      and c.verification_status = 'verified'
      and (c.valid_from is null or c.valid_from <= p_reviewed_at::date)
      and (c.valid_until is null or c.valid_until >= p_reviewed_at::date)
  );
$function$;

revoke all on function public.clinical_reviewer_credential_is_valid(uuid,uuid,text,timestamptz) from public;
grant execute on function public.clinical_reviewer_credential_is_valid(uuid,uuid,text,timestamptz)
  to authenticated, service_role;

-- Classify the pre-existing corpus conservatively. Regulatory/guidance rows that are
-- explicitly ungraded are source metadata; every graded or claim-bearing row is synthesis.
update public.clinical_evidence_records
set publication_scope = case
  when evidence_type in ('regulation','regulatory-guidance')
       and evidence_strength = 'ungraded'
    then 'source-metadata'
  else 'clinical-synthesis'
end
where publication_scope is null;

alter table public.clinical_evidence_records
  alter column publication_scope set not null;

-- Preserve every row, but fail closed on synthesis publication unless production already
-- contains both approved provenance review and valid credential-bound clinical review.
update public.clinical_evidence_records e
set review_status = 'under-review',
    updated_at = now()
where e.review_status = 'published'
  and e.publication_scope = 'clinical-synthesis'
  and not (
    exists (
      select 1
      from public.clinical_evidence_reviews p
      where p.evidence_record_id = e.id
        and p.review_type = 'provenance'
        and p.decision = 'approved'
    )
    and exists (
      select 1
      from public.clinical_evidence_reviews r
      where r.evidence_record_id = e.id
        and r.review_type = 'clinical'
        and r.reviewer_type in ('clinician','pharmacist')
        and r.decision = 'approved'
        and r.reviewer_user_id is not null
        and r.reviewer_credential_id is not null
        and public.clinical_reviewer_credential_is_valid(
          r.reviewer_credential_id,
          r.reviewer_user_id,
          r.reviewer_type,
          r.reviewed_at
        )
    )
  );

create or replace function public.clinical_require_credentialed_qualified_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.decision = 'approved' and new.review_type in ('clinical','methodology') then
    if new.reviewer_type not in ('clinician','pharmacist') then
      raise exception 'qualified Clinical review requires clinician or pharmacist reviewer type';
    end if;
    if new.reviewer_user_id is null or new.reviewer_credential_id is null then
      raise exception 'qualified Clinical review requires credential-bound reviewer identity';
    end if;
    if not public.clinical_reviewer_credential_is_valid(
      new.reviewer_credential_id,
      new.reviewer_user_id,
      new.reviewer_type,
      new.reviewed_at
    ) then
      raise exception 'qualified Clinical review credential is not verified/current for this reviewer';
    end if;
  end if;
  return new;
end;
$function$;

revoke all on function public.clinical_require_credentialed_qualified_review() from public;
drop trigger if exists trg_clinical_require_credentialed_qualified_review
  on public.clinical_evidence_reviews;
create trigger trg_clinical_require_credentialed_qualified_review
before insert or update of review_type, reviewer_type, reviewer_user_id,
  reviewer_credential_id, decision, reviewed_at
on public.clinical_evidence_reviews
for each row execute function public.clinical_require_credentialed_qualified_review();

create or replace function public.clinical_require_publication_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.review_status = 'published'
     and (
       tg_op = 'INSERT'
       or old.review_status is distinct from 'published'
       or old.publication_scope is distinct from new.publication_scope
       or old.evidence_strength is distinct from new.evidence_strength
     ) then
    if not exists (
      select 1
      from public.clinical_evidence_reviews p
      where p.evidence_record_id = new.id
        and p.review_type = 'provenance'
        and p.decision = 'approved'
    ) then
      raise exception 'clinical evidence publication requires an approved provenance review';
    end if;

    if new.publication_scope = 'clinical-synthesis'
       or new.evidence_strength in ('high','moderate','low','very-low','conflicted') then
      if not exists (
        select 1
        from public.clinical_evidence_reviews r
        where r.evidence_record_id = new.id
          and r.review_type = 'clinical'
          and r.reviewer_type in ('clinician','pharmacist')
          and r.decision = 'approved'
          and r.reviewer_user_id is not null
          and r.reviewer_credential_id is not null
          and public.clinical_reviewer_credential_is_valid(
            r.reviewer_credential_id,
            r.reviewer_user_id,
            r.reviewer_type,
            r.reviewed_at
          )
      ) then
        raise exception 'clinical synthesis or graded certainty requires an approved credential-bound clinician/pharmacist review';
      end if;
    end if;
  end if;
  return new;
end;
$function$;

revoke all on function public.clinical_require_publication_review() from public;
drop trigger if exists trg_clinical_require_publication_review
  on public.clinical_evidence_records;
create trigger trg_clinical_require_publication_review
before insert or update of review_status, publication_scope, evidence_strength
on public.clinical_evidence_records
for each row execute function public.clinical_require_publication_review();

-- ---------------------------------------------------------------------------
-- 3. Reconcile change events for PR #1525 currentness job.
-- Existing published events are preserved; internal currentness events may omit display fields.
-- ---------------------------------------------------------------------------
alter table public.clinical_evidence_change_events
  add column if not exists payload jsonb not null default '{}'::jsonb,
  alter column title drop not null,
  alter column summary drop not null,
  alter column verified_at drop not null,
  alter column primary_source_title drop not null,
  alter column primary_source_publisher drop not null,
  alter column primary_source_url drop not null,
  alter column occurred_at set default now();

alter table public.clinical_evidence_change_events
  drop constraint if exists clinical_evidence_change_events_event_type_check;

create index if not exists idx_clinical_change_events_record
  on public.clinical_evidence_change_events(evidence_record_id, created_at desc);
create index if not exists idx_clinical_change_events_type
  on public.clinical_evidence_change_events(event_type, created_at desc);

-- ---------------------------------------------------------------------------
-- 4. Missing supporting Clinical tables required by #1523/#1525.
-- ---------------------------------------------------------------------------
create table if not exists public.clinical_evidence_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_registry_id text not null,
  snapshot_key text not null,
  source_url text not null,
  source_version text,
  retrieved_at timestamptz not null,
  media_type text not null,
  hash_scope text not null check (hash_scope in (
    'source-bytes','normalized-text','normalized-reviewed-extract'
  )),
  content_sha256 text not null,
  byte_size bigint,
  locator_manifest jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_registry_id, snapshot_key),
  constraint clinical_evidence_snapshots_source_https check (source_url ~ '^https://'),
  constraint clinical_evidence_snapshots_sha256 check (content_sha256 ~ '^[0-9a-f]{64}$')
);

create index if not exists idx_clinical_snapshots_registry
  on public.clinical_evidence_snapshots(source_registry_id, retrieved_at desc);

create table if not exists public.clinical_structured_extractions (
  id uuid primary key default gen_random_uuid(),
  evidence_record_id uuid not null
    references public.clinical_evidence_records(id) on delete cascade,
  source_snapshot_id uuid not null
    references public.clinical_evidence_snapshots(id) on delete restrict,
  population jsonb,
  intervention jsonb,
  comparator jsonb,
  outcomes jsonb not null default '[]'::jsonb,
  study_design text,
  sample_size integer,
  follow_up text,
  effect_estimates jsonb not null default '[]'::jsonb,
  uncertainty jsonb,
  limitations jsonb not null default '[]'::jsonb,
  source_locator text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.clinical_outcome_evidence (
  id uuid primary key default gen_random_uuid(),
  condition_id text not null,
  evidence_record_id uuid not null
    references public.clinical_evidence_records(id) on delete cascade,
  source_snapshot_id uuid
    references public.clinical_evidence_snapshots(id) on delete restrict,
  intervention_label text,
  intervention_class text not null,
  formulation text,
  cannabinoids text[] not null default '{}',
  population_summary text,
  comparator_summary text,
  outcome_key text not null,
  outcome_label text not null,
  relationship_kind text not null check (relationship_kind in (
    'authorized-indication','efficacy','safety','tolerability','quality-of-life','other'
  )),
  direction text not null check (direction in (
    'benefit','harm','no-clear-effect','mixed','not-assessed'
  )),
  effect_summary text,
  uncertainty_summary text,
  publication_scope text not null check (publication_scope in ('source-metadata','clinical-synthesis')),
  review_status text not null check (review_status in ('published','under-review','superseded')),
  created_at timestamptz not null default now()
);

create table if not exists public.clinical_grade_assessments (
  id uuid primary key default gen_random_uuid(),
  evidence_record_id uuid not null
    references public.clinical_evidence_records(id) on delete cascade,
  review_id uuid not null
    references public.clinical_evidence_reviews(id) on delete restrict,
  grading_method_key text not null,
  starting_certainty text not null,
  risk_of_bias text not null,
  inconsistency text not null,
  indirectness text not null,
  imprecision text not null,
  publication_bias text not null,
  final_certainty text not null,
  assessment_rationale text not null,
  created_at timestamptz not null default now(),
  unique (evidence_record_id, review_id)
);

create table if not exists public.clinical_intake_queue (
  id uuid primary key default gen_random_uuid(),
  intake_status text not null default 'queued',
  priority text not null default 'normal',
  coverage_status text not null default 'source-identified',
  intended_conditions text[] not null default '{}',
  intended_jurisdictions text[] not null default '{}',
  intended_publication_scope text not null default 'source-metadata'
    check (intended_publication_scope in ('source-metadata','clinical-synthesis')),
  assigned_user_id uuid,
  review_due_at timestamptz,
  notes text,
  source_id text not null,
  source_key text not null,
  source_type text not null,
  source_title text not null,
  publisher text not null,
  source_url text not null,
  doi text,
  pmid text,
  din text,
  source_version text,
  currentness text not null default 'unknown',
  latest_snapshot_id uuid references public.clinical_evidence_snapshots(id) on delete set null,
  retrieved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint clinical_intake_source_https check (source_url ~ '^https://')
);

create table if not exists public.clinical_view_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  evidence_record_id uuid not null
    references public.clinical_evidence_records(id) on delete cascade,
  record_verified_at timestamptz not null,
  jurisdiction_context text,
  viewed_at timestamptz not null default now()
);

create index if not exists idx_clinical_view_audit_user
  on public.clinical_view_audit(user_id, viewed_at desc);
create index if not exists idx_clinical_evidence_records_review_status
  on public.clinical_evidence_records(review_status);
create index if not exists idx_clinical_evidence_records_freshness
  on public.clinical_evidence_records(freshness_status);
create index if not exists idx_clinical_evidence_records_currentness_checked
  on public.clinical_evidence_records(source_currentness_checked_at nulls first);
create index if not exists idx_clinical_evidence_records_jurisdictions
  on public.clinical_evidence_records using gin(jurisdictions);

-- ---------------------------------------------------------------------------
-- 5. RLS: one effective published-read policy for authenticated users only.
-- Private governance/source-processing tables stay reviewer/service-role scoped.
-- ---------------------------------------------------------------------------
create or replace function public.clinical_evidence_has_review_role(
  allowed_roles text[] default array['admin','operator','analyst']
)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = any(allowed_roles)
  );
$function$;

revoke all on function public.clinical_evidence_has_review_role(text[]) from public;
grant execute on function public.clinical_evidence_has_review_role(text[])
  to authenticated, service_role;

alter table public.clinical_evidence_records enable row level security;
alter table public.clinical_evidence_change_events enable row level security;
alter table public.clinical_evidence_snapshots enable row level security;
alter table public.clinical_structured_extractions enable row level security;
alter table public.clinical_outcome_evidence enable row level security;
alter table public.clinical_grade_assessments enable row level security;
alter table public.clinical_reviewer_credentials enable row level security;
alter table public.clinical_evidence_reviews enable row level security;
alter table public.clinical_intake_queue enable row level security;
alter table public.clinical_view_audit enable row level security;

drop policy if exists clinical_evidence_records_public_read
  on public.clinical_evidence_records;
drop policy if exists clinical_evidence_published_read
  on public.clinical_evidence_records;
create policy clinical_evidence_published_read
  on public.clinical_evidence_records
  for select to authenticated
  using (review_status = 'published');

drop policy if exists clinical_evidence_change_events_public_read
  on public.clinical_evidence_change_events;
drop policy if exists clinical_evidence_change_events_published_read
  on public.clinical_evidence_change_events;
create policy clinical_evidence_change_events_published_read
  on public.clinical_evidence_change_events
  for select to authenticated
  using (
    review_status = 'published'
    and (
      evidence_record_id is null
      or exists (
        select 1
        from public.clinical_evidence_records r
        where r.id = clinical_evidence_change_events.evidence_record_id
          and r.review_status = 'published'
      )
    )
  );

drop policy if exists clinical_snapshots_review_read on public.clinical_evidence_snapshots;
create policy clinical_snapshots_review_read
  on public.clinical_evidence_snapshots
  for select to authenticated
  using (public.clinical_evidence_has_review_role());

drop policy if exists clinical_structured_extractions_review_access
  on public.clinical_structured_extractions;
create policy clinical_structured_extractions_review_access
  on public.clinical_structured_extractions
  for all to authenticated
  using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());

drop policy if exists clinical_outcome_evidence_review_access
  on public.clinical_outcome_evidence;
create policy clinical_outcome_evidence_review_access
  on public.clinical_outcome_evidence
  for all to authenticated
  using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());

drop policy if exists clinical_grade_assessments_review_access
  on public.clinical_grade_assessments;
create policy clinical_grade_assessments_review_access
  on public.clinical_grade_assessments
  for all to authenticated
  using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());

drop policy if exists clinical_reviewer_credentials_review_read
  on public.clinical_reviewer_credentials;
drop policy if exists clinical_reviewer_credentials_admin_write
  on public.clinical_reviewer_credentials;
create policy clinical_reviewer_credentials_review_read
  on public.clinical_reviewer_credentials
  for select to authenticated
  using (public.clinical_evidence_has_review_role());
create policy clinical_reviewer_credentials_admin_write
  on public.clinical_reviewer_credentials
  for all to authenticated
  using (public.clinical_evidence_has_review_role(array['admin','operator']))
  with check (public.clinical_evidence_has_review_role(array['admin','operator']));

drop policy if exists clinical_evidence_reviews_review_access
  on public.clinical_evidence_reviews;
create policy clinical_evidence_reviews_review_access
  on public.clinical_evidence_reviews
  for all to authenticated
  using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());

drop policy if exists clinical_intake_queue_review_access
  on public.clinical_intake_queue;
create policy clinical_intake_queue_review_access
  on public.clinical_intake_queue
  for all to authenticated
  using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());

drop policy if exists clinical_view_audit_own on public.clinical_view_audit;
create policy clinical_view_audit_own
  on public.clinical_view_audit
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.clinical_evidence_records from anon;
revoke all on public.clinical_evidence_change_events from anon;
revoke all on public.clinical_evidence_snapshots from anon;
revoke all on public.clinical_structured_extractions from anon;
revoke all on public.clinical_outcome_evidence from anon;
revoke all on public.clinical_grade_assessments from anon;
revoke all on public.clinical_reviewer_credentials from anon;
revoke all on public.clinical_evidence_reviews from anon;
revoke all on public.clinical_intake_queue from anon;
revoke all on public.clinical_view_audit from anon;

grant select on public.clinical_evidence_records to authenticated;
grant select on public.clinical_evidence_change_events to authenticated;
grant select on public.clinical_evidence_snapshots to authenticated;
grant select, insert, update on public.clinical_structured_extractions to authenticated;
grant select, insert, update on public.clinical_outcome_evidence to authenticated;
grant select, insert, update on public.clinical_grade_assessments to authenticated;
grant select, insert, update on public.clinical_evidence_reviews to authenticated;
grant select on public.clinical_reviewer_credentials to authenticated;
grant select, insert, update on public.clinical_intake_queue to authenticated;
grant select, insert, update, delete on public.clinical_view_audit to authenticated;

grant all on public.clinical_evidence_records to service_role;
grant all on public.clinical_evidence_change_events to service_role;
grant all on public.clinical_evidence_snapshots to service_role;
grant all on public.clinical_structured_extractions to service_role;
grant all on public.clinical_outcome_evidence to service_role;
grant all on public.clinical_grade_assessments to service_role;
grant all on public.clinical_reviewer_credentials to service_role;
grant all on public.clinical_evidence_reviews to service_role;
grant all on public.clinical_intake_queue to service_role;
grant all on public.clinical_view_audit to service_role;

-- The live search helpers were historically executable by anon. Keep them aligned with
-- the authenticated-only evidence policy rather than relying on RLS to return an empty set.
do $$
begin
  if to_regprocedure('public.search_clinical_evidence_records(text,text,integer)') is not null then
    revoke execute on function public.search_clinical_evidence_records(text,text,integer) from anon;
    grant execute on function public.search_clinical_evidence_records(text,text,integer)
      to authenticated, service_role;
  end if;
  if to_regprocedure('public.clinical_condition_term_known(text)') is not null then
    revoke execute on function public.clinical_condition_term_known(text) from anon;
    grant execute on function public.clinical_condition_term_known(text)
      to authenticated, service_role;
  end if;
end $$;

create or replace function public.clinical_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

drop trigger if exists clinical_evidence_records_updated_at
  on public.clinical_evidence_records;
create trigger clinical_evidence_records_updated_at
before update on public.clinical_evidence_records
for each row execute function public.clinical_set_updated_at();

comment on column public.clinical_evidence_records.publication_scope is
  'source-metadata or clinical-synthesis. Existing graded/claim-bearing rows were conservatively classified as synthesis during 2026-08-18 reconciliation.';
comment on table public.clinical_evidence_snapshots is
  'Source-currentness snapshots used by the protected Clinical currentness job; not a public evidence projection.';
comment on table public.clinical_evidence_reviews is
  'Private review provenance. Approved clinical/methodology reviews require a valid credential-bound clinician or pharmacist identity.';

commit;
