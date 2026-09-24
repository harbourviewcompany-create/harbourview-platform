-- Evidence integrity layer for the 291 x 32 depth contract.
-- Adds atomic provenance, negative evidence, conflict resolution, freshness,
-- and research-queue structures without inventing jurisdiction facts.
--
-- This migration is additive and does not modify production data.

create table if not exists public.jurisdiction_depth_evidence (
  evidence_id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on delete restrict,
  evidence_state text not null
    check (evidence_state in ('verified','verified_not_applicable','partial','conflict','research_required','stale','superseded')),
  applicability text not null
    check (applicability in ('applicable','not_applicable','unknown')),
  authority_level text not null
    check (authority_level in (
      'primary_legislation','primary_regulator','official_register',
      'official_guidance','official_statistics','international_body','secondary'
    )),
  source_url text not null,
  source_document_ref text,
  source_locator text,
  source_snapshot_sha256 text,
  source_excerpt text,
  claim_text text not null,
  negative_evidence boolean not null default false,
  inference_used boolean not null default false,
  effective_from date,
  effective_to date,
  published_at timestamptz,
  retrieved_at timestamptz,
  verified_at timestamptz,
  freshness_deadline timestamptz,
  supersedes_evidence_id uuid references public.jurisdiction_depth_evidence(evidence_id) on delete set null,
  conflict_group text,
  research_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (btrim(source_url) <> ''),
  check (btrim(claim_text) <> ''),
  check (effective_to is null or effective_from is null or effective_to >= effective_from),
  check (not negative_evidence or source_excerpt is not null),
  check (not inference_used or evidence_state not in ('verified','verified_not_applicable')),
  check (
    evidence_state not in ('verified','verified_not_applicable')
    or (
      verified_at is not null
      and retrieved_at is not null
      and source_snapshot_sha256 is not null
      and btrim(source_snapshot_sha256) <> ''
      and applicability <> 'unknown'
    )
  ),
  check (
    evidence_state <> 'conflict'
    or conflict_group is not null
  ),
  check (
    evidence_state <> 'research_required'
    or research_reason is not null
  )
);

create index if not exists jurisdiction_depth_evidence_lookup_idx
  on public.jurisdiction_depth_evidence(jurisdiction_key,dimension_key,evidence_state);
create index if not exists jurisdiction_depth_evidence_freshness_idx
  on public.jurisdiction_depth_evidence(freshness_deadline,evidence_state);
create index if not exists jurisdiction_depth_evidence_conflict_idx
  on public.jurisdiction_depth_evidence(conflict_group)
  where conflict_group is not null;

create table if not exists public.jurisdiction_depth_conflicts (
  conflict_id uuid primary key default gen_random_uuid(),
  conflict_group text not null unique,
  jurisdiction_key text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on delete restrict,
  conflict_type text not null
    check (conflict_type in ('source_conflict','temporal_conflict','scope_conflict','classification_conflict')),
  status text not null default 'open'
    check (status in ('open','resolved','superseded')),
  description text not null,
  resolution_basis text,
  resolution_evidence_id uuid references public.jurisdiction_depth_evidence(evidence_id) on delete set null,
  opened_at timestamptz not null default now(),
  resolved_at timestamptz,
  updated_at timestamptz not null default now(),
  check ((status = 'resolved') = (resolved_at is not null)),
  check (status <> 'resolved' or resolution_basis is not null)
);

create index if not exists jurisdiction_depth_conflicts_open_idx
  on public.jurisdiction_depth_conflicts(jurisdiction_key,dimension_key,status);

create table if not exists public.jurisdiction_depth_research_queue (
  research_id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on delete restrict,
  reason_code text not null
    check (reason_code in (
      'missing_evidence','missing_primary_source','stale_evidence',
      'conflicting_sources','unknown_applicability','source_capture_failed',
      'scope_ambiguity','temporal_gap','entity_resolution_gap'
    )),
  priority text not null default 'normal'
    check (priority in ('critical','high','normal','low')),
  status text not null default 'queued'
    check (status in ('queued','claimed','in_review','blocked','resolved','cancelled')),
  preferred_authority text,
  research_question text not null,
  last_attempted_at timestamptz,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_review_at timestamptz,
  linked_evidence_id uuid references public.jurisdiction_depth_evidence(evidence_id) on delete set null,
  linked_conflict_id uuid references public.jurisdiction_depth_conflicts(conflict_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'resolved' or linked_evidence_id is not null)
);

