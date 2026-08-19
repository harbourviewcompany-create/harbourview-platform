-- ============================================================
-- Regulatory-tier trade negation hardening
-- ============================================================
-- Forward repair for 20260819125403_regulatory_tier_import_aware_classifier.sql.
--
-- The import-aware classifier correctly added licensed import pathways as
-- legal_commercial_access, but its affirmative trade regexes also matched
-- explicitly negated phrases such as "no licensed export industry".
-- This migration preserves the import-aware behavior while requiring an
-- affirmative, non-negated trade clause before promoting a jurisdiction.
--
-- The previously merged migration remains immutable. This migration replaces
-- the shared classifier and re-derives origin='auto' countries only. Manual
-- override rows remain untouched.
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
  export_commercial boolean;
  import_commercial boolean;
begin
  if ps = '' then
    return null;
  end if;

  under_discussion :=
    ps ~* '(under (active )?consideration|under discussion|under review|licensing under (discussion|consideration|review)|reform under)';

  -- Evaluate trade language clause-by-clause so a negated clause such as
  -- "no licensed export industry" cannot satisfy the affirmative export
  -- pattern. Splitting also allows a later, separate affirmative clause to
  -- remain meaningful (for example: "no export industry historically;
  -- licensed export permit now active").
  select exists (
    select 1
    from regexp_split_to_table(ps, '[.;,]+') as s(segment)
    where segment ~* '(export (industry|hub|industry leader|-oriented)|licensed export|export-oriented|export permit)'
      and segment !~* '(no|without|not currently|lacks?|absent)[[:space:]]+(licensed[[:space:]]+)?(commercial[[:space:]]+)?export([[:space:]]+(industry|hub|pathway|permit|market))?'
      and segment !~* 'export licensing under (discussion|consideration|review)'
  ) into export_commercial;

  select exists (
    select 1
    from regexp_split_to_table(ps, '[.;,]+') as s(segment)
    where segment ~* '(licensed import|import market|medical import|commercial import|import pathway|import permit|licensed importer|importers)'
      and segment !~* '(no|without|not currently|lacks?|absent)[[:space:]]+(licensed[[:space:]]+)?((commercial|medical)[[:space:]]+)?import(ers?|[[:space:]]+(market|pathway|permit))'
      and segment !~* 'import licensing under (discussion|consideration|review)'
  ) into import_commercial;

  -- cbd_hemp_only: cannabis prohibited BUT affirmative licensed hemp/CBD.
  if ps ~* 'prohibited'
     and ps ~* '(industrial hemp (producer|cultivation)|largest industrial hemp|hemp expansion underway|licensed .*hemp|hemp .*licensed)'
     and ps !~* '(research (interest|developing)|informal)'
  then
    return 'cbd_hemp_only';
  end if;

  -- legal_commercial_access: lawful CROSS-BORDER commercial pathway at scale.
  -- Import and export remain peers, but only affirmative trade clauses count.
  if not under_discussion then
    if export_commercial then
      return 'legal_commercial_access';
    end if;

    if import_commercial then
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
  'Derives countries.regulatory_tier from briefing program_status. Affirmative import/export pathways map to legal_commercial_access; explicitly negated trade language does not; adult-use alone is domestic_only; medical-only is medical_limited_trade.';

-- Re-derive every automatic country from the current briefing text so any
-- false-positive trade promotion from the prior classifier is corrected.
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
    regulatory_tier_source = 'auto-reclassified negation-hardened classifier 2026-08-19',
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
  'classifier_negation_hardening',
  program_status,
  'system',
  'Forward reclassify after trade-negation hardening (20260819150000).'
from updated;
