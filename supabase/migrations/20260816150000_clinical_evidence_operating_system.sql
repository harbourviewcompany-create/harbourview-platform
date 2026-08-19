-- Clinical Evidence Operating System V1.
-- Extends the governed Clinical evidence spine with deterministic concept resolution,
-- evidence eligibility, publication/study-family normalization, claim-level provenance,
-- and corpus-coverage introspection. This migration adds no efficacy, dosing, safety,
-- interaction, or patient-specific claim.

-- ---------------------------------------------------------------------------
-- Deterministic normalization shared by concept resolution and search.
-- ---------------------------------------------------------------------------
create or replace function public.normalize_clinical_query(p_value text)
returns text
language sql
immutable
parallel safe
set search_path = public
as $function$
  select btrim(
    regexp_replace(
      regexp_replace(lower(coalesce(p_value, '')), '[^[:alnum:]]+', ' ', 'g'),
      '\s+', ' ', 'g'
    )
  );
$function$;

revoke all on function public.normalize_clinical_query(text) from public;
grant execute on function public.normalize_clinical_query(text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Canonical concepts + individually sourced aliases.
-- ---------------------------------------------------------------------------
create table if not exists public.clinical_concepts (
  id uuid primary key default gen_random_uuid(),
  concept_type text not null check (concept_type in (
    'condition','intervention','cannabinoid','formulation','outcome','safety','guideline','other'
  )),
  canonical_label text not null,
  normalized_label text not null,
  definition text,
  vocabulary_source text,
  source_system text,
  source_identifier text,
  source_version text,
  source_url text,
  verified_at timestamptz,
  review_status text not null default 'under-review'
    check (review_status in ('published','under-review','retired')),
  superseded_by_concept_id uuid references public.clinical_concepts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (concept_type, normalized_label),
  constraint clinical_concept_source_https check (source_url is null or source_url ~ '^https://'),
  constraint clinical_concept_normalized_label_nonempty check (btrim(normalized_label) <> '')
);

create table if not exists public.clinical_concept_aliases (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid not null references public.clinical_concepts(id) on delete cascade,
  alias_label text not null,
  normalized_alias text not null,
  alias_kind text not null default 'synonym'
    check (alias_kind in ('synonym','abbreviation','historical-term','spelling-variant','source-term','other')),
  source_system text,
  source_identifier text,
  source_version text,
  source_url text,
  verified_at timestamptz,
  review_status text not null default 'under-review'
    check (review_status in ('published','under-review','retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (concept_id, normalized_alias),
  constraint clinical_concept_alias_source_https check (source_url is null or source_url ~ '^https://'),
  constraint clinical_concept_alias_normalized_nonempty check (btrim(normalized_alias) <> '')
);

create index if not exists idx_clinical_concepts_normalized
  on public.clinical_concepts (normalized_label) where review_status = 'published';
create index if not exists idx_clinical_concept_aliases_normalized
  on public.clinical_concept_aliases (normalized_alias) where review_status = 'published';

alter table public.clinical_concepts enable row level security;
alter table public.clinical_concept_aliases enable row level security;

drop policy if exists clinical_concepts_public_read on public.clinical_concepts;
create policy clinical_concepts_public_read
  on public.clinical_concepts for select to anon, authenticated
  using (review_status = 'published');

drop policy if exists clinical_concept_aliases_public_read on public.clinical_concept_aliases;
create policy clinical_concept_aliases_public_read
  on public.clinical_concept_aliases for select to anon, authenticated
  using (
    review_status = 'published'
    and exists (
      select 1 from public.clinical_concepts c
      where c.id = clinical_concept_aliases.concept_id
        and c.review_status = 'published'
    )
  );

grant select on public.clinical_concepts to anon, authenticated;
grant select on public.clinical_concept_aliases to anon, authenticated;
grant all on public.clinical_concepts to service_role;
grant all on public.clinical_concept_aliases to service_role;

-- Backfill the already-governed condition vocabulary without changing its source truth.
insert into public.clinical_concepts (
  concept_type, canonical_label, normalized_label, definition, vocabulary_source,
  source_system, source_identifier, source_version, source_url, verified_at, review_status
)
select
  'condition', t.canonical_name, public.normalize_clinical_query(t.canonical_name), t.definition,
  t.vocabulary_source, t.source_system, t.source_identifier, t.source_version, t.source_url,
  t.verified_at,
  case when t.review_status = 'published' then 'published'
       when t.review_status = 'retired' then 'retired'
       else 'under-review' end
from public.clinical_condition_terms t
where public.normalize_clinical_query(t.canonical_name) <> ''
on conflict (concept_type, normalized_label) do update set
  canonical_label = excluded.canonical_label,
  definition = excluded.definition,
  vocabulary_source = excluded.vocabulary_source,
  source_system = excluded.source_system,
  source_identifier = excluded.source_identifier,
  source_version = excluded.source_version,
  source_url = excluded.source_url,
  verified_at = excluded.verified_at,
  review_status = excluded.review_status,
  updated_at = now();

insert into public.clinical_concept_aliases (
  concept_id, alias_label, normalized_alias, alias_kind,
  source_system, source_identifier, source_version, source_url, verified_at, review_status
)
select
  c.id,
  a.alias_label,
  public.normalize_clinical_query(a.alias_label),
  case when a.alias_label = upper(a.alias_label) and length(a.alias_label) <= 12 then 'abbreviation' else 'synonym' end,
  t.source_system,
  t.source_identifier,
  t.source_version,
  t.source_url,
  t.verified_at,
  case when t.review_status = 'published' then 'published'
       when t.review_status = 'retired' then 'retired'
       else 'under-review' end
from public.clinical_condition_terms t
join public.clinical_concepts c
  on c.concept_type = 'condition'
 and c.normalized_label = public.normalize_clinical_query(t.canonical_name)
cross join lateral unnest(t.aliases) as a(alias_label)
where public.normalize_clinical_query(a.alias_label) <> ''
on conflict (concept_id, normalized_alias) do update set
  alias_label = excluded.alias_label,
  alias_kind = excluded.alias_kind,
  source_system = excluded.source_system,
  source_identifier = excluded.source_identifier,
  source_version = excluded.source_version,
  source_url = excluded.source_url,
  verified_at = excluded.verified_at,
  review_status = excluded.review_status,
  updated_at = now();

-- Add only sourced terminology, not a clinical conclusion. Orphanet ORPHA:33069
-- records SMEI / severe myoclonic epilepsy of infancy as Dravet syndrome terminology.
insert into public.clinical_concept_aliases (
  concept_id, alias_label, normalized_alias, alias_kind,
  source_system, source_identifier, source_version, source_url, verified_at, review_status
)
select
  c.id, v.alias_label, public.normalize_clinical_query(v.alias_label), v.alias_kind,
  'Orphanet', 'ORPHA:33069', '2026-08-16',
  'https://www.orpha.net/en/disease/detail/33069', '2026-08-16T14:00:00Z', 'published'
from public.clinical_concepts c
cross join (values
  ('SMEI'::text, 'abbreviation'::text),
  ('Severe myoclonic epilepsy of infancy'::text, 'historical-term'::text)
) as v(alias_label, alias_kind)
where c.concept_type = 'condition'
  and c.normalized_label = public.normalize_clinical_query('Dravet syndrome')
on conflict (concept_id, normalized_alias) do update set
  alias_label = excluded.alias_label,
  alias_kind = excluded.alias_kind,
  source_system = excluded.source_system,
  source_identifier = excluded.source_identifier,
  source_version = excluded.source_version,
  source_url = excluded.source_url,
  verified_at = excluded.verified_at,
  review_status = excluded.review_status,
  updated_at = now();

-- Keep condition concepts synchronized with future governed condition-term updates.
create or replace function public.clinical_sync_condition_concept()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_concept_id uuid;
  v_status text;
  v_alias text;
begin
  v_status := case when new.review_status = 'published' then 'published'
                   when new.review_status = 'retired' then 'retired'
                   else 'under-review' end;

  insert into public.clinical_concepts (
    concept_type, canonical_label, normalized_label, definition, vocabulary_source,
    source_system, source_identifier, source_version, source_url, verified_at, review_status
  ) values (
    'condition', new.canonical_name, public.normalize_clinical_query(new.canonical_name),
    new.definition, new.vocabulary_source, new.source_system, new.source_identifier,
    new.source_version, new.source_url, new.verified_at, v_status
  )
  on conflict (concept_type, normalized_label) do update set
    canonical_label = excluded.canonical_label,
    definition = excluded.definition,
    vocabulary_source = excluded.vocabulary_source,
    source_system = excluded.source_system,
    source_identifier = excluded.source_identifier,
    source_version = excluded.source_version,
    source_url = excluded.source_url,
    verified_at = excluded.verified_at,
    review_status = excluded.review_status,
    updated_at = now()
  returning id into v_concept_id;

  foreach v_alias in array coalesce(new.aliases, '{}'::text[]) loop
    if public.normalize_clinical_query(v_alias) <> '' then
      insert into public.clinical_concept_aliases (
        concept_id, alias_label, normalized_alias, alias_kind,
        source_system, source_identifier, source_version, source_url, verified_at, review_status
      ) values (
        v_concept_id, v_alias, public.normalize_clinical_query(v_alias),
        case when v_alias = upper(v_alias) and length(v_alias) <= 12 then 'abbreviation' else 'synonym' end,
        new.source_system, new.source_identifier, new.source_version, new.source_url,
        new.verified_at, v_status
      )
      on conflict (concept_id, normalized_alias) do update set
        alias_label = excluded.alias_label,
        alias_kind = excluded.alias_kind,
        source_system = excluded.source_system,
        source_identifier = excluded.source_identifier,
        source_version = excluded.source_version,
        source_url = excluded.source_url,
        verified_at = excluded.verified_at,
        review_status = excluded.review_status,
        updated_at = now();
    end if;
  end loop;

  return new;
end;
$function$;

revoke all on function public.clinical_sync_condition_concept() from public;
drop trigger if exists trg_clinical_sync_condition_concept on public.clinical_condition_terms;
create trigger trg_clinical_sync_condition_concept
after insert or update of canonical_name, aliases, definition, vocabulary_source, source_system,
  source_identifier, source_version, source_url, verified_at, review_status
on public.clinical_condition_terms
for each row execute function public.clinical_sync_condition_concept();

-- ---------------------------------------------------------------------------
-- Evidence-to-concept graph.
-- ---------------------------------------------------------------------------
create table if not exists public.clinical_evidence_concept_links (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid not null references public.clinical_concepts(id) on delete cascade,
  evidence_record_id uuid not null references public.clinical_evidence_records(id) on delete cascade,
  relationship text not null check (relationship in (
    'condition','indication','intervention','formulation','outcome','safety','guideline','context','other'
  )),
  applicability text,
  review_status text not null default 'under-review'
    check (review_status in ('published','under-review','retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (concept_id, evidence_record_id, relationship)
);

alter table public.clinical_evidence_concept_links enable row level security;
drop policy if exists clinical_evidence_concept_links_public_read on public.clinical_evidence_concept_links;
create policy clinical_evidence_concept_links_public_read
  on public.clinical_evidence_concept_links for select to anon, authenticated
  using (
    review_status = 'published'
    and exists (select 1 from public.clinical_concepts c where c.id = concept_id and c.review_status = 'published')
    and exists (select 1 from public.clinical_evidence_records r where r.id = evidence_record_id and r.review_status = 'published')
  );
grant select on public.clinical_evidence_concept_links to anon, authenticated;
grant all on public.clinical_evidence_concept_links to service_role;

insert into public.clinical_evidence_concept_links (
  concept_id, evidence_record_id, relationship, applicability, review_status
)
select
  c.id,
  r.id,
  'condition',
  l.applicability,
  case when r.review_status = 'published' and t.review_status = 'published' then 'published' else 'under-review' end
from public.clinical_evidence_records r
join public.clinical_condition_terms t on t.id = r.condition_term_id
join public.clinical_concepts c
  on c.concept_type = 'condition'
 and c.normalized_label = public.normalize_clinical_query(t.canonical_name)
left join public.clinical_condition_evidence_links l
  on l.condition_term_id = t.id and l.evidence_record_id = r.id
on conflict (concept_id, evidence_record_id, relationship) do update set
  applicability = coalesce(excluded.applicability, clinical_evidence_concept_links.applicability),
  review_status = excluded.review_status,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Publication-family / independent-study normalization.
-- No family rows are inferred or seeded by this migration.
-- ---------------------------------------------------------------------------
create table if not exists public.clinical_study_families (
  id uuid primary key default gen_random_uuid(),
  family_key text not null unique,
  family_kind text not null check (family_kind in (
    'randomized-trial','controlled-study','observational-cohort','case-series','systematic-review',
    'meta-analysis','guideline','regulatory-dossier','other'
  )),
  title text not null,
  trial_registry_id text,
  protocol_id text,
  cohort_fingerprint text,
  counts_as_independent_study boolean not null default false,
  normalization_rationale text not null,
  review_status text not null default 'under-review'
    check (review_status in ('published','under-review','retired')),
  verified_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinical_evidence_study_family_links (
  id uuid primary key default gen_random_uuid(),
  study_family_id uuid not null references public.clinical_study_families(id) on delete cascade,
  evidence_record_id uuid not null references public.clinical_evidence_records(id) on delete cascade,
  publication_role text not null check (publication_role in (
    'primary-report','secondary-analysis','follow-up','extension','abstract','registry','regulatory-summary','other'
  )),
  is_primary_report boolean not null default false,
  overlap_note text,
  review_status text not null default 'under-review'
    check (review_status in ('published','under-review','retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (study_family_id, evidence_record_id)
);

alter table public.clinical_study_families enable row level security;
alter table public.clinical_evidence_study_family_links enable row level security;

drop policy if exists clinical_study_families_public_read on public.clinical_study_families;
create policy clinical_study_families_public_read
  on public.clinical_study_families for select to anon, authenticated
  using (review_status = 'published');

drop policy if exists clinical_evidence_study_family_links_public_read on public.clinical_evidence_study_family_links;
create policy clinical_evidence_study_family_links_public_read
  on public.clinical_evidence_study_family_links for select to anon, authenticated
  using (
    review_status = 'published'
    and exists (select 1 from public.clinical_study_families f where f.id = study_family_id and f.review_status = 'published')
    and exists (select 1 from public.clinical_evidence_records r where r.id = evidence_record_id and r.review_status = 'published')
  );

grant select on public.clinical_study_families to anon, authenticated;
grant select on public.clinical_evidence_study_family_links to anon, authenticated;
grant all on public.clinical_study_families to service_role;
grant all on public.clinical_evidence_study_family_links to service_role;

-- ---------------------------------------------------------------------------
-- Claim-level provenance anchored to immutable source snapshots and locators.
-- No claim rows are inferred or seeded by this migration.
-- ---------------------------------------------------------------------------
create table if not exists public.clinical_evidence_claims (
  id uuid primary key default gen_random_uuid(),
  evidence_record_id uuid not null references public.clinical_evidence_records(id) on delete cascade,
  claim_key text not null,
  claim_kind text not null check (claim_kind in (
    'indication','efficacy','safety','tolerability','interaction','monitoring','regulatory','limitation','other'
  )),
  claim_origin text not null default 'source-extraction'
    check (claim_origin in ('source-extraction','clinical-synthesis')),
  statement text not null,
  outcome_link_id uuid references public.clinical_evidence_outcome_links(id) on delete set null,
  extraction_id uuid references public.clinical_evidence_extractions(id) on delete set null,
  source_snapshot_id uuid references public.clinical_evidence_source_snapshots(id) on delete restrict,
  source_locator text,
  review_id uuid references public.clinical_evidence_reviews(id) on delete restrict,
  review_status text not null default 'under-review'
    check (review_status in ('published','under-review','retired')),
  verified_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (evidence_record_id, claim_key),
  constraint clinical_evidence_claim_statement_nonempty check (btrim(statement) <> '')
);

create or replace function public.clinical_require_claim_provenance()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.review_status = 'published' then
    if new.source_snapshot_id is null or btrim(coalesce(new.source_locator, '')) = '' then
      raise exception 'published Clinical claim requires immutable source snapshot and source locator';
    end if;
    if not exists (
      select 1 from public.clinical_evidence_records r
      where r.id = new.evidence_record_id and r.review_status = 'published'
    ) then
      raise exception 'published Clinical claim requires a published evidence record';
    end if;
    if new.claim_origin = 'clinical-synthesis' then
      if new.review_id is null or not exists (
        select 1 from public.clinical_evidence_reviews r
        where r.id = new.review_id
          and r.evidence_record_id = new.evidence_record_id
          and r.decision = 'approved'
          and r.review_type in ('clinical','methodology')
      ) then
        raise exception 'published Clinical synthesis claim requires an approved clinical or methodology review';
      end if;
    end if;
  end if;
  return new;
end;
$function$;

revoke all on function public.clinical_require_claim_provenance() from public;
drop trigger if exists trg_clinical_require_claim_provenance on public.clinical_evidence_claims;
create trigger trg_clinical_require_claim_provenance
before insert or update of review_status, source_snapshot_id, source_locator, claim_origin, review_id
on public.clinical_evidence_claims
for each row execute function public.clinical_require_claim_provenance();

alter table public.clinical_evidence_claims enable row level security;
drop policy if exists clinical_evidence_claims_public_read on public.clinical_evidence_claims;
create policy clinical_evidence_claims_public_read
  on public.clinical_evidence_claims for select to anon, authenticated
  using (
    review_status = 'published'
    and exists (select 1 from public.clinical_evidence_records r where r.id = evidence_record_id and r.review_status = 'published')
  );
grant select on public.clinical_evidence_claims to anon, authenticated;
grant all on public.clinical_evidence_claims to service_role;

-- ---------------------------------------------------------------------------
-- Defense-in-depth evidence eligibility.
-- Published stale/superseded records remain inspectable; withdrawn primary sources do not.
-- ---------------------------------------------------------------------------
create or replace function public.clinical_evidence_record_is_eligible(p_record_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $function$
  select exists (
    select 1
    from public.clinical_evidence_records r
    left join public.clinical_evidence_sources s on s.id = r.primary_source_registry_id
    where r.id = p_record_id
      and r.review_status = 'published'
      and (s.id is null or s.currentness <> 'withdrawn')
  );
$function$;

revoke all on function public.clinical_evidence_record_is_eligible(uuid) from public;
grant execute on function public.clinical_evidence_record_is_eligible(uuid) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Deterministic concept resolver. No model/vector inference participates in ranking.
-- ---------------------------------------------------------------------------
create or replace function public.resolve_clinical_query(
  p_query text,
  p_limit integer default 12
)
returns table (
  concept_id uuid,
  concept_type text,
  canonical_label text,
  matched_label text,
  match_kind text,
  match_rank integer,
  aliases text[]
)
language sql
stable
security invoker
set search_path = public
as $function$
  with q as (
    select public.normalize_clinical_query(p_query) as normalized
  ), candidates as (
    select
      c.id as concept_id,
      c.concept_type,
      c.canonical_label,
      c.canonical_label as matched_label,
      case
        when c.normalized_label = q.normalized then 'exact-canonical'
        when length(q.normalized) >= 2 and c.normalized_label like q.normalized || '%' then 'prefix-canonical'
        else 'contains-canonical'
      end as match_kind,
      case
        when c.normalized_label = q.normalized then 0
        when length(q.normalized) >= 2 and c.normalized_label like q.normalized || '%' then 2
        else 4
      end as match_rank
    from public.clinical_concepts c cross join q
    where c.review_status = 'published'
      and q.normalized <> ''
      and (
        c.normalized_label = q.normalized
        or (length(q.normalized) >= 2 and c.normalized_label like q.normalized || '%')
        or (length(q.normalized) >= 4 and c.normalized_label like '%' || q.normalized || '%')
      )
    union all
    select
      c.id,
      c.concept_type,
      c.canonical_label,
      a.alias_label,
      case
        when a.normalized_alias = q.normalized then 'exact-alias'
        when length(q.normalized) >= 2 and a.normalized_alias like q.normalized || '%' then 'prefix-alias'
        else 'contains-alias'
      end,
      case
        when a.normalized_alias = q.normalized then 1
        when length(q.normalized) >= 2 and a.normalized_alias like q.normalized || '%' then 3
        else 5
      end
    from public.clinical_concept_aliases a
    join public.clinical_concepts c on c.id = a.concept_id
    cross join q
    where c.review_status = 'published'
      and a.review_status = 'published'
      and q.normalized <> ''
      and (
        a.normalized_alias = q.normalized
        or (length(q.normalized) >= 2 and a.normalized_alias like q.normalized || '%')
        or (length(q.normalized) >= 4 and a.normalized_alias like '%' || q.normalized || '%')
      )
  ), best as (
    select distinct on (x.concept_id)
      x.concept_id, x.concept_type, x.canonical_label, x.matched_label, x.match_kind, x.match_rank
    from candidates x
    order by x.concept_id, x.match_rank, length(x.matched_label), x.matched_label
  )
  select
    b.concept_id,
    b.concept_type,
    b.canonical_label,
    b.matched_label,
    b.match_kind,
    b.match_rank,
    coalesce((
      select array_agg(a.alias_label order by a.alias_label)
      from public.clinical_concept_aliases a
      where a.concept_id = b.concept_id and a.review_status = 'published'
    ), '{}'::text[]) as aliases
  from best b
  order by b.match_rank, b.canonical_label, b.concept_id
  limit least(greatest(coalesce(p_limit, 12), 1), 50);
$function$;

revoke all on function public.resolve_clinical_query(text,integer) from public;
grant execute on function public.resolve_clinical_query(text,integer) to anon, authenticated, service_role;

-- Replace the P0 text-only search with deterministic concept expansion while retaining
-- direct field matching and the existing RPC signature used by the application.
create or replace function public.search_clinical_evidence_records(
  p_query text default '',
  p_jurisdiction text default null,
  p_limit integer default 20
)
returns setof public.clinical_evidence_records
language sql
stable
security invoker
set search_path = public
as $function$
  with q as (
    select public.normalize_clinical_query(p_query) as normalized
  ), resolved as (
    select * from public.resolve_clinical_query(p_query, 50)
  )
  select r.*
  from public.clinical_evidence_records r cross join q
  where public.clinical_evidence_record_is_eligible(r.id)
    and (p_jurisdiction is null or p_jurisdiction = any(r.jurisdictions) or 'Global' = any(r.jurisdictions))
    and (
      q.normalized = ''
      or exists (
        select 1
        from public.clinical_evidence_concept_links l
        join resolved rc on rc.concept_id = l.concept_id
        where l.evidence_record_id = r.id and l.review_status = 'published'
      )
      or exists (
        select 1
        from public.clinical_condition_terms t
        join resolved rc
          on rc.concept_type = 'condition'
         and rc.canonical_label = t.canonical_name
        where t.id = r.condition_term_id and t.review_status = 'published'
      )
      or public.normalize_clinical_query(coalesce(r.condition_label, '')) like '%' || q.normalized || '%'
      or exists (select 1 from unnest(r.condition_aliases) a where public.normalize_clinical_query(a) like '%' || q.normalized || '%')
      or public.normalize_clinical_query(r.title) like '%' || q.normalized || '%'
      or public.normalize_clinical_query(r.summary) like '%' || q.normalized || '%'
      or public.normalize_clinical_query(coalesce(r.population, '')) like '%' || q.normalized || '%'
      or public.normalize_clinical_query(coalesce(r.intervention, '')) like '%' || q.normalized || '%'
      or public.normalize_clinical_query(coalesce(r.formulation, '')) like '%' || q.normalized || '%'
      or exists (select 1 from unnest(r.cannabinoids) c where public.normalize_clinical_query(c) like '%' || q.normalized || '%')
      or public.normalize_clinical_query(coalesce(r.outcome, '')) like '%' || q.normalized || '%'
    )
  order by
    case
      when q.normalized = '' then 0
      else coalesce((
        select min(rc.match_rank)
        from resolved rc
        where exists (
          select 1 from public.clinical_evidence_concept_links l
          where l.evidence_record_id = r.id
            and l.concept_id = rc.concept_id
            and l.review_status = 'published'
        )
        or exists (
          select 1 from public.clinical_condition_terms t
          where t.id = r.condition_term_id
            and t.review_status = 'published'
            and rc.concept_type = 'condition'
            and rc.canonical_label = t.canonical_name
        )
      ), 20)
    end,
    case when r.supersession_state = 'current' then 0 else 1 end,
    case when coalesce(r.freshness_status, 'current') = 'current' then 0 else 1 end,
    r.verified_at desc,
    r.id
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$function$;

create or replace function public.clinical_condition_term_known(p_query text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $function$
  select exists (
    select 1 from public.resolve_clinical_query(p_query, 12) r
    where r.concept_type = 'condition'
  );
$function$;

revoke all on function public.search_clinical_evidence_records(text,text,integer) from public;
revoke all on function public.clinical_condition_term_known(text) from public;
grant execute on function public.search_clinical_evidence_records(text,text,integer) to anon, authenticated, service_role;
grant execute on function public.clinical_condition_term_known(text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Safe public projections for claims, publication families and corpus coverage.
-- ---------------------------------------------------------------------------
create or replace function public.clinical_evidence_claims_for_records(p_record_ids uuid[])
returns table (
  id uuid,
  evidence_record_id uuid,
  claim_key text,
  claim_kind text,
  claim_origin text,
  statement text,
  source_snapshot_id uuid,
  source_locator text,
  verified_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $function$
  select c.id, c.evidence_record_id, c.claim_key, c.claim_kind, c.claim_origin,
         c.statement, c.source_snapshot_id, c.source_locator, c.verified_at
  from public.clinical_evidence_claims c
  where c.review_status = 'published'
    and c.evidence_record_id = any(coalesce(p_record_ids, '{}'::uuid[]))
    and public.clinical_evidence_record_is_eligible(c.evidence_record_id)
  order by c.evidence_record_id, c.claim_key, c.id;
$function$;

create or replace function public.clinical_evidence_study_families_for_records(p_record_ids uuid[])
returns table (
  evidence_record_id uuid,
  family_key text,
  family_kind text,
  title text,
  trial_registry_id text,
  protocol_id text,
  counts_as_independent_study boolean,
  publication_role text,
  is_primary_report boolean,
  overlap_note text,
  verified_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $function$
  select l.evidence_record_id, f.family_key, f.family_kind, f.title,
         f.trial_registry_id, f.protocol_id, f.counts_as_independent_study,
         l.publication_role, l.is_primary_report, l.overlap_note, f.verified_at
  from public.clinical_evidence_study_family_links l
  join public.clinical_study_families f on f.id = l.study_family_id
  where l.review_status = 'published'
    and f.review_status = 'published'
    and l.evidence_record_id = any(coalesce(p_record_ids, '{}'::uuid[]))
    and public.clinical_evidence_record_is_eligible(l.evidence_record_id)
  order by l.evidence_record_id, f.family_key, l.publication_role;
$function$;

create or replace function public.clinical_evidence_corpus_profile(p_jurisdiction text default null)
returns table (
  record_count bigint,
  current_record_count bigint,
  graded_record_count bigint,
  condition_count bigint,
  concept_count bigint,
  source_count bigint,
  independent_study_count bigint,
  study_family_count bigint,
  claim_count bigint,
  claim_anchored_record_count bigint,
  last_verified_at timestamptz,
  grading_method_key text,
  grading_method_version text,
  grading_method_title text
)
language sql
stable
security invoker
set search_path = public
as $function$
  with eligible as (
    select r.*
    from public.clinical_evidence_records r
    where public.clinical_evidence_record_is_eligible(r.id)
      and (p_jurisdiction is null or p_jurisdiction = any(r.jurisdictions) or 'Global' = any(r.jurisdictions))
  ), family_scope as (
    select distinct f.id, f.counts_as_independent_study
    from eligible e
    join public.clinical_evidence_study_family_links l
      on l.evidence_record_id = e.id and l.review_status = 'published'
    join public.clinical_study_families f
      on f.id = l.study_family_id and f.review_status = 'published'
  ), claim_scope as (
    select c.*
    from public.clinical_evidence_claims c
    join eligible e on e.id = c.evidence_record_id
    where c.review_status = 'published'
  ), method as (
    select m.method_key, m.version, m.title
    from public.clinical_evidence_grading_methods m
    where m.retired_at is null
    order by m.effective_at desc, m.method_key
    limit 1
  )
  select
    (select count(*) from eligible),
    (select count(*) from eligible where supersession_state = 'current' and coalesce(freshness_status, 'current') = 'current'),
    (select count(*) from eligible where evidence_strength in ('high','moderate','low','very-low')),
    (select count(distinct condition_term_id) from eligible where condition_term_id is not null),
    (select count(*) from public.clinical_concepts where review_status = 'published'),
    (select count(distinct primary_source_registry_id) from eligible where primary_source_registry_id is not null),
    (select count(*) from family_scope where counts_as_independent_study),
    (select count(*) from family_scope),
    (select count(*) from claim_scope),
    (select count(distinct evidence_record_id) from claim_scope),
    (select max(verified_at) from eligible),
    (select method_key from method),
    (select version from method),
    (select title from method);
$function$;

revoke all on function public.clinical_evidence_claims_for_records(uuid[]) from public;
revoke all on function public.clinical_evidence_study_families_for_records(uuid[]) from public;
revoke all on function public.clinical_evidence_corpus_profile(text) from public;
grant execute on function public.clinical_evidence_claims_for_records(uuid[]) to anon, authenticated, service_role;
grant execute on function public.clinical_evidence_study_families_for_records(uuid[]) to anon, authenticated, service_role;
grant execute on function public.clinical_evidence_corpus_profile(text) to anon, authenticated, service_role;

comment on table public.clinical_concepts is
  'Governed canonical Clinical concepts. Matching expands deterministic reviewed terminology only; it does not infer a clinical conclusion.';
comment on table public.clinical_study_families is
  'Reviewed normalization of multiple publications to an underlying study/cohort/review family. Empty until independently verified; no publication is assumed independent by default.';
comment on table public.clinical_evidence_claims is
  'Published claim-level Clinical projections. Every published claim must remain anchored to an immutable source snapshot and exact source locator.';
comment on function public.resolve_clinical_query(text,integer) is
  'Deterministic governed concept resolver ranked exact canonical, exact alias, prefix canonical, prefix alias, then longer contains matches.';
comment on function public.search_clinical_evidence_records(text,text,integer) is
  'RLS-preserving governed evidence search with deterministic concept expansion, publication eligibility, jurisdiction/global matching, and no model-generated clinical inference.';
