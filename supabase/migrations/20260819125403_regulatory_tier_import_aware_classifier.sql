-- ============================================================
-- Import-aware regulatory_tier classifier + live reclassify
-- ============================================================
-- Root cause of DE/BR-style mis-colouring on the market-access globe:
--   * api.derive_regulatory_tier only treated EXPORT language as
--     legal_commercial_access. Import-heavy medical markets (Germany)
--     fell through to medical_limited_trade or domestic_only.
--   * Adult-use / social-club keywords ranked ABOVE medical, so CanG
--     social clubs forced domestic_only even when commercial import
--     pathways operate at scale.
--
-- Live path (already wired):
--   briefing program_status change
--     → trg_sync_regulatory_tier
--     → countries.regulatory_tier
--     → GlobeProvider realtime merge + /api/globe cache
--   signal pipeline
--     → market_access_events → promote_market_access_from_signals
--
-- This migration upgrades the shared classifier and re-runs it for every
-- origin='auto' country so the map matches current briefing text. Override
-- rows are left alone.
-- ============================================================

create or replace function api.derive_regulatory_tier(program_status text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  ps text := coalesce(program_status, '');
  under_discussion boolean;
begin
  if ps = '' then
    return null;
  end if;

  under_discussion :=
    ps ~* '(under (active )?consideration|under discussion|under review|licensing under (discussion|consideration|review)|reform under)';

  -- cbd_hemp_only: cannabis prohibited BUT affirmative licensed hemp/CBD.
  if ps ~* 'prohibited'
     and ps ~* '(industrial hemp (producer|cultivation)|largest industrial hemp|hemp expansion underway|licensed .*hemp|hemp .*licensed)'
     and ps !~* '(research (interest|developing)|informal)'
  then
    return 'cbd_hemp_only';
  end if;

  -- legal_commercial_access: lawful CROSS-BORDER commercial pathway at scale.
  -- Import and export are peers — an import market is commercial access.
  if not under_discussion then
    if ps ~* '(export (industry|hub|industry leader|-oriented)|licensed export|export-oriented|export permit)'
       and ps !~* 'export licensing under (discussion|consideration|review)'
    then
      return 'legal_commercial_access';
    end if;

    -- Licensed / operating import pathways (Germany-style medical import markets).
    if ps ~* '(licensed import|import market|medical import|commercial import|import pathway|import permit|licensed importer|importers)'
       and ps !~* 'import licensing under (discussion|consideration|review)'
    then
      return 'legal_commercial_access';
    end if;

    if ps ~* 'industrial (cultivation licensed|legal)' then
      return 'legal_commercial_access';
    end if;

    if ps ~* 'adult-use legal — federal' then
      return 'legal_commercial_access';
    end if;
  end if;

  -- domestic_only: lawful internally, no cross-border commercial route signal.
  -- Only when adult-use / personal cultivation is present AND we did not already
  -- match a commercial import/export pathway above.
  if ps ~* 'adult-use|personal cultivation legal|social clubs|home cultivation|recreational legal|coffee shop|pilot retail' then
    return 'domestic_only';
  end if;

  -- medical_limited_trade: affirmative medical access; exclude negated/future.
  if ps ~* '(medical (legal|—|-)|prescription|sativex|epidiolex|mcap|decriminaliz|cbd)'
     and ps !~* '(no medical programme|reform under|under (active )?consideration|under discussion)'
  then
    return 'medical_limited_trade';
  end if;

  return 'prohibited';
end;
$$;

comment on function api.derive_regulatory_tier(text) is
  'Derives countries.regulatory_tier from briefing program_status. Import and export pathways both map to legal_commercial_access; adult-use alone is domestic_only; medical-only is medical_limited_trade.';

-- Keep the public wrapper used by the briefing-change trigger in sync.
create or replace function public.api_derive_or_null(program_status text)
returns text
language sql
immutable
security definer
set search_path = ''
as $$
  select api.derive_regulatory_tier(program_status);
$$;

-- Reclassify every auto-origin country from current briefing text so production
-- map colours match the upgraded classifier without waiting for the next edit.
with derived as (
  select
    b.country_iso2,
    b.program_status,
    api.derive_regulatory_tier(b.program_status) as new_tier
  from public.cc_jurisdiction_briefings b
  where b.jurisdiction_type = 'country'
    and coalesce(b.program_status, '') <> ''
)
update public.countries c set
  regulatory_tier = d.new_tier,
  regulatory_tier_source = 'auto-reclassified import-aware classifier 2026-08-19',
  regulatory_tier_rationale = 'Derived from briefing: "' || left(d.program_status, 500) || '"',
  regulatory_tier_source_hash = md5(coalesce(d.program_status, '')),
  regulatory_tier_last_derived_at = now(),
  regulatory_tier_needs_review = case
    when d.new_tier is distinct from c.regulatory_tier then true
    else c.regulatory_tier_needs_review
  end
from derived d
where c.iso_alpha2 = d.country_iso2
  and coalesce(c.regulatory_tier_origin, 'auto') = 'auto'
  and d.new_tier is not null
  and d.new_tier is distinct from c.regulatory_tier;

-- Audit rows for every country that actually moved.
insert into public.regulatory_tier_audit
  (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
select
  c.iso_alpha2,
  null, -- historical old tier not recoverable in bulk without a temp table
  c.regulatory_tier,
  'auto',
  'classifier_upgrade',
  b.program_status,
  'system',
  'Bulk reclassify after import-aware classifier upgrade (20260819125403).'
from public.countries c
join public.cc_jurisdiction_briefings b
  on b.country_iso2 = c.iso_alpha2
 and b.jurisdiction_type = 'country'
where c.regulatory_tier_source = 'auto-reclassified import-aware classifier 2026-08-19';
