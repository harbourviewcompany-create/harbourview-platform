-- Single source of truth for deriving a regulatory_tier from briefing text.
-- Both the change-trigger and any manual/agent re-run call THIS, so the logic
-- can never drift between "how it was seeded" and "how it re-derives".
--
-- Mirrors the reviewed classification logic (migrations 20260710165831 /
-- 165848 / 171211). Exclusions run before affirmations so prospective/negated
-- language ("No Medical Programme", "Reform Under Consideration", "Export
-- Licensing Under Discussion") is not read as an active regime.
--
-- Returns NULL if there is genuinely no signal (caller decides how to treat it).

create or replace function api.derive_regulatory_tier(program_status text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  ps text := coalesce(program_status, '');
begin
  if ps = '' then
    return null;
  end if;

  -- cbd_hemp_only: cannabis prohibited BUT an affirmative licensed hemp/CBD
  -- regime. Deliberately narrow — requires an explicit licensed/permitted/
  -- producer signal, not mere "research interest".
  if ps ~* 'prohibited'
     and ps ~* '(industrial hemp (producer|cultivation)|largest industrial hemp|hemp expansion underway|licensed .*hemp|hemp .*licensed)'
     and ps !~* '(research (interest|developing)|informal)'
  then
    return 'cbd_hemp_only';
  end if;

  -- legal_commercial_access: lawful cross-border trade operating.
  if ps ~* '(export (industry|hub|industry leader|-oriented)|licensed export|export-oriented)'
     and ps !~* 'export licensing under (discussion|consideration|review)'
  then
    return 'legal_commercial_access';
  end if;
  if ps ~* 'industrial (cultivation licensed|legal)' then
    return 'legal_commercial_access';
  end if;
  if ps ~* 'adult-use legal — federal' then
    return 'legal_commercial_access';
  end if;

  -- domestic_only: lawful internally (adult-use / personal cultivation /
  -- coffee-shop / pilot retail) but no cross-border route.
  if ps ~* 'adult-use|personal cultivation legal|social clubs|home cultivation|recreational legal|coffee shop|pilot retail' then
    return 'domestic_only';
  end if;

  -- medical_limited_trade: affirmative medical access; exclude negated/future.
  if ps ~* '(medical (legal|—|-)|prescription|sativex|epidiolex|mcap|decriminaliz|cbd)'
     and ps !~* '(no medical programme|reform under|under (active )?consideration|under discussion)'
  then
    return 'medical_limited_trade';
  end if;

  -- default: prohibited.
  return 'prohibited';
end;
$$;

comment on function api.derive_regulatory_tier(text) is
  'Single source of truth for deriving countries.regulatory_tier from cc_jurisdiction_briefings.program_status. Called by the change-trigger and by manual re-runs so logic never drifts.';

revoke all on function api.derive_regulatory_tier(text) from public, anon, authenticated;
grant execute on function api.derive_regulatory_tier(text) to service_role;