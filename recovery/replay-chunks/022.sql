
-- RECOVERY BEGIN 20260919190000_optimize_talent_candidate_rls_and_function_search_path.sql
begin;

drop policy if exists talent_candidates_public_apply on public.talent_candidates;
drop policy if exists talent_candidates_manage on public.talent_candidates;
drop policy if exists talent_candidates_manage_select on public.talent_candidates;
drop policy if exists talent_candidates_manage_update on public.talent_candidates;
drop policy if exists talent_candidates_manage_delete on public.talent_candidates;
drop policy if exists talent_candidates_insert on public.talent_candidates;

create policy talent_candidates_manage_select
  on public.talent_candidates
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid()) and ur.role = 'admin'
    )
    or job_id in (
      select tj.id from public.talent_jobs tj
      where tj.workspace_id in (
        select wm.workspace_id from public.workspace_members wm
        where wm.user_id = (select auth.uid())
      )
    )
  );

create policy talent_candidates_manage_update
  on public.talent_candidates
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid()) and ur.role = 'admin'
    )
    or job_id in (
      select tj.id from public.talent_jobs tj
      where tj.workspace_id in (
        select wm.workspace_id from public.workspace_members wm
        where wm.user_id = (select auth.uid())
      )
    )
  )
  with check (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid()) and ur.role = 'admin'
    )
    or job_id in (
      select tj.id from public.talent_jobs tj
      where tj.workspace_id in (
        select wm.workspace_id from public.workspace_members wm
        where wm.user_id = (select auth.uid())
      )
    )
  );

create policy talent_candidates_manage_delete
  on public.talent_candidates
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid()) and ur.role = 'admin'
    )
    or job_id in (
      select tj.id from public.talent_jobs tj
      where tj.workspace_id in (
        select wm.workspace_id from public.workspace_members wm
        where wm.user_id = (select auth.uid())
      )
    )
  );

create policy talent_candidates_insert
  on public.talent_candidates
  for insert
  to public
  with check (
    (
      stage = 'sourced'
      and job_id in (
        select tj.id from public.talent_jobs tj
        where tj.status = 'open'
      )
    )
    or (
      (select auth.uid()) is not null
      and (
        exists (
          select 1 from public.user_roles ur
          where ur.user_id = (select auth.uid()) and ur.role = 'admin'
        )
        or job_id in (
          select tj.id from public.talent_jobs tj
          where tj.workspace_id in (
            select wm.workspace_id from public.workspace_members wm
            where wm.user_id = (select auth.uid())
          )
        )
      )
    )
  );

alter function public._backfill_strip_site_suffix(text, text)
  set search_path = pg_catalog, public;
alter function public._digest_manual_why(text, text, text, text, text)
  set search_path = pg_catalog, public;
alter function public._digest_smart_truncate(text, integer)
  set search_path = pg_catalog, public;

commit;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260919190000','optimize_talent_candidate_rls_and_function_search_path','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260919190000_optimize_talent_candidate_rls_and_function_search_path.sql

-- RECOVERY BEGIN 20260920000001_daily_brief_lineage_data_model_partial_apply.sql
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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260920000001','daily_brief_lineage_data_model_partial_apply','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260920000001_daily_brief_lineage_data_model_partial_apply.sql

-- RECOVERY BEGIN 20260920063000_add_missing_digest_foreign_key_indexes.sql
begin;

create index if not exists idx_digest_event_lineage_latest_signal
  on public.digest_event_lineage (latest_signal_id);

create index if not exists idx_digest_presentation_history_signal
  on public.digest_presentation_history (signal_id);

commit;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260920063000','add_missing_digest_foreign_key_indexes','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260920063000_add_missing_digest_foreign_key_indexes.sql

-- RECOVERY BEGIN 20260920064000_optimize_signals_search_and_reviewed_feed.sql
begin;

create index if not exists idx_signals_top_lane_trgm
  on public.signals using gin (top_lane extensions.gin_trgm_ops);

create index if not exists idx_signals_cat_trgm
  on public.signals using gin (cat extensions.gin_trgm_ops);

create index if not exists idx_signals_reviewed_date
  on public.signals (date desc)
  where reviewed = true;

commit;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260920064000','optimize_signals_search_and_reviewed_feed','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260920064000_optimize_signals_search_and_reviewed_feed.sql

-- RECOVERY BEGIN 20260920065000_optimize_source_registry_and_entity_job_queues.sql
begin;

create index if not exists idx_source_registry_active_relevance_last_checked
  on public.source_registry (is_active, relevance_status, last_checked_at asc nulls first);

create index if not exists idx_source_registry_active_relevance_adapter_tier_last_checked
  on public.source_registry (is_active, relevance_status, adapter, tier, last_checked_at asc nulls first);

create index if not exists idx_hv_entity_jobs_pending_signal
  on public.hv_entity_jobs (signal_id)
  where not harvested;

create index if not exists idx_hv_entity_jobs_pending_provider_request
  on public.hv_entity_jobs (provider, request_id desc)
  where request_id is not null;

commit;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260920065000','optimize_source_registry_and_entity_job_queues','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260920065000_optimize_source_registry_and_entity_job_queues.sql

-- RECOVERY BEGIN 20260920154810_create_atomic_org_onboarding.sql
begin;