create index if not exists jurisdiction_depth_research_queue_idx
  on public.jurisdiction_depth_research_queue(status,priority,next_review_at);
create unique index if not exists jurisdiction_depth_research_active_unique
  on public.jurisdiction_depth_research_queue(jurisdiction_key,dimension_key,reason_code)
  where status in ('queued','claimed','in_review','blocked');

create table if not exists public.jurisdiction_depth_source_policy (
  dimension_key text primary key references public.jurisdiction_data_depth_dimensions(dimension_key) on delete cascade,
  minimum_authority_level text not null
    check (minimum_authority_level in (
      'primary_legislation','primary_regulator','official_register',
      'official_guidance','official_statistics','international_body','secondary'
    )),
  direct_jurisdiction_evidence_required boolean not null default true,
  negative_evidence_allowed boolean not null default true,
  max_freshness_days integer,
  notes text,
  updated_at timestamptz not null default now(),
  check (max_freshness_days is null or max_freshness_days >= 0)
);

-- Establish policy for every contracted dimension. These are validation rules,
-- not claims about any jurisdiction.
insert into public.jurisdiction_depth_source_policy
(dimension_key,minimum_authority_level,direct_jurisdiction_evidence_required,negative_evidence_allowed,max_freshness_days,notes)
select
  d.dimension_key,
  case
    when d.requires_primary_source then 'primary_regulator'
    when d.layer in ('foundation','quality') then 'official_register'
    when d.layer in ('commercial','network','intelligence') then 'official_statistics'
    else 'official_guidance'
  end,
  case when d.layer='foundation' then false else true end,
  true,
  d.freshness_days,
  'Machine-checkable source policy for the 291 x 32 evidence contract.'
from public.jurisdiction_data_depth_dimensions d
on conflict (dimension_key) do update set
  minimum_authority_level=excluded.minimum_authority_level,
  direct_jurisdiction_evidence_required=excluded.direct_jurisdiction_evidence_required,
  negative_evidence_allowed=excluded.negative_evidence_allowed,
  max_freshness_days=excluded.max_freshness_days,
  notes=excluded.notes,
  updated_at=now();

alter table public.jurisdiction_depth_evidence enable row level security;
alter table public.jurisdiction_depth_evidence force row level security;
alter table public.jurisdiction_depth_conflicts enable row level security;
alter table public.jurisdiction_depth_conflicts force row level security;
alter table public.jurisdiction_depth_research_queue enable row level security;
alter table public.jurisdiction_depth_research_queue force row level security;
alter table public.jurisdiction_depth_source_policy enable row level security;
alter table public.jurisdiction_depth_source_policy force row level security;

drop policy if exists jurisdiction_depth_evidence_public_read on public.jurisdiction_depth_evidence;
create policy jurisdiction_depth_evidence_public_read
  on public.jurisdiction_depth_evidence
  for select to anon,authenticated
  using (evidence_state in ('verified','verified_not_applicable'));

drop policy if exists jurisdiction_depth_conflicts_public_read on public.jurisdiction_depth_conflicts;
create policy jurisdiction_depth_conflicts_public_read
  on public.jurisdiction_depth_conflicts
  for select to anon,authenticated
  using (status = 'resolved');

drop policy if exists jurisdiction_depth_research_queue_public_read on public.jurisdiction_depth_research_queue;
create policy jurisdiction_depth_research_queue_public_read
  on public.jurisdiction_depth_research_queue
  for select to anon,authenticated
  using (false);

drop policy if exists jurisdiction_depth_source_policy_public_read on public.jurisdiction_depth_source_policy;
create policy jurisdiction_depth_source_policy_public_read
  on public.jurisdiction_depth_source_policy
  for select to anon,authenticated
  using (true);

revoke all on public.jurisdiction_depth_evidence from anon,authenticated;
revoke all on public.jurisdiction_depth_conflicts from anon,authenticated;
revoke all on public.jurisdiction_depth_research_queue from anon,authenticated;
revoke all on public.jurisdiction_depth_source_policy from anon,authenticated;
grant select on public.jurisdiction_depth_evidence to anon,authenticated;
grant select on public.jurisdiction_depth_conflicts to anon,authenticated;
grant select on public.jurisdiction_depth_source_policy to anon,authenticated;

