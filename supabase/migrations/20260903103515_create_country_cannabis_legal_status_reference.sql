-- Reconstructed from production. Applied directly, never committed.
-- Verbatim statements for version 20260903103515.

create table if not exists public.country_cannabis_legal_status (
  iso2 text primary key,
  country_name text not null,
  legal_status text not null check (legal_status in (
    'recreational_retail',      -- true commercial recreational retail market
    'recreational_noncommercial', -- personal possession/home-grow/social clubs, no open retail
    'medical_only',              -- prescription-based medical program
    'cbd_hemp_only',              -- only low-THC/CBD products permitted
    'prohibited',                 -- cannabis illegal, no legal framework
    'unresearched'                -- not yet individually verified this pass
  )),
  notes text,
  last_reviewed date not null default current_date
);

comment on table public.country_cannabis_legal_status is
  'Country-level cannabis legal framework classification (NOT per-SKU packaging compliance -- see listings.compliance_flags for that, which currently only exists for CA). Populated from a general research pass, not individually verified per-country the way CA/DE/AU packaging rules were. Most of the ~195 ISO2 codes not present here default to unresearched in application logic, not assumed-prohibited or assumed-legal.';
