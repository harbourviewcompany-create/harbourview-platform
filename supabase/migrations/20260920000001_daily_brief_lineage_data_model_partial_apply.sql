-- Safe subset of 20260815204500 + 20260815234000, applied 2026-09-20.
-- Excludes both files' run_daily_digest() changes: the live function has
-- evolved past what those files' patches target (verified: patch anchors
-- from 20260815234000 do not match current pg_get_functiondef output).
-- Lineage DATA MODEL is applied and ready; lineage-aware GATING inside
-- run_daily_digest() is NOT wired in and needs a manual rebase.

create table if not exists public.digest_event_lineage (
  event_key text primary key,
  root_event_key text not null,
  latest_signal_id text references public.signals(id) on delete set null,
  prior_event_key text null,
  jurisdiction text not null default 'Global',
  entities jsonb not null default '[]'::jsonb,
  priority_domain text not null default 'other',
  verified_facts jsonb not null default '[]'::jsonb,
  inferences jsonb not null default '[]'::jsonb,
  competitive_position_change boolean not null default false,
  competitive_position_detail text null,
  latest_advancement_reason text null,
  first_presented_on date not null default current_date,
  last_presented_on date not null default current_date,
  presentation_count integer not null default 1 check (presentation_count > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint digest_event_lineage_priority_domain_check check (
    priority_domain in (
      'global_medical', 'import_export_eu_gmp', 'm_and_a', 'licensing_regulatory',
      'commercial_distribution', 'genetics', 'formulations',
      'pharmaceutical_cannabinoid_technology', 'other'
    )
  )
);

create table if not exists public.digest_candidate_assessments (
  id bigint generated always as identity primary key,
  digest_date date not null,
  signal_id text not null references public.signals(id) on delete cascade,
  event_key text not null,
  prior_event_key text null,
  delta_status text not null,
  advancement_reason text null,
  jurisdiction text not null default 'Global',
  entities jsonb not null default '[]'::jsonb,
  priority_domain text not null default 'other',
  verified_facts jsonb not null default '[]'::jsonb,
  inferences jsonb not null default '[]'::jsonb,
  competitive_position_change boolean not null default false,
  competitive_position_detail text null,
  include_in_edition boolean not null default false,
  assessed_at timestamptz not null default now(),
  constraint digest_candidate_assessments_delta_status_check check (
    delta_status in ('new_event', 'material_advancement', 'unchanged_duplicate')
  ),
  constraint digest_candidate_assessments_priority_domain_check check (
    priority_domain in (
      'global_medical', 'import_export_eu_gmp', 'm_and_a', 'licensing_regulatory',
      'commercial_distribution', 'genetics', 'formulations',
      'pharmaceutical_cannabinoid_technology', 'other'
    )
  ),
  constraint digest_candidate_assessments_unique_signal_day unique (digest_date, signal_id)
);

create table if not exists public.digest_presentation_history (
  id bigint generated always as identity primary key,
  digest_date date not null,
  signal_id text not null references public.signals(id) on delete restrict,
  event_key text not null,
  prior_event_key text null,
  delta_status text not null,
  advancement_reason text null,
  headline text not null,
  why_it_matters text not null,
  jurisdiction text not null default 'Global',
  entities jsonb not null default '[]'::jsonb,
  priority_domain text not null default 'other',
  verified_facts jsonb not null default '[]'::jsonb,
  inferences jsonb not null default '[]'::jsonb,
  competitive_position_change boolean not null default false,
  competitive_position_detail text null,
  presented_at timestamptz not null default now(),
  constraint digest_presentation_history_delta_status_check check (
    delta_status in ('new_event', 'material_advancement')
  ),
  constraint digest_presentation_history_one_event_per_edition unique (digest_date, event_key)
);

create index if not exists idx_digest_candidate_assessments_signal
  on public.digest_candidate_assessments(signal_id, assessed_at desc);
create index if not exists idx_digest_candidate_assessments_event
  on public.digest_candidate_assessments(event_key, assessed_at desc);
create index if not exists idx_digest_presentation_history_event
  on public.digest_presentation_history(event_key, digest_date desc);
create index if not exists idx_digest_presentation_history_domain
  on public.digest_presentation_history(priority_domain, digest_date desc);

comment on table public.digest_event_lineage is
  'Private cross-edition event registry for Daily Brief novelty/material-advancement decisions.';
comment on table public.digest_candidate_assessments is
  'Private per-candidate Daily Brief delta classification. Underlying source signals remain unchanged.';
comment on table public.digest_presentation_history is
  'Private immutable-style record of events actually presented in each Daily Brief edition. NOTE: run_daily_digest() does not yet write to this table -- see migration comment.';

alter table public.digest_event_lineage enable row level security;
alter table public.digest_candidate_assessments enable row level security;
alter table public.digest_presentation_history enable row level security;

revoke all on table public.digest_event_lineage from anon, authenticated;
revoke all on table public.digest_candidate_assessments from anon, authenticated;
revoke all on table public.digest_presentation_history from anon, authenticated;
grant all on table public.digest_event_lineage to service_role;
grant all on table public.digest_candidate_assessments to service_role;
grant all on table public.digest_presentation_history to service_role;

create or replace function public._digest_priority_domain(p_title text, p_summary text)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when lower(coalesce(p_title,'') || ' ' || coalesce(p_summary,'')) ~
      '(eu[- ]?gmp|good manufacturing practice|import permit|export permit|importer|exporter|cross-border|market access)'
      then 'import_export_eu_gmp'
    when lower(coalesce(p_title,'') || ' ' || coalesce(p_summary,'')) ~
      '(acquir|takeover|merger|m&a|strategic transaction|buyout|bid for)'
      then 'm_and_a'
    when lower(coalesce(p_title,'') || ' ' || coalesce(p_summary,'')) ~
      '(licen[cs]|regulat|gazette|rulemaking|reschedul|permit|authorization)'
      then 'licensing_regulatory'
    when lower(coalesce(p_title,'') || ' ' || coalesce(p_summary,'')) ~
      '(medical cannabis|medical marijuana|patient access|prescrib|pharmac|clinic)'
      then 'global_medical'
    when lower(coalesce(p_title,'') || ' ' || coalesce(p_summary,'')) ~
      '(distribution|wholesale|dispensar|retail channel|direct-to-consumer|showcase|marketplace)'
      then 'commercial_distribution'
    when lower(coalesce(p_title,'') || ' ' || coalesce(p_summary,'')) ~
      '(genetic|genomic|allele|cultivar|breeding|thcas|cbdas|germplasm)'
      then 'genetics'
    when lower(coalesce(p_title,'') || ' ' || coalesce(p_summary,'')) ~
      '(formulation|delivery system|rapid[- ]?onset|soft chew|capsule|pharmacokinetic)'
      then 'formulations'
    when lower(coalesce(p_title,'') || ' ' || coalesce(p_summary,'')) ~
      '(pharmaceutical cannabinoid|drug delivery|clinical-stage cannabinoid|cannabinoid medicine|nabiximols|cannabidiol drug)'
      then 'pharmaceutical_cannabinoid_technology'
    else 'other'
  end;
$$;

create or replace function public._digest_priority_weight(p_domain text)
returns integer
language sql
immutable
set search_path = public
as $$
  select case p_domain
    when 'import_export_eu_gmp' then 24
    when 'm_and_a' then 22
    when 'global_medical' then 20
    when 'licensing_regulatory' then 18
    when 'pharmaceutical_cannabinoid_technology' then 18
    when 'commercial_distribution' then 15
    when 'formulations' then 15
    when 'genetics' then 14
    else 0
  end;
$$;

revoke all on function public._digest_priority_domain(text,text) from public, anon, authenticated;
revoke all on function public._digest_priority_weight(text) from public, anon, authenticated;
grant execute on function public._digest_priority_domain(text,text) to service_role;
grant execute on function public._digest_priority_weight(text) to service_role;

create or replace function public._digest_candidate_lineage_context(p_event_key_hint text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_build_object(
        'event_key', l.event_key,
        'root_event_key', l.root_event_key,
        'prior_event_key', l.prior_event_key,
        'jurisdiction', l.jurisdiction,
        'entities', l.entities,
        'priority_domain', l.priority_domain,
        'verified_facts', l.verified_facts,
        'inferences', l.inferences,
        'competitive_position_change', l.competitive_position_change,
        'competitive_position_detail', l.competitive_position_detail,
        'latest_advancement_reason', l.latest_advancement_reason,
        'first_presented_on', l.first_presented_on,
        'last_presented_on', l.last_presented_on,
        'presentation_count', l.presentation_count
      )
      from public.digest_event_lineage l
      where l.event_key = p_event_key_hint
         or l.root_event_key = p_event_key_hint
      order by
        (l.event_key = p_event_key_hint) desc,
        l.last_presented_on desc,
        l.event_key
      limit 1
    ),
    'null'::jsonb
  );
