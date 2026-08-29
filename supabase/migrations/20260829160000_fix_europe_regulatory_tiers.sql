-- Europe-focused regulatory tier reconciliation.
--
-- This migration records the current accepted production Europe regulatory-tier state
-- after PR #1690 production application and the first-two migration-ledger parity repair.
-- It is intentionally safe to replay against the accepted production state: rows that
-- already match tier, override origin, review state, and rationale are skipped before
-- api.set_regulatory_tier is called.
--
-- Release-safety contract:
--   * preserve the accepted production tier assignments and rationales exactly;
--   * use api.set_regulatory_tier so override/audit semantics remain canonical if a
--     fresh or drifted environment needs repair;
--   * skip rows already at the accepted reviewed override state;
--   * future api.reclassify_auto_tiers runs cannot touch these rows because it
--     operates only on regulatory_tier_origin = 'auto' or null.

do $$
declare
  r record;
begin
  for r in
    select *
    from (values
      ('NL', 'domestic_only',          'Legend: legal internally; no full lawful cross-border commercial route'),
      ('ES', 'domestic_only',          'Legend: legal internally; no full lawful cross-border commercial route'),
      ('MT', 'domestic_only',          'Legend: legal internally; no full lawful cross-border commercial route'),
      ('LU', 'legal_commercial_access','Legend: lawful cross-border commercial pathway in operation'),
      ('DE', 'medical_limited_trade',  'Legend: medical market; narrow or no commercial cross-border route'),
      ('FR', 'medical_limited_trade',  'Legend: medical market; narrow or no commercial cross-border route'),
      ('IT', 'medical_limited_trade',  'Legend: medical market; narrow or no commercial cross-border route'),
      ('GB', 'medical_limited_trade',  'Legend: medical market; narrow or no commercial cross-border route'),
      ('IE', 'medical_limited_trade',  'Legend: lawful medical market; narrow or no commercial cross-border route'),
      ('AT', 'medical_limited_trade',  'Legend: lawful medical market; narrow or no commercial cross-border route'),
      ('BE', 'medical_limited_trade',  'Legend: lawful medical market; narrow or no commercial cross-border route'),
      ('CH', 'medical_limited_trade',  'Legend: lawful medical market; narrow or no commercial cross-border route'),
      ('DK', 'medical_limited_trade',  'Denmark: medical pathway; not general commercial access'),
      ('SE', 'medical_limited_trade',  'Legend: lawful medical market; narrow or no commercial cross-border route'),
      ('NO', 'medical_limited_trade',  'Legend: lawful medical market; narrow or no commercial cross-border route'),
      ('FI', 'medical_limited_trade',  'Legend: lawful medical market; narrow or no commercial cross-border route'),
      ('PL', 'medical_limited_trade',  'Legend: medical market; narrow or no commercial cross-border route'),
      ('CZ', 'medical_limited_trade',  'Legend: medical market; narrow or no commercial cross-border route'),
      ('GR', 'medical_limited_trade',  'GR medical'),
      ('HR', 'medical_limited_trade',  'HR medical'),
      ('SI', 'medical_limited_trade',  'SI medical'),
      ('SK', 'medical_limited_trade',  'SK medical'),
      ('HU', 'medical_limited_trade',  'HU medical'),
      ('BG', 'medical_limited_trade',  'BG medical'),
      ('RS', 'medical_limited_trade',  'RS medical'),
      ('PT', 'legal_commercial_access','Legend: lawful cross-border commercial pathway in operation'),
      ('IL', 'legal_commercial_access','Legend: lawful cross-border commercial pathway in operation'),
      ('TR', 'cbd_hemp_only',          'Legend: hemp/CBD pathway; cannabis otherwise restricted'),
      ('UA', 'cbd_hemp_only',          'Legend: hemp/CBD pathway; cannabis otherwise restricted'),
      ('RO', 'cbd_hemp_only',          'Legend: hemp/CBD pathway; cannabis otherwise restricted')
    ) as accepted(iso, tier, note)
  loop
    if exists (
      select 1
      from public.countries c
      where c.iso_alpha2 = r.iso
        and c.regulatory_tier is not distinct from r.tier
        and c.regulatory_tier_origin = 'override'
        and c.regulatory_tier_needs_review = false
        and c.regulatory_tier_rationale is not distinct from r.note
    ) then
      continue;
    end if;

    perform api.set_regulatory_tier(r.iso, r.tier, 'ops-eu', r.note);
  end loop;
end $$;
