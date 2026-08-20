-- ============================================================
-- Heat-map safety: conflict-aware roll-up, tier-1 freeze, seed
-- ============================================================
-- Follow-up to 20260816120000_auto_heatmap_from_signals.sql
-- 1. Restriction-aware status roll-up (prohibition / restrictive wins)
-- 2. Promote detects open+restricted conflicts → rejected_conflict
-- 3. Corroboration counts null source_id via signal_id
-- 4. Freeze high-stakes markets against auto-flip
-- 5. Correct known-wrong tiers for DE, BR, CO (reviewed overrides)
-- ============================================================

-- 1. Restriction-aware roll-up
-- When any prohibited status is present, prefer it over open statuses.
-- Otherwise prefer most open. Callers that need conflict rejection
-- check both open and restricted presence before calling this.
create or replace function public.roll_up_market_access_status(p_statuses text[])
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  s text;
  has_prohibited boolean := false;
  has_open boolean := false;
begin
  if p_statuses is null or array_length(p_statuses, 1) is null then
    return null;
  end if;

  foreach s in array p_statuses loop
    if s = 'prohibited' then
      has_prohibited := true;
    elsif s in ('legal_commercial_access', 'medical_limited_trade', 'domestic_only', 'cbd_hemp_only') then
      has_open := true;
    end if;
  end loop;

  -- Restriction wins over expansion when both appear in the same batch
  if has_prohibited then
    return 'prohibited';
  end if;

  foreach s in array array[
    'legal_commercial_access',
    'medical_limited_trade',
    'domestic_only',
    'cbd_hemp_only'
  ] loop
    if s = any (p_statuses) then
      return s;
    end if;
  end loop;

  return null;
end;
$$;

comment on function public.roll_up_market_access_status(text[]) is
  'Pathway events → one overall status. Prohibited wins over open statuses. Prefer most-open among non-prohibited.';

-- 2. Replace promote tick with conflict detection + better corroboration
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
  v_has_prohibited boolean;
  v_has_open boolean;
  r record;
