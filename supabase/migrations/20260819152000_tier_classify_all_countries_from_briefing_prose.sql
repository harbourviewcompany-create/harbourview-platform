-- ============================================================
-- Tier classify ALL active countries from full briefing prose
-- ============================================================
-- DE/BR-only program_status patches are too narrow. Commercial import/export
-- facts often live in public_summary / market_dynamics / regulatory_outlook while
-- the short program_status still reads adult-use-only or medical-only.
--
-- This migration:
--   1. Adds api.briefing_classifier_text(...) — concatenates the four prose fields
--   2. Points the live briefing trigger at the combined text
--   3. Reclassifies every origin='auto' country that has a country-level briefing
-- Override rows are never rewritten.
-- ============================================================

create or replace function api.briefing_classifier_text(
  program_status text,
  public_summary text default null,
  market_dynamics text default null,
  regulatory_outlook text default null
)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(
    trim(both from concat_ws(
      ' | ',
      nullif(trim(both from coalesce(program_status, '')), ''),
      nullif(trim(both from coalesce(public_summary, '')), ''),
      nullif(trim(both from coalesce(market_dynamics, '')), ''),
      nullif(trim(both from coalesce(regulatory_outlook, '')), '')
    )),
    ''
  );
$$;

comment on function api.briefing_classifier_text(text, text, text, text) is
  'Canonical text fed to api.derive_regulatory_tier for a country briefing. program_status is primary; longer prose supplies commercial import/export signals when the short status omits them.';

revoke all on function api.briefing_classifier_text(text, text, text, text) from public, anon, authenticated;
grant execute on function api.briefing_classifier_text(text, text, text, text) to service_role;

-- Live path: any program_status change still fires the trigger; classifier now
-- sees the full briefing row so secondary prose is not ignored.
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
  v_text       text;
  v_new_hash   text;
begin
  if new.jurisdiction_type is distinct from 'country' then
    return new;
  end if;
  if tg_op = 'UPDATE'
     and old.program_status is not distinct from new.program_status
     and old.public_summary is not distinct from new.public_summary
     and old.market_dynamics is not distinct from new.market_dynamics
     and old.regulatory_outlook is not distinct from new.regulatory_outlook
  then
    return new;
  end if;

  select regulatory_tier, regulatory_tier_origin
    into v_old_tier, v_origin
    from public.countries
   where iso_alpha2 = v_iso;

  if not found then
    return new;
  end if;

  v_text := api.briefing_classifier_text(
    new.program_status,
    new.public_summary,
    new.market_dynamics,
    new.regulatory_outlook
  );
  v_new_hash := md5(coalesce(v_text, ''));
  v_new_tier := public.api_derive_or_null(v_text);

  if v_origin = 'override' then
    update public.countries set
      regulatory_tier_source_hash = v_new_hash,
      regulatory_tier_needs_review = true,
      regulatory_tier_last_derived_at = now()
    where iso_alpha2 = v_iso;

    insert into public.regulatory_tier_audit
      (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
    values
      (v_iso, v_old_tier, v_old_tier, 'override', 'briefing_change', new.program_status, 'system',
       'Briefing prose changed under an overridden tier; flagged for re-confirmation, tier left as-is.');
    return new;
  end if;

  update public.countries set
    regulatory_tier = coalesce(v_new_tier, regulatory_tier),
    regulatory_tier_source = 'auto-reclassified on briefing prose ' || to_char(now(), 'YYYY-MM-DD'),
    regulatory_tier_rationale = 'Derived from briefing prose: "' || left(coalesce(v_text, ''), 500) || '"',
    regulatory_tier_source_hash = v_new_hash,
    regulatory_tier_last_derived_at = now(),
    regulatory_tier_needs_review = case
      when v_new_tier is distinct from v_old_tier then true
      else regulatory_tier_needs_review
    end
  where iso_alpha2 = v_iso;

  if v_new_tier is distinct from v_old_tier then
    insert into public.regulatory_tier_audit
      (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
    values
      (v_iso, v_old_tier, v_new_tier, 'auto', 'briefing_change', new.program_status, 'system',
       'Auto-reclassified after briefing prose change (full-field classifier).');
  end if;

  return new;
end;
$$;

-- Also fire when secondary prose fields change (not only program_status).
drop trigger if exists trg_sync_regulatory_tier on public.cc_jurisdiction_briefings;
create trigger trg_sync_regulatory_tier
  after insert or update of program_status, public_summary, market_dynamics, regulatory_outlook
  on public.cc_jurisdiction_briefings
  for each row execute function public.sync_regulatory_tier_from_briefing();

-- Bulk reclassify every active country briefing with origin=auto.
with derived as (
  select
    b.country_iso2,
    b.program_status,
    api.briefing_classifier_text(
      b.program_status,
      b.public_summary,
      b.market_dynamics,
      b.regulatory_outlook
    ) as classifier_text,
    api.derive_regulatory_tier(
      api.briefing_classifier_text(
        b.program_status,
        b.public_summary,
        b.market_dynamics,
        b.regulatory_outlook
      )
    ) as new_tier,
    c.regulatory_tier as old_tier
  from public.cc_jurisdiction_briefings b
  join public.countries c on c.iso_alpha2 = b.country_iso2
  where b.jurisdiction_type = 'country'
    and coalesce(b.program_status, '') <> ''
    and coalesce(c.regulatory_tier_origin, 'auto') = 'auto'
),
changed as (
  select * from derived
  where new_tier is not null
    and new_tier is distinct from old_tier
),
updated as (
  update public.countries c set
    regulatory_tier = ch.new_tier,
    regulatory_tier_source = 'auto-reclassified full briefing prose 2026-08-19',
    regulatory_tier_rationale = 'Derived from briefing prose: "' || left(ch.classifier_text, 500) || '"',
    regulatory_tier_source_hash = md5(coalesce(ch.classifier_text, '')),
    regulatory_tier_last_derived_at = now(),
    regulatory_tier_needs_review = true
  from changed ch
  where c.iso_alpha2 = ch.country_iso2
  returning c.iso_alpha2, ch.old_tier, ch.new_tier, ch.program_status
)
insert into public.regulatory_tier_audit
  (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
select
  iso_alpha2,
  old_tier,
  new_tier,
  'auto',
  'classifier_upgrade',
  program_status,
  'system',
  'Bulk reclassify all origin=auto countries from full briefing prose (20260819152000).'
from updated;
