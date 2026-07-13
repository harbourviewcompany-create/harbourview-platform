-- Fires when a country briefing's program_status changes. Keeps countries.
-- regulatory_tier fresh automatically, per the chosen policy:
--   * origin='auto'     → reclassify immediately; if the new tier differs from
--                         the old, set needs_review=true (the "flag surprising
--                         change" signal) and log it.
--   * origin='override' → do NOT change the tier, but update the source hash and
--                         set needs_review=true so someone re-confirms the
--                         human/agent call against the new text.
-- Every change is written to regulatory_tier_audit.

create or replace function public.sync_regulatory_tier_from_briefing()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_iso        text := new.country_iso2;
  v_old_tier   text;
  v_origin     text;
  v_new_tier   text;
  v_new_hash   text := md5(coalesce(new.program_status,''));
begin
  -- Only care about country-level briefings with a program_status change.
  if new.jurisdiction_type is distinct from 'country' then
    return new;
  end if;
  if tg_op = 'UPDATE'
     and old.program_status is not distinct from new.program_status then
    return new;   -- program_status didn't change; nothing to do.
  end if;

  select regulatory_tier, regulatory_tier_origin
    into v_old_tier, v_origin
    from public.countries
   where iso_alpha2 = v_iso;

  if not found then
    return new;   -- no matching country row; ignore.
  end if;

  v_new_tier := public.api_derive_or_null(new.program_status);

  if v_origin = 'override' then
    -- Respect the human/agent call; just refresh provenance and flag for
    -- re-confirmation against the new source text.
    update public.countries set
      regulatory_tier_source_hash = v_new_hash,
      regulatory_tier_needs_review = true,
      regulatory_tier_last_derived_at = now()
    where iso_alpha2 = v_iso;

    insert into public.regulatory_tier_audit
      (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
    values
      (v_iso, v_old_tier, v_old_tier, 'override', 'briefing_change', new.program_status, 'system',
       'Briefing changed under an overridden tier; flagged for re-confirmation, tier left as-is.');
    return new;
  end if;

  -- origin = 'auto': recompute.
  update public.countries set
    regulatory_tier = coalesce(v_new_tier, regulatory_tier),
    regulatory_tier_source = 'auto-reclassified on briefing change ' || to_char(now(),'YYYY-MM-DD'),
    regulatory_tier_source_hash = v_new_hash,
    regulatory_tier_last_derived_at = now(),
    regulatory_tier_needs_review = case when v_new_tier is distinct from v_old_tier then true else regulatory_tier_needs_review end
  where iso_alpha2 = v_iso;

  if v_new_tier is distinct from v_old_tier then
    insert into public.regulatory_tier_audit
      (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
    values
      (v_iso, v_old_tier, v_new_tier, 'auto', 'briefing_change', new.program_status, 'system',
       'Auto-reclassified after briefing change.');
  end if;

  return new;
end;
$$;

-- Thin wrapper so the trigger (search_path='') can reach the api-schema
-- classifier by a fully-qualified, stable name.
create or replace function public.api_derive_or_null(program_status text)
returns text language sql immutable security definer set search_path='' as $$
  select api.derive_regulatory_tier(program_status);
$$;

drop trigger if exists trg_sync_regulatory_tier on public.cc_jurisdiction_briefings;
create trigger trg_sync_regulatory_tier
  after insert or update of program_status on public.cc_jurisdiction_briefings
  for each row execute function public.sync_regulatory_tier_from_briefing();

comment on function public.sync_regulatory_tier_from_briefing() is
  'Keeps countries.regulatory_tier in sync when a country briefing program_status changes. Respects overrides, flags surprising changes, writes regulatory_tier_audit.';
