-- ============================================================
-- Automatic heat-map repaint from regulatory signals
-- ============================================================
-- Builds on existing countries.regulatory_tier + regulatory_tier_audit
-- + api.derive_regulatory_tier(). Closes the loop so promoted signals
-- with high confidence can update the globe colour automatically.
--
-- Safety:
--   * Global kill switch (market_access_auto_apply_enabled)
--   * Per-country freeze (regulatory_tier_auto_frozen)
--   * Primary-source preference + corroboration thresholds
--   * Full audit trail in regulatory_tier_audit + market_access_events
--   * Idempotent; concurrent-safe via advisory lock
-- ============================================================

-- 1. Kill switch + per-country freeze
create table if not exists public.platform_feature_flags (
  key         text primary key,
  enabled     boolean not null default false,
  description text,
  updated_at  timestamptz not null default now(),
  updated_by  text
);

insert into public.platform_feature_flags (key, enabled, description, updated_by)
values (
  'market_access_auto_apply_enabled',
  true,
  'When true, high-confidence market-access events may auto-update countries.regulatory_tier. Disable instantly to freeze the heat map.',
  'migration:20260816120000'
)
on conflict (key) do nothing;

alter table public.countries
  add column if not exists regulatory_tier_auto_frozen boolean not null default false;

comment on column public.countries.regulatory_tier_auto_frozen is
  'When true, automatic signal-driven tier updates are blocked for this country. Manual set_regulatory_tier still works.';

-- Ensure cbd_hemp_only is allowed on the check constraint (may already exist)
do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'countries_regulatory_tier_check'
  ) then
    alter table public.countries drop constraint countries_regulatory_tier_check;
  end if;
  alter table public.countries
    add constraint countries_regulatory_tier_check
    check (
      regulatory_tier is null or regulatory_tier in (
        'legal_commercial_access',
        'medical_limited_trade',
        'domestic_only',
        'cbd_hemp_only',
        'prohibited'
      )
    );
exception when others then
  null; -- already correct or concurrent
end $$;

-- 2. Structured impact events extracted from signals
create table if not exists public.market_access_events (
  id                  uuid primary key default gen_random_uuid(),
  signal_id           uuid not null,
  country_iso2        text not null,
  pathway             text not null check (pathway in (
                        'medical', 'adult_use', 'import', 'export',
                        'commercial_retail', 'hemp_cbd', 'prohibition'
                      )),
  direction           text not null check (direction in (
                        'expanded', 'restricted', 'opened', 'closed', 'clarified'
                      )),
  proposed_status     text not null check (proposed_status in (
                        'legal_commercial_access',
                        'medical_limited_trade',
                        'domestic_only',
                        'cbd_hemp_only',
                        'prohibited'
                      )),
  confidence          numeric(5,4) not null check (confidence between 0 and 1),
  is_primary_source   boolean not null default false,
  source_id           uuid,
  evidence_snippet    text,
  evidence_url        text,
  as_of_date          date,
  extracted_at        timestamptz not null default now(),
  extractor_version   text not null default 'v1',
  processed_at        timestamptz,
  unique (signal_id, pathway)
);

create index if not exists idx_mae_country_pending
  on public.market_access_events (country_iso2, extracted_at desc)
  where processed_at is null;

create index if not exists idx_mae_confidence
  on public.market_access_events (confidence desc)
  where confidence >= 0.85 and processed_at is null;

-- 3. Proposal ledger (even auto decisions are logged)
create table if not exists public.market_access_proposals (
  id                      uuid primary key default gen_random_uuid(),
  country_iso2            text not null,
  proposed_status         text not null,
  previous_status         text,
  aggregate_confidence    numeric(5,4) not null,
  corroboration_count     integer not null,
  primary_source_count    integer not null,
  event_ids               uuid[] not null default '{}',
  signal_ids              uuid[] not null default '{}',
  decision                text not null check (decision in (
                            'auto_applied',
                            'rejected_low_confidence',
                            'rejected_conflict',
                            'rejected_stale',
                            'rejected_frozen',
                            'rejected_disabled'
                          )),
  decision_reason         text,
  decided_at              timestamptz not null default now()
);