begin
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

  if not pg_try_advisory_xact_lock(hashtext('promote_market_access_from_signals')) then
    return jsonb_build_object('ok', true, 'applied', 0, 'rejected', 0, 'reason', 'lock held');
  end if;

  for r in
    with fresh as (
      select *
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
        -- Null source_id: fall back to signal_id so multi-null does not collapse to 1
        count(distinct coalesce(source_id::text, signal_id::text)) as independent_sources,
        array_agg(id) as event_ids,
        array_agg(distinct signal_id) as signal_ids,
        bool_or(proposed_status = 'prohibited') as has_prohibited,
        bool_or(proposed_status in (
          'legal_commercial_access', 'medical_limited_trade',
          'domestic_only', 'cbd_hemp_only'
        )) as has_open,
        -- High-confidence restriction signals present?
        bool_or(direction in ('restricted', 'closed') and confidence >= 0.85) as has_strong_restriction,
        bool_or(direction in ('expanded', 'opened') and confidence >= 0.85) as has_strong_expansion
      from fresh
      group by country_iso2
    )
    select * from by_country
  loop
    v_countries := v_countries + 1;
    v_country := r.country_iso2;
    v_has_prohibited := r.has_prohibited;
    v_has_open := r.has_open;

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

    -- Conflict: strong expansion AND strong restriction in same window
    if r.has_strong_expansion and r.has_strong_restriction then
      v_decision := 'rejected_conflict';
      v_reason := 'conflicting expansion + restriction signals in lookback window';
      v_proposed := public.roll_up_market_access_status(r.statuses);
      v_conf := coalesce(r.max_primary_conf, r.max_conf, 0);
      v_primary_count := r.primary_count;
      v_corroboration := r.independent_sources;
      v_event_ids := r.event_ids;
      v_signal_ids := r.signal_ids;
      v_rejected := v_rejected + 1;

      insert into public.market_access_proposals (
        country_iso2, proposed_status, previous_status,
        aggregate_confidence, corroboration_count, primary_source_count,
        event_ids, signal_ids, decision, decision_reason
      ) values (
        v_country, v_proposed, v_current,
        v_conf, v_corroboration, v_primary_count,
        v_event_ids, v_signal_ids, v_decision, v_reason
      );

      update public.market_access_events
         set processed_at = now()
       where id = any (v_event_ids);
      continue;
    end if;

    -- Open + prohibited in same batch without a clear direction winner → conflict
    if v_has_open and v_has_prohibited and not r.has_strong_restriction then
      -- weak prohibition mixed with open → still treat as conflict if conf close
      if coalesce(r.max_conf, 0) < 0.95 then
        v_decision := 'rejected_conflict';
        v_reason := 'open and prohibited statuses without decisive confidence';
        v_proposed := public.roll_up_market_access_status(r.statuses);
        v_conf := coalesce(r.max_primary_conf, r.max_conf, 0);
        v_primary_count := r.primary_count;
        v_corroboration := r.independent_sources;
        v_event_ids := r.event_ids;
        v_signal_ids := r.signal_ids;
        v_rejected := v_rejected + 1;

        insert into public.market_access_proposals (
          country_iso2, proposed_status, previous_status,
          aggregate_confidence, corroboration_count, primary_source_count,
          event_ids, signal_ids, decision, decision_reason
        ) values (
          v_country, v_proposed, v_current,
          v_conf, v_corroboration, v_primary_count,
          v_event_ids, v_signal_ids, v_decision, v_reason
        );

        update public.market_access_events
           set processed_at = now()
         where id = any (v_event_ids);
        continue;
      end if;
    end if;

    v_proposed := public.roll_up_market_access_status(r.statuses);
    v_conf := coalesce(r.max_primary_conf, r.max_conf, 0);
    v_primary_count := r.primary_count;
    v_corroboration := r.independent_sources;
    v_event_ids := r.event_ids;
    v_signal_ids := r.signal_ids;

    if v_proposed is not null and v_proposed is not distinct from v_current then
      v_decision := 'rejected_stale';
      v_reason := 'status already current';
      v_rejected := v_rejected + 1;
    elsif v_primary_count >= 1 and v_conf >= 0.92 then
      v_decision := 'auto_applied';
      v_reason := format('primary source @ %.2f', v_conf);
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
        regulatory_tier_source = 'signal-auto v1.1 ' || to_char(now(), 'YYYY-MM-DD'),
        regulatory_tier_rationale = v_reason,
        regulatory_tier_needs_review = false
      where iso_alpha2 = v_country;

      insert into public.regulatory_tier_audit (
        country_iso2, old_tier, new_tier, origin, trigger_source,
        program_status, actor, note
      ) values (
        v_country, v_current, v_proposed, 'auto', 'signal_pipeline',
        null, 'auto:v1.1', v_reason
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

comment on function api.promote_market_access_from_signals(integer) is
  'v1.1: conflict-aware promote. Rejects expansion+restriction conflicts. Restriction-aware roll-up. Null source_id counted via signal_id.';

-- 3. Freeze tier-1 / high-stakes markets until primary-source coverage is solid
update public.countries
   set regulatory_tier_auto_frozen = true
 where iso_alpha2 in (
   'DE', 'CA', 'AU', 'GB', 'US', 'NL', 'IL', 'FR', 'IT', 'ES',
   'PT', 'CH', 'DK', 'NZ', 'BR', 'CO', 'PL', 'CZ', 'MT', 'SE'
 );

-- 4. Correct known-wrong map colours (reviewed overrides; stay frozen)
-- Germany: leading EU medical commercial + CanG framework — not domestic-only
do $$
declare
  v_iso text;
  v_tier text;
  v_note text;
  v_old text;
begin
  for v_iso, v_tier, v_note in
    select * from (values
      ('DE', 'legal_commercial_access',
       'Reviewed correction: Germany is a leading EU medical commercial / import market with adult-use framework (CanG). Not domestic-only.'),
      ('BR', 'medical_limited_trade',
       'Reviewed correction: Brazil is a medical access / import market (ANVISA), not domestic-only or prohibited.'),
      ('CO', 'medical_limited_trade',
       'Reviewed correction: Colombia is medical cultivation/export pathway (INVIMA), not domestic-only.')
    ) as t(iso, tier, note)
  loop
    select regulatory_tier into v_old from public.countries where iso_alpha2 = v_iso;
    if not found then
      continue;
    end if;
    if v_old is not distinct from v_tier then
      continue;
    end if;

    update public.countries set
      regulatory_tier = v_tier,
      regulatory_tier_origin = 'override',
      regulatory_tier_reviewed_at = now(),
      regulatory_tier_needs_review = false,
      regulatory_tier_last_derived_at = now(),
      regulatory_tier_source = 'reviewed seed fix (heatmap v1.1) ' || to_char(now(), 'YYYY-MM-DD'),
      regulatory_tier_rationale = v_note,
      regulatory_tier_auto_frozen = true
    where iso_alpha2 = v_iso;

    insert into public.regulatory_tier_audit (
      country_iso2, old_tier, new_tier, origin, trigger_source,
      program_status, actor, note
    ) values (
      v_iso, v_old, v_tier, 'override', 'manual',
      null, 'seed:heatmap-v1.1', v_note
    );
  end loop;
end $$;
