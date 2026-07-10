-- Adds a fifth regulatory tier: cannabis prohibited, but a lawful licensed
-- hemp / low-THC-CBD regime exists. These are genuine (if narrow) market-access
-- states — commodity hemp fibre/seed and CBD ingredients — that were previously
-- flattened into 'prohibited', hiding real commercial opportunity (e.g. China
-- is the world's largest industrial hemp producer/exporter).
--
-- Deliberately NARROW. A country only qualifies if the briefing affirmatively
-- describes a *lawful* hemp/CBD regime (licensed, regulated, permitted). Grey
-- markets ("informal retail without legal clarity" — Bosnia), research-only
-- interest (Taiwan), or mere aspiration ("shown some interest" — Kazakhstan)
-- do NOT qualify and stay 'prohibited'.

alter table public.countries
  drop constraint if exists countries_regulatory_tier_check;

alter table public.countries
  add constraint countries_regulatory_tier_check
  check (regulatory_tier is null or regulatory_tier in (
    'legal_commercial_access',
    'medical_limited_trade',
    'domestic_only',
    'cbd_hemp_only',
    'prohibited'
  ));

comment on column public.countries.regulatory_tier is
  'Reviewed regulatory access tier for globe colouring. NULL = unreviewed. One of: legal_commercial_access, medical_limited_trade, domestic_only, cbd_hemp_only, prohibited. Never derive from market_access_status/import_status/export_status (unsourced, contain false values).';
