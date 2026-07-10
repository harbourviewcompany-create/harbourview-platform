-- Reclassify the 4 countries with a lawful hemp/CBD regime but prohibited
-- cannabis, from 'prohibited' to 'cbd_hemp_only'. Rationale drawn from each
-- country's own briefing text. Reviewed_at stays NULL (pending human review).
--
-- China    - world's largest licensed industrial hemp producer/exporter; CBD a
--            regulated cosmetic ingredient.
-- Turkiye  - provinces designated for hemp; regulated low-THC CBD framework;
--            hemp identified as strategic export crop.
-- Moldova  - industrial hemp cultivation permitted, aligned with EU standards.
-- India    - industrial hemp selectively licensed (Uttarakhand and others) for
--            fibre and seed.
--
-- Bosnia (informal retail, no legal clarity) and Taiwan (research only, no
-- licensed market) were reviewed and deliberately LEFT as 'prohibited'.

update public.countries set
  regulatory_tier = 'cbd_hemp_only',
  regulatory_tier_source = 'cc_jurisdiction_briefings (CBD/hemp review 2026-07-10, pending review)',
  regulatory_tier_rationale = case iso_alpha2
    when 'CN' then 'Cannabis (THC) prohibited, but China is the world''s largest licensed industrial hemp producer/exporter; CBD clarified as a cosmetic ingredient (2019).'
    when 'TR' then 'Cannabis prohibited, but provinces are designated for hemp cultivation under a regulated framework; low-THC CBD available; hemp identified as a strategic export crop.'
    when 'MD' then 'Cannabis prohibited, but industrial hemp cultivation is permitted under regulations aligned with EU standards.'
    when 'IN' then 'Recreational cannabis prohibited, but industrial hemp is selectively licensed (Uttarakhand and other states) for fibre and seed.'
  end
where iso_alpha2 in ('CN','TR','MD','IN');
