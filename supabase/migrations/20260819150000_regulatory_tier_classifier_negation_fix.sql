-- ============================================================
-- Regulatory tier classifier — negation-aware commercial signals
-- ============================================================
-- Production apply of 20260819125403 succeeded, but the post-apply
-- medical-only probe failed:
--
--   'Medical legal; prescription programme; no licensed export industry'
--     → legal_commercial_access  (wrong)
--     expected medical_limited_trade
--
-- Cause: export/import regexes matched substrings inside negated
-- phrases ("no licensed export industry" still matched "licensed export"
-- and "export industry").
--
-- This migration:
--   1. Replaces api.derive_regulatory_tier with negation guards
--   2. Reclassifies origin='auto' countries from current briefings
-- Override rows are left alone.
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
  export_negated boolean;
  import_negated boolean;
begin
  if ps = '' then
    return null;
  end if;

  under_discussion :=
    ps ~* '(under (active )?consideration|under discussion|under review|licensing under (discussion|consideration|review)|reform under)';

  -- Negation windows: "no/not/without/lack of … export|import"
  export_negated :=
    ps ~* '(no|not|without|lack of)[[:space:]]+(a[[:space:]]+|an[[:space:]]+|any[[:space:]]+)?(licensed[[:space:]]+)?export'
    or ps ~* '(no|not|without|lack of)[[:space:]]+[^.;]{0,40}export[[:space:]]+(industry|hub|permit|market)';

  import_negated :=
    ps ~* '(no|not|without|lack of)[[:space:]]+(a[[:space:]]+|an[[:space:]]+|any[[:space:]]+)?(licensed[[:space:]]+)?import'
    or ps ~* '(no|not|without|lack of)[[:space:]]+[^.;]{0,40}import[[:space:]]+(industry|pathway|permit|market)';

  -- cbd_hemp_only: cannabis prohibited BUT affirmative licensed hemp/CBD.
  if ps ~* 'prohibited'
     and ps ~* '(industrial hemp (producer|cultivation)|largest industrial hemp|hemp expansion underway|licensed .*hemp|hemp .*licensed)'
     and ps !~* '(research (interest|developing)|informal)'
  then
    return 'cbd_hemp_only';
  end if;

  -- legal_commercial_access: lawful CROSS-BORDER commercial pathway at scale.
  -- Import and export are peers — an import market is commercial access.
  -- Negated phrases must not promote (e.g. "no licensed export industry").
  if not under_discussion then
    if not export_negated
       and ps ~* '(export (industry|hub|industry leader|-oriented)|licensed export|export-oriented|export permit)'
       and ps !~* 'export licensing under (discussion|consideration|review)'
    then
      return 'legal_commercial_access';
    end if;

    -- Licensed / operating import pathways (Germany-style medical import markets).
    if not import_negated
       and ps ~* '(licensed import|import market|medical import|commercial import|import pathway|import permit|licensed importer|importers)'
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
  'Derives countries.regulatory_tier from briefing program_status. Import and export pathways both map to legal_commercial_access unless negated; adult-use alone is domestic_only; medical-only is medical_limited_trade.';

create or replace function public.api_derive_or_null(program_status text)
returns text
language sql
immutable
security definer
set search_path = ''
as $$
  select api.derive_regulatory_tier(program_status);
$$;

-- Reclassify origin=auto from current briefing text with the fixed classifier.
with derived as (
  select
    b.country_iso2,
    b.program_status,
    api.derive_regulatory_tier(b.program_status) as new_tier,
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
    regulatory_tier_source = 'auto-reclassified negation-aware classifier 2026-08-19',
    regulatory_tier_rationale = 'Derived from briefing: "' || left(ch.program_status, 500) || '"',
    regulatory_tier_source_hash = md5(coalesce(ch.program_status, '')),
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
  'Bulk reclassify after negation-aware classifier fix (20260819150000).'
from updated;