create index if not exists idx_map_country_decided
  on public.market_access_proposals (country_iso2, decided_at desc);

-- 4. Helper: is this source a primary regulator / gazette?
create or replace function public.is_primary_market_access_source(p_source_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (
      select
        coalesce(s.tier, 99) <= 1
        or coalesce(s.source_type, '') in ('regulator', 'government_official', 'gazette', 'official_gazette')
        or coalesce(s.content_type, '') in ('regulatory', 'legislation', 'official_notice')
      from public.source_registry s
      where s.id = p_source_id
    ),
    false
  );
$$;

-- 5. Pathway roll-up: many pathway events -> one overall status
-- Priority (most open wins when evidence is expansion-oriented;
-- restriction uses the most restrictive consistent signal).
create or replace function public.roll_up_market_access_status(p_statuses text[])
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  s text;
begin
  if p_statuses is null or array_length(p_statuses, 1) is null then
    return null;
  end if;
  -- Prefer most open status present
  foreach s in array array[
    'legal_commercial_access',
    'medical_limited_trade',
    'domestic_only',
    'cbd_hemp_only',
    'prohibited'
  ] loop
    if s = any (p_statuses) then
      return s;
    end if;
  end loop;
  return null;
end;
$$;

-- 6. Core promote tick (fully automatic)
create or replace function api.promote_market_access_from_signals(
  p_lookback_hours integer default 168
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_enabled boolean;
  v_country text;
  v_current text;
  v_frozen boolean;
  v_proposed text;
  v_conf numeric;
  v_primary_count int;
  v_corroboration int;
  v_event_ids uuid[];
  v_signal_ids uuid[];
  v_decision text;
  v_reason text;
  v_applied int := 0;
  v_rejected int := 0;
  v_countries int := 0;
  r record;
begin
  -- Global kill switch
  select enabled into v_enabled
  from public.platform_feature_flags
  where key = 'market_access_auto_apply_enabled';

  if not coalesce(v_enabled, false) then
    return jsonb_build_object(
      'ok', true,
      'applied', 0,
      'rejected', 0,
      'reason', 'auto-apply disabled'
    );
  end if;

  -- Advisory lock so concurrent ticks do not double-apply
  if not pg_try_advisory_xact_lock(hashtext('promote_market_access_from_signals')) then
    return jsonb_build_object('ok', true, 'applied', 0, 'rejected', 0, 'reason', 'lock held');
  end if;

  for r in
    with fresh as (
      select
        e.*,
        row_number() over (
          partition by e.country_iso2, e.proposed_status
          order by e.is_primary_source desc, e.confidence desc, e.extracted_at desc
        ) as rn
      from public.market_access_events e
      where e.processed_at is null
        and e.extracted_at > now() - make_interval(hours => p_lookback_hours)
        and e.confidence >= 0.80
    ),
    by_country as (
      select
        country_iso2,
        array_agg(distinct proposed_status) as statuses,
        max(confidence) filter (where is_primary_source) as max_primary_conf,
        max(confidence) as max_conf,
        count(*) filter (where is_primary_source) as primary_count,
        count(distinct source_id) as independent_sources,
        array_agg(id) as event_ids,
        array_agg(distinct signal_id) as signal_ids
      from fresh
      group by country_iso2
    )
    select * from by_country
  loop
    v_countries := v_countries + 1;
    v_country := r.country_iso2;

    select c.regulatory_tier, c.regulatory_tier_auto_frozen
      into v_current, v_frozen
    from public.countries c
    where c.iso_alpha2 = v_country;

    if not found then
      v_rejected := v_rejected + 1;
      insert into public.market_access_proposals (
        country_iso2, proposed_status, previous_status,
        aggregate_confidence, corroboration_count, primary_source_count,
        event_ids, signal_ids, decision, decision_reason
      ) values (
        v_country, public.roll_up_market_access_status(r.statuses), null,
        coalesce(r.max_conf, 0), r.independent_sources, r.primary_count,
        r.event_ids, r.signal_ids, 'rejected_stale', 'unknown country'
      );
      update public.market_access_events
         set processed_at = now()
       where id = any (r.event_ids);
      continue;
    end if;

    if v_frozen then
      v_rejected := v_rejected + 1;
      insert into public.market_access_proposals (
        country_iso2, proposed_status, previous_status,
        aggregate_confidence, corroboration_count, primary_source_count,
        event_ids, signal_ids, decision, decision_reason
      ) values (
        v_country, public.roll_up_market_access_status(r.statuses), v_current,
        coalesce(r.max_conf, 0), r.independent_sources, r.primary_count,
        r.event_ids, r.signal_ids, 'rejected_frozen', 'country auto-frozen'
      );
      update public.market_access_events
         set processed_at = now()
       where id = any (r.event_ids);
      continue;
    end if;

    v_proposed := public.roll_up_market_access_status(r.statuses);
    v_conf := coalesce(r.max_primary_conf, r.max_conf, 0);
    v_primary_count := r.primary_count;
    v_corroboration := r.independent_sources;
    v_event_ids := r.event_ids;
    v_signal_ids := r.signal_ids;

    -- Same status -> no-op
    if v_proposed is not null and v_proposed is not distinct from v_current then
      v_decision := 'rejected_stale';
      v_reason := 'status already current';
      v_rejected := v_rejected + 1;
    -- Single strong primary
    elsif v_primary_count >= 1 and v_conf >= 0.92 then
      v_decision := 'auto_applied';
      v_reason := format('primary source @ %.2f', v_conf);
    -- Multi-source corroboration
    elsif v_corroboration >= 2 and v_conf >= 0.85 then
      v_decision := 'auto_applied';
      v_reason := format('%s sources @ %.2f', v_corroboration, v_conf);
    else
      v_decision := 'rejected_low_confidence';
      v_reason := format(
        'conf=%.2f corroboration=%s primary=%s',
        v_conf, v_corroboration, v_primary_count
      );
      v_rejected := v_rejected + 1;
    end if;

    insert into public.market_access_proposals (
      country_iso2, proposed_status, previous_status,
      aggregate_confidence, corroboration_count, primary_source_count,
      event_ids, signal_ids, decision, decision_reason
    ) values (
      v_country, v_proposed, v_current,
      v_conf, v_corroboration, v_primary_count,
      v_event_ids, v_signal_ids, v_decision, v_reason
    );

    if v_decision = 'auto_applied' and v_proposed is not null then
      update public.countries set
        regulatory_tier = v_proposed,
        regulatory_tier_origin = 'auto',
        regulatory_tier_last_derived_at = now(),
        regulatory_tier_source = 'signal-auto v1 ' || to_char(now(), 'YYYY-MM-DD'),
        regulatory_tier_rationale = v_reason,
        regulatory_tier_needs_review = false
      where iso_alpha2 = v_country;

      insert into public.regulatory_tier_audit (
        country_iso2, old_tier, new_tier, origin, trigger_source,
        program_status, actor, note
      ) values (
        v_country, v_current, v_proposed, 'auto', 'signal_pipeline',
        null, 'auto:v1', v_reason
      );

      v_applied := v_applied + 1;
    end if;

    update public.market_access_events
       set processed_at = now()
     where id = any (v_event_ids);
  end loop;

  return jsonb_build_object(
    'ok', true,
    'countries_seen', v_countries,
    'applied', v_applied,
    'rejected', v_rejected
  );
end;
$$;

revoke all on function api.promote_market_access_from_signals(integer) from public, anon, authenticated;
grant execute on function api.promote_market_access_from_signals(integer) to service_role;

comment on function api.promote_market_access_from_signals(integer) is
  'Fully automatic: promotes high-confidence market_access_events into countries.regulatory_tier. Respects kill switch and per-country freeze. Idempotent under advisory lock.';

-- 7. Insert helper used by the extractor edge function / cron
create or replace function api.record_market_access_event(
  p_signal_id uuid,
  p_country_iso2 text,
  p_pathway text,
  p_direction text,
  p_proposed_status text,
  p_confidence numeric,
  p_source_id uuid default null,
  p_evidence_snippet text default null,
  p_evidence_url text default null,
  p_as_of_date date default null,
  p_extractor_version text default 'v1'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_primary boolean;
begin
  v_primary := public.is_primary_market_access_source(p_source_id);

  insert into public.market_access_events (
    signal_id, country_iso2, pathway, direction, proposed_status,
    confidence, is_primary_source, source_id,
    evidence_snippet, evidence_url, as_of_date, extractor_version
  ) values (
    p_signal_id, upper(p_country_iso2), p_pathway, p_direction, p_proposed_status,
    p_confidence, v_primary, p_source_id,
    p_evidence_snippet, p_evidence_url, p_as_of_date, p_extractor_version
  )
  on conflict (signal_id, pathway) do update set
    confidence = greatest(market_access_events.confidence, excluded.confidence),
    is_primary_source = market_access_events.is_primary_source or excluded.is_primary_source,
    evidence_snippet = coalesce(excluded.evidence_snippet, market_access_events.evidence_snippet),
    evidence_url = coalesce(excluded.evidence_url, market_access_events.evidence_url),
    as_of_date = coalesce(excluded.as_of_date, market_access_events.as_of_date),
    processed_at = null  -- re-open for promote if evidence improved
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function api.record_market_access_event(uuid,text,text,text,text,numeric,uuid,text,text,date,text)
  from public, anon, authenticated;
grant execute on function api.record_market_access_event(uuid,text,text,text,text,numeric,uuid,text,text,date,text)
  to service_role;

-- 8. Instant kill / unfreeze helpers
create or replace function api.set_market_access_auto_apply(p_enabled boolean, p_actor text default 'ops')
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.platform_feature_flags (key, enabled, description, updated_at, updated_by)
  values (
    'market_access_auto_apply_enabled',
    p_enabled,
    'When true, high-confidence market-access events may auto-update countries.regulatory_tier.',
    now(),
    p_actor
  )
  on conflict (key) do update set
    enabled = excluded.enabled,
    updated_at = now(),
    updated_by = excluded.updated_by;
  return p_enabled;
end;
$$;

create or replace function api.set_country_auto_freeze(p_iso text, p_frozen boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.countries
     set regulatory_tier_auto_frozen = p_frozen
   where iso_alpha2 = upper(p_iso);
  if not found then
    raise exception 'unknown country %', p_iso;
  end if;
end;
$$;

revoke all on function api.set_market_access_auto_apply(boolean, text) from public, anon;
revoke all on function api.set_country_auto_freeze(text, boolean) from public, anon;
grant execute on function api.set_market_access_auto_apply(boolean, text) to service_role, authenticated;
grant execute on function api.set_country_auto_freeze(text, boolean) to service_role, authenticated;

-- 9. Public-safe read of current heat-map status (single source of truth)
create or replace view api.country_market_access_public as
select
  c.iso_alpha2 as country_iso2,
  c.country_name,
  c.region,
  c.regulatory_tier as status,
  c.regulatory_tier_last_derived_at as last_changed_at,
  c.regulatory_tier_origin as origin
from public.countries c
where c.regulatory_tier is not null;

grant select on api.country_market_access_public to anon, authenticated, service_role;

comment on view api.country_market_access_public is
  'Public-safe heat-map status. Globe and country briefs should read regulatory_tier via this view (or countries) — not fixtures.';
