-- Europe-focused regulatory tier reconciliation.
-- Production correction was applied manually on 2026-08-29 via api.set_regulatory_tier
-- with actor ops-eu (audit ids 76-105). This migration records the approved state
-- for repository replay without duplicating audit rows when production already matches.
--
-- Release-safety contract:
--   * preserve the approved tier assignments and rationales exactly;
--   * use api.set_regulatory_tier so override/audit semantics remain canonical;
--   * skip rows already at the approved reviewed override state;
--   * future api.reclassify_auto_tiers runs cannot touch these rows because it
--     operates only on regulatory_tier_origin = 'auto' or null.

do $$
declare
  r record;
begin
  for r in
    select *
    from (values
      ('NL', 'domestic_only',          'NL coffee-shop domestic'),
      ('ES', 'domestic_only',          'ES clubs/medical limited export'),
      ('MT', 'domestic_only',          'MT association model'),
      ('LU', 'domestic_only',          'LU limited domestic'),
      ('DE', 'medical_limited_trade',  'DE medical + limited clubs'),
      ('FR', 'medical_limited_trade',  'FR medical'),
      ('IT', 'medical_limited_trade',  'IT medical'),
      ('GB', 'medical_limited_trade',  'UK Schedule 2 medical'),
      ('IE', 'medical_limited_trade',  'IE medical'),
      ('AT', 'medical_limited_trade',  'AT medical'),
      ('BE', 'medical_limited_trade',  'BE medical'),
      ('CH', 'medical_limited_trade',  'CH medical'),
      ('DK', 'medical_limited_trade',  'DK medical'),
      ('SE', 'medical_limited_trade',  'SE medical'),
      ('NO', 'medical_limited_trade',  'NO medical'),
      ('FI', 'medical_limited_trade',  'FI medical'),
      ('PL', 'medical_limited_trade',  'PL medical'),
      ('CZ', 'medical_limited_trade',  'CZ medical'),
      ('GR', 'medical_limited_trade',  'GR medical'),
      ('HR', 'medical_limited_trade',  'HR medical'),
      ('SI', 'medical_limited_trade',  'SI medical'),
      ('SK', 'medical_limited_trade',  'SK medical'),
      ('HU', 'medical_limited_trade',  'HU medical'),
      ('BG', 'medical_limited_trade',  'BG medical'),
      ('RS', 'medical_limited_trade',  'RS medical'),
      ('PT', 'legal_commercial_access','PT EU medical trade'),
      ('IL', 'legal_commercial_access','IL medical export'),
      ('TR', 'cbd_hemp_only',          'TR hemp'),
      ('UA', 'cbd_hemp_only',          'UA hemp'),
      ('RO', 'cbd_hemp_only',          'RO hemp')
    ) as approved(iso, tier, note)
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
