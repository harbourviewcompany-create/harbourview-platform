-- Reconstructed from production. Verbatim statements for version 20260903103515.
--
-- Production applied this table creation on 2026-09-03 via Supabase MCP, which
-- writes a supabase_migrations.schema_migrations row and no repository file.
-- PR #1755 originally carried the same DDL under an invented version
-- (20260903100100), combined with the seed below. That would have left the
-- repository permanently out of correspondence with the live ledger in both
-- directions: two applied-not-committed versions in production and two
-- committed-not-applied versions here.
--
-- Committed at the real version instead. Body is byte-identical to
-- schema_migrations.statements[1] (1,199 bytes, md5
-- 11a093d94e6666ebd5cb890947dcf1e9), verified before write. Rewriting this file
-- cannot affect production: 20260903103515 is already recorded, so
-- `supabase db push` skips it.

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
