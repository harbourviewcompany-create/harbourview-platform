-- ============================================================
-- Regulatory tier classifier — clause-scope hardening
-- ============================================================
-- Forward repair after:
--   20260819150000_regulatory_tier_classifier_negation_fix.sql
--   20260819152000_tier_classify_all_countries_from_briefing_prose.sql
--
-- 20260819150000 fixed the immediate false positive where
-- "no licensed export industry" matched affirmative export regexes. Remaining
-- classifier-contract gaps include clause-local negation, natural-language
-- negation forms, and trade-discussion text erasing established medical access.
--
-- 20260819152000 makes full briefing prose the canonical classifier input by
-- joining program_status, public_summary, market_dynamics, and
-- regulatory_outlook with " | ". This migration preserves that contract.
--
-- Override rows are never reclassified.
-- ============================================================

create or replace function api.derive_regulatory_tier(program_status text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  ps text := coalesce(program_status, '');
  general_under_discussion boolean;
  export_commercial boolean;
  import_commercial boolean;
begin
  if trim(both from ps) = '' then
    return null;
  end if;

  general_under_discussion :=
    ps ~* '(under (active )?consideration|under discussion|under review|licensing under (discussion|consideration|review)|reform under)';

  -- Evaluate trade evidence clause-by-clause. Full briefing prose is joined by
  -- " | ", so pipe separators are boundaries as well as punctuation.
  -- and/but/however also start a new clause so historical negative wording does
  -- not suppress a later current affirmative pathway.
  select exists (
    select 1
    from regexp_split_to_table(
      ps,
      '[.;,|]+|[[:space:]]+(and|but|however)[[:space:]]+',
      'i'
    ) as s(segment)
    where segment ~* '(export (industry|hub|industry leader|-oriented)|licensed export|export-oriented|export permit)'
      and segment !~* '((no|not|without|never|lack of|lacks?|lacking|absent|does[[:space:]]+not)[[:space:]]+(longer[[:space:]]+|currently[[:space:]]+)?((has?|have|operates?|supports?|maintains?)[[:space:]]+)?((a|an|any)[[:space:]]+)?(licensed[[:space:]]+)?(commercial[[:space:]]+)?)(export (industry|hub|industry leader|-oriented)|licensed export|export-oriented|export permit)'
      and segment !~* 'export licensing under (discussion|consideration|review)'
  ) into export_commercial;

  select exists (
    select 1
    from regexp_split_to_table(
      ps,
      '[.;,|]+|[[:space:]]+(and|but|however)[[:space:]]+',
      'i'
    ) as s(segment)
    where segment ~* '(licensed import|import market|medical import|commercial import|import pathway|import permit|licensed importer|importers)'
      and segment !~* '((no|not|without|never|lack of|lacks?|lacking|absent|does[[:space:]]+not)[[:space:]]+(longer[[:space:]]+|currently[[:space:]]+)?((has?|have|operates?|supports?|maintains?)[[:space:]]+)?((a|an|any)[[:space:]]+)?(licensed[[:space:]]+)?((commercial|medical)[[:space:]]+)?)(licensed import|import market|medical import|commercial import|import pathway|import permit|licensed importer|importers)'
      and segment !~* 'import licensing under (discussion|consideration|review)'
  ) into import_commercial;

  -- cbd_hemp_only: cannabis prohibited BUT affirmative licensed hemp/CBD.
  if ps ~* 'prohibited'
     and ps ~* '(industrial hemp (producer|cultivation)|largest industrial hemp|hemp expansion underway|licensed .*hemp|hemp .*licensed)'
     and ps !~* '(research (interest|developing)|informal)'
  then
    return 'cbd_hemp_only';
  end if;

  -- Cross-border commercial access requires at least one affirmative,
  -- non-negated import/export clause.
  if export_commercial or import_commercial then
    return 'legal_commercial_access';
  end if;

  -- Preserve fail-closed handling for broad future/discussion language on the
  -- non-trade commercial signals inherited from the earlier classifier.
  if not general_under_discussion then
    if ps ~* 'industrial (cultivation licensed|legal)' then
      return 'legal_commercial_access';
    end if;

    if ps ~* 'adult-use legal — federal' then
      return 'legal_commercial_access';
    end if;
  end if;

  -- Domestic lawful access without an affirmative cross-border pathway.
  if ps ~* 'adult-use|personal cultivation legal|social clubs|home cultivation|recreational legal|coffee shop|pilot retail' then
    return 'domestic_only';
  end if;

  -- Established medical access remains established when a separate trade
  -- reform is under discussion. The medical-legal token must end at "legal"
  -- so future terms such as "medical legalization/legalisation" do not get
  -- mistaken for an already-legal medical programme.
  if ps ~* '(medical legal([[:space:][:punct:]]|$)|medical[[:space:]]*(—|-)|prescription|sativex|epidiolex|mcap|decriminaliz|cbd)'
     and ps !~* '(no medical programme|no medical program|medical (reform|programme|program|access|legalization|legalisation|licensing)( remains?)? under (active )?(consideration|discussion|review))'
  then
    return 'medical_limited_trade';
  end if;

  return 'prohibited';
end;
$$;

comment on function api.derive_regulatory_tier(text) is
  'Derives countries.regulatory_tier from canonical briefing text. Affirmative non-negated import/export clauses map to legal_commercial_access; unrelated trade discussion does not erase established medical access; future medical legalization text is not treated as already legal; adult-use alone is domestic_only; medical-only is medical_limited_trade.';

create or replace function public.api_derive_or_null(program_status text)
returns text
language sql
immutable
security definer
set search_path = ''
as $$
  select api.derive_regulatory_tier(program_status);
$$;

-- Re-derive automatic country tiers using the SAME canonical full-briefing
-- source contract introduced by 20260819152000. Do not fall back to
-- program_status-only reclassification here.
with briefing_text as (
  select
    b.country_iso2,
    b.program_status,
    api.briefing_classifier_text(
      b.program_status,
      b.public_summary,
      b.market_dynamics,
      b.regulatory_outlook
    ) as classifier_text,
    c.regulatory_tier as old_tier
  from public.cc_jurisdiction_briefings b
  join public.countries c on c.iso_alpha2 = b.country_iso2
  where b.jurisdiction_type = 'country'
    and coalesce(c.regulatory_tier_origin, 'auto') = 'auto'
),
derived as (
  select
    country_iso2,
    program_status,
    classifier_text,
    api.derive_regulatory_tier(classifier_text) as new_tier,
    old_tier
  from briefing_text
  where classifier_text is not null
),
changed as (
  select * from derived
  where new_tier is not null
    and new_tier is distinct from old_tier
),
updated as (
  update public.countries c set
    regulatory_tier = ch.new_tier,
    regulatory_tier_source = 'auto-reclassified clause-scope full briefing prose 2026-08-19',
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
  'classifier_clause_scope_hardening',
  program_status,
  'system',
  'Forward reclassify from canonical full briefing prose after clause-scope hardening (20260819153000).'
from updated;