$$;

revoke all on function public._digest_candidate_lineage_context(text) from public, anon, authenticated;
grant execute on function public._digest_candidate_lineage_context(text) to service_role;

comment on function public._digest_candidate_lineage_context(text) is
  'Bounded candidate-specific lookup into persistent Daily Brief event lineage; returns JSON null when no canonical lineage exists. NOTE: run_daily_digest() does not yet call this -- see migration comment.';

-- Historical backfill from 20260815213000_daily_brief_delta_history_backfill.sql,
-- applied unmodified in the same session (pure inserts, no function conflicts):
with legacy_cards as (
  select d.digest_date, h.item
  from public.daily_digest d
  cross join lateral jsonb_array_elements(coalesce(d.headlines, '[]'::jsonb)) h(item)
  where d.status = 'published'
    and jsonb_typeof(h.item) = 'object'
    and nullif(h.item->>'signal_id', '') is not null
),
resolved as (
  select
    l.digest_date, s.id as signal_id,
    coalesce(link.canonical_signal_id, s.cluster_rep_id, s.id) as event_key,
    left(coalesce(nullif(l.item->>'headline', ''), nullif(s.title_en, ''), s.headline, 'Untitled'), 110) as headline,
    coalesce(l.item->>'why_it_matters', '') as why_it_matters,
    coalesce(nullif(l.item->>'jurisdiction', ''), nullif(l.item->>'market', ''), nullif(s.country, ''), 'Global') as jurisdiction,
    case when jsonb_typeof(l.item->'entities') = 'array' then l.item->'entities' else '[]'::jsonb end as entities,
    case
      when l.item->>'priority_domain' in (
        'global_medical','import_export_eu_gmp','m_and_a','licensing_regulatory',
        'commercial_distribution','genetics','formulations','pharmaceutical_cannabinoid_technology','other'
      ) then l.item->>'priority_domain'
      else public._digest_priority_domain(
        coalesce(nullif(l.item->>'headline', ''), nullif(s.title_en, ''), s.headline),
        coalesce(nullif(s.summary_en, ''), nullif(s.summary, ''), l.item->>'why_it_matters')
      )
    end as priority_domain,
    case when jsonb_typeof(l.item->'verified_facts') = 'array' then l.item->'verified_facts' else '[]'::jsonb end as verified_facts,
    case when jsonb_typeof(l.item->'inferences') = 'array' then l.item->'inferences' else '[]'::jsonb end as inferences,
    lower(coalesce(l.item->>'competitive_position_change', 'false')) = 'true' as competitive_position_change,
    nullif(l.item->>'competitive_position_detail', '') as competitive_position_detail
  from legacy_cards l
  join public.signals s on s.id = l.item->>'signal_id'
  left join public.signal_digest_canonical_links link on link.duplicate_signal_id = s.id
),
ranked as (
  select r.*, row_number() over (partition by r.digest_date, r.event_key order by r.signal_id) as event_rn
  from resolved r
)
insert into public.digest_presentation_history (
  digest_date, signal_id, event_key, prior_event_key, delta_status, advancement_reason,
  headline, why_it_matters, jurisdiction, entities, priority_domain, verified_facts,
  inferences, competitive_position_change, competitive_position_detail
)
select
  r.digest_date, r.signal_id, r.event_key, null, 'new_event',
  'Historical presentation seeded from a previously published source-backed Daily Brief card.',
  r.headline, r.why_it_matters, r.jurisdiction, r.entities, r.priority_domain, r.verified_facts,
  r.inferences, r.competitive_position_change, r.competitive_position_detail