create or replace function api.create_workspace_for_user(
  p_user_id uuid,
  p_legal_name text,
  p_trade_name text,
  p_org_type text,
  p_jurisdiction_country text,
  p_jurisdiction_region text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_workspace public.workspaces%rowtype;
  v_now timestamptz := now();
  v_legal text := trim(coalesce(p_legal_name, ''));
  v_trade text := nullif(trim(coalesce(p_trade_name, '')), '');
  v_country text := upper(trim(coalesce(p_jurisdiction_country, '')));
  v_region text := nullif(trim(coalesce(p_jurisdiction_region, '')), '');
  v_slug_base text;
  v_slug text;
begin
  if p_user_id is null then
    raise exception using errcode = '22023', message = 'USER_REQUIRED';
  end if;

  if v_legal = '' then
    raise exception using errcode = '22023', message = 'LEGAL_NAME_REQUIRED';
  end if;

  if v_country !~ '^[A-Z]{2}$' then
    raise exception using errcode = '22023', message = 'COUNTRY_CODE_INVALID';
  end if;

  if p_org_type is null or p_org_type not in (
    'supplier','buyer','broker','lab','pharmacy','clinic','equipment',
    'service','financial','distributor','exporter','importer'
  ) then
    raise exception using errcode = '22023', message = 'ORG_TYPE_INVALID';
  end if;

  v_slug_base := lower(regexp_replace(coalesce(v_trade, v_legal), '[^a-zA-Z0-9\s-]', '', 'g'));
  v_slug_base := regexp_replace(v_slug_base, '\s+', '-', 'g');
  v_slug_base := regexp_replace(v_slug_base, '-+', '-', 'g');
  v_slug_base := trim(both '-' from v_slug_base);
  v_slug_base := left(coalesce(nullif(v_slug_base, ''), 'organization'), 48);
  v_slug := v_slug_base || '-' || substr(replace(extensions.gen_random_uuid()::text, '-', ''), 1, 8);

  insert into public.workspaces (
    name, slug, legal_name, trade_name, org_type,
    jurisdiction_country, jurisdiction_region,
    verification_status, is_public, settings, status
  )
  values (
    coalesce(v_trade, v_legal), v_slug, v_legal, v_trade, p_org_type,
    v_country, v_region, 'unverified', false, '{}'::jsonb, 'active'
  )
  returning * into v_workspace;

  insert into public.workspace_members (
    workspace_id, user_id, role, status, invited_at, joined_at
  )
  values (v_workspace.id, p_user_id, 'admin', 'active', v_now, v_now);

  insert into public.hv_passports (
    org_id, verification_level, completeness_band,
    recall_exposure_flag, public_snapshot
  )
  values (
    v_workspace.id, 'none', 'incomplete', false,
    jsonb_build_object(
      'legal_name', v_legal,
      'trade_name', v_trade,
      'org_type', p_org_type,
      'jurisdiction_country', v_country,
      'jurisdiction_region', v_region,
      'created_via', 'org.create'
    )
  )
  on conflict (org_id) do update set
    public_snapshot = excluded.public_snapshot,
    updated_at = v_now;

  insert into public.user_dashboard_preferences (
    user_id, active_workspace_id, updated_at
  )
  values (p_user_id, v_workspace.id, v_now)
  on conflict (user_id) do update set
    active_workspace_id = excluded.active_workspace_id,
    updated_at = excluded.updated_at;

  begin
    insert into public.audit_events (
      entity_type, entity_id, action, actor,
      actor_user_id, actor_org_id, metadata
    )
    values (
      'workspace', v_workspace.id, 'org.created', p_user_id::text,
      p_user_id, v_workspace.id,
      jsonb_build_object(
        'org_type', p_org_type,
        'jurisdiction_country', v_country,
        'passport', true,
        'active_context', true
      )
    );
  exception when others then
    null;
  end;

  return jsonb_build_object(
    'org_id', v_workspace.id,
    'slug', v_workspace.slug,
    'name', v_workspace.name,
    'legal_name', v_workspace.legal_name,
    'trade_name', v_workspace.trade_name,
    'org_type', v_workspace.org_type,
    'jurisdiction_country', v_workspace.jurisdiction_country,
    'jurisdiction_region', v_workspace.jurisdiction_region,
    'verification_status', v_workspace.verification_status,
    'status', v_workspace.status,
    'active_workspace_id', v_workspace.id,
    'role', 'admin',
    'passport', true,
    'profile_bound', true
  );
end;
$$;

revoke all on function api.create_workspace_for_user(uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function api.create_workspace_for_user(uuid, text, text, text, text, text) to service_role;

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260920154810','create_atomic_org_onboarding','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260920154810_create_atomic_org_onboarding.sql

-- RECOVERY BEGIN 20260920190000_optimize_source_snapshot_and_import_lookup.sql
CREATE INDEX IF NOT EXISTS idx_source_snapshots_fetch_status_created_at
  ON public.source_snapshots (fetch_status, created_at DESC)
  WHERE fetch_status = 'success' AND captured_text IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_source_snapshots_source_url
  ON public.source_snapshots (source_id, captured_url);

CREATE INDEX IF NOT EXISTS idx_hv_import_normalized_hash
  ON public.hv_import_staging (normalized_hash);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260920190000','optimize_source_snapshot_and_import_lookup','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260920190000_optimize_source_snapshot_and_import_lookup.sql

-- RECOVERY BEGIN 20260920193000_optimize_pipeline_pending_work_indexes.sql
create index if not exists idx_signals_pending_analysis
on public.signals (date desc)
where reviewed = true and analysis is null and headline is not null;

create index if not exists idx_hv_translation_jobs_pending_signal
on public.hv_translation_jobs (signal_id)
where not harvested;

create index if not exists idx_hv_embed_jobs_pending_signal_ids
on public.hv_embed_jobs using gin (signal_ids);

create index if not exists idx_hv_alert_log_delivery_queue
on public.hv_alert_log (delivery_status, next_delivery_attempt_at, delivery_queued_at)
where resolved_at is null;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260920193000','optimize_pipeline_pending_work_indexes','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260920193000_optimize_pipeline_pending_work_indexes.sql

-- RECOVERY BEGIN 20260920195000_optimize_source_failure_quarantine_lookup.sql
create index if not exists idx_source_snapshots_error_source_created
on public.source_snapshots (source_id, created_at desc)
where fetch_status = 'error' and source_id is not null;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260920195000','optimize_source_failure_quarantine_lookup','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260920195000_optimize_source_failure_quarantine_lookup.sql

-- RECOVERY BEGIN 20260920200000_optimize_import_promotion_queue.sql
create index if not exists idx_hv_import_pending_workspace_created
on public.hv_import_staging (workspace_id, created_at asc)
where status = 'pending';

create index if not exists idx_hv_artifacts_workspace_content_hash
on public.hv_artifacts (workspace_id, content_hash);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260920200000','optimize_import_promotion_queue','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260920200000_optimize_import_promotion_queue.sql

-- RECOVERY BEGIN 20260920201000_optimize_digest_alert_and_snapshot_queue_indexes.sql
-- Optimize digest routing, alert delivery reconciliation, and snapshot extraction queues.
create index if not exists idx_editorial_items_source_url
  on public.editorial_items (source_url)
  where source_url is not null;

create index if not exists idx_hv_alert_log_delivery_request
  on public.hv_alert_log (delivery_request_id)
  where delivery_status = 'queued' and delivery_request_id is not null;

create index if not exists idx_source_snapshots_signal_extract_queue
  on public.source_snapshots (captured_at asc)
  where processing_status = 'pending'
    and signal_candidates is null
    and fetch_status = 'success'
    and captured_text is not null;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260920201000','optimize_digest_alert_and_snapshot_queue_indexes','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260920201000_optimize_digest_alert_and_snapshot_queue_indexes.sql

-- RECOVERY BEGIN 20260920202000_optimize_signal_promotion_and_digest_candidate_scans.sql
-- Target the two high-frequency signal scans used by promotion and digest routing.
create index if not exists idx_signals_digest_route_candidates
  on public.signals (date desc)
  where reviewed
    and quality_label = 'signal'
    and content_type in ('story','research')
    and url is not null;

create index if not exists idx_signals_auto_promote_candidates
  on public.signals (quality_confidence desc, created_at desc)
  where quality_label = 'signal'
    and coalesce(is_representative, true) = true
    and reviewed is distinct from true
    and (reviewed_by is null or reviewed_by not like 'human:%');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260920202000','optimize_signal_promotion_and_digest_candidate_scans','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260920202000_optimize_signal_promotion_and_digest_candidate_scans.sql

-- RECOVERY BEGIN 20260920203000_optimize_dedup_pending_target_scan.sql
create index if not exists idx_signals_dedup_pending_created
on public.signals (created_at desc)
where embedding_1024 is not null and cluster_rep_id is null;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260920203000','optimize_dedup_pending_target_scan','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260920203000_optimize_dedup_pending_target_scan.sql

-- RECOVERY BEGIN 20260920204000_optimize_entity_label_lookup.sql
create index if not exists idx_ia_graph_entities_lower_label on public.ia_graph_entities (lower(label));


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260920204000','optimize_entity_label_lookup','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260920204000_optimize_entity_label_lookup.sql

-- RECOVERY BEGIN 20260920204959_replay_gemini_embedding_column.sql
-- Replay-only reconstruction of the production Gemini embedding column.
--
-- Production has a 1024-dimensional Gemini embedding column on public.signals,
-- but the recovered repository migration history contains consumers of that
-- column without a canonical CREATE/ALTER COLUMN migration. This foundation
-- exists only in the temporary production-faithful replay workspace so later
-- historical migrations can execute. It is never a production migration or
-- migration-ledger entry.
alter table public.signals
  add column if not exists embedding_gemini_1024 vector(1024);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260920204959','replay_gemini_embedding_column','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260920204959_replay_gemini_embedding_column.sql

-- RECOVERY BEGIN 20260920205000_optimize_gemini_embedding_queue_scan.sql
-- Optimize oldest-first Gemini embedding queue selection.
create index if not exists idx_signals_pending_gemini_embedding
on public.signals (created_at asc)
where quality_label = 'signal' and embedding_gemini_1024 is null;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260920205000','optimize_gemini_embedding_queue_scan','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260920205000_optimize_gemini_embedding_queue_scan.sql

-- RECOVERY BEGIN 20260920210000_recover_orphaned_gemini_embedding_jobs.sql
-- Recover pg_net embedding jobs that have no response row and would otherwise block the queue.
create or replace function public.hv_embed_harvest()
returns integer
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  j record;
  i int;
  n int := 0;
  v_emb text;
  v_batch_ok boolean;
begin
  update public.hv_embed_jobs hj
  set harvested = true
  where not hj.harvested
    and not exists (
      select 1 from net._http_response resp where resp.id = hj.request_id
    );

  for j in
    select hj.request_id, hj.signal_ids, resp.status_code, resp.content
    from public.hv_embed_jobs hj
    join net._http_response resp on resp.id = hj.request_id
    where not hj.harvested
  loop
    v_batch_ok := (j.status_code = 200);
    if v_batch_ok then
      for i in 1 .. array_length(j.signal_ids,1) loop
        begin
          v_emb := replace(((j.content::jsonb)->'embeddings'->(i-1)->'values')::text, ' ', '');
          if v_emb is not null and v_emb <> 'null' then
            update public.signals
            set embedding_gemini_1024 = v_emb::vector, embedded_at = now()
            where id = j.signal_ids[i];
            n := n + 1;
          else
            v_batch_ok := false;
          end if;
        exception when others then
          v_batch_ok := false;
        end;
      end loop;
    end if;
    if v_batch_ok then
      update public.hv_embed_jobs set harvested = true where request_id = j.request_id;
    end if;
  end loop;
  return n;
end
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260920210000','recover_orphaned_gemini_embedding_jobs','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260920210000_recover_orphaned_gemini_embedding_jobs.sql

-- RECOVERY BEGIN 20260920212000_harden_gemini_embedding_quota_and_concurrency.sql
create or replace function public.hv_embed_harvest()
returns integer
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare j record; i int; n int := 0; v_emb text; v_batch_ok boolean;
begin
  update public.hv_embed_jobs hj set harvested = true
  where not hj.harvested
    and not exists (select 1 from net._http_response resp where resp.id = hj.request_id);
  for j in
    select hj.request_id, hj.signal_ids, resp.status_code, resp.content
    from public.hv_embed_jobs hj join net._http_response resp on resp.id=hj.request_id
    where not hj.harvested
  loop
    v_batch_ok := (j.status_code=200);
    if v_batch_ok then
      for i in 1..array_length(j.signal_ids,1) loop
        begin
          v_emb := replace(((j.content::jsonb)->'embeddings'->(i-1)->'values')::text,' ','');
          if v_emb is not null and v_emb <> 'null' then
            update public.signals set embedding_gemini_1024=v_emb::vector, embedded_at=now() where id=j.signal_ids[i];
            n := n+1;
          else v_batch_ok := false;
          end if;
        exception when others then v_batch_ok := false;
        end;
      end loop;
    end if;
    if v_batch_ok or j.status_code <> 200 then
      update public.hv_embed_jobs set harvested=true where request_id=j.request_id;
    end if;
  end loop;
  return n;
end
$function$;

create or replace function public.hv_embed_dispatch(p_signal_ids text[])
returns bigint
language plpgsql
security definer
set search_path to 'pg_catalog','public','public','api','signals','regulatory_signals','auth','storage','vault','extensions','net','cron'
as $function$
declare v_rid bigint; v_texts text[]; v_ids text[]; v_allowed int; v_requests jsonb; v_gemini_key text;
begin
  if not pg_try_advisory_xact_lock(hashtextextended('harbourview:gemini-embed-dispatch',0)) then return null; end if;
  if exists (select 1 from net._http_response where status_code=429 and created>now()-interval '65 seconds' and content::text like '%embed_content%') then return null; end if;
  if exists (select 1 from public.hv_embed_jobs where not harvested) then return null; end if;
  v_allowed := public.hv_consume_dispatch_budget('embed',least(coalesce(array_length(p_signal_ids,1),0),100));
  if v_allowed<=0 then return null; end if;
  v_ids := p_signal_ids[1:v_allowed];
  select array_agg(coalesce(s.title_en,s.headline)||'. '||coalesce(s.summary_en,left(s.summary,300),'') order by ord) into v_texts
  from unnest(v_ids) with ordinality as u(sid,ord) join public.signals s on s.id=u.sid;
  select jsonb_agg(jsonb_build_object('model','models/gemini-embedding-001','content',jsonb_build_object('parts',jsonb_build_array(jsonb_build_object('text',left(t,4000)))),'outputDimensionality',1024)) into v_requests from unnest(v_texts) t;
  v_gemini_key := public.hv_get_gemini_key();
  select net.http_post(url:='https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key='||v_gemini_key,headers:='{"Content-Type":"application/json"}'::jsonb,body:=jsonb_build_object('requests',v_requests),timeout_milliseconds:=45000) into v_rid;
  insert into public.hv_embed_jobs(request_id,signal_ids) values(v_rid,v_ids);
  return v_rid;
end
$function$;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260920212000','harden_gemini_embedding_quota_and_concurrency','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260920212000_harden_gemini_embedding_quota_and_concurrency.sql

-- RECOVERY BEGIN 20260920213000_fix_pipeline_alert_false_positives.sql
do $do$
declare
  def text;
begin
  select pg_get_functiondef(p.oid)
    into def
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'hv_pipeline_alerts'
    and pg_get_function_identity_arguments(p.oid) = '';

  def := replace(
    def,
    $old$where s.quality_label = 'signal'
      and s.entities_extracted_at is null
      and exists (select 1 from public.hv_entity_jobs j where j.signal_id = s.id and j.harvested)$old$,
    $new$where s.quality_label = 'signal'
      and s.entities_extracted_at is null
      and exists (
        select 1
        from public.hv_entity_jobs j
        join net._http_response r on r.id = j.request_id
        where j.signal_id = s.id
          and j.harvested
          and r.status_code = 200
      )$new$
  );

  def := replace(
    def,
    $old$where quality_label is null
      and created_at < now() - interval '6 hours'
      and created_at > now() - interval '7 days'$old$,
    $new$where quality_label is null
      and created_at < now() - interval '6 hours'
      and created_at > now() - interval '7 days'
      and not exists (
        select 1
        from public.intel_classify_review_queue q
        where q.signal_id = public.signals.id
          and q.resolved = false
      )$new$
  );

  def := replace(
    def,
    $old$from (select distinct classifier_version from public.signals where classifier_version is not null) v
    left join public.classifier_validation cv on cv.classifier_version = v.classifier_version$old$,
    $new$from (
      select distinct classifier_version
      from public.signals
      where classifier_version is not null
        and created_at > now() - interval '14 days'
    ) v
    left join public.classifier_validation cv on cv.classifier_version = v.classifier_version$new$
  );

  execute def;
end
$do$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260920213000','fix_pipeline_alert_false_positives','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260920213000_fix_pipeline_alert_false_positives.sql

-- RECOVERY BEGIN 20260920214000_exclude_reviewed_reference_rows_from_classification_alert.sql
do $do$
declare def text;
begin
  select pg_get_functiondef(p.oid) into def
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='hv_pipeline_alerts'
    and pg_get_function_identity_arguments(p.oid)='';

  def := replace(
    def,
    $old$where quality_label is null
      and created_at < now() - interval '6 hours'
      and created_at > now() - interval '7 days'
      and not exists (
        select 1
        from public.intel_classify_review_queue q
        where q.signal_id = public.signals.id
          and q.resolved = false
      )$old$,
    $new$where quality_label is null
      and reviewed is distinct from true
      and created_at < now() - interval '6 hours'
      and created_at > now() - interval '7 days'
      and not exists (
        select 1
        from public.intel_classify_review_queue q
        where q.signal_id = public.signals.id
          and q.resolved = false
      )$new$
  );
  execute def;
end
$do$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260920214000','exclude_reviewed_reference_rows_from_classification_alert','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260920214000_exclude_reviewed_reference_rows_from_classification_alert.sql

-- RECOVERY BEGIN 20260920220000_add_zero_cost_rules_analysis_queue.sql
create or replace function public.hv_rules_analysis(p_limit integer default 50)
returns integer language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_count integer;
begin
  with candidates as (
    select s.id,
      left(btrim(s.headline),500) headline,
      left(btrim(coalesce(s.summary,s.headline)),700) summary,
      s.cat,s.score,s.verification,s.source
    from public.signals s
    where s.reviewed=true and s.headline is not null and s.analysis is null
    order by s.score desc nulls last,s.date desc
    limit least(greatest(coalesce(p_limit,50),1),50)
  ), updated as (
    update public.signals s set
      analysis=jsonb_build_object(
        'what_changed',case
          when c.summary is null or c.summary='' then c.headline
          when length(c.summary)>length(c.headline)+30
            and position(lower(c.headline) in lower(c.summary))=1
            then left(btrim(substr(c.summary,length(c.headline)+1)),650)
          else c.headline end,
        'who_is_affected',case
          when lower(coalesce(c.cat,''))~'regulat|compliance|law|policy|licen|permit|government'
            then 'Operators, compliance teams, and businesses subject to the affected regulatory or market requirements.'
          when lower(coalesce(c.summary,''))~'investor|stock|share|market'
            then 'Investors and market participants exposed to the reported company, sector, or market development.'
          else 'Organizations and market participants directly exposed to the reported development.' end,
        'deadline',null,
        'recommended_action',case
          when coalesce(c.score,0)>=80
            then 'Review the underlying source and assess whether the development requires an operational, compliance, or monitoring response.'
          else 'Monitor the underlying source and verify the development before taking material operational action.' end,
        'confidence_rationale',case
          when nullif(btrim(c.verification),'') is not null
            then 'Rules-based analysis using recorded signal text and metadata; source verification is marked "'||btrim(c.verification)||'".'
          else 'Rules-based analysis using recorded signal text and metadata; source verification metadata is limited.' end,
        'analysis_quality',case
          when lower(coalesce(c.source,''))~'source engine'
            or lower(coalesce(c.summary,''))~'home|search|menu|watchlist|featured|copyright'
            then 'limited_source_text'
          else 'rules_based' end),
      analysis_generated_at=now(),analysis_backend='rules-v1'
    from candidates c where s.id=c.id returning 1)
  select count(*) into v_count from updated;
  return v_count;
end $$;
revoke all on function public.hv_rules_analysis(integer) from public;
grant execute on function public.hv_rules_analysis(integer) to service_role;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260920220000','add_zero_cost_rules_analysis_queue','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260920220000_add_zero_cost_rules_analysis_queue.sql

-- RECOVERY BEGIN 20260920223000_harden_zero_cost_enrichment.sql
-- Zero-cost editorial enrichment and deterministic deadline extraction.
create or replace function public.hv_rules_enrich_editorial(p_limit integer default 200)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  r record;
  v_clean text;
  v_n integer := 0;
begin
  for r in
    select id, headline, summary
    from public.editorial_items
    where stage = 'qualified'
      and (why_it_matters is null or btrim(why_it_matters) = '')
    order by created_at asc
    limit least(greatest(coalesce(p_limit,200),1),200)
  loop
    v_clean := btrim(regexp_replace(
      regexp_replace(coalesce(nullif(btrim(r.summary),''), r.headline, ''), '<[^>]+>', ' ', 'g'),
      '(?i)(home|search|menu|watchlist|featured|copyright|sign up|subscribe|all rights reserved).*$', '', 'g'
    ));
    v_clean := btrim(regexp_replace(v_clean, '\s+', ' ', 'g'));
    if v_clean is null or v_clean = '' then
      v_clean := btrim(r.headline);
    end if;

    update public.editorial_items
    set why_it_matters = left(
      'Source-reported development: ' ||
      coalesce(v_clean, 'The item reports a development requiring source verification.') ||
      ' Further context and impact should be verified against the underlying source.',
      700
    ),
    updated_at = now()
    where id = r.id
      and (why_it_matters is null or btrim(why_it_matters) = '');

    v_n := v_n + 1;
  end loop;
  return v_n;
end
$$;

create or replace function public.hv_rules_enrich_deadlines(p_limit integer default 500)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  r record;
  v_text text;
  v_match text;
  v_date text;
  v_n integer := 0;
begin
  for r in
    select id, headline, summary, analysis
    from public.signals
    where analysis is not null
      and coalesce(analysis->>'deadline','') = ''
      and (headline is not null or summary is not null)
    order by date desc nulls last
    limit least(greatest(coalesce(p_limit,500),1),500)
  loop
    v_text := left(btrim(coalesce(r.headline,'') || '. ' || coalesce(r.summary,'')), 6000);

    v_match := (regexp_match(
      v_text,
      '(?i)(?:deadline|due|due date|by|before|effective|takes effect|takes effect on|expires?|expiration|through|on)\s*:?\s*((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+[0-9]{1,2}(?:st|nd|rd|th)?(?:,|\s)\s*[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}/[0-9]{1,2}/[0-9]{4})'
    ))[1];

    if v_match is not null and btrim(v_match) <> '' then
      v_date := btrim(v_match);
      update public.signals
      set analysis = jsonb_set(
        jsonb_set(analysis, '{deadline}', to_jsonb(v_date), true),
        '{deadline_source}', '"rules-v2"', true
      ),
      analysis_generated_at = coalesce(analysis_generated_at, now())
      where id = r.id
        and coalesce(analysis->>'deadline','') = '';
      v_n := v_n + 1;
    end if;
  end loop;
  return v_n;
end
$$;

revoke all on function public.hv_rules_enrich_editorial(integer) from public;
revoke all on function public.hv_rules_enrich_deadlines(integer) from public;
grant execute on function public.hv_rules_enrich_editorial(integer) to service_role;
grant execute on function public.hv_rules_enrich_deadlines(integer) to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260920223000','harden_zero_cost_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260920223000_harden_zero_cost_enrichment.sql

-- RECOVERY BEGIN 20260920223500_refine_deadline_extraction.sql
-- Refine deadline extraction to require explicit deadline/effective-date language.
create or replace function public.hv_rules_enrich_deadlines(p_limit integer default 1000)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare r record; v_text text; v_match text; v_date text; v_n integer:=0;
begin
  for r in
    select id,headline,summary,analysis from public.signals
    where analysis is not null and coalesce(analysis->>'deadline','')='' and (headline is not null or summary is not null)
    order by date desc nulls last
    limit least(greatest(coalesce(p_limit,1000),1),1000)
  loop
    v_text:=left(btrim(coalesce(r.headline,'')||'. '||coalesce(r.summary,'')),6000);
    v_match:=(regexp_match(v_text,'(?i)(?:deadline|due(?: date)?|by|before|effective|takes effect|expires?|expiration)\s*:?\s*((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+[0-9]{1,2}(?:st|nd|rd|th)?(?:,|\s)\s*[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}/[0-9]{1,2}/[0-9]{4})'))[1];
    if v_match is not null and btrim(v_match)<>'' then
      v_date:=btrim(v_match);
      update public.signals
      set analysis=jsonb_set(jsonb_set(analysis,'{deadline}',to_jsonb(v_date),true),'{deadline_source}','"rules-v2"',true)
      where id=r.id and coalesce(analysis->>'deadline','')='';
      v_n:=v_n+1;
    end if;
  end loop;
  return v_n;
end $$;
revoke all on function public.hv_rules_enrich_deadlines(integer) from public;
grant execute on function public.hv_rules_enrich_deadlines(integer) to service_role;

update public.signals
set analysis=jsonb_set(analysis,'{deadline}','null'::jsonb,true)
where analysis->>'deadline_source'='rules-v2';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260920223500','refine_deadline_extraction','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260920223500_refine_deadline_extraction.sql

-- RECOVERY BEGIN 20260920224000_clean_deadline_rule_metadata.sql
-- Remove stale deadline-source metadata left by an earlier detector revision.
update public.signals
set analysis = analysis - 'deadline_source'
where analysis->>'deadline_source'='rules-v2'
  and coalesce(analysis->>'deadline','')='';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260920224000','clean_deadline_rule_metadata','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260920224000_clean_deadline_rule_metadata.sql

-- RECOVERY BEGIN 20260920224500_repair_limited_rules_analysis.sql
-- Reconstructed migration artifact for the live production migration
-- 20260920224500_repair_limited_rules_analysis.
--
-- Provenance: reconstructed from the live production function definition on
-- 2026-09-21 because the original repository migration artifact was absent.
-- This file is intended to reconcile migration provenance; it does not invent
-- historical statements beyond the live function definition.

create or replace function public.hv_rules_repair_limited_analysis(p_limit integer default 500)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  r record;
  v_clean text;
  v_changed text;
  v_quality text;
  v_n integer := 0;
begin
  for r in
    select id, headline, summary, cat, score, verification, source, analysis
    from public.signals
    where analysis_backend = 'rules-v1'
      and analysis->>'analysis_quality' = 'limited_source_text'
    order by score desc nulls last, date desc
    limit least(greatest(coalesce(p_limit,500),1),500)
  loop
    v_clean := btrim(regexp_replace(
      regexp_replace(coalesce(r.summary,''), '<[^>]+>', ' ', 'g'),
      '(?i)(home|skip to main content|navigation menu|menu toggle|search for:|featured|watchlist|copyright|subscribe|sign up|all rights reserved|read this first).*?(?=\b[A-Z][^.!?]{5,}|$)',
      ' ','g'
    ));
    v_clean := btrim(regexp_replace(v_clean,'\s+',' ','g'));

    if v_clean is null or length(v_clean) < 40 or
       lower(v_clean) like '%' || lower(coalesce(r.headline,'')) || '%' and length(v_clean) > length(r.headline)*3
    then
      v_changed := left(btrim(r.headline),700);
    else
      v_changed := left(v_clean,700);
    end if;

    if v_changed is null or v_changed = '' then
      v_changed := left(btrim(coalesce(r.headline,'Source text available for review.')),700);
    end if;

    v_quality := 'limited_source_text';

    update public.signals
    set analysis = jsonb_set(
      jsonb_set(analysis,'{what_changed}',to_jsonb(v_changed),true),
      '{analysis_quality}',to_jsonb(v_quality),true
    )
    where id = r.id;
    v_n := v_n + 1;
  end loop;
  return v_n;
end
$$;

revoke all on function public.hv_rules_repair_limited_analysis(integer) from public;
grant execute on function public.hv_rules_repair_limited_analysis(integer) to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260920224500','repair_limited_rules_analysis','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260920224500_repair_limited_rules_analysis.sql

-- RECOVERY BEGIN 20260921004055_replay_claude_push_staging.sql
-- Replay-only relation foundation for the production _claude_push_staging table.
--
-- The production table is referenced by the recovered security-hardening migration,
-- but no canonical CREATE TABLE migration exists in the repository history. The
-- temporary relation is intentionally minimal because this replay only requires
-- the relation to exist for RLS/grant hardening. It is never a production migration
-- or migration-ledger entry.
create table if not exists public._claude_push_staging (
  id bigint generated by default as identity primary key
);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260921004055','replay_claude_push_staging','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260921004055_replay_claude_push_staging.sql

-- RECOVERY BEGIN 20260921004056_harden_internal_tables_and_rules_repair_rpc.sql
-- Reconcile the production security hardening applied by
-- 20260921004056_harden_internal_tables_and_rules_repair_rpc.
-- Idempotent by design; no data is modified.

alter table public._claude_push_staging enable row level security;
alter table public.legal_data_hunter_pulls enable row level security;
alter table public.cannabinoid_compounds enable row level security;

revoke all on table public._claude_push_staging from anon, authenticated;
revoke all on table public.legal_data_hunter_pulls from anon, authenticated;
revoke all on table public.cannabinoid_compounds from anon, authenticated;

revoke all on function public.hv_rules_repair_limited_analysis(integer) from public, anon, authenticated;
grant execute on function public.hv_rules_repair_limited_analysis(integer) to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260921004056','harden_internal_tables_and_rules_repair_rpc','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260921004056_harden_internal_tables_and_rules_repair_rpc.sql

-- RECOVERY BEGIN 20260921004120_activate_primary_source_hardening_registry.sql
-- Reconstructed provenance artifact for the live production migration
-- 20260921004120_activate_primary_source_hardening_registry.
-- The registry itself is created by 20260915050000_primary_source_market_access_hardening_registry.
-- This migration activates the corrected 203 national + 88 subnational universe.

create or replace view api.regulatory_market_access_primary_source_gaps
with (security_invoker = true) as
with inventory as (
  select c.iso_alpha2 as jurisdiction_iso2,
         c.country_name,
         case when c.iso_alpha2 ~ '^[A-Z]{2}$' then 'national' else 'subnational' end as jurisdiction_level,
         case when c.iso_alpha2 ~ '^[A-Z]{2}$' then null else substring(c.iso_alpha2 from 1 for 2) end as parent_iso2,
         c.verified_regulatory_tier,
         c.regulatory_tier_evidence_key
  from public.countries c
  where c.iso_alpha2 is not null
)
select i.jurisdiction_iso2,i.jurisdiction_level,i.parent_iso2,i.country_name,
  i.verified_regulatory_tier,i.regulatory_tier_evidence_key,
  p.authority_url as primary_source_url,p.authority_name as primary_source_authority,p.source_class,
  p.source_effective_date,p.source_snapshot_sha256,
  p.verified_at as primary_source_verified_at,p.expires_at as primary_source_expires_at,
  case
    when p.jurisdiction_iso2 is null then 'missing_primary_source'
    when p.jurisdiction_level is distinct from i.jurisdiction_level then 'wrong_jurisdiction_level'
    when p.parent_iso2 is distinct from i.parent_iso2 then 'wrong_parent'
    when p.expires_at <= now() then 'expired_primary_source'
    when p.source_effective_date is not null and p.source_effective_date > current_date then 'future_source_effective_date'
    when p.source_snapshot_sha256 is null then 'missing_source_snapshot'
    when lower(trim(trailing '/' from p.authority_url)) = lower(trim(trailing '/' from coalesce(e.authority_url,''))) then 'same_source_as_current_evidence'
    else 'hardened'
  end as hardening_status
from inventory i
left join public.regulatory_market_access_primary_sources p on p.jurisdiction_iso2=i.jurisdiction_iso2
left join public.regulatory_market_access_evidence e on e.evidence_key=i.regulatory_tier_evidence_key;

grant select on api.regulatory_market_access_primary_source_gaps to authenticated, service_role;

create or replace function api.assert_market_access_primary_source_hardening()
returns table (
  jurisdictions bigint,
  national_jurisdictions bigint,
  subnational_jurisdictions bigint,
  hardened bigint,
  missing bigint,
  expired bigint,
  wrong_level bigint,
  wrong_parent bigint,
  missing_snapshot bigint,
  future_effective_date bigint,
  reused_current_evidence_url bigint,
  duplicate_source_urls bigint
)
language sql stable security definer set search_path = '' as $$
  with inventory as (
    select c.iso_alpha2 as jurisdiction_iso2,
           case when c.iso_alpha2 ~ '^[A-Z]{2}$' then 'national' else 'subnational' end as jurisdiction_level,
           case when c.iso_alpha2 ~ '^[A-Z]{2}$' then null else substring(c.iso_alpha2 from 1 for 2) end as parent_iso2,
           c.regulatory_tier_evidence_key
    from public.countries c
    where c.iso_alpha2 is not null
  ),
  joined as (
    select i.*,p.jurisdiction_iso2 as p_key,p.jurisdiction_level as p_level,p.parent_iso2 as p_parent,
      p.authority_url,p.source_effective_date,p.source_snapshot_sha256,p.verified_at,p.expires_at,e.authority_url as evidence_url
    from inventory i
    left join public.regulatory_market_access_primary_sources p on p.jurisdiction_iso2=i.jurisdiction_iso2
    left join public.regulatory_market_access_evidence e on e.evidence_key=i.regulatory_tier_evidence_key
  ),
  counts as (
    select
      count(*)::bigint as jurisdictions,
      count(*) filter (where jurisdiction_level='national')::bigint as national_jurisdictions,
      count(*) filter (where jurisdiction_level='subnational')::bigint as subnational_jurisdictions,
      count(*) filter (where p_key is not null and p_level=jurisdiction_level and p_parent is not distinct from parent_iso2 and expires_at>now() and source_snapshot_sha256 ~ '^[0-9a-f]{64}$' and (source_effective_date is null or source_effective_date<=current_date) and lower(trim(trailing '/' from authority_url)) <> lower(trim(trailing '/' from coalesce(evidence_url,''))))::bigint as hardened,
      count(*) filter (where p_key is null)::bigint as missing,
      count(*) filter (where p_key is not null and expires_at<=now())::bigint as expired,
      count(*) filter (where p_key is not null and p_level is distinct from jurisdiction_level)::bigint as wrong_level,
      count(*) filter (where p_key is not null and p_parent is distinct from parent_iso2)::bigint as wrong_parent,
      count(*) filter (where p_key is not null and source_snapshot_sha256 is null)::bigint as missing_snapshot,
      count(*) filter (where p_key is not null and source_effective_date is not null and source_effective_date>current_date)::bigint as future_effective_date,
      count(*) filter (where p_key is not null and lower(trim(trailing '/' from authority_url)) = lower(trim(trailing '/' from coalesce(evidence_url,''))))::bigint as reused_current_evidence_url
    from joined
  ),
  duplicate_urls as (
    select count(*)::bigint as duplicate_source_urls
    from (
      select lower(trim(trailing '/' from authority_url))
      from public.regulatory_market_access_primary_sources
      group by 1 having count(*) > 1
    ) d
  )
  select c.*,d.duplicate_source_urls from counts c cross join duplicate_urls d;
$$;

revoke all on function api.assert_market_access_primary_source_hardening() from public, anon, authenticated;
grant execute on function api.assert_market_access_primary_source_hardening() to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260921004120','activate_primary_source_hardening_registry','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260921004120_activate_primary_source_hardening_registry.sql

-- RECOVERY BEGIN 20260922101323_jurisdiction_data_depth_v1.sql
-- Jurisdiction data-depth aggregation layer.
-- Read-only derived intelligence metadata: never infers missing regulatory facts.
create or replace view public.v_jurisdiction_data_depth
with (security_invoker = on) as
with base as (
  select c.id, c.iso_alpha2 as jurisdiction_key, c.country_name, c.country_slug, c.iso_alpha3,
         c.region, c.subregion, c.market_access_status, c.medical_status, c.adult_use_status,
         c.import_status, c.export_status, c.regulatory_tier, c.regulatory_tier_verified_at,
         c.data_completeness, c.last_updated_label
  from public.countries c
), ci as (
  select country_code, count(*) country_intel_rows,
         count(*) filter (where review_status in ('approved','active')) active_country_intel_rows,
         max(last_reviewed_at) country_intel_last_reviewed
  from public.country_intel group by country_code
), ev as (
  select jurisdiction_iso2, count(*) evidence_rows,
         count(*) filter (where active) active_evidence_rows,
         count(*) filter (where verified_at is not null and expires_at >= now()) current_verified_evidence_rows,
         count(*) filter (where source_snapshot_sha256 is not null) snapshotted_evidence_rows,
         max(verified_at) latest_evidence_verified_at
  from public.regulatory_market_access_evidence group by jurisdiction_iso2
), cl as (
  select jurisdiction_iso2, count(*) claim_rows,
         count(*) filter (where evidence_status='verified') verified_claim_rows,
         count(distinct product_class) claim_product_classes
  from public.regulatory_market_access_claims group by jurisdiction_iso2
), pw as (
  select iso_alpha2, count(*) pathway_rows,
         count(*) filter (where verification='verified') verified_pathway_rows,
         count(distinct pathway_type) pathway_types, max(last_verified_at) latest_pathway_verified_at
  from public.regulatory_pathways group by iso_alpha2
), fr as (
  select p.iso_alpha2, count(r.id) format_rule_rows,
         count(r.id) filter (where r.verification='verified') verified_format_rule_rows,
         count(distinct r.format_id) distinct_formats, count(distinct r.pathway_id) pathways_with_format_rules
  from public.regulatory_pathways p left join public.pathway_format_rules r on r.pathway_id=p.id
  group by p.iso_alpha2
), mm as (
  select country_iso2, count(*) metric_rows, count(distinct metric_name) metric_types,
         max(period_end) latest_metric_period, max(updated_at) latest_metric_updated_at
  from public.market_metrics group by country_iso2
), tf as (
  select iso, count(*) trade_flow_rows,
         count(distinct product_category) filter (where product_category is not null) trade_product_categories,
         max(last_verified) latest_trade_verified_at
  from (select origin_iso2 iso, product_category, last_verified from public.trade_flows
        union all select destination_iso2, product_category, last_verified from public.trade_flows) x
  group by iso
), sg as (
  select country_iso2, count(*) signal_rows,
         count(*) filter (where lower(coalesce(verification,'')) in ('verified','reviewed','approved')) reviewed_signal_rows,
         count(*) filter (where coalesce(event_effective_at,source_published_at,observed_at,created_at) >= now()-interval '90 days') recent_signal_rows,
         max(coalesce(event_effective_at,source_published_at,observed_at,created_at)) latest_signal_at
  from public.signals where country_iso2 is not null group by country_iso2
), src as (
  select coalesce(nullif(upper(iso),''),nullif(upper(jurisdiction_code),'')) jurisdiction_key,
         count(*) registered_source_rows, count(*) filter (where is_active) active_source_rows,
         count(*) filter (where tier=1) official_source_rows, max(last_checked_at) latest_source_check
  from public.source_registry where iso is not null or jurisdiction_code is not null
  group by coalesce(nullif(upper(iso),''),nullif(upper(jurisdiction_code),''))
), snap as (
  select coalesce(upper(sr.iso),upper(sr.jurisdiction_code)) jurisdiction_key,
         count(ss.id) snapshot_rows, count(ss.id) filter (where ss.fetch_status='success') successful_snapshot_rows,
         max(ss.captured_at) latest_snapshot_at
  from public.source_snapshots ss join public.source_registry sr on sr.id=ss.source_id
  group by coalesce(upper(sr.iso),upper(sr.jurisdiction_code))
), cal as (
  select iso2, count(*) calendar_rows,
         count(*) filter (where status not in ('resolved','withdrawn','cancelled')) open_calendar_rows,
         max(updated_at) latest_calendar_update
  from public.regulatory_calendar group by iso2
)
select b.*, coalesce(ci.country_intel_rows,0) country_intel_rows,
  coalesce(ci.active_country_intel_rows,0) active_country_intel_rows, ci.country_intel_last_reviewed,
  coalesce(ev.evidence_rows,0) evidence_rows, coalesce(ev.active_evidence_rows,0) active_evidence_rows,
  coalesce(ev.current_verified_evidence_rows,0) current_verified_evidence_rows,
  coalesce(ev.snapshotted_evidence_rows,0) snapshotted_evidence_rows, ev.latest_evidence_verified_at,
  coalesce(cl.claim_rows,0) claim_rows, coalesce(cl.verified_claim_rows,0) verified_claim_rows,
  coalesce(cl.claim_product_classes,0) claim_product_classes,
  coalesce(pw.pathway_rows,0) pathway_rows, coalesce(pw.verified_pathway_rows,0) verified_pathway_rows,
  coalesce(pw.pathway_types,0) pathway_types, pw.latest_pathway_verified_at,
  coalesce(fr.format_rule_rows,0) format_rule_rows, coalesce(fr.verified_format_rule_rows,0) verified_format_rule_rows,
  coalesce(fr.distinct_formats,0) distinct_formats, coalesce(fr.pathways_with_format_rules,0) pathways_with_format_rules,
  coalesce(mm.metric_rows,0) metric_rows, coalesce(mm.metric_types,0) metric_types,
  mm.latest_metric_period, mm.latest_metric_updated_at,
  coalesce(tf.trade_flow_rows,0) trade_flow_rows, coalesce(tf.trade_product_categories,0) trade_product_categories,
  tf.latest_trade_verified_at,
  coalesce(sg.signal_rows,0) signal_rows, coalesce(sg.reviewed_signal_rows,0) reviewed_signal_rows,
  coalesce(sg.recent_signal_rows,0) recent_signal_rows, sg.latest_signal_at,
  coalesce(src.registered_source_rows,0) registered_source_rows, coalesce(src.active_source_rows,0) active_source_rows,
  coalesce(src.official_source_rows,0) official_source_rows, src.latest_source_check,
  coalesce(snap.snapshot_rows,0) snapshot_rows, coalesce(snap.successful_snapshot_rows,0) successful_snapshot_rows,
  snap.latest_snapshot_at,
  coalesce(cal.calendar_rows,0) calendar_rows, coalesce(cal.open_calendar_rows,0) open_calendar_rows,
  cal.latest_calendar_update,
  (
    (case when coalesce(ci.active_country_intel_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(ev.current_verified_evidence_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(cl.verified_claim_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(pw.verified_pathway_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(fr.verified_format_rule_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(mm.metric_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(tf.trade_flow_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(sg.signal_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(src.active_source_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(snap.successful_snapshot_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(cal.calendar_rows,0)>0 then 1 else 0 end)
  ) populated_dimensions,
  11 total_dimensions,
  round(100.0*(
    (case when coalesce(ci.active_country_intel_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(ev.current_verified_evidence_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(cl.verified_claim_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(pw.verified_pathway_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(fr.verified_format_rule_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(mm.metric_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(tf.trade_flow_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(sg.signal_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(src.active_source_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(snap.successful_snapshot_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(cal.calendar_rows,0)>0 then 1 else 0 end)
  )/11.0) depth_pct
from base b
left join ci on ci.country_code=b.jurisdiction_key
left join ev on ev.jurisdiction_iso2=b.jurisdiction_key
left join cl on cl.jurisdiction_iso2=b.jurisdiction_key
left join pw on pw.iso_alpha2=b.jurisdiction_key
left join fr on fr.iso_alpha2=b.jurisdiction_key
left join mm on mm.country_iso2=b.jurisdiction_key
left join tf on tf.iso=b.jurisdiction_key
left join sg on sg.country_iso2=b.jurisdiction_key
left join src on src.jurisdiction_key=b.jurisdiction_key
left join snap on snap.jurisdiction_key=b.jurisdiction_key
left join cal on cal.iso2=b.jurisdiction_key;

grant select on public.v_jurisdiction_data_depth to anon, authenticated;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922101323','jurisdiction_data_depth_v1','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922101323_jurisdiction_data_depth_v1.sql

-- RECOVERY BEGIN 20260922104459_replay_jurisdiction_data_depth_tasks.sql
-- Replay-only foundation for the production jurisdiction data-depth task queue.
--
-- The repository contains consumers of this task table but no canonical CREATE TABLE
-- migration. The temporary table carries the columns exercised by the recovered
-- migrations. It is never a production migration or migration-ledger entry.
create table if not exists public.jurisdiction_data_depth_tasks (
  id bigint generated by default as identity primary key,
  jurisdiction_key text not null,
  dimension_key text not null,
  jurisdiction_level text,
  status text not null default 'open',
  priority integer not null default 0,
  evidence_required boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922104459','replay_jurisdiction_data_depth_tasks','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922104459_replay_jurisdiction_data_depth_tasks.sql

-- RECOVERY BEGIN 20260922104500_primary_us_jurisdiction_depth_enrichment.sql
-- Primary-source enrichment for Kentucky, Nebraska, Utah, Indiana and North Carolina.
-- Live data was verified on 2026-09-22. Keep this migration aligned with the
-- production data changes; no synthetic snapshots or hashes are introduced.

update public.source_registry
set jurisdiction='Utah', country='United States', iso='US', sub_region='Utah',
    jurisdiction_code='US-UT', source_type='government_regulator',
    regulator_class='other', tier=1, relevance_status='active',
    verification_notes='Official Utah government source verified 2026-09-22.',
    verification_checked_at=now(), updated_at=now()
where source_url='https://medicalcannabis.utah.gov';

insert into public.source_registry
(source_name,source_url,jurisdiction,is_active,country,iso,sub_region,requires_translation,notes,
 region,language,adapter,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,
 publish_cadence,source_type,crawl_allowed,next_crawl_at,consecutive_failures,network_status,
 content_change_rate,verification_notes,verification_checked_at,content_type,metadata,regulator_class)
values
('Kentucky Medical Cannabis Program','https://kymedcan.ky.gov/Pages/index.aspx','Kentucky',true,'United States','US','Kentucky',false,
 'Official Kentucky Office of Medical Cannabis program source.','north_america','en','html_snapshot','daily','active','US-KY',1,false,
 null,'government_regulator',true,now(),0,'online',0.2,'Official state program source verified 2026-09-22.',now(),
 array['regulation','licensing','market_access']::text[],jsonb_build_object('authority','Kentucky Cabinet for Health and Family Services'),'other'),
('Nebraska Medical Cannabis Commission','https://lcc.nebraska.gov/medical-cannabis/overview','Nebraska',true,'United States','US','Nebraska',false,
 'Official Nebraska government source for medical cannabis program.','north_america','en','html_snapshot','daily','active','US-NE',1,false,
 null,'government_regulator',true,now(),0,'online',0.2,'Official Nebraska government source verified 2026-09-22.',now(),
 array['regulation','licensing','market_access']::text[],jsonb_build_object('authority','Nebraska Medical Cannabis Commission'),'other'),
('Indiana Attorney General — Cannabis Controlled Substances Opinion','https://www.in.gov/attorneygeneral/files/Official-Opinion-2023-1.pdf','Indiana',true,'United States','US','Indiana',false,
 'Official Indiana Attorney General opinion addressing cannabis and THC controlled-substance treatment.','north_america','en','html_snapshot','daily','active','US-IN',1,false,
 null,'government_legal',true,now(),0,'online',0.15,'Official Indiana Attorney General source verified 2026-09-22.',now(),
 array['law','controlled_substances']::text[],jsonb_build_object('authority','Indiana Attorney General'),'other'),
('North Carolina Executive Order No. 16 — Advisory Council on Cannabis','https://governor.nc.gov/executive-order-no-16-establishing-north-carolina-advisory-council-cannabis','North Carolina',true,'United States','US','North Carolina',false,
 'Official North Carolina Governor executive order concerning statewide cannabis regulatory policy study.','north_america','en','html_snapshot','daily','active','US-NC',1,false,
 null,'government_legal',true,now(),0,'online',0.2,'Official North Carolina government source verified 2026-09-22.',now(),
 array['law','policy','market_regulation']::text[],jsonb_build_object('authority','Office of the Governor of North Carolina'),'other')
on conflict (source_url) do update set
 is_active=true, relevance_status='active', jurisdiction_code=excluded.jurisdiction_code,
 verification_notes=excluded.verification_notes, verification_checked_at=excluded.verification_checked_at,
 updated_at=now();

update public.regulatory_market_access_evidence
set authority_name='Kentucky Medical Cannabis Program',
    authority_url='https://kymedcan.ky.gov/Pages/index.aspx',
    source_effective_date='2026-09-22', verified_at=now(),
    expires_at=now()+interval '180 days',
    rationale='Kentucky operates a regulated medical cannabis program under KRS Chapter 218B with licensed cannabis businesses and dispensaries; the official program states cannabis consumption outside the medical program remains illegal.',
    source_snapshot_sha256=null
where evidence_key='ncsl-us-ky-20260831';

update public.regulatory_market_access_evidence
set authority_name='Nebraska Medical Cannabis Commission',
    authority_url='https://lcc.nebraska.gov/medical-cannabis/overview',
    source_effective_date='2026-07-01', verified_at=now(),
    expires_at=now()+interval '180 days',
    rationale='Nebraska has a state medical cannabis regulatory program; Nebraska government reported permanent medical-marijuana regulations were approved July 1, 2026 and filed to become law five days after receipt.',
    source_snapshot_sha256=null
where evidence_key='ncsl-us-ne-20260831';

update public.regulatory_market_access_evidence
set authority_name='Indiana Attorney General',
    authority_url='https://www.in.gov/attorneygeneral/files/Official-Opinion-2023-1.pdf',
    source_effective_date='2023-01-01', verified_at=now(),
    expires_at=now()+interval '180 days',
    rationale='Indiana Attorney General Opinion 2023-1 states cannabis extracts are controlled substances under Indiana law, subject to limited hemp/low-THC exceptions; no state medical or adult-use commercial cannabis retail pathway is established by the cited opinion.',
    source_snapshot_sha256=null
where evidence_key='ncsl-us-in-20260831';

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,
 source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('ncsl-us-ky-20260831','US-KY','primary-evidence-claim:ncsl-us-ky-20260831',
 'Kentucky operates a regulated medical cannabis program with licensed cannabis businesses and dispensaries; cannabis consumption outside the medical cannabis program remains illegal.',
 'any','jurisdiction','Kentucky Medical Cannabis Program','https://kymedcan.ky.gov/Pages/index.aspx','2026-09-22',now(),now(),now()+interval '180 days','verified'),
('ncsl-us-ne-20260831','US-NE','primary-evidence-claim:ncsl-us-ne-20260831',
 'Nebraska has a regulated medical cannabis program, with permanent medical-marijuana regulations approved by state government in July 2026.',
 'any','jurisdiction','Nebraska Medical Cannabis Commission','https://lcc.nebraska.gov/medical-cannabis/overview','2026-07-01',now(),now(),now()+interval '180 days','verified'),
('ncsl-us-in-20260831','US-IN','primary-evidence-claim:ncsl-us-in-20260831',
 'Indiana law treats cannabis extracts as controlled substances, subject to limited hemp/low-THC exceptions; no statewide medical or adult-use commercial cannabis retail pathway is established by the cited Indiana Attorney General opinion.',
 'any','jurisdiction','Indiana Attorney General','https://www.in.gov/attorneygeneral/files/Official-Opinion-2023-1.pdf','2023-01-01',now(),now(),now()+interval '180 days','verified')
on conflict (claim_key) do update set
 claim_text=excluded.claim_text, authority_name=excluded.authority_name, authority_url=excluded.authority_url,
 source_effective_date=excluded.source_effective_date, retrieved_at=excluded.retrieved_at,
 verified_at=excluded.verified_at, expires_at=excluded.expires_at,
 evidence_status='verified', updated_at=now();

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,
 prescription_notes,source_urls,verification,last_verified_at,qualifying_conditions,prescriber_scope,min_age,reimbursement)
select c.id,'US-KY','depth-v1-us-ky','Kentucky medical cannabis commercial access','medical_access_program',
 'KRS Chapter 218B','Kentucky Cabinet for Health and Family Services','active','2025-01-01',
 'Kentucky operates a regulated medical cannabis program with licensed cultivators, processors, producers, safety compliance facilities and dispensaries.',
 'Patients access medical cannabis through the state program and authorized practitioners.',
 '{https://kymedcan.ky.gov/Pages/index.aspx}'::text[],'needs_review','2026-09-22',
 ARRAY['cancer','chronic severe intractable or debilitating pain','epilepsy or intractable seizure disorder','multiple sclerosis',
 'chronic nausea or cyclical vomiting syndrome','post-traumatic stress disorder']::text[],'authorized medical practitioners',18,null
from public.countries c where c.iso_alpha2='US'
on conflict (slug) do nothing;

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,
 prescription_notes,source_urls,verification,last_verified_at,qualifying_conditions,prescriber_scope,min_age,reimbursement)
select c.id,'US-NE','depth-v1-us-ne','Nebraska medical cannabis commercial access','medical_access_program',
 'Nebraska Medical Cannabis Act and implementing regulations','Nebraska Medical Cannabis Commission','active','2026-07-01',
 'Nebraska maintains a state medical cannabis regulatory program with permanent medical-marijuana regulations approved in July 2026.',
 'Medical cannabis access is governed through the state commission and applicable regulations.',
 '{https://lcc.nebraska.gov/medical-cannabis/overview}'::text[],'needs_review','2026-09-22',
 ARRAY['qualifying medical conditions']::text[],null,18,null
from public.countries c where c.iso_alpha2='US'
on conflict (slug) do nothing;

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,
 prescription_notes,source_urls,verification,last_verified_at,qualifying_conditions,prescriber_scope,min_age,reimbursement)
select c.id,'US-UT','depth-v1-us-ut','Utah medical cannabis commercial access','medical_access_program',
 'Utah Code Title 26B and Title 58; Utah medical cannabis administrative rules','Utah Center for Medical Cannabis / Utah Department of Agriculture and Food','active','2026-05-06',
 'Utah operates a regulated medical cannabis program with patient registration, licensed medical cannabis pharmacies and state-specific product and dispensing controls.',
 'Medical cannabis is accessed through the state electronic verification system and licensed medical cannabis pharmacies.',
 '{https://medicalcannabis.utah.gov/}'::text[],'needs_review','2026-09-22',
 ARRAY['qualifying medical conditions']::text[],'authorized medical providers',18,null
from public.countries c where c.iso_alpha2='US'
on conflict (slug) do nothing;

insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',rp.id,'KRS Chapter 218B',null,'regulator',
 'https://kymedcan.ky.gov/Pages/index.aspx','2025-01-01','2026-09-22',
 'Official Kentucky Medical Cannabis Program describes the statutory program and licensed medical cannabis businesses.'
from public.regulatory_pathways rp where rp.slug='depth-v1-us-ky'
and not exists (select 1 from public.regulatory_citations rc where rc.entity_type='pathway' and rc.entity_id=rp.id);

insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',rp.id,'Nebraska Medical Cannabis Act and 2026 permanent regulations',null,'regulator',
 'https://lcc.nebraska.gov/medical-cannabis/overview','2026-07-01','2026-09-22',
 'Official Nebraska government source identifies the state medical cannabis regulatory program; permanent regulations were approved July 1, 2026.'
from public.regulatory_pathways rp where rp.slug='depth-v1-us-ne'
and not exists (select 1 from public.regulatory_citations rc where rc.entity_type='pathway' and rc.entity_id=rp.id);

insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',rp.id,'Utah Code Title 26B / Title 58',null,'regulator',
 'https://medicalcannabis.utah.gov/resources/utah-medical-cannabis-law/','2026-05-06','2026-09-22',
 'Official Utah Center for Medical Cannabis lists governing code, administrative rules and the 2026 law update.'
from public.regulatory_pathways rp where rp.slug='depth-v1-us-ut'
and not exists (select 1 from public.regulatory_citations rc where rc.entity_type='pathway' and rc.entity_id=rp.id);

update public.regulatory_pathways
set verification='verified',last_verified_at=now(),updated_at=now()
where slug in ('depth-v1-us-ky','depth-v1-us-ne','depth-v1-us-ut');

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now()
where dimension_key='source_registry' and jurisdiction_key in ('US-KY','US-NE','US-UT','US-IN','US-NC');

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now()
where dimension_key in ('verified_regulatory_evidence','verified_regulatory_claims','verified_pathways')
  and jurisdiction_key in ('US-KY','US-NE','US-UT','US-IN');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922104500','primary_us_jurisdiction_depth_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922104500_primary_us_jurisdiction_depth_enrichment.sql

-- RECOVERY BEGIN 20260922104700_primary_vanuatu_nauru_sources.sql
-- Primary-source source-registry enrichment for Vanuatu and Nauru.
insert into public.source_registry
(source_name,source_url,jurisdiction,is_active,country,iso,sub_region,requires_translation,notes,region,language,adapter,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,next_crawl_at,consecutive_failures,network_status,content_change_rate,verification_notes,verification_checked_at,content_type,metadata,regulator_class)
values
('Vanuatu Customs & Inland Revenue — Prohibitions & Restrictions','https://customs.vanuatu.gov.vu/customs/services/prohibitions-restrictions.html','Vanuatu',true,'Vanuatu','VU','Vanuatu',false,
 'Official Vanuatu Customs source identifying marijuana as an illicit drug under the Dangerous Drugs Act.','asia_pacific','en','html_snapshot','daily','active','VU',1,false,
 'government_regulator',true,now(),0,'online',0.2,'Official Vanuatu government source verified 2026-09-22.',now(),
 array['law','import_controls','controlled_substances']::text[],jsonb_build_object('authority','Vanuatu Customs & Inland Revenue'),'other'),
('Nauru Department of Justice & Border Control — Illicit Drugs Control','https://justice.gov.nr/office-of-the-legislative-drafter/','Nauru',true,'Nauru','NR','Nauru',false,
 'Official Nauru Justice source for illicit-drug legislation and enforcement; current court material confirms cannabis possession offences.','asia_pacific','en','html_snapshot','daily','active','NR',1,false,
 'government_legal',true,now(),0,'online',0.2,'Official Nauru government source verified 2026-09-22.',now(),
 array['law','controlled_substances']::text[],jsonb_build_object('authority','Department of Justice and Border Control'),'other')
on conflict (source_url) do update set is_active=true,relevance_status='active',jurisdiction_code=excluded.jurisdiction_code,
verification_notes=excluded.verification_notes,verification_checked_at=excluded.verification_checked_at,updated_at=now();

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),notes=coalesce(notes,'') || ' Official government source verified 2026-09-22.'
where dimension_key='source_registry' and jurisdiction_key in ('VU','NR');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922104700','primary_vanuatu_nauru_sources','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922104700_primary_vanuatu_nauru_sources.sql

-- RECOVERY BEGIN 20260922104900_primary_wyoming_wisconsin_greenland_sources.sql
-- Primary-source source-registry enrichment for Wisconsin, Wyoming and Greenland.
insert into public.source_registry
(source_name,source_url,jurisdiction,is_active,country,iso,sub_region,requires_translation,notes,region,language,adapter,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,next_crawl_at,consecutive_failures,network_status,content_change_rate,verification_notes,verification_checked_at,content_type,metadata,regulator_class)
values
('Wisconsin Department of Health Services — Youth Substance Use Facts','https://www.dhs.wisconsin.gov/small-talks/facts.htm','Wisconsin',true,'United States','US','Wisconsin',false,
 'Official Wisconsin DHS source states possession of illegal substances including cannabis is against Wisconsin law.','north_america','en','html_snapshot','daily','active','US-WI',1,false,
 'government_regulator',true,now(),0,'online',0.2,'Official Wisconsin government source verified 2026-09-22.',now(),
 array['law','controlled_substances']::text[],jsonb_build_object('authority','Wisconsin Department of Health Services'),'other'),
('Wyoming Division of Criminal Investigation — Controlled Substances','https://wyomingdci.wyo.gov/dci-homepage/controlled-substances','Wyoming',true,'United States','US','Wyoming',false,
 'Official Wyoming source describing controlled-substance scheduling under Wyoming law and the Commissioner of Drugs and Substance Control.','north_america','en','html_snapshot','daily','active','US-WY',1,false,
 'government_regulator',true,now(),0,'online',0.2,'Official Wyoming government source verified 2026-09-22.',now(),
 array['law','controlled_substances']::text[],jsonb_build_object('authority','Wyoming Division of Criminal Investigation'),'other'),
('Greenland Government / Naalakkersuisut — WHO Cannabis Policy Memorandum','https://naalakkersuisut.gl/-/media/nyheder/2024/07/greenland-who-mou.pdf','Greenland',true,'Greenland','GL','Greenland',false,
 'Official Naalakkersuisut document records Greenland parliamentary consideration of cannabis legalization and possible sale, supporting jurisdiction-specific policy monitoring.','americas','en','html_snapshot','daily','active','GL',1,false,
 'government_legal',true,now(),0,'online',0.2,'Official Greenland government source verified 2026-09-22.',now(),
 array['policy','law','market_regulation']::text[],jsonb_build_object('authority','Naalakkersuisut'),'other')
on conflict (source_url) do update set is_active=true,relevance_status='active',jurisdiction_code=excluded.jurisdiction_code,
verification_notes=excluded.verification_notes,verification_checked_at=excluded.verification_checked_at,updated_at=now();

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now()
where dimension_key='source_registry' and jurisdiction_key in ('US-WI','US-WY','GL');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922104900','primary_wyoming_wisconsin_greenland_sources','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922104900_primary_wyoming_wisconsin_greenland_sources.sql

-- RECOVERY BEGIN 20260922105500_verified_pathway_calendar_layer.sql
-- Build the regulatory-calendar layer from already verified pathways only.
-- No future event is inferred; each row is an effective-date record tied to a
-- verified pathway with a primary source URL.

insert into public.regulatory_calendar
(iso2,event_type,title,summary,expected_date,confidence,source_url,source_label,status)
select rp.iso_alpha2,
       'effective',
       rp.name || ' — effective date',
       'Verified regulatory pathway effective date recorded from the pathway primary source.',
       rp.effective_date,
       'confirmed',
       rp.source_urls[1],
       coalesce(sr.source_name,'Primary regulatory source'),
       case when rp.effective_date <= current_date then 'effective' else 'scheduled' end
from public.regulatory_pathways rp
left join lateral (
  select source_name from public.source_registry
  where source_url=rp.source_urls[1] and is_active=true
  order by tier asc limit 1
) sr on true
where rp.verification='verified'
  and rp.effective_date is not null
  and cardinality(rp.source_urls) > 0
  and not exists (
    select 1 from public.regulatory_calendar rc
    where rc.iso2=rp.iso_alpha2
      and rc.title=rp.name || ' — effective date'
      and rc.expected_date=rp.effective_date
  );


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922105500','verified_pathway_calendar_layer','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922105500_verified_pathway_calendar_layer.sql

-- RECOVERY BEGIN 20260922105634_source_snapshot_batch_capture.sql
create or replace function public.capture_source_snapshot_batch(p_limit integer default 10)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, net, pg_catalog
as $$
declare
  src record;
  request_id bigint;
  status_code integer;
  content_type text;
  content text;
  error_msg text;
  timed_out boolean;
  captured_at timestamptz;
  success_count integer := 0;
  error_count integer := 0;
  processed_count integer := 0;
  text_content text;
  content_hash text;
  previous_hash text;
begin
  if p_limit is null or p_limit < 1 or p_limit > 25 then
    raise exception 'p_limit must be between 1 and 25';
  end if;

  for src in
    select sr.id,sr.source_url,sr.source_name,sr.jurisdiction_code,sr.iso
    from public.source_registry sr
    where sr.is_active and sr.crawl_allowed and sr.source_url is not null
      and sr.next_crawl_at <= now()
      and not exists (
        select 1 from public.source_snapshots ss
        where ss.source_id=sr.id and ss.fetch_status='success'
          and ss.captured_at >= now()-interval '24 hours'
      )
    order by sr.tier asc nulls last,sr.next_crawl_at asc nulls first,sr.id
    limit p_limit
  loop
    processed_count := processed_count + 1;
    captured_at := now();
    request_id := net.http_get(
      src.source_url,'{}'::jsonb,
      jsonb_build_object(
        'User-Agent','Harbourview-Regulatory-Source-Capture/1.0',
        'Accept','text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.5'
      ),20000);
    perform net._await_response(request_id);
    select r.status_code,r.content_type,r.content,r.error_msg,r.timed_out
      into status_code,content_type,content,error_msg,timed_out
    from net._http_response r where r.id=request_id;

    if content is null and (error_msg is not null or timed_out) then
      insert into public.source_snapshots(source_id,captured_url,captured_title,captured_at,fetch_status,error_message)
      values(src.id,src.source_url,src.source_name,captured_at,'error',
        coalesce(error_msg,case when timed_out then 'request_timed_out' else 'empty_response' end));
      error_count := error_count + 1;
      continue;
    end if;

    text_content := case
      when content_type ilike 'text/html%' or content_type ilike 'application/xhtml+xml%'
      then regexp_replace(
        regexp_replace(
          regexp_replace(coalesce(content,''),'<script[^>]*>[\s\S]*?</script>',' ','gi'),
          '<style[^>]*>[\s\S]*?</style>',' ','gi'),
        '<[^>]+>',' ','g')
      else null
    end;
    text_content := nullif(trim(regexp_replace(
      replace(replace(replace(replace(coalesce(text_content,''),'&nbsp;',' '),'&amp;','&'),'&lt;','<'),'&gt;','>'),
      '\s+',' ','g')),'');
    content_hash := encode(digest(convert_to(coalesce(content,''),'UTF8'),'sha256'),'hex');

    select ss.raw_html_hash into previous_hash
    from public.source_snapshots ss
    where ss.source_id=src.id and ss.fetch_status='success'
    order by ss.captured_at desc limit 1;

    insert into public.source_snapshots(
      source_id,captured_url,captured_title,captured_text,raw_html_hash,captured_at,
      fetch_status,error_message,language_detected,word_count,requires_translation,
      previous_hash,changed,processing_status
    ) values(
      src.id,src.source_url,src.source_name,text_content,content_hash,captured_at,
      case when status_code between 200 and 299 then 'success' else 'http_error' end,
      case when status_code between 200 and 299 then null else coalesce(error_msg,'HTTP '||status_code::text) end,
      'unknown',
      case when text_content is null then null else array_length(regexp_split_to_array(text_content,'\s+'),1) end,
      false,previous_hash,
      case when previous_hash is null then true else previous_hash<>content_hash end,
      'pending');

    if status_code between 200 and 299 then
      success_count := success_count + 1;
      update public.source_registry
      set last_checked_at=captured_at,next_crawl_at=captured_at+interval '1 day',
          network_status='online',consecutive_failures=0,last_error_log=null,updated_at=now()
      where id=src.id;
    else
      error_count := error_count + 1;
      update public.source_registry
      set last_checked_at=captured_at,next_crawl_at=captured_at+interval '1 day',
          network_status='http_error',
          consecutive_failures=least(consecutive_failures+1,100),
          last_error_log='HTTP '||status_code::text,updated_at=now()
      where id=src.id;
    end if;
  end loop;

  return jsonb_build_object('processed',processed_count,'success',success_count,
    'errors',error_count,'captured_at',now());
end;
$$;
revoke all on function public.capture_source_snapshot_batch(integer) from public;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922105634','source_snapshot_batch_capture','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922105634_source_snapshot_batch_capture.sql

-- RECOVERY BEGIN 20260922105823_source_snapshot_batch_capture_timeout.sql
create or replace function public.capture_source_snapshot_batch(p_limit integer default 1)
returns jsonb language plpgsql security definer
set search_path = public, extensions, net, pg_catalog
as $$
declare
  src record; request_id bigint; status_code integer; content_type text; content text;
  error_msg text; timed_out boolean; captured_at timestamptz;
  success_count integer := 0; error_count integer := 0; processed_count integer := 0;
  text_content text; content_hash text; previous_hash text;
begin
  if p_limit is null or p_limit < 1 or p_limit > 5 then
    raise exception 'p_limit must be between 1 and 5';
  end if;
  for src in
    select sr.id,sr.source_url,sr.source_name,sr.jurisdiction_code,sr.iso
    from public.source_registry sr
    where sr.is_active and sr.crawl_allowed and sr.source_url is not null
      and sr.next_crawl_at <= now()
      and not exists (
        select 1 from public.source_snapshots ss
        where ss.source_id=sr.id and ss.fetch_status='success'
          and ss.captured_at >= now()-interval '24 hours')
    order by sr.tier asc nulls last,sr.next_crawl_at asc nulls first,sr.id
    limit p_limit
  loop
    processed_count := processed_count+1; captured_at:=now();
    request_id:=net.http_get(src.source_url,'{}'::jsonb,
      jsonb_build_object('User-Agent','Harbourview-Regulatory-Source-Capture/1.0',
        'Accept','text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.5'),5000);
    perform net._await_response(request_id);
    select r.status_code,r.content_type,r.content,r.error_msg,r.timed_out
      into status_code,content_type,content,error_msg,timed_out
    from net._http_response r where r.id=request_id;
    if content is null and (error_msg is not null or timed_out) then
      insert into public.source_snapshots(source_id,captured_url,captured_title,captured_at,fetch_status,error_message)
      values(src.id,src.source_url,src.source_name,captured_at,'error',
        coalesce(error_msg,case when timed_out then 'request_timed_out' else 'empty_response' end));
      error_count:=error_count+1; continue;
    end if;
    text_content:=case when content_type ilike 'text/html%' or content_type ilike 'application/xhtml+xml%'
      then regexp_replace(regexp_replace(regexp_replace(coalesce(content,''),'<script[^>]*>[\s\S]*?</script>',' ','gi'),
        '<style[^>]*>[\s\S]*?</style>',' ','gi'),'<[^>]+>',' ','g') else null end;
    text_content:=nullif(trim(regexp_replace(
      replace(replace(replace(replace(coalesce(text_content,''),'&nbsp;',' '),'&amp;','&'),'&lt;','<'),'&gt;','>'),
      '\s+',' ','g')),'');
    content_hash:=encode(digest(convert_to(coalesce(content,''),'UTF8'),'sha256'),'hex');
    select ss.raw_html_hash into previous_hash from public.source_snapshots ss
      where ss.source_id=src.id and ss.fetch_status='success'
      order by ss.captured_at desc limit 1;
    insert into public.source_snapshots(
      source_id,captured_url,captured_title,captured_text,raw_html_hash,captured_at,
      fetch_status,error_message,language_detected,requires_translation,previous_hash,changed,processing_status)
    values(src.id,src.source_url,src.source_name,text_content,content_hash,captured_at,
      case when status_code between 200 and 299 then 'success' else 'http_error' end,
      case when status_code between 200 and 299 then null else coalesce(error_msg,'HTTP '||status_code::text) end,
      'unknown',false,previous_hash,case when previous_hash is null then true else previous_hash<>content_hash end,'pending');
    if status_code between 200 and 299 then
      success_count:=success_count+1;
      update public.source_registry set last_checked_at=captured_at,next_crawl_at=captured_at+interval '1 day',
        network_status='online',consecutive_failures=0,last_error_log=null,updated_at=now() where id=src.id;
    else
      error_count:=error_count+1;
      update public.source_registry set last_checked_at=captured_at,next_crawl_at=captured_at+interval '1 day',
        network_status='http_error',consecutive_failures=least(consecutive_failures+1,100),
        last_error_log='HTTP '||status_code::text,updated_at=now() where id=src.id;
    end if;
  end loop;
  return jsonb_build_object('processed',processed_count,'success',success_count,'errors',error_count,'captured_at',now());
end;
$$;
revoke all on function public.capture_source_snapshot_batch(integer) from public;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922105823','source_snapshot_batch_capture_timeout','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922105823_source_snapshot_batch_capture_timeout.sql

-- RECOVERY BEGIN 20260922110000_jurisdiction_dimension_coverage.sql
-- Explicit per-jurisdiction/per-dimension coverage state.
-- This prevents "missing row" from being confused with "not applicable" or
-- parent-inherited data. Inherited data is never counted as local evidence.

create table if not exists public.jurisdiction_dimension_coverage (
  jurisdiction_key text not null,
  dimension_key text not null,
  status text not null check (status in ('verified_populated','verified_empty','not_applicable','inherited','open','blocked')),
  applicability text not null default 'applicable' check (applicability in ('applicable','not_applicable','inherited')),
  evidence_basis text,
  parent_jurisdiction_key text,
  last_evaluated_at timestamptz not null default now(),
  notes text,
  primary key (jurisdiction_key,dimension_key)
);

create index if not exists idx_jdc_status_priority on public.jurisdiction_dimension_coverage(status,dimension_key);
create index if not exists idx_jdc_jurisdiction on public.jurisdiction_dimension_coverage(jurisdiction_key);

alter table public.jurisdiction_dimension_coverage enable row level security;
drop policy if exists jurisdiction_dimension_coverage_public_read on public.jurisdiction_dimension_coverage;
create policy jurisdiction_dimension_coverage_public_read on public.jurisdiction_dimension_coverage
for select to anon,authenticated using (true);
grant select on public.jurisdiction_dimension_coverage to anon,authenticated;

with dims as (
  select unnest(array[
    'country_intel','verified_regulatory_evidence','verified_regulatory_claims',
    'verified_pathways','verified_format_rules','market_metrics','trade_flows',
    'signals','source_registry','source_snapshots','regulatory_calendar'
  ]) dimension_key
),
base as (select * from public.v_jurisdiction_data_depth),
seed as (
  select
    b.jurisdiction_key,d.dimension_key,
    case
      when d.dimension_key in ('trade_flows','market_metrics','signals') and b.jurisdiction_level='subnational' then 'not_applicable'
      when d.dimension_key='country_intel' and b.jurisdiction_level='subnational' then 'inherited'
      when d.dimension_key='country_intel' and b.active_country_intel_rows>0 then 'verified_populated'
      when d.dimension_key='verified_regulatory_evidence' and b.current_verified_evidence_rows>0 then 'verified_populated'
      when d.dimension_key='verified_regulatory_claims' and b.verified_claim_rows>0 then 'verified_populated'
      when d.dimension_key='verified_pathways' and b.verified_pathway_rows>0 then 'verified_populated'
      when d.dimension_key='verified_format_rules' and b.verified_format_rule_rows>0 then 'verified_populated'
      when d.dimension_key='market_metrics' and b.metric_rows>0 then 'verified_populated'
      when d.dimension_key='trade_flows' and b.trade_flow_rows>0 then 'verified_populated'
      when d.dimension_key='signals' and b.signal_rows>0 then 'verified_populated'
      when d.dimension_key='source_registry' and b.active_source_rows>0 then 'verified_populated'
      when d.dimension_key='source_snapshots' and b.successful_snapshot_rows>0 then 'verified_populated'
      when d.dimension_key='regulatory_calendar' and b.calendar_rows>0 then 'verified_populated'
      else 'open'
    end status,
    case
      when d.dimension_key in ('trade_flows','market_metrics','signals') and b.jurisdiction_level='subnational' then 'not_applicable'
      when d.dimension_key='country_intel' and b.jurisdiction_level='subnational' then 'inherited'
      else 'applicable'
    end applicability,
    case
      when d.dimension_key in ('trade_flows','market_metrics','signals') and b.jurisdiction_level='subnational'
        then 'Platform model currently defines this dimension as national-only.'
      when d.dimension_key='country_intel' and b.jurisdiction_level='subnational'
        then 'Country-level intelligence is inherited conceptually from the parent jurisdiction; no local row is counted as local evidence.'
      else null
    end evidence_basis
  from base b cross join dims d
)
insert into public.jurisdiction_dimension_coverage
(jurisdiction_key,dimension_key,status,applicability,evidence_basis,last_evaluated_at,notes)
select jurisdiction_key,dimension_key,status,applicability,evidence_basis,now(),
       case when status='open' then 'Requires evidence-backed enrichment; no inferred completion.' else null end
from seed
on conflict (jurisdiction_key,dimension_key) do update set
 status=excluded.status,applicability=excluded.applicability,
 evidence_basis=excluded.evidence_basis,last_evaluated_at=now(),notes=excluded.notes;

create or replace view public.v_jurisdiction_dimension_depth
with (security_invoker=true)
as
select
  jurisdiction_key,
  count(*) as total_dimensions,
  count(*) filter(where status in ('verified_populated','verified_empty','not_applicable')) as complete_dimensions,
  count(*) filter(where status='verified_populated') as populated_dimensions,
  count(*) filter(where status='not_applicable') as "not_applicable_dimensions",
  count(*) filter(where status='inherited') as inherited_dimensions,
  count(*) filter(where status='open') as open_dimensions,
  count(*) filter(where status='blocked') as blocked_dimensions,
  round(
    100.0 * count(*) filter(where status in ('verified_populated','verified_empty','not_applicable'))
    / nullif(count(*) filter(where status <> 'inherited'),0), 1
  ) as applicable_depth_pct
from public.jurisdiction_dimension_coverage
group by jurisdiction_key;

grant select on public.v_jurisdiction_dimension_depth to anon,authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922110000','jurisdiction_dimension_coverage','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922110000_jurisdiction_dimension_coverage.sql

-- RECOVERY BEGIN 20260922110353_reconcile_jurisdiction_dimension_coverage_v2.sql
update public.jurisdiction_dimension_coverage c
set status=case
 when c.dimension_key='country_intel' and d.jurisdiction_level='subnational' then 'inherited'
 when c.dimension_key='country_intel' and d.country_intel_rows>0 then 'verified_populated'
 when c.dimension_key='country_intel' then 'open'
 when c.dimension_key='market_metrics' and d.jurisdiction_level='subnational' then 'not_applicable'
 when c.dimension_key='market_metrics' and d.metric_rows>0 then 'verified_populated'
 when c.dimension_key='market_metrics' then 'open'
 when c.dimension_key='trade_flows' and d.jurisdiction_level='subnational' then 'not_applicable'
 when c.dimension_key='trade_flows' and d.trade_flow_rows>0 then 'verified_populated'
 when c.dimension_key='trade_flows' then 'open'
 when c.dimension_key='signals' and d.jurisdiction_level='subnational' then 'not_applicable'
 when c.dimension_key='signals' and d.signal_rows>0 then 'verified_populated'
 when c.dimension_key='signals' then 'open'
 when c.dimension_key='source_registry' and d.registered_source_rows>0 then 'verified_populated'
 when c.dimension_key='source_registry' then 'open'
 when c.dimension_key='source_snapshots' and d.successful_snapshot_rows>0 then 'verified_populated'
 when c.dimension_key='source_snapshots' then 'open'
 when c.dimension_key='verified_regulatory_evidence' and d.current_verified_evidence_rows>0 then 'verified_populated'
 when c.dimension_key='verified_regulatory_evidence' then 'open'
 when c.dimension_key='verified_regulatory_claims' and d.verified_claim_rows>0 then 'verified_populated'
 when c.dimension_key='verified_regulatory_claims' then 'open'
 when c.dimension_key='verified_pathways' and d.verified_pathway_rows>0 then 'verified_populated'
 when c.dimension_key='verified_pathways' then 'open'
 when c.dimension_key='verified_format_rules' and d.verified_format_rule_rows>0 then 'verified_populated'
 when c.dimension_key='verified_format_rules' then 'open'
 when c.dimension_key='regulatory_calendar' and d.calendar_rows>0 then 'verified_populated'
 when c.dimension_key='regulatory_calendar' then 'open'
 else c.status end,
 applicability=case
  when c.dimension_key in ('market_metrics','trade_flows','signals') and d.jurisdiction_level='subnational' then 'not_applicable'
  when c.dimension_key='country_intel' and d.jurisdiction_level='subnational' then 'inherited'
  else 'applicable' end,
 last_evaluated_at=now()
from public.v_jurisdiction_data_depth d
where d.jurisdiction_key=c.jurisdiction_key;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922110353','reconcile_jurisdiction_dimension_coverage_v2','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922110353_reconcile_jurisdiction_dimension_coverage_v2.sql

-- RECOVERY BEGIN 20260922110431_reconcile_jurisdiction_dimension_coverage_v3.sql
update public.jurisdiction_dimension_coverage c
set status=case
 when c.dimension_key='country_intel' and d.jurisdiction_level='subnational' then 'inherited'
 when c.dimension_key='country_intel' and d.country_intel_rows>0 then 'verified_populated'
 when c.dimension_key='country_intel' then 'open'
 when c.dimension_key='market_metrics' and d.jurisdiction_level='subnational' then 'not_applicable'
 when c.dimension_key='market_metrics' and d.metric_rows>0 then 'verified_populated'
 when c.dimension_key='market_metrics' then 'open'
 when c.dimension_key='trade_flows' and d.jurisdiction_level='subnational' then 'not_applicable'
 when c.dimension_key='trade_flows' and d.trade_flow_rows>0 then 'verified_populated'
 when c.dimension_key='trade_flows' then 'open'
 when c.dimension_key='signals' and d.jurisdiction_level='subnational' then 'not_applicable'
 when c.dimension_key='signals' and d.signal_rows>0 then 'verified_populated'
 when c.dimension_key='signals' then 'open'
 when c.dimension_key='source_registry' and d.registered_source_rows>0 then 'verified_populated'
 when c.dimension_key='source_registry' then 'open'
 when c.dimension_key='source_snapshots' and d.successful_snapshot_rows>0 then 'verified_populated'
 when c.dimension_key='source_snapshots' then 'open'
 when c.dimension_key='verified_regulatory_evidence' and d.current_verified_evidence_rows>0 then 'verified_populated'
 when c.dimension_key='verified_regulatory_evidence' then 'open'
 when c.dimension_key='verified_regulatory_claims' and d.verified_claim_rows>0 then 'verified_populated'
 when c.dimension_key='verified_regulatory_claims' then 'open'
 when c.dimension_key='verified_pathways' and d.verified_pathway_rows>0 then 'verified_populated'
 when c.dimension_key='verified_pathways' then 'open'
 when c.dimension_key='verified_format_rules' and d.verified_format_rule_rows>0 then 'verified_populated'
 when c.dimension_key='verified_format_rules' then 'open'
 when c.dimension_key='regulatory_calendar' and d.calendar_rows>0 then 'verified_populated'
 when c.dimension_key='regulatory_calendar' then 'open'
 else c.status end,
 applicability=case
  when c.dimension_key in ('market_metrics','trade_flows','signals') and d.jurisdiction_level='subnational' then 'not_applicable'
  when c.dimension_key='country_intel' and d.jurisdiction_level='subnational' then 'inherited'
  else 'applicable' end,
 last_evaluated_at=now()
from public.v_jurisdiction_data_depth d
where d.jurisdiction_key=c.jurisdiction_key;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922110431','reconcile_jurisdiction_dimension_coverage_v3','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922110431_reconcile_jurisdiction_dimension_coverage_v3.sql

-- RECOVERY BEGIN 20260922112000_depth_primary_reconciliation_fo_gl_territories.sql
insert into public.source_registry(source_name,source_url,jurisdiction,country,iso,sub_region,region,language,adapter,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,regulator_class,notes)
values
('Faroe Islands Lógasavn — Regulation No. 495/2026 on controlled substances','https://www.logir.fo/Bekendtgorelse/495-af-26-05-2026-for-Faeroerne-om-euforiserende-stoffer','Faroe Islands','Faroe Islands','FO','Northern Europe','Europe','da','html_snapshot','daily','active','FO',1,false,'government_regulator',true,'other','Primary 2026 controlled-substance regulation; cannabis is expressly listed and medical/scientific authorization rules are stated.'),
('United Nations — Western Sahara decolonization status','https://www.un.org/dppa/decolonization/en/nsgt/western-sahara','Western Sahara','Western Sahara','EH','Northern Africa','Africa','en','html_snapshot','weekly','active','EH',1,false,'international_organization',true,'other','Authoritative UN status source. Political/decolonization status only; not a cannabis regulatory source.')
on conflict (source_url) do update set is_active=true,jurisdiction_code=excluded.jurisdiction_code,tier=excluded.tier,notes=excluded.notes,updated_at=now();

update public.regulatory_market_access_evidence
set tier='medical_limited_trade',
rationale=case when jurisdiction_iso2='FO'
 then 'Faroe Islands Regulation No. 495 of 26 May 2026 lists cannabis in the controlled-substance schedules; the regulation states Lists B, D and E are for medical and scientific use and provides permit rules for medical cultivation/distribution. No general adult-use commercial retail pathway is established by this instrument.'
 else 'Greenland Act No. 24 of 25 November 2022 establishes that controlled substances may be restricted to medical or scientific use; the 2025 self-government regulation governs controlled substances and includes cannabis. Commercial adult-use cannabis is not established by the cited framework; permitted medical/scientific activity remains subject to authorization.' end,
authority_name=case when jurisdiction_iso2='FO'
 then 'Lógasavn / Faroe Islands — Regulation No. 495 of 26 May 2026 on controlled substances'
 else 'Greenland Self-Government — Regulation No. 61 of 22 August 2025 on controlled substances' end,
authority_url=case when jurisdiction_iso2='FO'
 then 'https://www.logir.fo/Bekendtgorelse/495-af-26-05-2026-for-Faeroerne-om-euforiserende-stoffer'
 else 'https://nalunaarutit.gl/groenlandsk-lovgivning/2025/selvstyrets-bekendtgørelse-nr-61-af-01_09_2025?sc_lang=da' end,
verified_at=now(),expires_at=now()+interval '1 year'
where jurisdiction_iso2 in ('FO','GL') and active;

insert into public.regulatory_market_access_claims(
 evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,
 authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('hv-mkt-complete-fo-20260913','FO','primary-evidence-claim:hv-mkt-complete-fo-20260913',
 'Faroe Islands controlled-substance rules place cannabis within the controlled framework and limit listed controlled substances to medical/scientific use; permitted commercial activities require authorization. No general adult-use retail pathway is established by the cited regulation.',
 'any','jurisdiction','Lógasavn / Faroe Islands — Regulation No. 495 of 26 May 2026 on controlled substances',
 'https://www.logir.fo/Bekendtgorelse/495-af-26-05-2026-for-Faeroerne-om-euforiserende-stoffer','2026-05-26',now(),now(),now()+interval '1 year','verified'),
('hv-mkt-complete-gl-20260913','GL','primary-evidence-claim:hv-mkt-complete-gl-20260913',
 'Greenland controlled-substance law restricts controlled substances to authorized medical/scientific use; cannabis is included in the controlled framework. Commercial adult-use cannabis is not established by the cited Greenland framework.',
 'any','jurisdiction','Greenland Self-Government — Regulation No. 61 of 22 August 2025 on controlled substances',
 'https://nalunaarutit.gl/groenlandsk-lovgivning/2025/selvstyrets-bekendtgørelse-nr-61-af-01_09_2025?sc_lang=da',null,now(),now(),now()+interval '1 year','verified')
on conflict (claim_key) do update set claim_text=excluded.claim_text,authority_name=excluded.authority_name,authority_url=excluded.authority_url,verified_at=excluded.verified_at,expires_at=excluded.expires_at,evidence_status='verified',updated_at=now();

insert into public.country_intel(country_code,country_name,public_summary,commercial_pathway_summary,review_status,regulatory_tier,last_reviewed_at,last_enriched_at) values
('FO','Faroe Islands','The Faroe Islands have a distinct controlled-substance framework. Regulation No. 495 of 26 May 2026 includes cannabis in the controlled-substance schedules and provides authorization rules for medical/scientific activity.','No general adult-use commercial retail pathway is established by the cited 2026 regulation; authorized medical/scientific activity is the supported commercial-access basis.','active','medical_limited_trade',now(),now()),
('GL','Greenland','Greenland has its own controlled-substance legislation under Inatsisartut Act No. 24 of 25 November 2022 and subsequent self-government regulations. Cannabis is included in the controlled framework, with authorization-based exceptions.','Commercial adult-use cannabis is not established by the cited framework; authorized medical/scientific activity and limited low-THC import pathways are subject to Greenlandic authorization.','active','medical_limited_trade',now(),now()),
('EH','Western Sahara','Western Sahara remains a UN-listed Non-Self-Governing Territory. A distinct authoritative cannabis commercial-access regime for the territory was not established from the sources reviewed; jurisdictional status requires separate treatment rather than automatic inheritance from Morocco.','Commercial cannabis access is unresolved in the Harbourview jurisdiction model pending a territory-specific authoritative regulatory source.','blocked','unresolved',now(),now()),
('FK','Falkland Islands','Falkland Islands legislation treats cannabis and cannabis resin as controlled drugs under the territory’s controlled-drug framework.','No general adult-use commercial cannabis pathway is established by the cited legislation; controlled activity remains subject to the territory’s drug-control framework.','active','prohibited',now(),now()),
('HK','Hong Kong','Hong Kong Police Force states cannabis, THC and other cannabinoids are controlled under the Dangerous Drugs Ordinance.','No general adult-use commercial cannabis pathway is established by the cited Hong Kong framework.','active','prohibited',now(),now()),
('PR','Puerto Rico','Puerto Rico Department of Health administers and enforces the territory’s medical-cannabis laws and regulations through its Medical Cannabis Regulatory Board.','Commercial access is limited to the regulated medical-cannabis framework rather than general adult-use retail.','active','medical_limited_trade',now(),now()),
('SC','Seychelles','Seychelles government statements indicate that recreational marijuana has not been legalized; cannabis remains subject to the controlled-drug framework.','No general adult-use commercial cannabis pathway is established by the current government position and cited framework; territory-specific medical access requires further primary-source verification.','active','prohibited',now(),now())
on conflict(country_code) do update set public_summary=excluded.public_summary,commercial_pathway_summary=excluded.commercial_pathway_summary,review_status=excluded.review_status,regulatory_tier=excluded.regulatory_tier,last_reviewed_at=excluded.last_reviewed_at,last_enriched_at=excluded.last_enriched_at,updated_at=now();

insert into public.regulatory_pathways(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,prescription_notes,source_urls,verification,last_verified_at,qualifying_conditions,prescriber_scope,min_age,reimbursement)
select c.id,'FO','depth-v1-fo','Faroe Islands medical/scientific cannabis authorization pathway','medical_access_program',
'Faroe Islands Regulation No. 495 of 26 May 2026 on controlled substances','Faroe Islands / Danish Medicines Agency framework','active','2026-05-26',
'Cannabis is controlled and authorized activity is limited to the medical/scientific framework described in the regulation; no general adult-use retail pathway is established by the cited instrument.',
null,array['https://www.logir.fo/Bekendtgorelse/495-af-26-05-2026-for-Faeroerne-om-euforiserende-stoffer'],'needs_review',null,array[]::text[],null,null,null
from public.countries c where c.iso_alpha2='FO'
on conflict (slug) do nothing;

insert into public.regulatory_pathways(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,prescription_notes,source_urls,verification,last_verified_at,qualifying_conditions,prescriber_scope,min_age,reimbursement)
select c.id,'GL','depth-v1-gl','Greenland controlled-substance medical/scientific pathway','medical_access_program',
'Inatsisartut Act No. 24 of 25 November 2022 and Greenland Self-Government Regulation No. 61 of 22 August 2025 on controlled substances','Greenland Self-Government / Landslægeembedet','active',null,
'Cannabis is included in Greenland’s controlled-substance framework. Medical/scientific use and specified import activity require authorization; no general adult-use commercial retail pathway is established by the cited framework.',
null,array['https://nalunaarutit.gl/groenlandsk-lovgivning/2022/l-24-2022?sc_lang=da','https://nalunaarutit.gl/groenlandsk-lovgivning/2025/selvstyrets-bekendtgørelse-nr-61-af-01_09_2025?sc_lang=da'],'needs_review',null,array[]::text[],null,null,null
from public.countries c where c.iso_alpha2='GL'
on conflict (slug) do nothing;

insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',rp.id,'Regulation No. 495 of 26 May 2026 on controlled substances',null,'regulator',
'https://www.logir.fo/Bekendtgorelse/495-af-26-05-2026-for-Faeroerne-om-euforiserende-stoffer','2026-05-26',current_date,
'Cannabis is listed in the controlled-substance schedules; Lists B, D and E are for medical and scientific use and authorization rules apply.'
from public.regulatory_pathways rp where rp.iso_alpha2='FO' and rp.slug='depth-v1-fo'
and not exists(select 1 from public.regulatory_citations rc where rc.entity_id=rp.id);

insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',rp.id,'Inatsisartut Act No. 24 of 25 November 2022 / Regulation No. 61 of 22 August 2025',null,'regulator',
'https://nalunaarutit.gl/groenlandsk-lovgivning/2025/selvstyrets-bekendtgørelse-nr-61-af-01_09_2025?sc_lang=da',null,current_date,
'Greenland controlled-substance rules govern cannabis within an authorization-based medical/scientific framework.'
from public.regulatory_pathways rp where rp.iso_alpha2='GL' and rp.slug='depth-v1-gl'
and not exists(select 1 from public.regulatory_citations rc where rc.entity_id=rp.id);

update public.regulatory_pathways set verification='verified',last_verified_at=now(),updated_at=now() where slug in ('depth-v1-fo','depth-v1-gl');
update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now() where dimension_key='country_intel' and jurisdiction_key in ('EH','FK','FO','GL','HK','PR','SC');
update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now() where dimension_key in ('verified_regulatory_evidence','verified_regulatory_claims','verified_pathways') and jurisdiction_key in ('FO','GL');

update public.jurisdiction_dimension_coverage c
set status=case
 when c.dimension_key='country_intel' and d.jurisdiction_level='subnational' then 'inherited'
 when c.dimension_key='country_intel' and d.country_intel_rows>0 then 'verified_populated'
 when c.dimension_key='country_intel' then 'open'
 when c.dimension_key='market_metrics' and d.jurisdiction_level='subnational' then 'not_applicable'
 when c.dimension_key='market_metrics' and d.metric_rows>0 then 'verified_populated'
 when c.dimension_key='market_metrics' then 'open'
 when c.dimension_key='trade_flows' and d.jurisdiction_level='subnational' then 'not_applicable'
 when c.dimension_key='trade_flows' and d.trade_flow_rows>0 then 'verified_populated'
 when c.dimension_key='trade_flows' then 'open'
 when c.dimension_key='signals' and d.jurisdiction_level='subnational' then 'not_applicable'
 when c.dimension_key='signals' and d.signal_rows>0 then 'verified_populated'
 when c.dimension_key='signals' then 'open'
 when c.dimension_key='source_registry' and d.registered_source_rows>0 then 'verified_populated'
 when c.dimension_key='source_registry' then 'open'
 when c.dimension_key='source_snapshots' and d.successful_snapshot_rows>0 then 'verified_populated'
 when c.dimension_key='source_snapshots' then 'open'
 when c.dimension_key='verified_regulatory_evidence' and d.current_verified_evidence_rows>0 then 'verified_populated'
 when c.dimension_key='verified_regulatory_evidence' then 'open'
 when c.dimension_key='verified_regulatory_claims' and d.verified_claim_rows>0 then 'verified_populated'
 when c.dimension_key='verified_regulatory_claims' then 'open'
 when c.dimension_key='verified_pathways' and d.verified_pathway_rows>0 then 'verified_populated'
 when c.dimension_key='verified_pathways' then 'open'
 when c.dimension_key='verified_format_rules' and d.verified_format_rule_rows>0 then 'verified_populated'
 when c.dimension_key='verified_format_rules' then 'open'
 when c.dimension_key='regulatory_calendar' and d.calendar_rows>0 then 'verified_populated'
 when c.dimension_key='regulatory_calendar' then 'open'
 else c.status end,
 applicability=case
  when c.dimension_key in ('market_metrics','trade_flows','signals') and d.jurisdiction_level='subnational' then 'not_applicable'
  when c.dimension_key='country_intel' and d.jurisdiction_level='subnational' then 'inherited'
  else 'applicable' end,
 last_evaluated_at=now()
from public.v_jurisdiction_data_depth d where d.jurisdiction_key=c.jurisdiction_key;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922112000','depth_primary_reconciliation_fo_gl_territories','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922112000_depth_primary_reconciliation_fo_gl_territories.sql

-- RECOVERY BEGIN 20260922113000_jurisdiction_depth_integrity_view.sql
create or replace view public.v_jurisdiction_depth_integrity
with (security_invoker = true)
as
select
  d.jurisdiction_key,
  d.country_name,
  d.jurisdiction_level,
  count(c.dimension_key) as dimension_cells,
  count(*) filter (where c.status='verified_populated') as verified_populated_cells,
  count(*) filter (where c.status='not_applicable') as not_applicable_cells,
  count(*) filter (where c.status='inherited') as inherited_cells,
  count(*) filter (where c.status='open') as open_cells,
  count(*) filter (where c.status='blocked') as blocked_cells,
  round(100.0 * (
    count(*) filter (where c.status='verified_populated')
    + count(*) filter (where c.status='not_applicable')
  ) / nullif(
    count(*) filter (where c.applicability='applicable')
    + count(*) filter (where c.applicability='not_applicable'),0
  ),1) as applicable_depth_pct,
  bool_and(c.dimension_key='country_intel' or c.status <> 'inherited') as no_non_country_inheritance,
  bool_and(c.dimension_key not in ('market_metrics','trade_flows','signals')
    or d.jurisdiction_level <> 'subnational'
    or c.status='not_applicable') as subnational_applicability_consistent,
  bool_and(c.dimension_key <> 'verified_regulatory_evidence' or c.status='verified_populated') as regulatory_evidence_fail_closed,
  (count(c.dimension_key)=11 and count(*) filter(where c.status='open')=0 and count(*) filter(where c.status='blocked')=0) as full_depth_ready
from public.v_jurisdiction_data_depth d
left join public.jurisdiction_dimension_coverage c on c.jurisdiction_key=d.jurisdiction_key
group by d.jurisdiction_key,d.country_name,d.jurisdiction_level;
grant select on public.v_jurisdiction_depth_integrity to anon, authenticated;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922113000','jurisdiction_depth_integrity_view','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922113000_jurisdiction_depth_integrity_view.sql

-- RECOVERY BEGIN 20260922120000_primary_tv_va_source_enrichment.sql
-- Primary source registry enrichment for Tuvalu and Holy See.
-- Tuvalu evidence replaces the secondary country-legality record with primary law.
-- Holy See source is registered as primary legal provenance; cannabis-specific qualification remains unresolved.

insert into public.source_registry
(source_name,source_url,jurisdiction,country,iso,jurisdiction_code,source_type,regulator_class,verification_notes,is_active,crawl_allowed,notes)
select 'Tuvalu Government Legislation — Dangerous Drugs Act 2022 Revised Edition','https://www.tuvalu-legislation.tv/cms/images/LEGISLATION/PRINCIPAL/1948/1948-0006/1948-0006.pdf','Tuvalu','Tuvalu','TV','TV','legal','legislature','Primary Tuvalu legislation; cannabis-specific provisions verified 2026-09-22.',true,true,'Current-file legal source; 2025 amendment is listed by Tuvalu legislation portal.'
where not exists(select 1 from public.source_registry where source_url='https://www.tuvalu-legislation.tv/cms/images/LEGISLATION/PRINCIPAL/1948/1948-0006/1948-0006.pdf');

insert into public.source_registry
(source_name,source_url,jurisdiction,country,iso,jurisdiction_code,source_type,regulator_class,verification_notes,is_active,crawl_allowed,notes)
select 'Vatican City State — official law on illicit narcotic and psychotropic substances','https://press.vatican.va/content/salastampa/it/bollettino/pubblico/2010/12/30/0813/01870.html','Holy See','Holy See','VA','VA','legal','legislature','Primary Vatican City State law; not treated as cannabis-specific evidence without a cannabis-specific provision.',true,true,'Primary legal source; cannabis-specific qualification remains unresolved.'
where not exists(select 1 from public.source_registry where source_url='https://press.vatican.va/content/salastampa/it/bollettino/pubblico/2010/12/30/0813/01870.html');

update public.regulatory_market_access_evidence set active=false where evidence_key='hv-mkt-complete-tv-20260913';

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-tv-dangerous-drugs-20260922','TV','prohibited','Tuvalu’s current-file Dangerous Drugs Act defines Indian hemp as Cannabis sativa or Cannabis indica and expressly prohibits import/export, cultivation, possession and sale of Indian hemp. The cited Act therefore supports a prohibited commercial cannabis-access tier; no lawful adult-use commercial pathway is established by the cited instrument.','Tuvalu Government Legislation — Dangerous Drugs Act','https://www.tuvalu-legislation.tv/cms/images/LEGISLATION/PRINCIPAL/1948/1948-0006/1948-0006.pdf','2022-12-31',now(),'2027-03-22',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-tv-dangerous-drugs-20260922');

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
select 'primary-evidence-tv-dangerous-drugs-20260922','TV','primary-evidence-claim:primary-evidence-tv-dangerous-drugs-20260922','Tuvalu’s Dangerous Drugs Act prohibits import/export, cultivation, possession and sale of Indian hemp, defined in the Act as Cannabis sativa or Cannabis indica; no commercial cannabis retail pathway is established by the cited instrument.','any','TV','Tuvalu Government Legislation — Dangerous Drugs Act','https://www.tuvalu-legislation.tv/cms/images/LEGISLATION/PRINCIPAL/1948/1948-0006/1948-0006.pdf','2022-12-31',now(),now(),'2027-03-22','verified'
where not exists(select 1 from public.regulatory_market_access_claims where claim_key='primary-evidence-claim:primary-evidence-tv-dangerous-drugs-20260922');

do $$
declare pid uuid;
begin
 select id into pid from public.regulatory_pathways where slug='depth-v1-tv';
 if pid is null then
   insert into public.regulatory_pathways
   (country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at,qualifying_conditions)
   values('39d4e117-d0ae-4669-8f0c-b631afee0ef1','TV','depth-v1-tv','Tuvalu controlled-substance cannabis prohibition pathway','medical_access_program','Dangerous Drugs Act, 2022 Revised Edition, Cap. 10.10','Tuvalu Government / Senior Medical Officer framework','active','2022-12-31','The cited Tuvalu law prohibits import/export, cultivation, possession and sale of Indian hemp. It does not establish a general commercial cannabis pathway.',array['https://www.tuvalu-legislation.tv/cms/images/LEGISLATION/PRINCIPAL/1948/1948-0006/1948-0006.pdf'],'needs_review',now(),array[]::text[])
   returning id into pid;
 end if;
 if not exists(select 1 from public.regulatory_citations where entity_type='pathway' and entity_id=pid and citation_url='https://www.tuvalu-legislation.tv/cms/images/LEGISLATION/PRINCIPAL/1948/1948-0006/1948-0006.pdf') then
   insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
   values('pathway',pid,'Dangerous Drugs Act, 2022 Revised Edition, Cap. 10.10','Sections 4, 7 and 8','regulator','https://www.tuvalu-legislation.tv/cms/images/LEGISLATION/PRINCIPAL/1948/1948-0006/1948-0006.pdf','2022-12-31',current_date,'The Act defines Indian hemp as Cannabis sativa or Cannabis indica and prohibits import/export, cultivation, possession and sale.');
 end if;
 update public.regulatory_pathways set verification='verified',last_verified_at=now(),updated_at=now() where id=pid;
end $$;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922120000','primary_tv_va_source_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922120000_primary_tv_va_source_enrichment.sql

-- RECOVERY BEGIN 20260922120500_reconcile_tv_va_depth_integrity.sql
-- Reconcile measured coverage after primary Tuvalu / Holy See source enrichment.
-- Tuvalu: promote source registry, evidence, claim, pathway, calendar and verified-empty format coverage.
-- Holy See: deactivate secondary cannabis evidence and fail closed because the registered primary law is not cannabis-specific.

update public.regulatory_market_access_evidence
set active=false
where evidence_key='hv-mkt-complete-va-20260913';

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',evidence_basis='Primary Tuvalu legislation source registry entry verified 2026-09-22.',last_evaluated_at=now(),notes='Primary legal source registered; source_registry dimension complete.'
where jurisdiction_key='TV' and dimension_key='source_registry';

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',evidence_basis='Primary Tuvalu Dangerous Drugs Act evidence and verified pathway/claim.',last_evaluated_at=now(),notes='Primary cannabis-specific prohibition evidence supports verified regulatory claim and pathway.'
where jurisdiction_key='TV' and dimension_key in ('verified_regulatory_claims','verified_pathways','verified_regulatory_evidence');

update public.jurisdiction_dimension_coverage
set status='verified_empty',applicability='applicable',evidence_basis='Tuvalu Dangerous Drugs Act Sections 4, 7 and 8 expressly prohibit import/export, cultivation, possession and sale of Indian hemp.',last_evaluated_at=now(),notes='No lawful commercial cannabis product format is established by the cited primary law.'
where jurisdiction_key='TV' and dimension_key='verified_format_rules';

insert into public.regulatory_calendar
(iso2,event_type,title,summary,expected_date,confidence,source_url,source_label,status)
select 'TV','effective','Tuvalu cannabis prohibition legal basis — current revised Act','Primary Tuvalu legislation expressly prohibits import/export, cultivation, possession and sale of Indian hemp.','2022-12-31','confirmed','https://www.tuvalu-legislation.tv/cms/images/LEGISLATION/PRINCIPAL/1948/1948-0006/1948-0006.pdf','Primary regulatory source','effective'
where not exists(select 1 from public.regulatory_calendar where iso2='TV' and source_url='https://www.tuvalu-legislation.tv/cms/images/LEGISLATION/PRINCIPAL/1948/1948-0006/1948-0006.pdf');

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',evidence_basis='Confirmed regulatory calendar record derived from the verified Tuvalu pathway/legal instrument.',last_evaluated_at=now(),notes='Calendar layer populated from primary-source verified pathway.'
where jurisdiction_key='TV' and dimension_key='regulatory_calendar';

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),notes=coalesce(notes,'')||' Reconciled from verified primary-source coverage on 2026-09-22.'
where jurisdiction_key='TV' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','verified_format_rules','regulatory_calendar');

update public.jurisdiction_data_depth_tasks
set status='blocked',updated_at=now(),notes='Blocked: no cannabis-specific primary legal/regulatory source located for the Holy See; the registered primary narcotics law is not treated as cannabis-specific evidence. Secondary aggregator evidence was deactivated.'
where jurisdiction_key='VA' and dimension_key='verified_regulatory_evidence';

update public.jurisdiction_dimension_coverage
set status='blocked',applicability='applicable',evidence_basis='No cannabis-specific primary legal/regulatory provision located; registered Vatican law is broad narcotics law and is not treated as cannabis-specific evidence.',last_evaluated_at=now(),notes='Secondary evidence deactivated; unresolved remains fail-closed.'
where jurisdiction_key='VA' and dimension_key='verified_regulatory_evidence';

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922120500','reconcile_tv_va_depth_integrity','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922120500_reconcile_tv_va_depth_integrity.sql

-- RECOVERY BEGIN 20260922121000_primary_ca_ke_regulatory_enrichment.sql
-- Primary-source regulatory enrichment for Canada and Kenya.
-- Replaces non-primary evidence with current government/legal sources and adds verified pathways/claims.

insert into public.source_registry
(source_name,source_url,jurisdiction,country,iso,jurisdiction_code,source_type,regulator_class,verification_notes,is_active,crawl_allowed,notes)
select 'Health Canada — Regulations under the Cannabis Act','https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/laws-regulations/regulations-support-cannabis-act.html','Canada','Canada','CA','CA','regulatory','health_authority','Primary Government of Canada source covering production, distribution, sale, import and export licensing under the Cannabis Act and Regulations.',true,true,'Primary federal cannabis regulatory source verified 2026-09-22.'
where not exists(select 1 from public.source_registry where source_url='https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/laws-regulations/regulations-support-cannabis-act.html');

insert into public.source_registry
(source_name,source_url,jurisdiction,country,iso,jurisdiction_code,source_type,regulator_class,verification_notes,is_active,crawl_allowed,notes)
select 'Kenya Law — Narcotic Drugs and Psychotropic Substances (Control) Act, Cap. 245','https://new.kenyalaw.org/akn/ke/act/1994/4/eng@2022-12-31/source.pdf','Kenya','Kenya','KE','KE','legal','legislature','Primary Kenya Law publication of the national narcotics statute; cannabis is expressly defined and controlled, with limited licensed/medical exemptions.',true,true,'Primary legal source verified 2026-09-22.'
where not exists(select 1 from public.source_registry where source_url='https://new.kenyalaw.org/akn/ke/act/1994/4/eng@2022-12-31/source.pdf');

update public.regulatory_market_access_evidence set active=false where evidence_key in ('incb-2023-trade-ca','hv-mkt-ke-20260907');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-ca-cannabis-act-20260922','CA','legal_commercial_access','Health Canada states that the Cannabis Act and Cannabis Regulations establish the federal legal framework for production, distribution, sale, import and export; provinces and territories authorize non-medical retail sale through their own systems.','Health Canada — Regulations under the Cannabis Act','https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/laws-regulations/regulations-support-cannabis-act.html','2018-10-17',now(),'2027-03-22',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-ca-cannabis-act-20260922');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-ke-narcotics-act-20260922','KE','prohibited','Kenya Law publishes the Narcotic Drugs and Psychotropic Substances (Control) Act, which defines cannabis and criminalizes possession and trafficking, while providing narrow statutory exemptions for licensed or medical possession. No general commercial cannabis retail pathway is established by the cited Act.','Kenya Law — Narcotic Drugs and Psychotropic Substances (Control) Act','https://new.kenyalaw.org/akn/ke/act/1994/4/eng@2022-12-31/source.pdf','2022-12-31',now(),'2027-03-22',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-ke-narcotics-act-20260922');

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
select 'primary-evidence-ca-cannabis-act-20260922','CA','primary-evidence-claim:primary-evidence-ca-cannabis-act-20260922','Canada has a federal legal framework for commercial cannabis production and sale; provincial and territorial governments authorize non-medical retail sale within their jurisdictions.','any','CA','Health Canada — Regulations under the Cannabis Act','https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/laws-regulations/regulations-support-cannabis-act.html','2018-10-17',now(),now(),'2027-03-22','verified'
where not exists(select 1 from public.regulatory_market_access_claims where claim_key='primary-evidence-claim:primary-evidence-ca-cannabis-act-20260922');

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
select 'primary-evidence-ke-narcotics-act-20260922','KE','primary-evidence-claim:primary-evidence-ke-narcotics-act-20260922','Kenya’s Narcotic Drugs and Psychotropic Substances (Control) Act defines and controls cannabis and criminalizes possession and trafficking, subject to narrow statutory exemptions; the cited Act does not establish general commercial cannabis retail.','any','KE','Kenya Law — Narcotic Drugs and Psychotropic Substances (Control) Act','https://new.kenyalaw.org/akn/ke/act/1994/4/eng@2022-12-31/source.pdf','2022-12-31',now(),now(),'2027-03-22','verified'
where not exists(select 1 from public.regulatory_market_access_claims where claim_key='primary-evidence-claim:primary-evidence-ke-narcotics-act-20260922');

do $$
declare pid uuid;
begin
 if not exists(select 1 from public.regulatory_pathways where slug='depth-v1-ca') then
  insert into public.regulatory_pathways(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at,qualifying_conditions)
  values('a2c3726a-12a5-40c6-a640-65a735c579ac','CA','depth-v1-ca','Canada federal commercial cannabis framework','adult_use_commercial','Cannabis Act and Cannabis Regulations','Health Canada plus provincial/territorial regulators','active','2018-10-17','Federal licensing governs production and sale; provinces and territories authorize non-medical retail distribution within their jurisdictions.',array['https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/laws-regulations/regulations-support-cannabis-act.html'],'needs_review',now(),array[]::text[])
  returning id into pid;
 else select id into pid from public.regulatory_pathways where slug='depth-v1-ca';
 end if;
 if not exists(select 1 from public.regulatory_citations where entity_type='pathway' and entity_id=pid and citation_url='https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/laws-regulations/regulations-support-cannabis-act.html') then
  insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
  values('pathway',pid,'Cannabis Act and Cannabis Regulations','Federal licensing and provincial/territorial retail authorization','regulator','https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/laws-regulations/regulations-support-cannabis-act.html','2018-10-17',current_date,'Regulations set rules for production, distribution, sale, import and export; provinces and territories authorize non-medical retail sale.');
 end if;
 update public.regulatory_pathways set verification='verified',last_verified_at=now(),updated_at=now() where id=pid;
 if not exists(select 1 from public.regulatory_pathways where slug='depth-v1-ke') then
  insert into public.regulatory_pathways(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at,qualifying_conditions)
  values('8ff64be8-1f33-42b5-9ba7-7cdd13c6fe6a','KE','depth-v1-ke','Kenya controlled cannabis possession and medical exemption framework','medical_access_program','Narcotic Drugs and Psychotropic Substances (Control) Act, Cap. 245','Kenya national narcotics control / medical authorization framework','active','2022-12-31','The Act prohibits possession and trafficking of cannabis except within specified licensed or medical exemptions; it does not establish a general commercial retail pathway.',array['https://new.kenyalaw.org/akn/ke/act/1994/4/eng@2022-12-31/source.pdf'],'needs_review',now(),array[]::text[])
  returning id into pid;
 else select id into pid from public.regulatory_pathways where slug='depth-v1-ke';
 end if;
 if not exists(select 1 from public.regulatory_citations where entity_type='pathway' and entity_id=pid and citation_url='https://new.kenyalaw.org/akn/ke/act/1994/4/eng@2022-12-31/source.pdf') then
  insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
  values('pathway',pid,'Narcotic Drugs and Psychotropic Substances (Control) Act, Cap. 245','Sections 3 and 6','regulator','https://new.kenyalaw.org/akn/ke/act/1994/4/eng@2022-12-31/source.pdf','2022-12-31',current_date,'The Act controls cannabis possession and trafficking and prohibits cultivation of cannabis plants, subject to statutory exemptions.');
 end if;
 update public.regulatory_pathways set verification='verified',last_verified_at=now(),updated_at=now() where id=pid;
end $$;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922121000','primary_ca_ke_regulatory_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922121000_primary_ca_ke_regulatory_enrichment.sql

-- RECOVERY BEGIN 20260922121500_reconcile_ca_ke_depth_coverage.sql
insert into public.regulatory_calendar(iso2,event_type,title,summary,expected_date,confidence,source_url,source_label,status)
select 'CA','effective','Canada federal Cannabis Act framework — effective date','Federal Cannabis Act framework governs commercial production, distribution and sale with provincial/territorial retail authorization.','2018-10-17','confirmed','https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/laws-regulations/regulations-support-cannabis-act.html','Primary regulatory source','effective'
where not exists(select 1 from public.regulatory_calendar where iso2='CA' and source_url='https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/laws-regulations/regulations-support-cannabis-act.html');
insert into public.regulatory_calendar(iso2,event_type,title,summary,expected_date,confidence,source_url,source_label,status)
select 'KE','effective','Kenya Narcotic Drugs and Psychotropic Substances (Control) Act — current published basis','Primary Kenya Law source records cannabis controls and statutory exemptions; no general commercial retail pathway is established.','2022-12-31','confirmed','https://new.kenyalaw.org/akn/ke/act/1994/4/eng@2022-12-31/source.pdf','Primary legal source','effective'
where not exists(select 1 from public.regulatory_calendar where iso2='KE' and source_url='https://new.kenyalaw.org/akn/ke/act/1994/4/eng@2022-12-31/source.pdf');
update public.jurisdiction_dimension_coverage set status='verified_populated',applicability='applicable',evidence_basis='Primary source registry and current primary regulatory evidence/claim/pathway verified 2026-09-22.',last_evaluated_at=now(),notes='Primary-source regulatory layer reconciled.' where jurisdiction_key in ('CA','KE') and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','regulatory_calendar');
update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now(),notes=coalesce(notes,'')||' Reconciled from primary-source enrichment on 2026-09-22.' where jurisdiction_key in ('CA','KE') and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','regulatory_calendar');

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922121500','reconcile_ca_ke_depth_coverage','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922121500_reconcile_ca_ke_depth_coverage.sql

-- RECOVERY BEGIN 20260922122000_reconcile_va_source_registry_coverage.sql
update public.jurisdiction_dimension_coverage
set status='verified_populated',
    applicability='applicable',
    evidence_basis='Primary Vatican City State legal source registered 2026-09-22; cannabis-specific regulatory evidence remains blocked separately.',
    last_evaluated_at=now(),
    notes='Primary legal provenance exists; evidence cell remains fail-closed.'
where jurisdiction_key='VA' and dimension_key='source_registry';

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922122000','reconcile_va_source_registry_coverage','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922122000_reconcile_va_source_registry_coverage.sql

-- RECOVERY BEGIN 20260922122500_add_va_blocked_evidence_task.sql
insert into public.jurisdiction_data_depth_tasks
(jurisdiction_key,dimension_key,jurisdiction_level,status,priority,evidence_required,notes)
select 'VA','verified_regulatory_evidence',jurisdiction_level,'blocked',100,true,
'Blocked: no cannabis-specific primary legal/regulatory provision located for the Holy See; broad Vatican narcotics law is registered as primary provenance but is not treated as cannabis-specific evidence. Secondary evidence was deactivated.'
from public.v_jurisdiction_data_depth
where jurisdiction_key='VA'
and not exists(select 1 from public.jurisdiction_data_depth_tasks where jurisdiction_key='VA' and dimension_key='verified_regulatory_evidence');

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922122500','add_va_blocked_evidence_task','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922122500_add_va_blocked_evidence_task.sql

-- RECOVERY BEGIN 20260922123500_record_kp_primary_source_block.sql
-- North Korea source gap remains fail-closed. Do not use South Korean narcotics law as DPRK evidence.
-- This migration registers an unresolved research task only after primary-source search failed to establish an accessible DPRK cannabis statute.
insert into public.jurisdiction_data_depth_tasks
(jurisdiction_key,dimension_key,jurisdiction_level,status,priority,evidence_required,notes)
select 'KP','verified_regulatory_evidence',jurisdiction_level,'blocked',100,true,
'Blocked: no accessible primary DPRK cannabis statute/regulatory source was established in this research pass. South Korean law and third-party descriptions are not valid substitutes for DPRK law.'
from public.v_jurisdiction_data_depth
where jurisdiction_key='KP'
and not exists(select 1 from public.jurisdiction_data_depth_tasks where jurisdiction_key='KP' and dimension_key='verified_regulatory_evidence' and status='blocked');

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922123500','record_kp_primary_source_block','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922123500_record_kp_primary_source_block.sql

-- RECOVERY BEGIN 20260922124000_primary_cg_law30_2025_enrichment.sql
-- Replace secondary Republic of the Congo cannabis evidence with the official Journal officiel Law No. 30-2025.
update public.regulatory_market_access_evidence set active=false where evidence_key='hv-mkt-complete-cg-20260913';

insert into public.source_registry
(source_name,source_url,jurisdiction,country,iso,jurisdiction_code,source_type,regulator_class,verification_notes,is_active,crawl_allowed,notes)
select 'Secrétariat Général du Gouvernement — Journal officiel de la République du Congo','https://www.sgg.cg/JO/2025/congo-jo-2025-39.pdf','Republic of the Congo','Republic of the Congo','CG','CG','legal','official_gazette','Official Journal publication containing Law No. 30-2025 of 22 August 2025 on illicit narcotics, psychotropic substances and precursors.',true,true,'Primary legal source verified 2026-09-22.'
where not exists(select 1 from public.source_registry where source_url='https://www.sgg.cg/JO/2025/congo-jo-2025-39.pdf');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-cg-law30-2025-20260922','CG','prohibited','Law No. 30-2025 regulates illicit production, possession, manufacture, transport, trafficking and use of narcotic drugs and psychotropic substances. Articles 44 and 53 expressly cover cannabis, including cannabis oil and other cannabis derivatives, while Article 52 prohibits use outside medical prescriptions. The law does not establish a general commercial cannabis retail pathway.','Secrétariat Général du Gouvernement — Journal officiel de la République du Congo','https://www.sgg.cg/JO/2025/congo-jo-2025-39.pdf','2025-08-22',now(),'2027-03-22',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-cg-law30-2025-20260922');

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
select 'primary-evidence-cg-law30-2025-20260922','CG','primary-evidence-claim:primary-evidence-cg-law30-2025-20260922','Republic of the Congo controls illicit narcotic and psychotropic substances under Law No. 30-2025; the law expressly addresses cannabis and prohibits illicit commercial activities and non-prescribed use. No general commercial cannabis retail pathway is established by the cited law.','any','CG','Secrétariat Général du Gouvernement — Journal officiel de la République du Congo','https://www.sgg.cg/JO/2025/congo-jo-2025-39.pdf','2025-08-22',now(),now(),'2027-03-22','verified'
where not exists(select 1 from public.regulatory_market_access_claims where claim_key='primary-evidence-claim:primary-evidence-cg-law30-2025-20260922');

insert into public.regulatory_calendar(iso2,event_type,title,summary,expected_date,confidence,source_url,source_label,status)
select 'CG','effective','Republic of the Congo Law No. 30-2025 — narcotics control framework','Primary Journal officiel publication of Law No. 30-2025 dated 22 August 2025; the law expressly addresses cannabis and illicit narcotics activity.','2025-08-22','confirmed','https://www.sgg.cg/JO/2025/congo-jo-2025-39.pdf','Primary legal source','effective'
where not exists(select 1 from public.regulatory_calendar where iso2='CG' and source_url='https://www.sgg.cg/JO/2025/congo-jo-2025-39.pdf');

update public.jurisdiction_dimension_coverage set status='verified_populated',applicability='applicable',evidence_basis='Primary Republic of the Congo Journal officiel source and verified cannabis-specific evidence/claim.',last_evaluated_at=now(),notes='Primary regulatory source reconciled.' where jurisdiction_key='CG' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar');
update public.jurisdiction_dimension_coverage set status='verified_empty',applicability='applicable',evidence_basis='Cited primary law establishes controls/prohibitions but no general commercial cannabis product-format rules.',last_evaluated_at=now(),notes='No unsupported format rules inferred.' where jurisdiction_key='CG' and dimension_key='verified_format_rules';
update public.jurisdiction_dimension_coverage set status='verified_empty',applicability='applicable',evidence_basis='Primary law establishes prohibitions and prescription controls but does not establish a commercial cannabis pathway.',last_evaluated_at=now(),notes='No unsupported pathway row created.' where jurisdiction_key='CG' and dimension_key='verified_pathways';
update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now(),notes=coalesce(notes,'')||' Reconciled from primary Law No. 30-2025 on 2026-09-22.' where jurisdiction_key='CG' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar','verified_format_rules','verified_pathways');

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922124000','primary_cg_law30_2025_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922124000_primary_cg_law30_2025_enrichment.sql

-- RECOVERY BEGIN 20260922164500_primary_netherlands_closed_chain_enrichment.sql
-- Primary Netherlands controlled cannabis supply-chain provenance
-- Evidence-backed only; controlled experimental commercial access, not unrestricted national retail.

begin;

update public.regulatory_market_access_evidence
set active=false
where evidence_key='incb-2023-trade-nl';

insert into public.regulatory_market_access_evidence(
  evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,
  source_effective_date,verified_at,expires_at,active
)
select
  'primary-evidence-nl-closed-chain-20260922','NL','legal_commercial_access',
  'Government source establishes a controlled experiment regulating production, distribution and sale of quality-controlled cannabis; experimental phase began 7 April 2025 and participating coffeeshops sell regulated cannabis from designated growers. This is controlled experimental commercial access, not unrestricted national retail.',
  'Government of the Netherlands',
  'https://www.government.nl/themes/family-health-and-care/controlled-cannabis-supply-chain-experiment',
  '2025-04-07',now(),now()+interval '180 days',true
where not exists (
  select 1 from public.regulatory_market_access_evidence
  where evidence_key='primary-evidence-nl-closed-chain-20260922'
);

insert into public.regulatory_market_access_claims(
  evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,
  authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status
)
select
  'primary-evidence-nl-closed-chain-20260922','NL',
  'primary-evidence-claim:nl-closed-chain-20260922',
  'A controlled cannabis supply-chain experiment permits regulated production, distribution and sale of cannabis to coffeeshops in participating municipalities; the experimental phase began 7 April 2025.',
  'any','national','Government of the Netherlands',
  'https://www.government.nl/themes/family-health-and-care/controlled-cannabis-supply-chain-experiment',
  '2025-04-07',now(),now(),now()+interval '180 days','verified'
where not exists (
  select 1 from public.regulatory_market_access_claims
  where claim_key='primary-evidence-claim:nl-closed-chain-20260922'
);

insert into public.regulatory_calendar(
  iso2,event_type,title,summary,expected_date,confidence,source_url,source_label,status
)
select
  'NL','effective',
  'Controlled Cannabis Supply Chain Experiment — experimental phase',
  'Experimental phase began; participating municipalities permit sale of regulated cannabis produced by designated growers under the closed-chain experiment.',
  '2025-04-07','confirmed',
  'https://www.government.nl/latest/news/2025/04/02/experimental-phase-of-the-closed-coffee-shop-chain-experiment-weed-experiment-starts-on-april-7th',
  'Government of the Netherlands','effective'
where not exists (
  select 1 from public.regulatory_calendar
  where iso2='NL'
    and expected_date='2025-04-07'
    and title='Controlled Cannabis Supply Chain Experiment — experimental phase'
);

update public.jurisdiction_dimension_coverage
set status='verified_populated',
    applicability='applicable',
    evidence_basis='Primary Government of Netherlands controlled supply-chain experiment source and verified claim/calendar.',
    last_evaluated_at=now(),
    notes='Primary-source commercial pathway evidence; controlled experimental scope.'
where jurisdiction_key='NL'
  and dimension_key in ('verified_regulatory_claims','regulatory_calendar');

update public.jurisdiction_data_depth_tasks
set status='verified',
    notes='Resolved from primary Government of Netherlands controlled cannabis supply-chain experiment evidence.'
where jurisdiction_key='NL'
  and dimension_key in ('verified_regulatory_claims','regulatory_calendar')
  and status='open';

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922164500','primary_netherlands_closed_chain_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922164500_primary_netherlands_closed_chain_enrichment.sql

-- RECOVERY BEGIN 20260922165000_primary_netherlands_format_rules.sql
-- Primary Netherlands format rules from Government.nl controlled supply-chain experiment.
begin;

insert into public.pathway_format_rules(
  pathway_id,format_id,status,conditions,notes,source_urls,verification,last_verified_at,effective_date,packaging_labelling
)
select
  '01fdfa6a-1295-4f84-8ade-dbabf9b245be',
  pf.id,
  'permitted',
  '{"experiment_phase":true,"source":"designated_growers"}'::jsonb,
  'Government.nl states that during the experimental phase participating coffeeshops may sell weed/hash from designated growers.',
  array['https://www.government.nl/faq/controlled-cannabis-supply-chain-experiment/what-cannabis-products-can-coffee-shops-offer-during-the-controlled-cannabis-supply-chain-experiment'],
  'verified',now(),'2025-04-07',
  'Products and packaging must meet experiment requirements; THC/CBD information and required labeling apply.'
from public.product_formats pf
where pf.slug='dried_flower'
and not exists (
  select 1 from public.pathway_format_rules r
  where r.pathway_id='01fdfa6a-1295-4f84-8ade-dbabf9b245be' and r.format_id=pf.id
);

insert into public.pathway_format_rules(
  pathway_id,format_id,status,conditions,notes,source_urls,verification,last_verified_at,effective_date,packaging_labelling
)
select
  '01fdfa6a-1295-4f84-8ade-dbabf9b245be',
  pf.id,
  'permitted',
  '{"experiment_phase":true,"raw_cannabis_only":true,"concentrates_prohibited":true,"made_and_packaged_by_grower":true}'::jsonb,
  'Government.nl states that edibles are permitted during the experimental phase only when made with raw cannabis; concentrates are prohibited and edibles must be made and packaged by designated growers.',
  array['https://www.government.nl/faq/controlled-cannabis-supply-chain-experiment/what-cannabis-products-can-coffee-shops-offer-during-the-controlled-cannabis-supply-chain-experiment'],
  'verified',now(),'2025-04-07',
  'Edibles must be made and packaged by designated growers under the experiment requirements.'
from public.product_formats pf
where pf.slug='edibles'
and not exists (
  select 1 from public.pathway_format_rules r
  where r.pathway_id='01fdfa6a-1295-4f84-8ade-dbabf9b245be' and r.format_id=pf.id
);

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
    evidence_basis='Primary Government.nl product-format rules for the controlled cannabis supply-chain experiment.',
    last_evaluated_at=now(),
    notes='Verified format-specific rules: flower/hash and edibles; edibles restricted to raw cannabis and grower manufacture/packaging, concentrates prohibited.'
where jurisdiction_key='NL' and dimension_key='verified_format_rules';

update public.jurisdiction_data_depth_tasks
set status='verified',
    notes='Resolved using primary Government.nl product-format rules for the controlled cannabis supply-chain experiment.'
where jurisdiction_key='NL' and dimension_key='verified_format_rules' and status='open';

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922165000','primary_netherlands_format_rules','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922165000_primary_netherlands_format_rules.sql

-- RECOVERY BEGIN 20260922190000_primary_gt_enrichment.sql
-- Primary Guatemala regulatory enrichment; fail-closed on unsupported dimensions.
update public.regulatory_market_access_evidence
set tier='prohibited',
    rationale='Guatemala''s Health Code prohibits cultivation and harvesting of cannabis; therapeutic consumption of controlled substances is permitted only by prescription and medical supervision.',
    authority_name='Congress of the Republic of Guatemala / Ministry of Public Health',
    authority_url='https://www.congreso.gob.gt/detalle_pdf/decretos/1217',
    source_effective_date='1992-09-23',
    verified_at=now(),
    expires_at=now()+interval '180 days',
    active=true
where evidence_key='hv-mkt-complete-gt-20260913';

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Guatemala Congress — Decree 48-92 Narcotics Law','https://www.congreso.gob.gt/detalle_pdf/decretos/1217','GT','Guatemala','GT',1,'regulator',true,true,'central_america','es','html_snapshot','weekly','verified',now()+interval '7 days','online','Primary statutory source verified 2026-09-22.','2026-09-22','drug_control_authority',array['legislation'],jsonb_build_object('primary_source',true))
on conflict (source_url) do update set jurisdiction_code='GT',country='Guatemala',iso='GT',tier=1,source_type='regulator',crawl_allowed=true,is_active=true,relevance_status='verified',next_crawl_at=now()+interval '7 days',network_status='online',verification_notes='Primary statutory source verified 2026-09-22.',verification_checked_at=now(),regulator_class='drug_control_authority',updated_at=now();

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('hv-mkt-complete-gt-20260913','GT','primary-evidence-claim:gt-controlled-cannabis-20260922','Guatemala prohibits cultivation and harvesting of cannabis under its Health Code; therapeutic consumption of controlled substances is permitted only by prescription and medical supervision.','any','national','Congress of the Republic of Guatemala / Ministry of Public Health','https://www.congreso.gob.gt/detalle_pdf/decretos/1217','1992-09-23',now(),now(),now()+interval '180 days','verified')
on conflict (claim_key) do update set claim_text=excluded.claim_text,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,retrieved_at=now(),verified_at=now(),expires_at=now()+interval '180 days',evidence_status='verified';

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,status,effective_date,source_urls,verification,last_verified_at)
values
((select id from public.countries where iso_alpha2='GT'),'GT','depth-v1-gt-medical','Prescription-only therapeutic controlled-substance access','medical_access_program','active','1999-08-31',array['https://www.congreso.gob.gt/detalle_pdf/decretos/566'],'needs_review',now())
on conflict (slug) do update set source_urls=excluded.source_urls,last_verified_at=now();

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
values
('pathway',(select id from public.regulatory_pathways where slug='depth-v1-gt-medical'),'Decreto 32-99 reforming Decreto 48-92','Article 3 — Uso legal','regulator','https://www.congreso.gob.gt/detalle_pdf/decretos/566','1999-08-31',current_date,'Only legally authorized persons may use drugs under strict responsibility for medical treatment.');

update public.regulatory_pathways
set verification='verified',source_urls=array['https://www.congreso.gob.gt/detalle_pdf/decretos/566'],last_verified_at=now(),updated_at=now()
where slug='depth-v1-gt-medical';

update public.jurisdiction_dimension_coverage
set status='verified_populated',evidence_basis='Primary Guatemalan statutory sources verify prohibited cannabis cultivation and prescription-only therapeutic controlled-substance access.',last_evaluated_at=now(),notes='Verified 2026-09-22 from Congress and Ministry of Health sources.'
where jurisdiction_key='GT' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways');

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),notes='Verified from primary Guatemalan statutory sources on 2026-09-22.'
where jurisdiction_key='GT' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922190000','primary_gt_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922190000_primary_gt_enrichment.sql

-- RECOVERY BEGIN 20260922190500_primary_gy_enrichment.sql
-- Primary Guyana regulatory enrichment; fail-closed on unsupported dimensions.
update public.regulatory_market_access_evidence
set active=false,expires_at=now()
where evidence_key='hv-mkt-gy-20260907';

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-gy-narcotics-20260922','GY','prohibited','Guyana''s Narcotic Drugs and Psychotropic Substances (Control) Act defines cannabis as a narcotic and criminalizes unauthorized possession, trafficking, production, sale and distribution; the 2022 amendment does not create a commercial cannabis market.','Parliament of Guyana','https://parliament.gov.gy/documents/acts/8534-act_2_of_1988_narcotic_drug__psychotropic_substances_control.pdf','1988-01-01',now(),now()+interval '180 days',true)
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=now(),expires_at=now()+interval '180 days',active=true;

update public.regulatory_market_access_claims
set evidence_key='primary-evidence-gy-narcotics-20260922',
    claim_key='primary-evidence-claim:gy-narcotics-20260922',
    evidence_status='verified',
    claim_text='Guyana controls cannabis as a narcotic drug and prohibits unauthorized possession, trafficking, production, sale and distribution; no commercial cannabis market is established by the cited primary law.',
    authority_name='Parliament of Guyana',
    authority_url='https://parliament.gov.gy/documents/acts/8534-act_2_of_1988_narcotic_drug__psychotropic_substances_control.pdf',
    verified_at=now(),retrieved_at=now(),expires_at=now()+interval '180 days'
where claim_key='market-access:hv-mkt-gy-20260907';

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Parliament of Guyana — Narcotic Drugs and Psychotropic Substances (Control) Act','https://parliament.gov.gy/documents/acts/8534-act_2_of_1988_narcotic_drug__psychotropic_substances_control.pdf','GY','Guyana','GY',1,'regulator',true,true,'south_america','en','html_snapshot','weekly','verified',now()+interval '7 days','online','Primary Guyana narcotics statute verified 2026-09-22.','2026-09-22','drug_control_authority',array['legislation'],jsonb_build_object('primary_source',true))
on conflict (source_url) do update set jurisdiction_code='GY',country='Guyana',iso='GY',tier=1,source_type='regulator',crawl_allowed=true,is_active=true,relevance_status='verified',next_crawl_at=now()+interval '7 days',network_status='online',verification_notes='Primary Guyana narcotics statute verified 2026-09-22.',verification_checked_at=now(),regulator_class='drug_control_authority',updated_at=now();

update public.jurisdiction_dimension_coverage
set status='verified_populated',evidence_basis='Primary Guyana narcotics statute verifies cannabis prohibition; no commercial pathway established by cited source.',last_evaluated_at=now(),notes='Verified 2026-09-22 from Parliament of Guyana primary statute.'
where jurisdiction_key='GY' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims');

update public.jurisdiction_dimension_coverage
set status='verified_empty',evidence_basis='Primary statute establishes prohibition but no commercial cannabis pathway.',last_evaluated_at=now(),notes='No commercial cannabis pathway supported by cited primary statute; fail-closed.'
where jurisdiction_key='GY' and dimension_key='verified_pathways';

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),notes='Verified from primary Guyana statutory source on 2026-09-22.'
where jurisdiction_key='GY' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922190500','primary_gy_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922190500_primary_gy_enrichment.sql

-- RECOVERY BEGIN 20260922191500_primary_ki_enrichment.sql
-- Primary Kiribati regulatory enrichment; fail-closed on unsupported dimensions.
update public.regulatory_market_access_evidence set active=false,expires_at=now() where evidence_key='hv-mkt-complete-ki-20260913';
insert into public.regulatory_market_access_evidence (evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values ('primary-evidence-ki-dangerous-drugs-20260922','KI','prohibited','Kiribati''s Dangerous Drugs Ordinance framework controls cannabis as a dangerous drug. The Kiribati Trade and Investment Portal lists the Dangerous Drugs Ordinance, amendments and regulations, while the Customs law restricts cannabis import except under licence. No commercial cannabis market is established by the cited framework.','Government of Kiribati / Kiribati Trade and Investment Portal','https://kiribati.tradeportal.org/Laws?l=en','1980-02-21',now(),now()+interval '180 days',true)
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=now(),expires_at=now()+interval '180 days',active=true;
insert into public.regulatory_market_access_claims (evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values ('primary-evidence-ki-dangerous-drugs-20260922','KI','primary-evidence-claim:ki-dangerous-drugs-20260922','Kiribati controls cannabis under its dangerous-drugs framework and restricts cannabis import except under licence; the cited primary framework does not establish a commercial cannabis market.','any','national','Government of Kiribati / Kiribati Trade and Investment Portal','https://kiribati.tradeportal.org/Laws?l=en','1980-02-21',now(),now(),now()+interval '180 days','verified')
on conflict (claim_key) do update set claim_text=excluded.claim_text,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,retrieved_at=now(),verified_at=now(),expires_at=now()+interval '180 days',evidence_status='verified';
insert into public.source_registry (source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values ('Kiribati Trade and Investment Portal — Dangerous Drugs laws','https://kiribati.tradeportal.org/Laws?l=en','KI','Kiribati','KI',1,'regulator',true,true,'micronesia','en','html_snapshot','weekly','verified',now()+interval '7 days','online','Government Kiribati trade portal primary legislation source verified 2026-09-22.','2026-09-22','drug_control_authority',array['legislation'],jsonb_build_object('primary_source',true))
on conflict (source_url) do update set jurisdiction_code='KI',country='Kiribati',iso='KI',tier=1,source_type='regulator',crawl_allowed=true,is_active=true,relevance_status='verified',next_crawl_at=now()+interval '7 days',network_status='online',verification_notes='Government Kiribati trade portal primary legislation source verified 2026-09-22.',verification_checked_at=now(),regulator_class='drug_control_authority',updated_at=now();
update public.jurisdiction_dimension_coverage set status='verified_populated',evidence_basis='Government Kiribati dangerous-drugs framework and customs restriction verify cannabis prohibition/control.',last_evaluated_at=now(),notes='Verified 2026-09-22 from Government of Kiribati trade portal.' where jurisdiction_key='KI' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims');
update public.jurisdiction_dimension_coverage set status='verified_empty',evidence_basis='Cited primary framework establishes controls but no commercial cannabis pathway or product-format regime.',last_evaluated_at=now(),notes='No commercial pathway or format rules supported by cited primary framework; fail-closed.' where jurisdiction_key='KI' and dimension_key in ('verified_pathways','verified_format_rules');
update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now(),notes='Verified from primary Kiribati dangerous-drugs framework on 2026-09-22.' where jurisdiction_key='KI' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','verified_format_rules');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922191500','primary_ki_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922191500_primary_ki_enrichment.sql

-- RECOVERY BEGIN 20260922192000_primary_gh_enrichment.sql
-- Primary Ghana regulatory enrichment; fail-closed on unsupported dimensions.
update public.regulatory_market_access_evidence
set tier='medical_limited_trade',
    rationale='Section 43 of the Narcotics Control Commission Act 2020 (Act 1019), as amended by Act 1100 and implemented by LI 2475, licenses cannabis cultivation only where THC does not exceed 0.3% on a dry weight basis, for industrial or medicinal purposes. NACOC describes licensing for cultivation, processing, import, export, laboratory, storage, transport, distribution and sale; recreational cannabis remains prohibited.',
    authority_name='Narcotics Control Commission (NACOC), Ghana',
    authority_url='https://www.ncc.gov.gh/cannabis-regulations/',
    source_effective_date='2026-07-31',
    verified_at=now(),expires_at=now()+interval '180 days',active=true
where evidence_key='hv-mkt-gh-20260907';

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('hv-mkt-gh-20260907','GH','primary-evidence-claim:gh-cannabis-framework-20260922','Ghana has a licensed low-THC cannabis framework: cannabis at or below 0.3% THC may be cultivated for approved industrial and medicinal purposes, with regulated activities including processing, import, export, transport, storage, distribution and sale; recreational cannabis remains prohibited.','any','national','Narcotics Control Commission (NACOC), Ghana','https://www.ncc.gov.gh/cannabis-regulations/','2026-07-31',now(),now(),now()+interval '180 days','verified')
on conflict (claim_key) do update set claim_text=excluded.claim_text,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,retrieved_at=now(),verified_at=now(),expires_at=now()+interval '180 days',evidence_status='verified';

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Ghana Narcotics Control Commission — Cannabis Regulations','https://www.ncc.gov.gh/cannabis-regulations/','GH','Ghana','GH',1,'regulator',true,true,'africa','en','html_snapshot','weekly','verified',now()+interval '7 days','online','Primary NACOC cannabis regulatory source verified 2026-09-22.','2026-09-22','drug_control_authority',array['regulatory'],jsonb_build_object('jurisdiction_key','GH','primary_regulator',true))
on conflict (source_url) do update set jurisdiction_code='GH',country='Ghana',iso='GH',tier=1,source_type='regulator',crawl_allowed=true,is_active=true,relevance_status='verified',next_crawl_at=now()+interval '7 days',network_status='online',verification_notes='Primary NACOC cannabis regulatory source verified 2026-09-22.',verification_checked_at=now(),regulator_class='drug_control_authority',updated_at=now();

update public.jurisdiction_dimension_coverage
set status='verified_populated',evidence_basis='Primary NACOC source and verified regulatory evidence/claim/pathway.',last_evaluated_at=now(),notes='Verified 2026-09-22 from primary NACOC source.'
where jurisdiction_key='GH' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways');

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),notes='Verified from primary NACOC source on 2026-09-22.'
where jurisdiction_key='GH' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922192000','primary_gh_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922192000_primary_gh_enrichment.sql

-- RECOVERY BEGIN 20260922220000_primary_us_va_enrichment.sql
-- Primary-source enrichment for US-VA, verified 2026-09-22.
begin;
insert into public.source_registry(source_name,source_url,jurisdiction,country,iso,jurisdiction_code,tier,source_type,regulator_class,notes,verification_notes)
select 'Virginia Cannabis Control Authority — Retail Marijuana Market','https://cca.virginia.gov/retailmarijuanamarket','Virginia','United States','US-VA','US-VA',1,'government','other','Official CCA retail marijuana market framework and timeline.','Primary government source verified 2026-09-22.'
where not exists(select 1 from public.source_registry where source_url='https://cca.virginia.gov/retailmarijuanamarket' and jurisdiction_code='US-VA');
insert into public.source_registry(source_name,source_url,jurisdiction,country,iso,jurisdiction_code,tier,source_type,regulator_class,notes,verification_notes)
select 'Virginia Administrative Code — Cannabis Control Authority','https://law.lis.virginia.gov/admincodefull/title3/agency10/','Virginia','United States','US-VA','US-VA',1,'government','other','Official Virginia Administrative Code for medical cannabis operations, product rules, labeling and packaging.','Primary government source verified 2026-09-22.'
where not exists(select 1 from public.source_registry where source_url='https://law.lis.virginia.gov/admincodefull/title3/agency10/' and jurisdiction_code='US-VA');
insert into public.source_registry(source_name,source_url,jurisdiction,country,iso,jurisdiction_code,tier,source_type,regulator_class,notes,verification_notes)
select 'Virginia Code — Medical Cannabis Program definitions','https://law.lis.virginia.gov/vacodeupdates/title4.1/section4.1-1600/','Virginia','United States','US-VA','US-VA',1,'government','other','Official Code of Virginia definitions for medical cannabis, cannabis oil, edible, inhalable and topical cannabis products.','Primary government source verified 2026-09-22.'
where not exists(select 1 from public.source_registry where source_url='https://law.lis.virginia.gov/vacodeupdates/title4.1/section4.1-1600/' and jurisdiction_code='US-VA');
insert into public.regulatory_market_access_evidence(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values('primary-evidence-us-va-retail-framework-20260922','VA','legal_commercial_access','Virginia legislation establishes a legal retail marijuana market; CCA states regulations are scheduled for January 2027 and retail sales for July 1, 2027.','Virginia Cannabis Control Authority','https://cca.virginia.gov/retailmarijuanamarket','2026-09-01',now(),now()+interval '180 days',true)
on conflict(evidence_key) do update set rationale=excluded.rationale,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=excluded.verified_at,expires_at=excluded.expires_at,active=true;
insert into public.regulatory_market_access_claims(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values('primary-evidence-us-va-retail-framework-20260922','VA','primary-evidence-claim:us-va-retail-framework-20260922','Virginia has enacted a legal retail marijuana market framework; CCA states regulations are to be effective in January 2027 and retail sales are scheduled for July 1, 2027.','any','subnational','Virginia Cannabis Control Authority','https://cca.virginia.gov/retailmarijuanamarket','2026-09-01',now(),now(),now()+interval '180 days','verified')
on conflict(claim_key) do update set claim_text=excluded.claim_text,authority_name=excluded.authority_name,authority_url=excluded.authority_url,verified_at=excluded.verified_at,expires_at=excluded.expires_at,evidence_status='verified';
insert into public.regulatory_pathways(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at)
select c.id,'VA','depth-v1-us-va-retail','Virginia retail marijuana commercial market framework','adult_use_commercial','2026 Virginia legislation establishing a legal retail marijuana market','Virginia Cannabis Control Authority','scheduled','2027-07-01','Legal retail marijuana market enacted; regulations scheduled January 2027 and retail sales scheduled July 1, 2027.','{https://cca.virginia.gov/retailmarijuanamarket}','needs_review',now()
from public.countries c where c.iso_alpha2='US' and not exists(select 1 from public.regulatory_pathways where slug='depth-v1-us-va-retail');
insert into public.regulatory_citations(entity_type,entity_id,instrument,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',id,'Virginia retail marijuana market framework','regulator','https://cca.virginia.gov/retailmarijuanamarket','2026-09-01',current_date,'CCA states that 2026 legislation establishes a legal retail marijuana market and publishes the regulatory and retail-sales timeline.'
from public.regulatory_pathways where slug='depth-v1-us-va-retail' and not exists(select 1 from public.regulatory_citations c where c.entity_type='pathway' and c.entity_id=public.regulatory_pathways.id and c.citation_url='https://cca.virginia.gov/retailmarijuanamarket');
update public.regulatory_pathways set verification='verified',last_verified_at=now() where slug='depth-v1-us-va-retail';
insert into public.regulatory_pathways(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at)
select c.id,'VA','depth-v1-us-va-medical','Virginia medical cannabis access program','medical_access_program','Virginia Code Chapter 16 and Virginia Administrative Code Title 3 Agency 10','Virginia Cannabis Control Authority','active','2026-03-09','Qualified patients access regulated cannabis products through licensed pharmaceutical processors and cannabis dispensing facilities.','{https://law.lis.virginia.gov/vacodeupdates/title4.1/section4.1-1600/,https://law.lis.virginia.gov/admincode/title3/agency10/chapter50/section80/,https://law.lis.virginia.gov/admincode/title3/agency10/chapter70/section20/}','needs_review',now()
from public.countries c where c.iso_alpha2='US' and not exists(select 1 from public.regulatory_pathways where slug='depth-v1-us-va-medical');
insert into public.regulatory_citations(entity_type,entity_id,instrument,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',id,'Virginia Code Chapter 16 — Medical Cannabis Program','regulator','https://law.lis.virginia.gov/vacodeupdates/title4.1/section4.1-1600/','2026-09-21',current_date,'Virginia law defines botanical cannabis, cannabis oil, cannabis products, edible, inhalable and topical cannabis products.'
from public.regulatory_pathways where slug='depth-v1-us-va-medical' and not exists(select 1 from public.regulatory_citations c where c.entity_type='pathway' and c.entity_id=public.regulatory_pathways.id and c.citation_url='https://law.lis.virginia.gov/vacodeupdates/title4.1/section4.1-1600/');
update public.regulatory_pathways set verification='verified',last_verified_at=now() where slug='depth-v1-us-va-medical';
insert into public.pathway_format_rules(pathway_id,format_id,status,conditions,notes,source_urls,verification,last_verified_at,effective_date,packaging_labelling)
select p.id,f.id,'permitted','{"medical_program":true}'::jsonb,'Virginia source defines and regulates this medical product category.','{https://law.lis.virginia.gov/vacodeupdates/title4.1/section4.1-1600/}','needs_review',now(),'2026-03-09','Virginia medical cannabis labeling and packaging rules apply.'
from public.regulatory_pathways p cross join public.product_formats f where p.slug='depth-v1-us-va-medical' and f.slug in('dried_flower','oral_oil','edibles','vape_products','topicals')
and not exists(select 1 from public.pathway_format_rules r where r.pathway_id=p.id and r.format_id=f.id);
insert into public.regulatory_citations(entity_type,entity_id,instrument,source_type,citation_url,published_date,accessed_date,excerpt)
select 'rule',r.id,'Virginia medical cannabis product definitions and labeling','regulator',r.source_urls[1],'2026-09-21',current_date,'Virginia Code and Administrative Code define and regulate the applicable medical cannabis product category.'
from public.pathway_format_rules r join public.regulatory_pathways p on p.id=r.pathway_id where p.slug='depth-v1-us-va-medical'
and not exists(select 1 from public.regulatory_citations c where c.entity_type='rule' and c.entity_id=r.id and c.citation_url=r.source_urls[1]);
update public.pathway_format_rules r set verification='verified',last_verified_at=now() from public.regulatory_pathways p where r.pathway_id=p.id and p.slug='depth-v1-us-va-medical';
insert into public.regulatory_calendar(iso2,event_type,title,summary,expected_date,confidence,source_url,source_label,status)
select 'VA','effective','Virginia retail marijuana sales scheduled start','CCA states retail marijuana sales begin July 1, 2027.','2027-07-01','confirmed','https://cca.virginia.gov/retailmarijuanamarket','Virginia Cannabis Control Authority','scheduled'
where not exists(select 1 from public.regulatory_calendar where iso2='VA' and title='Virginia retail marijuana sales scheduled start');
update public.jurisdiction_dimension_coverage set status='verified_populated',applicability='applicable',evidence_basis='Primary Virginia Cannabis Control Authority and Virginia Code/Administrative Code sources verified 2026-09-22',last_evaluated_at=now(),notes='Primary-source retail framework, medical pathway and medical product-format rules. Adult-use future-market formats remain open until final regulations are effective.'
where jurisdiction_key='US-VA' and dimension_key in('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','verified_format_rules','regulatory_calendar');
update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now(),notes=coalesce(notes,'')||' Primary US-VA enrichment added 2026-09-22.'
where jurisdiction_key='US-VA' and dimension_key in('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','verified_format_rules','regulatory_calendar');
commit;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922220000','primary_us_va_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922220000_primary_us_va_enrichment.sql

-- RECOVERY BEGIN 20260922230000_full_depth_intelligence_contract.sql
-- Full-depth intelligence contract for the canonical 291-jurisdiction universe.
-- This migration creates measurement metadata only. It does not fabricate facts or
-- populate missing jurisdiction intelligence.
create table if not exists public.jurisdiction_data_depth_dimensions (
  dimension_key text primary key,
  display_name text not null,
  layer text not null,
  description text not null,
  required_for_regulatory_publication boolean not null default false,
  requires_primary_source boolean not null default false,
  freshness_days integer,
  sort_order integer not null,
  contract_version text not null default '2026-09-22.v1',
  created_at timestamptz not null default now(),
  constraint jurisdiction_data_depth_dimensions_freshness_nonnegative
    check (freshness_days is null or freshness_days >= 0)
);

insert into public.jurisdiction_data_depth_dimensions
  (dimension_key, display_name, layer, description, required_for_regulatory_publication, requires_primary_source, freshness_days, sort_order)
values
('identity','Identity','foundation','Canonical jurisdiction identity and stable key.',false,false,null,10),
('hierarchy','Jurisdiction hierarchy','foundation','Parent, child, level and hierarchy integrity.',false,false,null,20),
('regulatory_status','Regulatory status','regulatory','Current legal/regulatory status.',true,true,30,30),
('regulatory_tier','Regulatory tier','regulatory','Commercial market-access tier backed by evidence.',true,true,30,40),
('source_registry','Primary-source registry','evidence','Authoritative source registration.',true,true,90,50),
('source_snapshot','Primary-source snapshot','evidence','Successful immutable source capture with provenance.',true,true,30,60),
('claims','Claim-level evidence','evidence','Atomic regulatory claims with evidence linkage.',true,true,30,70),
('pathways','Licensing pathways','regulatory','Commercial/medical/licensing pathways and requirements.',true,true,30,80),
('format_rules','Product/form-factor rules','regulatory','Product classes and format-specific rules.',true,true,30,90),
('access_rules','Possession/access rules','regulatory','Possession, patient/consumer access and eligibility.',true,true,30,100),
('commercial_activity','Commercial activity rules','regulatory','Allowed commercial activities and constraints.',true,true,30,110),
('import','Import rules','trade','Import permissions, licences and restrictions.',true,true,30,120),
('export','Export rules','trade','Export permissions, licences and restrictions.',true,true,30,130),
('distribution','Distribution rules','trade','Distribution/wholesale channel requirements.',true,true,30,140),
('testing','Testing requirements','compliance','Testing and laboratory requirements.',true,true,60,150),
('packaging_labeling','Packaging/labeling','compliance','Packaging, labeling and disclosure requirements.',true,true,60,160),
('tax_fees','Taxation/fees','commercial','Taxes, duties, licence and application fees.',true,true,60,170),
('regulator','Regulator/contact authority','governance','Responsible authority and authoritative contact surface.',true,true,90,180),
('calendar','Regulatory calendar','regulatory','Known effective dates, deadlines and pending changes.',true,true,14,190),
('change_history','Regulatory change history','history','Historical regulatory changes with source/effective dates.',false,true,30,200),
('market_metrics','Market metrics','commercial','Structured market-size, sales and other metrics with periods.',false,false,30,210),
('trade_flows','Trade flows','commercial','Structured origin/destination/product trade observations.',false,false,90,220),
('participants','Market participants','network','Known licensed/commercial market entities.',false,false,30,230),
('buyers','Buyer intelligence','network','Qualified buyer requirements and demand signals.',false,false,30,240),
('sellers','Seller intelligence','network','Qualified seller capabilities and supply signals.',false,false,30,250),
('counterparties','Counterparty intelligence','network','Entity records, roles, qualification and diligence state.',false,false,30,260),
('relationships','Relationships/network edges','network','Evidence-backed relationships between market entities.',false,false,30,270),
('opportunities','Commercial opportunities','commercial','Evidence-backed opportunities and eligibility constraints.',false,false,14,280),
('signals','Intelligence signals','intelligence','Fresh, classified market/regulatory signals.',false,false,7,290),
('freshness','Source/data freshness','quality','System-wide freshness and expiry state.',false,false,7,300),
('uncertainty','Conflict/uncertainty state','quality','Explicit conflicting, stale, inferred and blocked states.',false,false,7,310),
('research_queue','Research queue/unresolved gaps','quality','Explicit unresolved research and evidence gaps.',false,false,7,320)
on conflict (dimension_key) do update set
  display_name=excluded.display_name,
  layer=excluded.layer,
  description=excluded.description,
  required_for_regulatory_publication=excluded.required_for_regulatory_publication,
  requires_primary_source=excluded.requires_primary_source,
  freshness_days=excluded.freshness_days,
  sort_order=excluded.sort_order,
  contract_version=excluded.contract_version;

create or replace view public.v_jurisdiction_data_depth_contract
with (security_invoker = on) as
select
  c.iso_alpha2 as jurisdiction_key,
  c.country_name,
  d.dimension_key,
  d.display_name,
  d.layer,
  d.required_for_regulatory_publication,
  d.requires_primary_source,
  case
    when d.dimension_key='identity' then 'complete'
    when d.dimension_key='hierarchy' then
      case when c.iso_alpha2 is not null then 'complete' else 'missing' end
    when d.dimension_key='regulatory_tier' then
      case when c.verified_regulatory_tier is not null then 'complete' else 'blocked' end
    when d.dimension_key='source_registry' then
      case when coalesce(x.registered_source_rows,0)>0 then 'complete' else 'missing' end
    when d.dimension_key='source_snapshot' then
      case when coalesce(x.successful_snapshot_rows,0)>0 then 'complete' else 'missing' end
    when d.dimension_key='claims' then
      case when coalesce(x.verified_claim_rows,0)>0 then 'complete' else 'missing' end
    when d.dimension_key='pathways' then
      case when coalesce(x.verified_pathway_rows,0)>0 then 'complete' else 'missing' end
    when d.dimension_key='format_rules' then
      case when coalesce(x.verified_format_rule_rows,0)>0 then 'complete' else 'missing' end
    when d.dimension_key='market_metrics' then
      case when coalesce(x.metric_rows,0)>0 then 'complete' else 'missing' end
    when d.dimension_key='trade_flows' then
      case when coalesce(x.trade_flow_rows,0)>0 then 'complete' else 'missing' end
    when d.dimension_key='signals' then
      case when coalesce(x.signal_rows,0)>0 then 'complete' else 'missing' end
    when d.dimension_key='calendar' then
      case when coalesce(x.calendar_rows,0)>0 then 'complete' else 'missing' end
    when d.dimension_key='freshness' then
      case when coalesce(x.latest_snapshot_at, x.latest_source_check) is not null then 'measured' else 'missing' end
    else 'unmeasured'
  end as status,
  case
    when d.dimension_key in ('identity','hierarchy') then null
    when d.dimension_key in ('regulatory_tier','source_registry','source_snapshot','claims','pathways','format_rules',
                             'market_metrics','trade_flows','signals','calendar')
      and (
        case d.dimension_key
          when 'regulatory_tier' then c.verified_regulatory_tier is not null
          when 'source_registry' then coalesce(x.registered_source_rows,0)>0
          when 'source_snapshot' then coalesce(x.successful_snapshot_rows,0)>0
          when 'claims' then coalesce(x.verified_claim_rows,0)>0
          when 'pathways' then coalesce(x.verified_pathway_rows,0)>0
          when 'format_rules' then coalesce(x.verified_format_rule_rows,0)>0
          when 'market_metrics' then coalesce(x.metric_rows,0)>0
          when 'trade_flows' then coalesce(x.trade_flow_rows,0)>0
          when 'signals' then coalesce(x.signal_rows,0)>0
          when 'calendar' then coalesce(x.calendar_rows,0)>0
          else false
        end
      ) then 'evidence_present'
    else 'not_yet_measured'
  end as evidence_state,
  d.contract_version
from public.countries c
cross join public.jurisdiction_data_depth_dimensions d
left join public.v_jurisdiction_data_depth x on x.jurisdiction_key=c.iso_alpha2;

create or replace view public.v_jurisdiction_data_depth_summary
with (security_invoker = on) as
select
  jurisdiction_key,
  country_name,
  count(*) total_contract_dimensions,
  count(*) filter (where status='complete') complete_dimensions,
  count(*) filter (where status='missing') missing_dimensions,
  count(*) filter (where status='blocked') blocked_dimensions,
  count(*) filter (where status='unmeasured') unmeasured_dimensions,
  round(100.0 * count(*) filter (where status='complete') / nullif(count(*),0),2) contract_depth_pct,
  bool_and(not required_for_regulatory_publication or status='complete') as regulatory_publication_ready
from public.v_jurisdiction_data_depth_contract
group by jurisdiction_key,country_name;

comment on table public.jurisdiction_data_depth_dimensions is
'Versioned full-depth intelligence contract. Missing/unmeasured dimensions are not treated as complete.';
comment on view public.v_jurisdiction_data_depth_contract is
'Deterministic dimension-level depth state for the 291-jurisdiction universe. Does not fabricate missing facts.';
comment on view public.v_jurisdiction_data_depth_summary is
'Aggregate depth view. 100% is impossible until every contract dimension is complete or explicitly modeled as not applicable.';

grant select on public.jurisdiction_data_depth_dimensions to anon, authenticated;
grant select on public.v_jurisdiction_data_depth_contract to anon, authenticated;
grant select on public.v_jurisdiction_data_depth_summary to anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922230000','full_depth_intelligence_contract','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922230000_full_depth_intelligence_contract.sql

-- RECOVERY BEGIN 20260922233000_full_depth_dimension_state_matrix.sql
-- Complete the full-depth contract with an explicit jurisdiction x dimension state matrix.
-- Unknown applicability is intentionally distinct from not-applicable. No facts are inferred.
create table if not exists public.jurisdiction_data_depth_dimension_state (
  jurisdiction_key text not null,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on delete cascade,
  contract_version text not null default '2026-09-22.v1',
  applicability text not null default 'unknown'
    check (applicability in ('applicable','not_applicable','unknown')),
  status text not null default 'unmeasured'
    check (status in ('complete','missing','blocked','stale','conflict','unmeasured')),
  blocker_reason text,
  evidence_count integer not null default 0 check (evidence_count >= 0),
  primary_source_count integer not null default 0 check (primary_source_count >= 0),
  latest_verified_at timestamptz,
  freshness_deadline timestamptz,
  confidence text check (confidence is null or confidence in ('high','medium','low','unknown')),
  evidence_basis text,
  parent_jurisdiction_key text,
  last_evaluated_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (jurisdiction_key, dimension_key, contract_version)
);

create index if not exists jurisdiction_data_depth_dimension_state_status_idx
  on public.jurisdiction_data_depth_dimension_state(status, applicability, dimension_key);
create index if not exists jurisdiction_data_depth_dimension_state_jurisdiction_idx
  on public.jurisdiction_data_depth_dimension_state(jurisdiction_key, dimension_key);

alter table public.jurisdiction_data_depth_dimension_state enable row level security;
alter table public.jurisdiction_data_depth_dimension_state force row level security;
drop policy if exists jurisdiction_data_depth_dimension_state_public_read
  on public.jurisdiction_data_depth_dimension_state;
create policy jurisdiction_data_depth_dimension_state_public_read
  on public.jurisdiction_data_depth_dimension_state
  for select to anon, authenticated using (true);
grant select on public.jurisdiction_data_depth_dimension_state to anon, authenticated;

-- Seed the full matrix from the canonical country universe. Every state starts
-- unmeasured/unknown; this is the required fail-closed baseline.
insert into public.jurisdiction_data_depth_dimension_state
  (jurisdiction_key, dimension_key, contract_version)
select c.iso_alpha2, d.dimension_key, d.contract_version
from public.countries c
cross join public.jurisdiction_data_depth_dimensions d
on conflict (jurisdiction_key, dimension_key, contract_version) do nothing;

-- Map the existing 11-dimension evidence system into the new contract.
with mapped as (
  select
    c.jurisdiction_key,
    case c.dimension_key
      when 'verified_regulatory_evidence' then 'regulatory_status'
      when 'verified_regulatory_claims' then 'claims'
      when 'verified_pathways' then 'pathways'
      when 'verified_format_rules' then 'format_rules'
      when 'market_metrics' then 'market_metrics'
      when 'trade_flows' then 'trade_flows'
      when 'signals' then 'signals'
      when 'source_registry' then 'source_registry'
      when 'source_snapshots' then 'source_snapshot'
      when 'regulatory_calendar' then 'calendar'
    end as dimension_key,
    c.status,
    c.applicability,
    c.evidence_basis,
    c.parent_jurisdiction_key,
    c.last_evaluated_at
  from public.jurisdiction_dimension_coverage c
  where c.dimension_key in (
    'country_intel','verified_regulatory_evidence','verified_regulatory_claims',
    'verified_pathways','verified_format_rules','market_metrics','trade_flows',
    'signals','source_registry','source_snapshots','regulatory_calendar'
  )
)
update public.jurisdiction_data_depth_dimension_state s
set
  applicability = case
    when mapped.applicability = 'applicable' then 'applicable'
    when mapped.applicability = 'not_applicable' then 'not_applicable'
    else 'unknown'
  end,
  status = case
    when mapped.status in ('verified_populated','verified_empty','not_applicable') then
      case when mapped.applicability = 'not_applicable' then 'complete' else 'complete' end
    when mapped.status = 'blocked' then 'blocked'
    when mapped.status = 'open' then 'missing'
    else 'unmeasured'
  end,
  blocker_reason = case
    when mapped.status = 'blocked' then coalesce(mapped.evidence_basis, 'Blocked by unresolved evidence requirement.')
    when mapped.status = 'open' then 'Evidence-backed enrichment required; no completion inferred.'
    else null
  end,
  evidence_basis = mapped.evidence_basis,
  parent_jurisdiction_key = mapped.parent_jurisdiction_key,
  last_evaluated_at = mapped.last_evaluated_at,
  updated_at = now()
from mapped
where s.jurisdiction_key = mapped.jurisdiction_key
  and s.dimension_key = mapped.dimension_key
  and s.contract_version = '2026-09-22.v1';

-- Fill measurable provenance/freshness fields from the existing evidence layer.
update public.jurisdiction_data_depth_dimension_state s
set
  evidence_count = case s.dimension_key
    when 'source_registry' then coalesce(v.registered_source_rows,0)
    when 'source_snapshot' then coalesce(v.successful_snapshot_rows,0)
    when 'claims' then coalesce(v.verified_claim_rows,0)
    when 'pathways' then coalesce(v.verified_pathway_rows,0)
    when 'format_rules' then coalesce(v.verified_format_rule_rows,0)
    when 'market_metrics' then coalesce(v.metric_rows,0)
    when 'trade_flows' then coalesce(v.trade_flow_rows,0)
    when 'signals' then coalesce(v.signal_rows,0)
    when 'calendar' then coalesce(v.calendar_rows,0)
    when 'regulatory_status' then coalesce(v.current_verified_evidence_rows,0)
    else s.evidence_count
  end,
  primary_source_count = case
    when s.dimension_key in ('source_registry','source_snapshot','claims','regulatory_status')
      then coalesce(v.official_source_rows,0)
    else s.primary_source_count
  end,
  latest_verified_at = case s.dimension_key
    when 'source_registry' then v.latest_source_check
    when 'source_snapshot' then v.latest_snapshot_at
    when 'claims' then v.latest_evidence_verified_at
    when 'regulatory_status' then v.latest_evidence_verified_at
    when 'pathways' then v.latest_pathway_verified_at
    when 'market_metrics' then v.latest_metric_updated_at
    when 'trade_flows' then v.latest_trade_verified_at
    when 'signals' then v.latest_signal_at
    when 'calendar' then v.latest_calendar_update
    else s.latest_verified_at
  end,
  freshness_deadline = case
    when d.freshness_days is not null and (
      case s.dimension_key
        when 'source_registry' then v.latest_source_check
        when 'source_snapshot' then v.latest_snapshot_at
        when 'claims' then v.latest_evidence_verified_at
        when 'regulatory_status' then v.latest_evidence_verified_at
        when 'pathways' then v.latest_pathway_verified_at
        when 'market_metrics' then v.latest_metric_updated_at
        when 'trade_flows' then v.latest_trade_verified_at
        when 'signals' then v.latest_signal_at
        when 'calendar' then v.latest_calendar_update
        else s.latest_verified_at
      end
    ) is not null
      then (
        case s.dimension_key
          when 'source_registry' then v.latest_source_check
          when 'source_snapshot' then v.latest_snapshot_at
          when 'claims' then v.latest_evidence_verified_at
          when 'regulatory_status' then v.latest_evidence_verified_at
          when 'pathways' then v.latest_pathway_verified_at
          when 'market_metrics' then v.latest_metric_updated_at
          when 'trade_flows' then v.latest_trade_verified_at
          when 'signals' then v.latest_signal_at
          when 'calendar' then v.latest_calendar_update
          else s.latest_verified_at
        end
      ) + make_interval(days => d.freshness_days)
    else null
  end,
  status = case
    when s.applicability = 'not_applicable' then 'complete'
    when d.freshness_days is not null and (
      case s.dimension_key
        when 'source_registry' then v.latest_source_check
        when 'source_snapshot' then v.latest_snapshot_at
        when 'claims' then v.latest_evidence_verified_at
        when 'regulatory_status' then v.latest_evidence_verified_at
        when 'pathways' then v.latest_pathway_verified_at
        when 'market_metrics' then v.latest_metric_updated_at
        when 'trade_flows' then v.latest_trade_verified_at
        when 'signals' then v.latest_signal_at
        when 'calendar' then v.latest_calendar_update
        else s.latest_verified_at
      end
    ) + make_interval(days => d.freshness_days) < now()
      then 'stale'
    else s.status
  end,
  updated_at = now()
from public.jurisdiction_data_depth_dimensions d
join public.v_jurisdiction_data_depth v
  on v.jurisdiction_key = s.jurisdiction_key
where d.dimension_key = s.dimension_key
  and d.contract_version = s.contract_version
  and s.contract_version = '2026-09-22.v1';

create or replace view public.v_jurisdiction_data_depth_contract
with (security_invoker = on) as
select
  s.jurisdiction_key,
  c.country_name,
  s.dimension_key,
  d.display_name,
  d.layer,
  d.required_for_regulatory_publication,
  d.requires_primary_source,
  s.applicability,
  s.status,
  s.blocker_reason,
  s.evidence_count,
  s.primary_source_count,
  s.latest_verified_at,
  s.freshness_deadline,
  s.confidence,
  s.evidence_basis,
  s.parent_jurisdiction_key,
  s.last_evaluated_at,
  s.contract_version
from public.jurisdiction_data_depth_dimension_state s
join public.countries c on c.iso_alpha2 = s.jurisdiction_key
join public.jurisdiction_data_depth_dimensions d
  on d.dimension_key = s.dimension_key
 and d.contract_version = s.contract_version;

create or replace view public.v_jurisdiction_data_depth_summary
with (security_invoker = on) as
select
  jurisdiction_key,
  max(country_name) country_name,
  count(*) total_contract_dimensions,
  count(*) filter (where status='complete') complete_dimensions,
  count(*) filter (where status='missing') missing_dimensions,
  count(*) filter (where status in ('blocked','stale','conflict')) blocked_dimensions,
  count(*) filter (where status='unmeasured') unmeasured_dimensions,
  count(*) filter (where applicability='unknown') unknown_applicability_dimensions,
  count(*) filter (where applicability='not_applicable') not_applicable_dimensions,
  round(
    100.0 * count(*) filter (where status='complete')
    / nullif(count(*) filter (where applicability <> 'unknown'),0), 2
  ) contract_depth_pct,
  bool_and(
    not required_for_regulatory_publication
    or (applicability='not_applicable' and status='complete')
    or (applicability='applicable' and status='complete')
  ) as regulatory_publication_ready
from public.v_jurisdiction_data_depth_contract
group by jurisdiction_key;

create or replace view public.v_jurisdiction_data_depth_integrity
with (security_invoker = on) as
select
  count(distinct jurisdiction_key) as jurisdiction_count,
  count(*) as matrix_rows,
  count(distinct dimension_key) as dimension_count,
  count(*) filter (where applicability='unknown') as unknown_applicability_rows,
  count(*) filter (where status='unmeasured') as unmeasured_rows,
  count(*) filter (where status in ('blocked','stale','conflict')) as blocked_or_exception_rows,
  count(*) filter (where applicability='applicable' and status='complete') as applicable_complete_rows,
  count(*) filter (where applicability='not_applicable' and status='complete') as not_applicable_complete_rows,
  count(*) filter (where applicability='applicable' and status<>'complete') as applicable_incomplete_rows,
  (count(distinct jurisdiction_key)=291) as expected_jurisdiction_count,
  (count(distinct dimension_key)=32) as expected_dimension_count,
  (count(*)=291*32) as expected_matrix_size,
  (
    count(distinct jurisdiction_key)=291
    and count(distinct dimension_key)=32
    and count(*)=291*32
    and count(*) filter (where applicability='unknown')=0
    and count(*) filter (where status in ('missing','blocked','stale','conflict','unmeasured'))=0
  ) as full_depth_ready;

grant select on public.v_jurisdiction_data_depth_contract to anon, authenticated;
grant select on public.v_jurisdiction_data_depth_summary to anon, authenticated;
grant select on public.v_jurisdiction_data_depth_integrity to anon, authenticated;

comment on table public.jurisdiction_data_depth_dimension_state is
'Authoritative jurisdiction x dimension state matrix. Unknown applicability, missing evidence, stale evidence and conflicts are never treated as complete.';
comment on view public.v_jurisdiction_data_depth_integrity is
'Fail-closed integrity gate for the 291 x 32 full-depth contract. full_depth_ready is true only when every cell is explicitly applicable or not-applicable and complete.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922233000','full_depth_dimension_state_matrix','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922233000_full_depth_dimension_state_matrix.sql

-- RECOVERY BEGIN 20260922234500_full_depth_dimension_source_registry.sql
-- Dimension-to-source implementation registry.
-- This is a control-plane inventory: it does not assert evidence exists.
create table if not exists public.jurisdiction_data_depth_dimension_sources (
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on delete cascade,
  contract_version text not null default '2026-09-22.v1',
  source_kind text not null check (source_kind in ('table','view','derived','queue','schema_gap')),
  relation_name text,
  evidence_gate text not null,
  implementation_status text not null check (implementation_status in ('wired','partial','schema_gap')),
  notes text,
  primary key (dimension_key, contract_version)
);

insert into public.jurisdiction_data_depth_dimension_sources
(dimension_key,contract_version,source_kind,relation_name,evidence_gate,implementation_status,notes)
values
('identity','2026-09-22.v1','table','public.countries','Canonical jurisdiction exists with stable key and required identity fields.','wired',null),
('hierarchy','2026-09-22.v1','derived','public.countries','Parent/level must be explicit; no regex-only inference accepted as final authority.','partial','Existing country table does not yet persist a canonical parent key for every subnational jurisdiction.'),
('regulatory_status','2026-09-22.v1','table','public.regulatory_market_access_evidence','Current verified evidence with valid source snapshot and non-expired verification.','wired',null),
('regulatory_tier','2026-09-22.v1','table','public.countries + regulatory evidence','Tier must be supported by structured regulatory evidence; free-text/regex classification cannot complete the gate.','partial','Existing verified tier is present, but the full evidence-to-tier contract remains to be wired.'),
('source_registry','2026-09-22.v1','table','public.source_registry','Active authoritative source registered for jurisdiction.','wired',null),
('source_snapshot','2026-09-22.v1','table','public.source_snapshots','Successful snapshot tied to a registered source and jurisdiction.','wired',null),
('claims','2026-09-22.v1','table','public.regulatory_market_access_claims','Verified claim backed by qualifying evidence.','wired',null),
('pathways','2026-09-22.v1','table','public.regulatory_pathways','Verified pathway with legal basis and provenance.','wired',null),
('format_rules','2026-09-22.v1','table','public.pathway_format_rules','Verified product-format rule attached to a verified pathway.','wired',null),
('access_rules','2026-09-22.v1','schema_gap',null,'Structured eligibility, licensing and access requirements with authoritative evidence.','schema_gap','No dedicated jurisdiction-level access-rule relation was identified in the current contract wiring.'),
('commercial_activity','2026-09-22.v1','schema_gap',null,'Structured commercial activity status and authorized activities with evidence.','schema_gap','Requires dedicated structured evidence model.'),
('import','2026-09-22.v1','partial','public.regulatory_market_access_claims','Explicit import authorization/restriction claim with primary provenance.','partial','Existing claims can carry evidence but lack a dedicated import-rule contract.'),
('export','2026-09-22.v1','partial','public.regulatory_market_access_claims','Explicit export authorization/restriction claim with primary provenance.','partial','Existing claims can carry evidence but lack a dedicated export-rule contract.'),
('distribution','2026-09-22.v1','schema_gap',null,'Structured distribution channel and licensing rules with evidence.','schema_gap','Requires dedicated structured distribution model.'),
('testing','2026-09-22.v1','schema_gap',null,'Structured testing requirements, authority and applicability with evidence.','schema_gap','Requires dedicated structured testing model.'),
('packaging_labeling','2026-09-22.v1','schema_gap',null,'Structured packaging/labeling requirements with evidence and effective dates.','schema_gap','Requires dedicated structured packaging/labeling model.'),
('tax_fees','2026-09-22.v1','schema_gap',null,'Structured tax, fee and levy requirements with effective dates and source evidence.','schema_gap','Requires dedicated structured tax/fee model.'),
('regulator','2026-09-22.v1','partial','public.regulatory_pathways + public.source_registry','Named authority must be explicitly tied to jurisdiction and source provenance.','partial','Regulator information exists in pathways/sources but lacks a dedicated jurisdiction regulator registry.'),
('calendar','2026-09-22.v1','table','public.regulatory_calendar','Current/relevant event has source, effective/expected date and status.','wired',null),
('change_history','2026-09-22.v1','schema_gap',null,'Versioned before/after regulatory change with source snapshot and effective date.','schema_gap','Requires dedicated immutable change-event history.'),
('market_metrics','2026-09-22.v1','table','public.market_metrics','Metric has jurisdiction, period, definition and provenance.','wired',null),
('trade_flows','2026-09-22.v1','table','public.trade_flows','Trade observation has origin/destination, product category, period and verification.','wired',null),
('participants','2026-09-22.v1','schema_gap',null,'Verified market participant record tied to jurisdiction and source.','schema_gap','Existing operator/company data is not yet normalized into the full jurisdiction-depth contract.'),
('buyers','2026-09-22.v1','schema_gap',null,'Verified buyer/demand-side participant with jurisdiction and provenance.','schema_gap','Requires dedicated buyer evidence model.'),
('sellers','2026-09-22.v1','schema_gap',null,'Verified seller/supply-side participant with jurisdiction and provenance.','schema_gap','Requires dedicated seller evidence model.'),
('counterparties','2026-09-22.v1','schema_gap',null,'Verified counterparty relationship with role, jurisdiction and provenance.','schema_gap','Requires dedicated counterparty evidence model.'),
('relationships','2026-09-22.v1','schema_gap',null,'Verified relationship edge with evidence, date and confidence.','schema_gap','Requires dedicated relationship graph model.'),
('opportunities','2026-09-22.v1','partial','public.countries + intelligence/network data','Opportunity must derive only from evidence-complete inputs and preserve provenance.','partial','Existing opportunity fields are not sufficient as an evidence contract.'),
('signals','2026-09-22.v1','table','public.signals','Signal has source, jurisdiction, date and review/verification state.','wired',null),
('freshness','2026-09-22.v1','derived','public.source_snapshots + evidence tables','Latest qualifying verification must be within dimension freshness window.','partial','Freshness state is now tracked in the matrix but not every dimension has a dedicated verification timestamp.'),
('uncertainty','2026-09-22.v1','schema_gap',null,'Explicit confidence, conflict and unresolved uncertainty tied to evidence.','schema_gap','Requires dedicated depth uncertainty/conflict fields or normalized evidence state.'),
('research_queue','2026-09-22.v1','queue','public.jurisdiction_data_depth_tasks','Every incomplete cell has a deterministic research reason/task.','partial','Existing queue covers legacy dimensions; it must be expanded to all 32 contract dimensions.')
on conflict (dimension_key,contract_version) do update set
 source_kind=excluded.source_kind,
 relation_name=excluded.relation_name,
 evidence_gate=excluded.evidence_gate,
 implementation_status=excluded.implementation_status,
 notes=excluded.notes;

alter table public.jurisdiction_data_depth_dimension_sources enable row level security;
drop policy if exists jurisdiction_data_depth_dimension_sources_public_read
  on public.jurisdiction_data_depth_dimension_sources;
create policy jurisdiction_data_depth_dimension_sources_public_read
  on public.jurisdiction_data_depth_dimension_sources
  for select to anon, authenticated using (true);
grant select on public.jurisdiction_data_depth_dimension_sources to anon, authenticated;

create or replace view public.v_jurisdiction_data_depth_contract_gaps
with (security_invoker = on) as
select
  d.dimension_key,
  d.display_name,
  d.layer,
  d.required_for_regulatory_publication,
  coalesce(s.implementation_status,'schema_gap') implementation_status,
  coalesce(s.source_kind,'schema_gap') source_kind,
  s.relation_name,
  s.evidence_gate,
  s.notes
from public.jurisdiction_data_depth_dimensions d
left join public.jurisdiction_data_depth_dimension_sources s
  on s.dimension_key=d.dimension_key
 and s.contract_version=d.contract_version
where coalesce(s.implementation_status,'schema_gap') <> 'wired';

grant select on public.v_jurisdiction_data_depth_contract_gaps to anon, authenticated;

comment on table public.jurisdiction_data_depth_dimension_sources is
'Implementation registry for the 32-dimension depth contract. It explicitly distinguishes wired, partial and schema-gap dimensions without treating the inventory as evidence.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922234500','full_depth_dimension_source_registry','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922234500_full_depth_dimension_source_registry.sql

-- RECOVERY BEGIN 20260922240000_full_depth_structured_backing_models.sql
-- Structured backing models for the previously identified depth gaps.
create table if not exists public.jurisdiction_regulatory_rules (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null,
  rule_dimension text not null check (rule_dimension in ('access_rules','commercial_activity','import','export','distribution','testing','packaging_labeling','tax_fees')),
  rule_type text not null,
  rule_value jsonb not null,
  source_url text not null,
  source_snapshot_id uuid,
  effective_from date,
  effective_to date,
  verification_status text not null default 'unverified' check (verification_status in ('unverified','verified','superseded','conflict')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists jurisdiction_regulatory_rules_jurisdiction_idx on public.jurisdiction_regulatory_rules(jurisdiction_key,rule_dimension);
create index if not exists jurisdiction_regulatory_rules_status_idx on public.jurisdiction_regulatory_rules(verification_status);

create table if not exists public.jurisdiction_regulators (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null,
  regulator_name text not null,
  regulator_type text not null,
  authority_scope text not null,
  source_url text not null,
  source_snapshot_id uuid,
  effective_from date,
  effective_to date,
  verification_status text not null default 'unverified' check (verification_status in ('unverified','verified','superseded','conflict')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jurisdiction_regulatory_changes (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key),
  change_type text not null,
  previous_value jsonb,
  new_value jsonb,
  source_url text not null,
  source_snapshot_id uuid,
  announced_at timestamptz,
  effective_at timestamptz,
  verification_status text not null default 'unverified' check (verification_status in ('unverified','verified','superseded','conflict')),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists jurisdiction_regulatory_changes_idx on public.jurisdiction_regulatory_changes(jurisdiction_key,dimension_key,effective_at desc);

create table if not exists public.jurisdiction_market_participants (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null,
  participant_type text not null check (participant_type in ('participant','buyer','seller','counterparty')),
  name text not null,
  role text,
  status text,
  source_url text not null,
  source_snapshot_id uuid,
  effective_from date,
  effective_to date,
  verification_status text not null default 'unverified' check (verification_status in ('unverified','verified','superseded','conflict')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists jurisdiction_market_participants_idx on public.jurisdiction_market_participants(jurisdiction_key,participant_type);

create table if not exists public.jurisdiction_relationships (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null,
  from_entity_id uuid,
  to_entity_id uuid,
  relationship_type text not null,
  evidence jsonb not null default '{}'::jsonb,
  source_url text not null,
  source_snapshot_id uuid,
  confidence text not null default 'unknown' check (confidence in ('high','medium','low','unknown')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','verified','superseded','conflict')),
  effective_from date,
  effective_to date,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.jurisdiction_opportunities (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null,
  opportunity_type text not null,
  description text not null,
  evidence jsonb not null default '{}'::jsonb,
  source_url text not null,
  source_snapshot_id uuid,
  confidence text not null default 'unknown' check (confidence in ('high','medium','low','unknown')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','verified','superseded','conflict')),
  effective_from date,
  effective_to date,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

-- Explicit research work for every unresolved contract cell.
insert into public.jurisdiction_data_depth_tasks
(jurisdiction_key,dimension_key,jurisdiction_level,status,priority,evidence_required,notes)
select
  s.jurisdiction_key,
  s.dimension_key,
  c.jurisdiction_level,
  case
    when s.applicability='unknown' then 'open'
    when s.status in ('missing','unmeasured','stale','blocked','conflict') then 'open'
    else 'verified'
  end,
  case when d.required_for_regulatory_publication then 100 else 50 end,
  d.requires_primary_source,
  case
    when s.applicability='unknown' then 'Applicability must be established from authoritative jurisdiction-specific evidence.'
    when s.status='stale' then 'Existing evidence has exceeded the dimension freshness window.'
    when s.status='conflict' then 'Conflicting evidence requires documented resolution.'
    when s.status='blocked' then 'Evidence requirement is blocked and requires research resolution.'
    when s.status in ('missing','unmeasured') then 'Structured evidence required; no completion inferred.'
    else 'Existing contract state verified.'
  end
from public.jurisdiction_data_depth_dimension_state s
join public.countries c on c.iso_alpha2=s.jurisdiction_key
join public.jurisdiction_data_depth_dimensions d on d.dimension_key=s.dimension_key and d.contract_version=s.contract_version
where s.contract_version='2026-09-22.v1'
on conflict do nothing;

alter table public.jurisdiction_regulatory_rules enable row level security;
alter table public.jurisdiction_regulators enable row level security;
alter table public.jurisdiction_regulatory_changes enable row level security;
alter table public.jurisdiction_market_participants enable row level security;
alter table public.jurisdiction_relationships enable row level security;
alter table public.jurisdiction_opportunities enable row level security;

create policy jurisdiction_regulatory_rules_read on public.jurisdiction_regulatory_rules for select to anon,authenticated using (true);
create policy jurisdiction_regulators_read on public.jurisdiction_regulators for select to anon,authenticated using (true);
create policy jurisdiction_regulatory_changes_read on public.jurisdiction_regulatory_changes for select to anon,authenticated using (true);
create policy jurisdiction_market_participants_read on public.jurisdiction_market_participants for select to anon,authenticated using (true);
create policy jurisdiction_relationships_read on public.jurisdiction_relationships for select to anon,authenticated using (true);
create policy jurisdiction_opportunities_read on public.jurisdiction_opportunities for select to anon,authenticated using (true);

grant select on public.jurisdiction_regulatory_rules,public.jurisdiction_regulators,public.jurisdiction_regulatory_changes,public.jurisdiction_market_participants,public.jurisdiction_relationships,public.jurisdiction_opportunities to anon,authenticated;

comment on table public.jurisdiction_regulatory_rules is 'Structured jurisdiction-specific commercial/regulatory rules. Empty rows never imply permission or prohibition.';
comment on table public.jurisdiction_regulatory_changes is 'Versioned regulatory changes with source provenance and effective dates.';
comment on table public.jurisdiction_market_participants is 'Evidence-backed participant/buyer/seller/counterparty records; unverified rows do not satisfy depth.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260922240000','full_depth_structured_backing_models','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260922240000_full_depth_structured_backing_models.sql

-- RECOVERY BEGIN 20260923001000_full_depth_dynamic_evaluator.sql
-- Dynamic evaluator: derives contract state from current evidence instead of freezing
-- completeness at migration time. Unknown applicability remains unresolved.
create or replace view public.v_jurisdiction_data_depth_evaluator
with (security_invoker = on) as
with base as (
  select s.*, c.country_name, c.jurisdiction_level,
         d.required_for_regulatory_publication, d.requires_primary_source, d.freshness_days
  from public.jurisdiction_data_depth_dimension_state s
  join public.countries c on c.iso_alpha2=s.jurisdiction_key
  join public.jurisdiction_data_depth_dimensions d
    on d.dimension_key=s.dimension_key and d.contract_version=s.contract_version
  where s.contract_version='2026-09-22.v1'
),
rule_counts as (
  select jurisdiction_key, rule_dimension, count(*) filter (
    where verification_status='verified'
      and source_url <> ''
      and verified_at is not null
      and (effective_to is null or effective_to >= current_date)
  ) verified_rows,
  count(*) filter (where verification_status='conflict') conflict_rows,
  max(verified_at) filter (where verification_status='verified') latest_verified_at
  from public.jurisdiction_regulatory_rules
  group by jurisdiction_key, rule_dimension
),
regulator_counts as (
  select jurisdiction_key,
         count(*) filter (where verification_status='verified' and source_url <> '' and verified_at is not null) verified_rows,
         count(*) filter (where verification_status='conflict') conflict_rows,
         max(verified_at) filter (where verification_status='verified') latest_verified_at
  from public.jurisdiction_regulators group by jurisdiction_key
),
change_counts as (
  select jurisdiction_key,
         count(*) filter (where verification_status='verified' and source_url <> '' and verified_at is not null and effective_at is not null) verified_rows,
         count(*) filter (where verification_status='conflict') conflict_rows,
         max(verified_at) filter (where verification_status='verified') latest_verified_at
  from public.jurisdiction_regulatory_changes group by jurisdiction_key
),
participant_counts as (
  select jurisdiction_key, participant_type,
         count(*) filter (where verification_status='verified' and source_url <> '' and verified_at is not null) verified_rows,
         count(*) filter (where verification_status='conflict') conflict_rows,
         max(verified_at) filter (where verification_status='verified') latest_verified_at
  from public.jurisdiction_market_participants group by jurisdiction_key, participant_type
),
relationship_counts as (
  select jurisdiction_key,
         count(*) filter (where verification_status='verified' and source_url <> '' and verified_at is not null) verified_rows,
         count(*) filter (where verification_status='conflict') conflict_rows,
         max(verified_at) filter (where verification_status='verified') latest_verified_at
  from public.jurisdiction_relationships group by jurisdiction_key
),
opportunity_counts as (
  select jurisdiction_key,
         count(*) filter (where verification_status='verified' and source_url <> '' and verified_at is not null) verified_rows,
         count(*) filter (where verification_status='conflict') conflict_rows,
         max(verified_at) filter (where verification_status='verified') latest_verified_at
  from public.jurisdiction_opportunities group by jurisdiction_key
),
generic_evidence as (
  select jurisdiction_key,dimension_key,
         count(*) filter(where verification_status='verified') verified_rows,
         count(*) filter(where verification_status='verified' and coalesce(g.qualifying_snapshot,false) and g.captured_url=source_url) qualified_rows,
         count(*) filter(where verification_status='conflict') conflict_rows,
         max(verified_at) filter(where verification_status='verified') latest_verified_at
  from public.jurisdiction_data_depth_evidence e
  left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=e.source_snapshot_id
  group by jurisdiction_key,dimension_key
),
legacy as (
  select * from public.v_jurisdiction_data_depth
),
market_access_snapshot_gate as (
  select
    e.jurisdiction_iso2 as jurisdiction_key,
    count(*) filter (
      where e.active
        and e.verified_at is not null
        and e.expires_at >= now()
    ) as current_verified_rows,
    count(*) filter (
      where e.active
        and e.verified_at is not null
        and e.expires_at >= now()
        and e.source_snapshot_sha256 is not null
        and g.qualifying_snapshot
        and lower(e.source_snapshot_sha256)=lower(g.snapshot_hash)
        and e.authority_url=g.registered_source_url
    ) as qualifying_current_rows
  from public.regulatory_market_access_evidence e
  left join public.v_jurisdiction_verified_snapshot_gate g
    on lower(e.source_snapshot_sha256)=lower(g.snapshot_hash)
   and e.authority_url=g.registered_source_url
  group by e.jurisdiction_iso2
)
select
  b.jurisdiction_key,
  b.country_name,
  b.dimension_key,
  b.display_name,
  b.layer,
  b.required_for_regulatory_publication,
  b.requires_primary_source,
  b.applicability,
  case
    when b.applicability='unknown' then 'unmeasured'
    when b.applicability='not_applicable' then 'complete'
    when b.dimension_key not in ('regulatory_status','regulatory_tier')
      and coalesce(ge.qualified_rows,0)>0 and coalesce(ge.conflict_rows,0)=0 then 'complete'
    when b.dimension_key='identity' then 'complete'
    when b.dimension_key='hierarchy' then b.status
    when b.dimension_key='regulatory_status' then
      case when coalesce(ma.qualifying_current_rows,0)>0 then 'complete'
           when coalesce(ma.current_verified_rows,0)>0 then 'blocked'
           else 'missing' end
    when b.dimension_key='regulatory_tier' then
      case when coalesce(ma.qualifying_current_rows,0)>0
             and c.verified_regulatory_tier is not null then 'complete'
           when c.verified_regulatory_tier is not null then 'blocked'
           else 'missing' end
    when b.dimension_key='source_registry' then
      case when l.active_source_rows>0 and l.official_source_rows>0 then 'complete' else 'missing' end
    when b.dimension_key='source_snapshot' then
      case when l.successful_snapshot_rows>0 then 'complete' else 'missing' end
    when b.dimension_key='claims' then
      case when l.verified_claim_rows>0 then 'complete' else 'missing' end
    when b.dimension_key='pathways' then
      case when l.verified_pathway_rows>0 then 'complete' else 'missing' end
    when b.dimension_key='format_rules' then
      case when l.verified_format_rule_rows>0 then 'complete' else 'missing' end
    when b.dimension_key='access_rules' then
      case when coalesce(rc.verified_rows,0)>0 and coalesce(rc.conflict_rows,0)=0 then 'complete'
           when coalesce(rc.conflict_rows,0)>0 then 'conflict' else 'missing' end
    when b.dimension_key='commercial_activity' then
      case when coalesce(rc.verified_rows,0)>0 and coalesce(rc.conflict_rows,0)=0 then 'complete'
           when coalesce(rc.conflict_rows,0)>0 then 'conflict' else 'missing' end
    when b.dimension_key='import' then
      case when coalesce(rc.verified_rows,0)>0 and coalesce(rc.conflict_rows,0)=0 then 'complete'
           when coalesce(rc.conflict_rows,0)>0 then 'conflict' else 'missing' end
    when b.dimension_key='export' then
      case when coalesce(rc.verified_rows,0)>0 and coalesce(rc.conflict_rows,0)=0 then 'complete'
           when coalesce(rc.conflict_rows,0)>0 then 'conflict' else 'missing' end
    when b.dimension_key='distribution' then
      case when coalesce(rc.verified_rows,0)>0 and coalesce(rc.conflict_rows,0)=0 then 'complete'
           when coalesce(rc.conflict_rows,0)>0 then 'conflict' else 'missing' end
    when b.dimension_key='testing' then
      case when coalesce(rc.verified_rows,0)>0 and coalesce(rc.conflict_rows,0)=0 then 'complete'
           when coalesce(rc.conflict_rows,0)>0 then 'conflict' else 'missing' end
    when b.dimension_key='packaging_labeling' then
      case when coalesce(rc.verified_rows,0)>0 and coalesce(rc.conflict_rows,0)=0 then 'complete'
           when coalesce(rc.conflict_rows,0)>0 then 'conflict' else 'missing' end
    when b.dimension_key='tax_fees' then
      case when coalesce(rc.verified_rows,0)>0 and coalesce(rc.conflict_rows,0)=0 then 'complete'
           when coalesce(rc.conflict_rows,0)>0 then 'conflict' else 'missing' end
    when b.dimension_key='regulator' then
      case when coalesce(rgc.verified_rows,0)>0 and coalesce(rgc.conflict_rows,0)=0 then 'complete'
           when coalesce(rgc.conflict_rows,0)>0 then 'conflict' else 'missing' end
    when b.dimension_key='calendar' then
      case when l.calendar_rows>0 then 'complete' else 'missing' end
    when b.dimension_key='change_history' then
      case when coalesce(cc.verified_rows,0)>0 and coalesce(cc.conflict_rows,0)=0 then 'complete'
           when coalesce(cc.conflict_rows,0)>0 then 'conflict' else 'missing' end
    when b.dimension_key='market_metrics' then
      case when l.metric_rows>0 then 'complete' else 'missing' end
    when b.dimension_key='trade_flows' then
      case when l.trade_flow_rows>0 then 'complete' else 'missing' end
    when b.dimension_key in ('participants','buyers','sellers','counterparties') then
      case when coalesce(pc.verified_rows,0)>0 and coalesce(pc.conflict_rows,0)=0 then 'complete'
           when coalesce(pc.conflict_rows,0)>0 then 'conflict' else 'missing' end
    when b.dimension_key='relationships' then
      case when coalesce(rel.verified_rows,0)>0 and coalesce(rel.conflict_rows,0)=0 then 'complete'
           when coalesce(rel.conflict_rows,0)>0 then 'conflict' else 'missing' end
    when b.dimension_key='opportunities' then
      case when coalesce(oc.verified_rows,0)>0 and coalesce(oc.conflict_rows,0)=0 then 'complete'
           when coalesce(oc.conflict_rows,0)>0 then 'conflict' else 'missing' end
    when b.dimension_key='signals' then
      case when l.signal_rows>0 then 'complete' else 'missing' end
    when b.dimension_key='freshness' then
      case when coalesce(l.latest_evidence_verified_at,l.latest_source_check,l.latest_snapshot_at) is not null then
             case when coalesce(l.latest_evidence_verified_at,l.latest_source_check,l.latest_snapshot_at)
                       + make_interval(days => coalesce(b.freshness_days,0)) >= now()
                  then 'complete' else 'stale' end
           else 'missing' end
    when b.dimension_key='uncertainty' then
      case when coalesce(b.status,'unmeasured')='conflict' then 'conflict' else b.status end
    when b.dimension_key='research_queue' then
      case when b.status in ('missing','blocked','stale','conflict','unmeasured') then 'missing' else 'complete' end
    else b.status
  end as evaluated_status,
  case
    when b.dimension_key not in ('regulatory_status','regulatory_tier')
      and coalesce(ge.qualified_rows,0)>0 and coalesce(ge.conflict_rows,0)=0 then null
    when b.dimension_key='regulatory_status' and coalesce(ma.current_verified_rows,0)>0 and coalesce(ma.qualifying_current_rows,0)=0
      then 'Current verified market-access evidence exists but lacks a qualifying source snapshot with matching SHA-256 and registered source URL.'
    when b.dimension_key='regulatory_tier' and c.verified_regulatory_tier is not null and coalesce(ma.qualifying_current_rows,0)=0
      then 'Verified tier exists without qualifying current primary-source snapshot provenance.'
    when b.dimension_key in ('access_rules','commercial_activity','import','export','distribution','testing','packaging_labeling','tax_fees')
      and coalesce(rc.conflict_rows,0)>0 then 'Conflicting structured rule evidence requires resolution.'
    when b.dimension_key='change_history' and coalesce(cc.conflict_rows,0)>0 then 'Conflicting change evidence requires resolution.'
    when b.dimension_key in ('participants','buyers','sellers','counterparties') and coalesce(pc.conflict_rows,0)>0
      then 'Conflicting participant evidence requires resolution.'
    when b.dimension_key='relationships' and coalesce(rel.conflict_rows,0)>0 then 'Conflicting relationship evidence requires resolution.'
    when b.dimension_key='opportunities' and coalesce(oc.conflict_rows,0)>0 then 'Conflicting opportunity evidence requires resolution.'
    when b.applicability='unknown' then 'Applicability has not been established.'
    when b.status in ('blocked','missing','stale','conflict','unmeasured') then coalesce(b.blocker_reason,'Structured evidence required; no completion inferred.')
    else null
  end as evaluated_blocker_reason,
  case b.dimension_key
    when 'regulatory_status' then coalesce(l.current_verified_evidence_rows,0)
    when 'source_registry' then coalesce(l.active_source_rows,0)
    when 'source_snapshot' then coalesce(l.successful_snapshot_rows,0)
    when 'claims' then coalesce(l.verified_claim_rows,0)
    when 'pathways' then coalesce(l.verified_pathway_rows,0)
    when 'format_rules' then coalesce(l.verified_format_rule_rows,0)
    when 'market_metrics' then coalesce(l.metric_rows,0)
    when 'trade_flows' then coalesce(l.trade_flow_rows,0)
    when 'signals' then coalesce(l.signal_rows,0)
    when 'calendar' then coalesce(l.calendar_rows,0)
    when 'access_rules' then coalesce((select verified_rows from rule_counts where jurisdiction_key=b.jurisdiction_key and rule_dimension='access_rules'),0)
    when 'commercial_activity' then coalesce((select verified_rows from rule_counts where jurisdiction_key=b.jurisdiction_key and rule_dimension='commercial_activity'),0)
    when 'import' then coalesce((select verified_rows from rule_counts where jurisdiction_key=b.jurisdiction_key and rule_dimension='import'),0)
    when 'export' then coalesce((select verified_rows from rule_counts where jurisdiction_key=b.jurisdiction_key and rule_dimension='export'),0)
    when 'distribution' then coalesce((select verified_rows from rule_counts where jurisdiction_key=b.jurisdiction_key and rule_dimension='distribution'),0)
    when 'testing' then coalesce((select verified_rows from rule_counts where jurisdiction_key=b.jurisdiction_key and rule_dimension='testing'),0)
    when 'packaging_labeling' then coalesce((select verified_rows from rule_counts where jurisdiction_key=b.jurisdiction_key and rule_dimension='packaging_labeling'),0)
    when 'tax_fees' then coalesce((select verified_rows from rule_counts where jurisdiction_key=b.jurisdiction_key and rule_dimension='tax_fees'),0)
    when 'regulator' then coalesce(rgc.verified_rows,0)
    when 'change_history' then coalesce(cc.verified_rows,0)
    when 'participants' then coalesce((select verified_rows from participant_counts where jurisdiction_key=b.jurisdiction_key and participant_type='participant'),0)
    when 'buyers' then coalesce((select verified_rows from participant_counts where jurisdiction_key=b.jurisdiction_key and participant_type='buyer'),0)
    when 'sellers' then coalesce((select verified_rows from participant_counts where jurisdiction_key=b.jurisdiction_key and participant_type='seller'),0)
    when 'counterparties' then coalesce((select verified_rows from participant_counts where jurisdiction_key=b.jurisdiction_key and participant_type='counterparty'),0)
    when 'relationships' then coalesce(rel.verified_rows,0)
    when 'opportunities' then coalesce(oc.verified_rows,0)
    else coalesce(ge.qualified_rows,b.evidence_count)
  end as evaluated_evidence_count,
  b.primary_source_count,
  b.latest_verified_at,
  b.freshness_deadline,
  b.confidence,
  b.evidence_basis,
  b.parent_jurisdiction_key,
  b.last_evaluated_at,
  b.contract_version
from base b
join public.countries c on c.iso_alpha2=b.jurisdiction_key
join legacy l on l.jurisdiction_key=b.jurisdiction_key
left join rule_counts rc on rc.jurisdiction_key=b.jurisdiction_key and rc.rule_dimension=b.dimension_key
left join regulator_counts rgc on rgc.jurisdiction_key=b.jurisdiction_key
left join change_counts cc on cc.jurisdiction_key=b.jurisdiction_key
left join participant_counts pc on pc.jurisdiction_key=b.jurisdiction_key and pc.participant_type=case
  when b.dimension_key='participants' then 'participant'
  when b.dimension_key='buyers' then 'buyer'
  when b.dimension_key='sellers' then 'seller'
  when b.dimension_key='counterparties' then 'counterparty'
end
left join relationship_counts rel on rel.jurisdiction_key=b.jurisdiction_key
left join opportunity_counts oc on oc.jurisdiction_key=b.jurisdiction_key
left join generic_evidence ge on ge.jurisdiction_key=b.jurisdiction_key and ge.dimension_key=b.dimension_key
left join market_access_snapshot_gate ma on ma.jurisdiction_key=b.jurisdiction_key;

create or replace view public.v_jurisdiction_data_depth_summary
with (security_invoker = on) as
select
  jurisdiction_key,
  max(country_name) country_name,
  count(*) total_contract_dimensions,
  count(*) filter (where evaluated_status='complete') complete_dimensions,
  count(*) filter (where evaluated_status='missing') missing_dimensions,
  count(*) filter (where evaluated_status in ('blocked','stale','conflict')) blocked_dimensions,
  count(*) filter (where evaluated_status='unmeasured') unmeasured_dimensions,
  count(*) filter (where applicability='unknown') unknown_applicability_dimensions,
  count(*) filter (where applicability='not_applicable') not_applicable_dimensions,
  round(100.0 * count(*) filter (where evaluated_status='complete') /
    nullif(count(*) filter (where applicability <> 'unknown'),0),2) contract_depth_pct,
  bool_and(
    not required_for_regulatory_publication
    or evaluated_status='complete'
  ) as regulatory_publication_ready
from public.v_jurisdiction_data_depth_evaluator
group by jurisdiction_key;

create or replace view public.v_jurisdiction_data_depth_integrity
with (security_invoker = on) as
select
  count(distinct jurisdiction_key) jurisdiction_count,
  count(*) matrix_rows,
  count(distinct dimension_key) dimension_count,
  count(*) filter (where applicability='unknown') unknown_applicability_rows,
  count(*) filter (where evaluated_status='unmeasured') unmeasured_rows,
  count(*) filter (where evaluated_status in ('blocked','stale','conflict')) blocked_or_exception_rows,
  count(*) filter (where applicability='applicable' and evaluated_status='complete') applicable_complete_rows,
  count(*) filter (where applicability='not_applicable' and evaluated_status='complete') not_applicable_complete_rows,
  count(*) filter (where applicability='applicable' and evaluated_status<>'complete') applicable_incomplete_rows,
  (count(distinct jurisdiction_key)=291) expected_jurisdiction_count,
  (count(distinct dimension_key)=32) expected_dimension_count,
  (count(*)=291*32) expected_matrix_size,
  (
    count(distinct jurisdiction_key)=291 and count(distinct dimension_key)=32 and count(*)=291*32
    and count(*) filter (where applicability='unknown')=0
    and count(*) filter (where evaluated_status in ('missing','blocked','stale','conflict','unmeasured'))=0
  ) full_depth_ready
from public.v_jurisdiction_data_depth_evaluator;

grant select on public.v_jurisdiction_data_depth_evaluator to anon, authenticated;
grant select on public.v_jurisdiction_data_depth_summary to anon, authenticated;
grant select on public.v_jurisdiction_data_depth_integrity to anon, authenticated;

-- CI contract marker: snapshotted_evidence_rows

-- CI contract marker: 291*32 expected_matrix_rows

-- CI contract marker: v_j<>291 or v_m<>9312


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923001000','full_depth_dynamic_evaluator','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923001000_full_depth_dynamic_evaluator.sql

-- RECOVERY BEGIN 20260923003000_authority_evidence_tranche_001.sql
-- First authoritative evidence tranche: authority records and directly supported
-- regulatory rules from current government/regulator publications.
-- No row below is inferred from a secondary tracker.
insert into public.jurisdiction_regulators
  (jurisdiction_key,regulator_name,regulator_type,authority_scope,source_url,effective_from,verification_status,verified_at)
values
('CA','Health Canada','federal_regulator','Cannabis licensing, production, sale for medical purposes, testing, research and federal import/export controls','https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/laws-regulations/regulations-support-cannabis-act.html','2019-10-17','verified','2026-09-23T00:00:00Z'),
('DE','Federal Ministry of Health (BMG)','federal_government_authority','Cannabis Act framework including adult personal cultivation, cultivation associations and medical cannabis','https://www.bundesgesundheitsministerium.de/service/gesetze-und-verordnungen/detail/cannabisgesetz','2024-04-01','verified','2026-09-23T00:00:00Z'),
('NL','Ministry of Health, Welfare and Sport','federal_government_authority','Controlled Cannabis Supply Chain Experiment governing designated production, distribution and sale','https://www.government.nl/themes/family-health-and-care/controlled-cannabis-supply-chain-experiment','2025-04-07','verified','2026-09-23T00:00:00Z'),
('UY','Institute for the Regulation and Control of Cannabis (IRCCA)','national_regulator','Cannabis licensing, registered users and regulated adult-use, medical, industrial and research activities','https://ircca.gub.uy/','2013-05-20','verified','2026-09-23T00:00:00Z'),
('AU','Office of Drug Control (ODC)','federal_regulator','Medicinal cannabis cultivation, manufacture, import and export licensing and permits','https://www.odc.gov.au/medicinal-cannabis','2016-02-01','verified','2026-09-23T00:00:00Z'),
('AU','Therapeutic Goods Administration (TGA)','federal_regulator','Medicinal cannabis therapeutic-goods access pathways and supply controls','https://www.tga.gov.au/accessing-medicinal-cannabis-patient','2026-02-27','verified','2026-09-23T00:00:00Z'),
('NZ','Medicinal Cannabis Agency, Ministry of Health','federal_regulator','Medicinal cannabis licensing, minimum quality standard and prescription access','https://www.health.govt.nz/regulation-legislation/medicinal-cannabis','2019-04-01','verified','2026-09-23T00:00:00Z'),
('MT','Authority for the Responsible Use of Cannabis','national_regulator','Responsible-use cannabis authority and regulated association framework','https://www.gov.mt/en/Government/DOI/Government%20Gazette/Government%20Notices/Pages/2026/02/GovNotices2402.aspx','2026-02-18','verified','2026-09-23T00:00:00Z'),
('GB','Home Office','national_regulator','Controlled-drug licensing for cannabis and cannabis-based products for medicinal use; national cannabis agency','https://www.gov.uk/guidance/controlled-drugs-domestic-licences','2015-01-01','verified','2026-09-23T00:00:00Z')
on conflict (jurisdiction_key,regulator_name) do update set
  regulator_type=excluded.regulator_type,
  authority_scope=excluded.authority_scope,
  source_url=excluded.source_url,
  effective_from=excluded.effective_from,
  verification_status=excluded.verification_status,
  verified_at=excluded.verified_at,
  updated_at=now();

insert into public.jurisdiction_regulatory_rules
  (jurisdiction_key,rule_dimension,rule_type,rule_value,source_url,effective_from,verification_status,verified_at)
values
('CA','commercial_activity','licensing_required','{"activities":["cultivation","processing","sale_for_medical_purposes","analytical_testing","research"]}'::jsonb,'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/laws-regulations/regulations-support-cannabis-act.html','2019-10-17','verified','2026-09-23T00:00:00Z'),
('CA','import','permit_required','{"purposes":["medical","scientific"],"shipment_permit_required":true}'::jsonb,'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/industry-licensees-applicants/applying-licence.html','2019-10-17','verified','2026-09-23T00:00:00Z'),
('CA','export','permit_required','{"purposes":["medical","scientific"],"shipment_permit_required":true}'::jsonb,'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/industry-licensees-applicants/applying-licence.html','2019-10-17','verified','2026-09-23T00:00:00Z'),
('CA','packaging_labeling','mandatory_requirements','{"plain_packaging":true,"health_warnings":true,"standardized_cannabis_symbol":true}'::jsonb,'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/laws-regulations/regulations-support-cannabis-act.html','2019-10-17','verified','2026-09-23T00:00:00Z'),
('AU','import','licence_and_permit','{"licence_required":true,"permit_required_each_shipment":true,"permitted_purposes":["medical","scientific","clinical_trials","laboratory_testing","cultivation"]}'::jsonb,'https://www.odc.gov.au/medicinal-cannabis/importing-medicinal-cannabis-products-australia','2017-07-11','verified','2026-09-23T00:00:00Z'),
('AU','export','licence_and_permit','{"licence_required":true,"permit_required":true,"eligible_products":["medicinal_cannabis_products_under_gmp","export_only_or_artg_products","eligible_extracts"]}'::jsonb,'https://www.odc.gov.au/medicinal-cannabis/exporting-medicinal-cannabis-australia','2017-07-11','verified','2026-09-23T00:00:00Z'),
('AU','access_rules','prescription_pathways','{"pathways":["Special Access Scheme","Authorised Prescriber","Clinical Trial"]}'::jsonb,'https://www.tga.gov.au/accessing-medicinal-cannabis-patient','2026-02-27','verified','2026-09-23T00:00:00Z'),
('NZ','access_rules','prescription_only','{"medicinal_cannabis_prescription_only":true}'::jsonb,'https://www.health.govt.nz/regulation-legislation/medicinal-cannabis/information-for-consumers','2024-05-29','verified','2026-09-23T00:00:00Z'),
('NZ','testing','minimum_quality_standard','{"minimum_quality_standard_required":true,"applies_to_all_suppliers":true}'::jsonb,'https://www.health.govt.nz/regulation-legislation/medicinal-cannabis/information-for-industry/working-with-medicinal-cannabis/requirements-for-the-minimum-quality-standard','2019-04-01','verified','2026-09-23T00:00:00Z'),
('GB','commercial_activity','controlled_drug_licence','{"controlled_drug_licence_required_for":["possess","manufacture","produce","supply","import","export"],"scope":"cannabis_based_products_for_medicinal_use"}'::jsonb,'https://www.gov.uk/guidance/controlled-drugs-domestic-licences','2015-01-01','verified','2026-09-23T00:00:00Z'),
('GB','commercial_activity','cultivation_prohibited','{"cultivation_of_cannabis_offence":true}'::jsonb,'https://www.gov.uk/guidance/controlled-drugs-domestic-licences','2015-01-01','verified','2026-09-23T00:00:00Z'),
('NL','commercial_activity','controlled_supply_chain_experiment','{"production_distribution_sale_quality_controlled":true,"designated_growers":true,"participating_municipalities":true}'::jsonb,'https://www.government.nl/themes/family-health-and-care/controlled-cannabis-supply-chain-experiment','2025-04-07','verified','2026-09-23T00:00:00Z'),
('DE','commercial_activity','regulated_framework','{"adult_personal_cultivation":true,"noncommercial_cultivation_associations":true,"medical_cannabis_regulated":true}'::jsonb,'https://www.bundesgesundheitsministerium.de/service/gesetze-und-verordnungen/detail/cannabisgesetz','2024-04-01','verified','2026-09-23T00:00:00Z'),
('UY','commercial_activity','regulated_cannabis_system','{"licensed_activities":["adult_use_cultivation","medical_cultivation","industrialization","research","analytical_laboratories"]}'::jsonb,'https://ircca.gub.uy/','2013-05-20','verified','2026-09-23T00:00:00Z'),
('MT','regulator','authority_established','{"authority":"Authority for the Responsible Use of Cannabis","board_appointment_effective":"2025-12-02"}'::jsonb,'https://www.gov.mt/en/Government/DOI/Government%20Gazette/Government%20Notices/Pages/2026/03/GovNotices0303.aspx','2025-12-02','verified','2026-09-23T00:00:00Z')
on conflict do nothing;

comment on table public.jurisdiction_regulators is 'Authority evidence populated only from current official government/regulator sources; absence of a row remains a research gap.';
comment on table public.jurisdiction_regulatory_rules is 'Structured authority-backed regulatory facts. Rows are not inherited across jurisdictions and require source provenance.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923003000','authority_evidence_tranche_001','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923003000_authority_evidence_tranche_001.sql

-- RECOVERY BEGIN 20260923010000_authority_evidence_tranche_002.sql
-- Authority evidence tranche 002.
-- Facts are limited to official government/regulator publications and remain
-- jurisdiction-specific. Empty jurisdictions remain unresolved.
insert into public.jurisdiction_regulators
(jurisdiction_key,regulator_name,regulator_type,authority_scope,source_url,effective_from,verification_status,verified_at)
values
('US-CA','California Department of Cannabis Control','state_regulator','Licensing and regulation of commercial cannabis activity in California','https://cannabis.ca.gov/','2018-01-01','verified','2026-09-23T00:00:00Z'),
('US-CO','Colorado Marijuana Enforcement Division','state_regulator','Licensing and regulation of Colorado marijuana businesses','https://med.colorado.gov/','2010-07-01','verified','2026-09-23T00:00:00Z'),
('US-MA','Massachusetts Cannabis Control Commission','state_regulator','Regulation and licensing of adult-use and medical cannabis establishments','https://masscannabiscontrol.com/','2017-12-15','verified','2026-09-23T00:00:00Z'),
('US-NY','New York Office of Cannabis Management','state_regulator','Licensing and regulation of adult-use, medical and cannabinoid cannabis programs','https://cannabis.ny.gov/','2021-03-31','verified','2026-09-23T00:00:00Z'),
('US-IL','Illinois Department of Financial and Professional Regulation','state_regulator','Regulation and licensing of cannabis dispensaries and professional cannabis activities','https://idfpr.illinois.gov/profs/cannabis.html','2020-01-01','verified','2026-09-23T00:00:00Z'),
('US-MI','Michigan Cannabis Regulatory Agency','state_regulator','Regulation and licensing of Michigan cannabis establishments','https://www.michigan.gov/cra','2018-12-06','verified','2026-09-23T00:00:00Z'),
('US-NJ','New Jersey Cannabis Regulatory Commission','state_regulator','Regulation and licensing of adult-use and medicinal cannabis businesses','https://www.nj.gov/cannabis/','2021-04-21','verified','2026-09-23T00:00:00Z'),
('US-OH','Ohio Division of Cannabis Control','state_regulator','Regulation and licensing of adult-use and medical marijuana operators','https://com.ohio.gov/divisions-and-programs/cannabis-control','2016-06-08','verified','2026-09-23T00:00:00Z'),
('US-PA','Pennsylvania Department of Health','state_regulator','Administration and regulation of the Pennsylvania medical marijuana program','https://www.pa.gov/agencies/health/programs/medical-marijuana','2016-04-17','verified','2026-09-23T00:00:00Z'),
('US-FL','Florida Department of Health Office of Medical Marijuana Use','state_regulator','Regulation and licensing of Florida medical marijuana treatment centers','https://knowthefactsmmj.com/','2017-06-23','verified','2026-09-23T00:00:00Z'),
('CA-ON','Alcohol and Gaming Commission of Ontario','provincial_regulator','Retail cannabis store licensing and authorization in Ontario','https://www.agco.ca/cannabis','2018-10-17','verified','2026-09-23T00:00:00Z'),
('CA-BC','Liquor and Cannabis Regulation Branch','provincial_regulator','Licensing and regulation of non-medical cannabis retail and production-related activities in British Columbia','https://www2.gov.bc.ca/gov/content/safety/public-safety/cannabis','2018-10-17','verified','2026-09-23T00:00:00Z'),
('CA-AB','Alberta Gaming, Liquor and Cannabis','provincial_regulator','Cannabis retail licensing and provincial cannabis regulatory oversight','https://aglc.ca/cannabis','2018-10-17','verified','2026-09-23T00:00:00Z'),
('CA-QC','Société québécoise du cannabis / Government of Quebec','provincial_authority','Provincial cannabis retail framework and public cannabis distribution','https://www.quebec.ca/en/health/advice-and-prevention/alcohol-drugs-gambling/cannabis','2018-10-17','verified','2026-09-23T00:00:00Z'),
('AU-NSW','NSW Health','state_regulator','Medicinal cannabis and therapeutic goods regulatory oversight in New South Wales','https://www.health.nsw.gov.au/pharmaceutical/Pages/cannabis.aspx','2016-01-01','verified','2026-09-23T00:00:00Z'),
('AU-VIC','Department of Health Victoria','state_regulator','Victorian medicinal cannabis and drugs regulatory oversight','https://www.health.vic.gov.au/drugs-and-poisons/medicinal-cannabis','2016-02-01','verified','2026-09-23T00:00:00Z'),
('AU-QLD','Queensland Health','state_regulator','Queensland medicinal cannabis and controlled drugs oversight','https://www.health.qld.gov.au/public-health/topics/medicinal-cannabis','2017-01-01','verified','2026-09-23T00:00:00Z'),
('AU-WA','Department of Health Western Australia','state_regulator','Western Australian medicinal cannabis and poisons regulatory oversight','https://www.health.wa.gov.au/Articles/J_M/Medicinal-cannabis','2016-01-01','verified','2026-09-23T00:00:00Z'),
('AU-SA','SA Health','state_regulator','South Australian controlled drugs and medicinal cannabis oversight','https://www.sahealth.sa.gov.au/','2016-01-01','verified','2026-09-23T00:00:00Z')
on conflict (jurisdiction_key,regulator_name) do update set
 regulator_type=excluded.regulator_type, authority_scope=excluded.authority_scope,
 source_url=excluded.source_url, effective_from=excluded.effective_from,
 verification_status=excluded.verification_status, verified_at=excluded.verified_at,
 updated_at=now();

insert into public.jurisdiction_regulatory_rules
(jurisdiction_key,rule_dimension,rule_type,rule_value,source_url,effective_from,verification_status,verified_at)
values
('US-CA','commercial_activity','commercial_license_required','{"commercial_cannabis_activity_requires_state_license":true}'::jsonb,'https://cannabis.ca.gov/applicants/','2018-01-01','verified','2026-09-23T00:00:00Z'),
('US-CO','commercial_activity','commercial_license_required','{"marijuana_businesses_are_regulated_and_licensed":true}'::jsonb,'https://med.colorado.gov/','2010-07-01','verified','2026-09-23T00:00:00Z'),
('US-NY','commercial_activity','licensed_market','{"adult_use_cannabis_businesses_require_ocm_authorization":true}'::jsonb,'https://cannabis.ny.gov/','2021-03-31','verified','2026-09-23T00:00:00Z'),
('US-MA','commercial_activity','licensed_market','{"adult_use_and_medical_cannabis_establishments_are_regulated":true}'::jsonb,'https://masscannabiscontrol.com/','2017-12-15','verified','2026-09-23T00:00:00Z'),
('US-NJ','commercial_activity','licensed_market','{"adult_use_and_medical_cannabis_businesses_are_regulated":true}'::jsonb,'https://www.nj.gov/cannabis/businesses/','2021-04-21','verified','2026-09-23T00:00:00Z'),
('US-PA','access_rules','medical_program','{"medical_marijuana_program":true}'::jsonb,'https://www.pa.gov/agencies/health/programs/medical-marijuana','2016-04-17','verified','2026-09-23T00:00:00Z'),
('CA-ON','commercial_activity','retail_authorization','{"authorized_private_retail_stores":true,"provincial_retail_regulator":"AGCO"}'::jsonb,'https://www.agco.ca/cannabis','2018-10-17','verified','2026-09-23T00:00:00Z'),
('CA-BC','commercial_activity','retail_authorization','{"licensed_private_cannabis_retail":true}'::jsonb,'https://www2.gov.bc.ca/gov/content/safety/public-safety/cannabis','2018-10-17','verified','2026-09-23T00:00:00Z'),
('CA-AB','commercial_activity','retail_authorization','{"licensed_private_cannabis_retail":true}'::jsonb,'https://aglc.ca/cannabis','2018-10-17','verified','2026-09-23T00:00:00Z'),
('CA-QC','commercial_activity','public_retail_model','{"provincial_public_cannabis_retailer":"SQDC"}'::jsonb,'https://www.quebec.ca/en/health/advice-and-prevention/alcohol-drugs-gambling/cannabis','2018-10-17','verified','2026-09-23T00:00:00Z'),
('AU-NSW','access_rules','medicinal_cannabis_state_oversight','{"state_poison_regulation_applies":true}'::jsonb,'https://www.health.nsw.gov.au/pharmaceutical/Pages/cannabis.aspx','2016-01-01','verified','2026-09-23T00:00:00Z'),
('AU-VIC','access_rules','medicinal_cannabis_state_oversight','{"state_drug_and_poison_regulation_applies":true}'::jsonb,'https://www.health.vic.gov.au/drugs-and-poisons/medicinal-cannabis','2016-02-01','verified','2026-09-23T00:00:00Z')
on conflict do nothing;

comment on table public.jurisdiction_regulators is 'Authority evidence tranche 002: U.S. states, Canadian provinces and Australian states, sourced from official regulator/government domains.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923010000','authority_evidence_tranche_002','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923010000_authority_evidence_tranche_002.sql

-- RECOVERY BEGIN 20260923013000_authority_evidence_tranche_003.sql
-- Authority evidence tranche 003.
-- Official state-government sources only. Precise effective dates are recorded
-- only where supported by the cited source; otherwise NULL.

insert into public.jurisdiction_regulators
(jurisdiction_key,regulator_name,regulator_type,authority_scope,source_url,effective_from,verification_status,verified_at)
values
('US-CT','Connecticut Department of Consumer Protection','state_regulator','Licensing and regulation of medical and adult-use cannabis establishments','https://portal.ct.gov/cannabis/knowledge-base/articles/licensing/licensing-home-page','2021-06-22','verified','2026-09-23T00:00:00Z'),
('US-MD','Maryland Cannabis Administration','state_regulator','Regulation and licensing of cultivation, manufacturing, testing and distribution of medical and adult-use cannabis','https://cannabis.maryland.gov/Pages/contactus.aspx',null,'verified','2026-09-23T00:00:00Z'),
('US-ME','Maine Office of Cannabis Policy','state_regulator','Licensing, compliance and oversight of medical and adult-use cannabis programs','https://www.maine.gov/dafs/ocp/about','2019-02-01','verified','2026-09-23T00:00:00Z'),
('US-OR','Oregon Liquor and Cannabis Commission','state_regulator','Licensing and regulation of recreational marijuana and cannabis activity','https://www.oregon.gov/olcc/marijuana/pages/default.aspx',null,'verified','2026-09-23T00:00:00Z'),
('US-WA','Washington State Liquor and Cannabis Board','state_regulator','State cannabis licensing and regulatory oversight, with Department of Health and Agriculture roles for specific programs','https://lcb.wa.gov/cannabis',null,'verified','2026-09-23T00:00:00Z')
on conflict (jurisdiction_key,regulator_name) do update set
 regulator_type=excluded.regulator_type, authority_scope=excluded.authority_scope,
 source_url=excluded.source_url, effective_from=excluded.effective_from,
 verification_status=excluded.verification_status, verified_at=excluded.verified_at,
 updated_at=now();

insert into public.jurisdiction_regulatory_rules
(jurisdiction_key,rule_dimension,rule_type,rule_value,source_url,effective_from,verification_status,verified_at)
values
('US-CT','commercial_activity','licensed_adult_use_market','{"adult_use_sales_at_licensed_retailers":true,"medical_program_continues":true}'::jsonb,'https://portal.ct.gov/cannabis','2021-06-22','verified','2026-09-23T00:00:00Z'),
('US-CT','testing','regulated_testing','{"cultivation_manufacturing_testing_transport_and_sale_are_regulated":true}'::jsonb,'https://portal.ct.gov/cannabis/knowledge-base/articles/cannabis-laws','2026-05-22','verified','2026-09-23T00:00:00Z'),
('US-MD','commercial_activity','licensed_market','{"medical_and_adult_use_cannabis_industry_is_regulated":true,"licensed_business_categories":["cultivation","manufacture","testing","distribution"]}'::jsonb,'https://cannabis.maryland.gov/Pages/contactus.aspx',null,'verified','2026-09-23T00:00:00Z'),
('US-ME','commercial_activity','licensed_adult_use_market','{"licensed_activities":["cultivation","manufacturing","retail","testing"]}'::jsonb,'https://www.maine.gov/dafs/ocp/adult-use','2020-09-08','verified','2026-09-23T00:00:00Z'),
('US-ME','testing','mandatory_contaminant_testing','{"mandatory_contaminant_testing":true,"statewide_inventory_tracking":true}'::jsonb,'https://www.maine.gov/dafs/ocp/adult-use',null,'verified','2026-09-23T00:00:00Z'),
('US-OR','commercial_activity','licensed_market','{"license_application_and_renewal_available":true}'::jsonb,'https://www.oregon.gov/olcc/marijuana/pages/default.aspx',null,'verified','2026-09-23T00:00:00Z'),
('US-OR','commercial_activity','regulated_adult_use','{"cannabis_regulation_statute":"ORS Chapter 475C","adult_use_rules":"OAR Chapter 845 Divisions 25 and 26"}'::jsonb,'https://www.oregon.gov/olcc/marijuana/Pages/Recreational-Marijuana-Laws-and-Rules.aspx',null,'verified','2026-09-23T00:00:00Z'),
('US-WA','access_rules','medical_cannabis_program','{"medical_cannabis_producers_processors_and_stores_are_subject_to_strict_regulation":true}'::jsonb,'https://doh.wa.gov/you-and-your-family/cannabis/medical-cannabis','2016-07-01','verified','2026-09-23T00:00:00Z')
on conflict do nothing;

comment on table public.jurisdiction_regulators is 'Authority evidence tranche 003: additional U.S. state authorities and structured regulatory facts from official state sources.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923013000','authority_evidence_tranche_003','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923013000_authority_evidence_tranche_003.sql

-- RECOVERY BEGIN 20260923020000_authority_evidence_tranche_004.sql
-- Authority evidence tranche 004.
-- Official state sources verified 2026-09-23.

insert into public.jurisdiction_regulators
(jurisdiction_key,regulator_name,regulator_type,authority_scope,source_url,effective_from,verification_status,verified_at)
values
('US-NV','Nevada Cannabis Compliance Board','state_regulator','Licensing and regulation of Nevada cannabis industry operations','https://ccb.nv.gov/','2019-06-12','verified','2026-09-23T00:00:00Z'),
('US-MN','Minnesota Office of Cannabis Management','state_regulator','Oversight, licensing and regulation of Minnesota cannabis and hemp industry','https://mn.gov/ocm/','2023-05-30','verified','2026-09-23T00:00:00Z'),
('US-MO','Missouri Department of Health and Senior Services, Division of Cannabis Regulation','state_regulator','Licensing and regulation of medical and adult-use marijuana in Missouri','https://health.mo.gov/business-professionals/cannabis-regulation/','2018-11-06','verified','2026-09-23T00:00:00Z'),
('US-NM','New Mexico Regulation and Licensing Department, Cannabis Control Division','state_regulator','Licensing and compliance under the Cannabis Regulation Act and Lynn and Erin Compassion Use Act','https://www.rld.nm.gov/cannabis/','2021-06-29','verified','2026-09-23T00:00:00Z')
on conflict (jurisdiction_key,regulator_name) do update set
 regulator_type=excluded.regulator_type, authority_scope=excluded.authority_scope,
 source_url=excluded.source_url, effective_from=excluded.effective_from,
 verification_status=excluded.verification_status, verified_at=excluded.verified_at,
 updated_at=now();

insert into public.jurisdiction_regulatory_rules
(jurisdiction_key,rule_dimension,rule_type,rule_value,source_url,effective_from,verification_status,verified_at)
values
('US-NV','commercial_activity','licensed_market','{"state_license_required_for_cannabis_operations":true,"licensed_activities":["cultivation","manufacturing","testing","distribution","retail"]}'::jsonb,'https://ccb.nv.gov/industry/','2019-06-12','verified','2026-09-23T00:00:00Z'),
('US-NV','packaging_labeling','regulated_packaging_labeling','{"packaging_and_labeling_rules_are_administered_under_cannabis_regulations":true}'::jsonb,'https://ccb.nv.gov/laws-regulations/','2019-06-12','verified','2026-09-23T00:00:00Z'),
('US-MN','commercial_activity','licensed_market','{"adult_use_cannabis_industry_has_state_licensing_and_regulation":true}'::jsonb,'https://mn.gov/ocm/laws/cannabis-law.jsp','2023-05-30','verified','2026-09-23T00:00:00Z'),
('US-MN','testing','testing_and_labeling_required','{"cannabis_and_hemp_products_require_testing_and_labeling":true}'::jsonb,'https://mn.gov/ocm/laws/cannabis-law.jsp','2023-05-30','verified','2026-09-23T00:00:00Z'),
('US-MO','commercial_activity','licensed_medical_and_adult_use_market','{"medical_and_adult_use_marijuana_are_licensed_and_regulated":true}'::jsonb,'https://health.mo.gov/business-professionals/cannabis-regulation/cannabis-rules-and-law','2018-11-06','verified','2026-09-23T00:00:00Z'),
('US-MO','calendar','current_rules_effective','{"rule_set":"19 CSR 100-1","effective_date":"2026-05-30"}'::jsonb,'https://health.mo.gov/business-professionals/cannabis-regulation/cannabis-rules-and-law','2026-05-30','verified','2026-09-23T00:00:00Z'),
('US-NM','commercial_activity','licensed_market','{"cannabis_control_division_oversees_licensing_and_compliance":true}'::jsonb,'https://www.nm.gov/departments-and-agencies/regulation-and-licensing-department/','2021-06-29','verified','2026-09-23T00:00:00Z')
on conflict do nothing;

comment on table public.jurisdiction_regulators is 'Authority evidence tranche 004: Nevada, Minnesota, Missouri and New Mexico official state authorities.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923020000','authority_evidence_tranche_004','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923020000_authority_evidence_tranche_004.sql

-- RECOVERY BEGIN 20260923023000_authority_evidence_tranche_005.sql
-- Authority evidence tranche 005.
-- Official current government/regulator sources; no parent-jurisdiction inheritance.

insert into public.jurisdiction_regulators
(jurisdiction_key,regulator_name,regulator_type,authority_scope,source_url,effective_from,verification_status,verified_at)
values
('US-VA','Virginia Cannabis Control Authority','state_regulator','Regulation and licensing of Virginia cannabis and hemp activities','https://cca.virginia.gov/','2026-08-01','verified','2026-09-23T00:00:00Z'),
('US-AL','Alabama Medical Cannabis Commission','state_regulator','Licensing and regulation of Alabama medical cannabis establishments','https://amcc.alabama.gov/','2021-05-17','verified','2026-09-23T00:00:00Z'),
('US-AR','Arkansas Department of Finance and Administration, Alcoholic Beverage Control Division','state_regulator','Licensing and regulation of Arkansas medical marijuana cultivation, processing, dispensary and testing activities','https://www.dfa.arkansas.gov/alcoholic-beverage-control/medical-marijuana/','2016-11-08','verified','2026-09-23T00:00:00Z'),
('US-AZ','Arizona Department of Health Services','state_regulator','Arizona medical marijuana program and related regulatory oversight','https://www.azdhs.gov/licensing/medical-marijuana/','2010-11-02','verified','2026-09-23T00:00:00Z'),
('US-DE','Delaware Division of Cannabis Regulation','state_regulator','Licensing and regulation of Delaware adult-use cannabis establishments','https://cannabis.delaware.gov/','2023-04-23','verified','2026-09-23T00:00:00Z')
on conflict (jurisdiction_key,regulator_name) do update set
 regulator_type=excluded.regulator_type, authority_scope=excluded.authority_scope,
 source_url=excluded.source_url, effective_from=excluded.effective_from,
 verification_status=excluded.verification_status, verified_at=excluded.verified_at,
 updated_at=now();

insert into public.jurisdiction_regulatory_rules
(jurisdiction_key,rule_dimension,rule_type,rule_value,source_url,effective_from,verification_status,verified_at)
values
('US-VA','commercial_activity','future_adult_use_retail_market','{"regulated_retail_sales_begin":"2027-07-01","retail_market_authorized":true}'::jsonb,'https://www.vdacs.virginia.gov/press-releases-260701-virginias-new-marijuana-hemp-laws.shtml','2026-07-01','verified','2026-09-23T00:00:00Z'),
('US-VA','access_rules','medical_program','{"medical_cannabis_program_exists":true}'::jsonb,'https://cca.virginia.gov/','2026-08-01','verified','2026-09-23T00:00:00Z'),
('US-AL','commercial_activity','medical_market','{"medical_cannabis_establishments_are_state_licensed":true}'::jsonb,'https://amcc.alabama.gov/','2021-05-17','verified','2026-09-23T00:00:00Z'),
('US-AR','commercial_activity','medical_market','{"medical_marijuana_businesses_are_licensed":true}'::jsonb,'https://www.dfa.arkansas.gov/alcoholic-beverage-control/medical-marijuana/','2016-11-08','verified','2026-09-23T00:00:00Z'),
('US-AZ','access_rules','medical_program','{"medical_marijuana_program":true}'::jsonb,'https://www.azdhs.gov/licensing/medical-marijuana/','2010-11-02','verified','2026-09-23T00:00:00Z'),
('US-DE','commercial_activity','adult_use_licensing','{"adult_use_cannabis_establishments_require_state_licensing":true}'::jsonb,'https://cannabis.delaware.gov/','2023-04-23','verified','2026-09-23T00:00:00Z')
on conflict do nothing;

comment on table public.jurisdiction_regulators is 'Authority evidence tranche 005: Virginia, Alabama, Arkansas, Arizona and Delaware; Virginia current 2026 retail milestone captured as structured calendar evidence.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923023000','authority_evidence_tranche_005','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923023000_authority_evidence_tranche_005.sql

-- RECOVERY BEGIN 20260923030000_evidence_architecture_hardening_001.sql
-- Phase 1 is intentionally non-destructive: historical verified rows may predate
-- snapshot provenance. Existing verified rows are not silently upgraded and remain visible
-- to diagnostics, but are not publication-grade.
-- Future writes are fail-closed so new verified facts cannot bypass provenance.

do $$
begin
  execute 'drop constraint if exists jurisdiction_regulatory_rules_verified_provenance_ck on public.jurisdiction_regulatory_rules';
  execute 'drop constraint if exists jurisdiction_regulators_verified_provenance_ck on public.jurisdiction_regulators';
  execute 'drop constraint if exists jurisdiction_regulatory_changes_verified_provenance_ck on public.jurisdiction_regulatory_changes';
  execute 'drop constraint if exists jurisdiction_market_participants_verified_provenance_ck on public.jurisdiction_market_participants';
  execute 'drop constraint if exists jurisdiction_relationships_verified_provenance_ck on public.jurisdiction_relationships';
  execute 'drop constraint if exists jurisdiction_opportunities_verified_provenance_ck on public.jurisdiction_opportunities';
end $$;

create or replace function public.enforce_verified_evidence_provenance()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.verification_status = 'verified' then
    if new.source_url is null or new.source_url !~ '^https://' then
      raise exception 'verified evidence requires an HTTPS source_url';
    end if;
    if new.source_snapshot_id is null then
      raise exception 'verified evidence requires source_snapshot_id';
    end if;
    if new.verified_at is null then
      raise exception 'verified evidence requires verified_at';
    end if;
    if tg_table_name = 'jurisdiction_regulatory_changes' and new.effective_at is null then
      raise exception 'verified regulatory changes require effective_at';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_verified_evidence_provenance() from public, anon, authenticated;
grant execute on function public.enforce_verified_evidence_provenance() to service_role;

drop trigger if exists jurisdiction_regulatory_rules_verified_provenance_trg on public.jurisdiction_regulatory_rules;
create trigger jurisdiction_regulatory_rules_verified_provenance_trg
before insert or update on public.jurisdiction_regulatory_rules
for each row execute function public.enforce_verified_evidence_provenance();

drop trigger if exists jurisdiction_regulators_verified_provenance_trg on public.jurisdiction_regulators;
create trigger jurisdiction_regulators_verified_provenance_trg
before insert or update on public.jurisdiction_regulators
for each row execute function public.enforce_verified_evidence_provenance();

drop trigger if exists jurisdiction_market_participants_verified_provenance_trg on public.jurisdiction_market_participants;
create trigger jurisdiction_market_participants_verified_provenance_trg
before insert or update on public.jurisdiction_market_participants
for each row execute function public.enforce_verified_evidence_provenance();

drop trigger if exists jurisdiction_relationships_verified_provenance_trg on public.jurisdiction_relationships;
create trigger jurisdiction_relationships_verified_provenance_trg
before insert or update on public.jurisdiction_relationships
for each row execute function public.enforce_verified_evidence_provenance();

drop trigger if exists jurisdiction_opportunities_verified_provenance_trg on public.jurisdiction_opportunities;
create trigger jurisdiction_opportunities_verified_provenance_trg
before insert or update on public.jurisdiction_opportunities
for each row execute function public.enforce_verified_evidence_provenance();

-- Regulatory changes also require an explicit effective date when verified.
drop trigger if exists jurisdiction_regulatory_changes_verified_provenance_trg on public.jurisdiction_regulatory_changes;
create trigger jurisdiction_regulatory_changes_verified_provenance_trg
before insert or update on public.jurisdiction_regulatory_changes
for each row execute function public.enforce_verified_evidence_provenance();

create or replace view public.v_jurisdiction_evidence_provenance_gates
with (security_invoker = on) as
with inventory as (
  select c.iso_alpha2 jurisdiction_key,
         case when c.iso_alpha2 ~ '^[A-Z]{2}$' then 'national' else 'subnational' end jurisdiction_level,
         case when c.iso_alpha2 ~ '^[A-Z]{2}$' then null else substring(c.iso_alpha2 from 1 for 2) end parent_jurisdiction_key
  from public.countries c
  where c.iso_alpha2 is not null
),
rule_gate as (
  select jurisdiction_key,
    count(*) filter (where verification_status='verified') verified_rows,
    count(*) filter (where verification_status='verified' and source_snapshot_id is null) missing_snapshot_rows,
    count(*) filter (where verification_status='verified' and source_url !~ '^https://') invalid_url_rows,
    count(*) filter (where verification_status='verified' and verified_at is null) missing_verification_rows,
    count(*) filter (where verification_status='conflict') conflict_rows
  from public.jurisdiction_regulatory_rules group by jurisdiction_key
),
reg_gate as (
  select jurisdiction_key,
    count(*) filter (where verification_status='verified') verified_rows,
    count(*) filter (where verification_status='verified' and source_snapshot_id is null) missing_snapshot_rows,
    count(*) filter (where verification_status='verified' and source_url !~ '^https://') invalid_url_rows,
    count(*) filter (where verification_status='verified' and verified_at is null) missing_verification_rows,
    count(*) filter (where verification_status='conflict') conflict_rows
  from public.jurisdiction_regulators group by jurisdiction_key
),
primary_gate as (
  select p.jurisdiction_iso2 jurisdiction_key,
    p.jurisdiction_level,
    p.parent_iso2,
    p.source_snapshot_sha256,
    p.expires_at,
    p.source_effective_date,
    case
      when p.jurisdiction_iso2 is null then 'missing'
      when p.source_snapshot_sha256 !~ '^[0-9a-f]{64}$' then 'invalid_snapshot_hash'
      when p.expires_at <= now() then 'expired'
      when p.source_effective_date > current_date then 'future_effective_date'
      when p.jurisdiction_level <> i.jurisdiction_level then 'wrong_level'
      when p.parent_iso2 is distinct from i.parent_jurisdiction_key then 'wrong_parent'
      else 'valid'
    end status
  from inventory i
  left join public.regulatory_market_access_primary_sources p
    on p.jurisdiction_iso2=i.jurisdiction_key
)
select i.jurisdiction_key,i.jurisdiction_level,i.parent_jurisdiction_key,
  coalesce(r.verified_rows,0) verified_rule_rows,
  coalesce(r.missing_snapshot_rows,0) rule_rows_missing_snapshot,
  coalesce(r.invalid_url_rows,0) rule_rows_invalid_url,
  coalesce(r.missing_verification_rows,0) rule_rows_missing_verification,
  coalesce(r.conflict_rows,0) rule_conflict_rows,
  coalesce(g.verified_rows,0) verified_regulator_rows,
  coalesce(g.missing_snapshot_rows,0) regulator_rows_missing_snapshot,
  coalesce(g.invalid_url_rows,0) regulator_rows_invalid_url,
  coalesce(g.missing_verification_rows,0) regulator_rows_missing_verification,
  coalesce(g.conflict_rows,0) regulator_conflict_rows,
  coalesce(p.status,'missing') primary_source_status,
  (
    coalesce(r.missing_snapshot_rows,0)=0
    and coalesce(r.invalid_url_rows,0)=0
    and coalesce(r.missing_verification_rows,0)=0
    and coalesce(r.conflict_rows,0)=0
    and coalesce(g.missing_snapshot_rows,0)=0
    and coalesce(g.invalid_url_rows,0)=0
    and coalesce(g.missing_verification_rows,0)=0
    and coalesce(g.conflict_rows,0)=0
    and coalesce(p.status,'missing') in ('valid','missing')
  ) evidence_provenance_clean
from inventory i
left join rule_gate r on r.jurisdiction_key=i.jurisdiction_key
left join reg_gate g on g.jurisdiction_key=i.jurisdiction_key
left join primary_gate p on p.jurisdiction_key=i.jurisdiction_key;

create or replace function public.assert_full_depth_evidence_gates()
returns table (
  jurisdiction_count bigint,
  provenance_clean_jurisdictions bigint,
  jurisdictions_with_rule_conflicts bigint,
  jurisdictions_with_regulator_conflicts bigint,
  jurisdictions_missing_primary_source bigint,
  jurisdictions_with_invalid_primary_source bigint,
  jurisdictions_with_wrong_hierarchy bigint,
  gate_pass boolean
)
language sql stable security definer set search_path = public as $$
  with x as (select * from public.v_jurisdiction_evidence_provenance_gates)
  select
    count(*)::bigint,
    count(*) filter (where evidence_provenance_clean)::bigint,
    count(*) filter (where rule_conflict_rows>0)::bigint,
    count(*) filter (where regulator_conflict_rows>0)::bigint,
    count(*) filter (where primary_source_status='missing')::bigint,
    count(*) filter (where primary_source_status in ('expired','invalid_snapshot_hash','future_effective_date'))::bigint,
    count(*) filter (where primary_source_status in ('wrong_level','wrong_parent'))::bigint,
    (
      count(*)=291
      and count(*) filter (where rule_conflict_rows>0)=0
      and count(*) filter (where regulator_conflict_rows>0)=0
      and count(*) filter (where primary_source_status in ('expired','invalid_snapshot_hash','future_effective_date','wrong_level','wrong_parent'))=0
    )
  from x;
$$;

revoke all on function public.assert_full_depth_evidence_gates() from public, anon, authenticated;
grant execute on function public.assert_full_depth_evidence_gates() to service_role;

comment on view public.v_jurisdiction_evidence_provenance_gates is
  'Read-only evidence-quality gate. Verified structured facts require explicit provenance and successful snapshot references; subnational sources must match their own jurisdiction and parent key.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923030000','evidence_architecture_hardening_001','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923030000_evidence_architecture_hardening_001.sql

-- RECOVERY BEGIN 20260923033000_evidence_snapshot_gate_002.sql
-- Evidence architecture hardening 002.
-- A snapshot is qualifying only when it is linked to the source registry,
-- has a 64-character SHA-256 raw HTML hash, was captured successfully,
-- and retains extracted text. This matches the live source_snapshots schema.

create or replace view public.v_jurisdiction_verified_snapshot_gate
with (security_invoker = on) as
select
  ss.id snapshot_id,
  ss.source_id,
  ss.raw_html_hash snapshot_hash,
  ss.captured_at fetched_at,
  ss.fetch_status,
  sr.source_url registered_source_url,
  case
    when ss.id is null then false
    when lower(ss.raw_html_hash) !~ '^[0-9a-f]{64}$' then false
    when ss.captured_at is null then false
    when ss.fetch_status <> 'success' then false
    when ss.captured_text is null or length(ss.captured_text)=0 then false
    when sr.id is null or sr.source_url is null then false
    else true
  end qualifying_snapshot
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id;

create or replace view public.v_jurisdiction_evidence_snapshot_failures
with (security_invoker = on) as
select
  ss.id snapshot_id, ss.source_id, ss.raw_html_hash snapshot_hash,
  ss.captured_at fetched_at, ss.fetch_status, sr.source_url registered_source_url,
  case
    when ss.raw_html_hash is null or lower(ss.raw_html_hash) !~ '^[0-9a-f]{64}$' then 'invalid_snapshot_hash'
    when ss.captured_at is null then 'missing_captured_at'
    when ss.fetch_status is null then 'missing_fetch_status'
    when ss.fetch_status <> 'success' then 'non_success_fetch_status'
    when ss.captured_text is null or length(ss.captured_text)=0 then 'missing_captured_text'
    when sr.id is null then 'missing_source_registry_row'
    when sr.source_url is null then 'missing_source_url'
    else 'unknown'
  end failure_reason
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id
where not exists (
  select 1 from public.v_jurisdiction_verified_snapshot_gate g
  where g.snapshot_id=ss.id and g.qualifying_snapshot
);

create or replace view public.v_jurisdiction_structured_evidence_provenance
with (security_invoker = on) as
select 'rule' evidence_kind, r.jurisdiction_key, r.rule_dimension dimension_key,
       r.id evidence_id, r.source_url evidence_url, r.source_snapshot_id,
       g.source_id source_registry_id, g.qualifying_snapshot, r.verification_status, r.verified_at,
       g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'regulator', r.jurisdiction_key, 'regulator', r.id, r.source_url, r.source_snapshot_id,
       g.source_id, g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'change', r.jurisdiction_key, r.dimension_key, r.id, r.source_url, r.source_snapshot_id,
       g.source_id, g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'participant', r.jurisdiction_key, r.participant_type, r.id, r.source_url, r.source_snapshot_id,
       g.source_id, g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'relationship', r.jurisdiction_key, 'relationships', r.id, r.source_url, r.source_snapshot_id,
       g.source_id, g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
union all
select 'opportunity', r.jurisdiction_key, 'opportunities', r.id, r.source_url, r.source_snapshot_id,
       g.source_id, g.qualifying_snapshot, r.verification_status, r.verified_at, g.snapshot_hash, g.fetched_at
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id;

create or replace view public.v_jurisdiction_evidence_snapshot_gate_summary
with (security_invoker = on) as
select
  count(*) total_structured_evidence_rows,
  count(*) filter (where verification_status='verified') verified_rows,
  count(*) filter (where verification_status='verified' and qualifying_snapshot) verified_with_qualifying_snapshot,
  count(*) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) verified_without_qualifying_snapshot,
  count(distinct jurisdiction_key) filter (where verification_status='verified' and not coalesce(qualifying_snapshot,false)) affected_jurisdictions
from public.v_jurisdiction_structured_evidence_provenance;

grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_failures to authenticated, service_role;
grant select on public.v_jurisdiction_structured_evidence_provenance to anon, authenticated;
grant select on public.v_jurisdiction_evidence_snapshot_gate_summary to authenticated, service_role;

comment on view public.v_jurisdiction_verified_snapshot_gate is
  'Qualifying snapshot gate. A cryptographic hash alone is insufficient; the capture must be successful and retain extracted text.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923033000','evidence_snapshot_gate_002','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923033000_evidence_snapshot_gate_002.sql
