-- Batch 2: legend-aligned live tier corrections + auto reclassify
-- Use set_regulatory_tier so audit trail is preserved.

-- Medical markets (lawful medical; limited/no full commercial cross-border)
do $$
declare iso text;
begin
  foreach iso in array array[
    'AR',  -- Argentina medical
    'TH',  -- Thailand medical
    'NZ',  -- New Zealand medical
    'JP',  -- Japan limited medical/pharma
    'MX',  -- Mexico medical / limited
    'PE',  -- Peru medical
    'CL',  -- Chile medical
    'CH',  -- Switzerland medical / limited
    'NO',  -- Norway medical
    'FI',  -- Finland medical
    'IE',  -- Ireland medical
    'AT',  -- Austria medical
    'BE',  -- Belgium medical
    'DK',  -- Denmark medical
    'SE'   -- Sweden medical (narrow)
  ]
  loop
    begin
      perform api.set_regulatory_tier(
        iso, 'medical_limited_trade', 'ops-batch2',
        'Legend: lawful medical market; narrow or no commercial cross-border route'
      );
    exception when others then null;
    end;
  end loop;
end $$;

-- Commercial / export leaders
do $$
declare iso text;
begin
  foreach iso in array array[
    'UY',  -- Uruguay adult-use commercial
    'CO',  -- Colombia export leader
    'IL',  -- Israel medical export ecosystem
    'PT',  -- Portugal medical + EU trade pathways
    'DK'   -- if export licences active; else medical already set above — last write wins; prefer medical for DK
  ]
  loop
    begin
      perform api.set_regulatory_tier(
        iso, 'legal_commercial_access', 'ops-batch2',
        'Legend: lawful cross-border commercial pathway in operation'
      );
    exception when others then null;
    end;
  end loop;
end $$;

-- Revert DK to medical (safer default; export not general commercial access)
do $$
begin
  perform api.set_regulatory_tier(
    'DK', 'medical_limited_trade', 'ops-batch2',
    'Denmark: medical pathway; not general commercial access'
  );
exception when others then null;
end $$;

-- Domestic-only adult-use / club models (no full cross-border commercial)
do $$
declare iso text;
begin
  foreach iso in array array[
    'MT',  -- Malta associations / limited
    'NL',  -- coffee-shop domestic
    'ES'   -- clubs / medical; limited export
  ]
  loop
    begin
      perform api.set_regulatory_tier(
        iso, 'domestic_only', 'ops-batch2',
        'Legend: legal internally; no full lawful cross-border commercial route'
      );
    exception when others then null;
    end;
  end loop;
end $$;

-- Hemp / CBD only
do $$
declare iso text;
begin
  foreach iso in array array['TR', 'CN', 'UA', 'RO']
  loop
    begin
      perform api.set_regulatory_tier(
        iso, 'cbd_hemp_only', 'ops-batch2',
        'Legend: hemp/CBD pathway; cannabis otherwise restricted'
      );
    exception when others then null;
    end;
  end loop;
end $$;

-- Reclassify remaining auto-origin rows from briefings
select * from api.reclassify_auto_tiers('ops-batch2');

-- Flag suspicious greens for review (do not auto-green without briefing)
update public.countries set
  regulatory_tier_needs_review = true
where iso_alpha2 in ('ET', 'GR', 'KE', 'UG', 'ZW')
  and regulatory_tier = 'legal_commercial_access';