from ranked r
where r.event_rn = 1
on conflict (digest_date, event_key) do nothing;

with history_ranked as (
  select p.*, min(p.digest_date) over (partition by p.event_key) as first_date,
    max(p.digest_date) over (partition by p.event_key) as last_date,
    count(*) over (partition by p.event_key)::integer as presentation_total,
    row_number() over (partition by p.event_key order by p.digest_date desc, p.id desc) as latest_rn
  from public.digest_presentation_history p
)
insert into public.digest_event_lineage (
  event_key, root_event_key, latest_signal_id, prior_event_key, jurisdiction, entities,
  priority_domain, verified_facts, inferences, competitive_position_change,
  competitive_position_detail, latest_advancement_reason, first_presented_on,
  last_presented_on, presentation_count
)
select
  h.event_key, h.event_key, h.signal_id, null, h.jurisdiction, h.entities, h.priority_domain,
  h.verified_facts, h.inferences, h.competitive_position_change, h.competitive_position_detail,
  h.advancement_reason, h.first_date, h.last_date, h.presentation_total
from history_ranked h
where h.latest_rn = 1
on conflict (event_key) do update set
  latest_signal_id = excluded.latest_signal_id, jurisdiction = excluded.jurisdiction,
  entities = excluded.entities, priority_domain = excluded.priority_domain,
  verified_facts = excluded.verified_facts, inferences = excluded.inferences,
  competitive_position_change = excluded.competitive_position_change,
  competitive_position_detail = excluded.competitive_position_detail,
  first_presented_on = least(public.digest_event_lineage.first_presented_on, excluded.first_presented_on),
  last_presented_on = greatest(public.digest_event_lineage.last_presented_on, excluded.last_presented_on),
  presentation_count = greatest(public.digest_event_lineage.presentation_count, excluded.presentation_count),
  updated_at = now();