create or replace view public.v_jurisdiction_depth_integrity
with (security_invoker=true) as
select
  s.jurisdiction_key,
  s.dimension_key,
  s.applicability,
  s.status,
  s.evidence_count,
  s.primary_source_count,
  coalesce(e.verified_count,0) verified_evidence_count,
  coalesce(e.negative_verified_count,0) negative_verified_evidence_count,
  coalesce(e.stale_count,0) stale_evidence_count,
  coalesce(e.conflict_count,0) conflict_evidence_count,
  coalesce(r.active_research_count,0) active_research_count,
  case
    when s.applicability='unknown' then 'research_required'
    when coalesce(e.conflict_count,0)>0 then 'conflict'
    when coalesce(e.stale_count,0)>0 then 'stale'
    when coalesce(e.verified_count,0)>0 then 'verified'
    when s.status='complete' and s.applicability='not_applicable' then 'verified_not_applicable'
    else 'research_required'
  end as evidence_integrity_state
from public.jurisdiction_data_depth_dimension_state s
left join (
  select
    jurisdiction_key,
    dimension_key,
    count(*) filter(where evidence_state in ('verified','verified_not_applicable')) verified_count,
    count(*) filter(where evidence_state in ('verified','verified_not_applicable') and negative_evidence) negative_verified_count,
    count(*) filter(where evidence_state='stale' or (freshness_deadline is not null and freshness_deadline <= now())) stale_count,
    count(*) filter(where evidence_state='conflict') conflict_count
  from public.jurisdiction_depth_evidence
  group by jurisdiction_key,dimension_key
) e using (jurisdiction_key,dimension_key)
left join (
  select jurisdiction_key,dimension_key,count(*) active_research_count
  from public.jurisdiction_depth_research_queue
  where status in ('queued','claimed','in_review','blocked')
  group by jurisdiction_key,dimension_key
) r using (jurisdiction_key,dimension_key)
where s.contract_version='2026-09-23.v2';

create or replace view public.v_jurisdiction_depth_research_queue
with (security_invoker=true) as
select
  q.research_id,
  q.jurisdiction_key,
  c.country_name,
  q.dimension_key,
  d.display_name as dimension_name,
  q.reason_code,
  q.priority,
  q.status,
  q.preferred_authority,
  q.research_question,
  q.attempt_count,
  q.last_attempted_at,
  q.next_review_at,
  q.linked_evidence_id,
  q.linked_conflict_id,
  q.created_at,
  q.updated_at
from public.jurisdiction_depth_research_queue q
join public.countries c on c.iso_alpha2=q.jurisdiction_key
join public.jurisdiction_data_depth_dimensions d on d.dimension_key=q.dimension_key
where q.status in ('queued','claimed','in_review','blocked');

create or replace view public.v_depth_evidence_gate
with (security_invoker=true) as
select
  count(*) filter(where evidence_integrity_state in ('verified','verified_not_applicable')) as verified_cells,
  count(*) filter(where evidence_integrity_state='conflict') as conflict_cells,
  count(*) filter(where evidence_integrity_state='stale') as stale_cells,
  count(*) filter(where evidence_integrity_state='research_required') as research_required_cells,
  count(*) as matrix_cells,
  case
    when count(*)=9312
     and count(*) filter(where evidence_integrity_state in ('conflict','stale','research_required'))=0
    then 'GO'
    else 'HOLD'
  end as gate
from public.v_jurisdiction_depth_integrity;

grant select on public.v_jurisdiction_depth_integrity to anon,authenticated;
grant select on public.v_jurisdiction_depth_research_queue to anon,authenticated;
grant select on public.v_depth_evidence_gate to anon,authenticated;

-- Hard structural checks. This migration must never silently drift from the contract.
do $$
declare
  v_dimensions integer;
  v_cells integer;
  v_policies integer;
begin
  select count(*) into v_dimensions
  from public.jurisdiction_data_depth_dimensions
  where contract_version='2026-09-23.v2';

  select count(*) into v_cells
  from public.jurisdiction_data_depth_dimension_state
  where contract_version='2026-09-23.v2';

  select count(*) into v_policies
  from public.jurisdiction_depth_source_policy;

  if v_dimensions <> 32 then
    raise exception 'Evidence integrity gate failed: expected 32 dimensions, found %',v_dimensions;
  end if;

  if v_cells <> 9312 then
    raise exception 'Evidence integrity gate failed: expected 9312 cells, found %',v_cells;
  end if;

  if v_policies <> 32 then
    raise exception 'Evidence integrity gate failed: expected 32 source policies, found %',v_policies;
  end if;
end $$;
