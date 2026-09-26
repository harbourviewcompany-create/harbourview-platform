-- HISTORICAL RECOVERY ARTIFACT
-- Production migration version: 20260925120408
-- Recovered verbatim from production supabase_migrations.schema_migrations.statements.
-- DO NOT REPLAY: archival source only.


create table if not exists public.jurisdiction_data_depth_authority_bindings (
  jurisdiction_key text not null references public.countries(iso_alpha2) on delete cascade,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on delete cascade,
  contract_version text not null default '2026-09-23.v2',
  source_registry_id uuid not null references public.source_registry(id) on delete restrict,
  authority_url text not null,
  expected_snapshot_sha256 text,
  binding_status text not null default 'bound' check (binding_status in ('bound','snapshot_mismatch','expired','invalid')),
  bound_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (jurisdiction_key, dimension_key, contract_version)
);

alter table public.jurisdiction_data_depth_authority_bindings enable row level security;
drop policy if exists "full depth authority bindings read" on public.jurisdiction_data_depth_authority_bindings;
create policy "full depth authority bindings read" on public.jurisdiction_data_depth_authority_bindings for select to authenticated using (true);
revoke insert, update, delete, truncate on public.jurisdiction_data_depth_authority_bindings from anon, authenticated;

insert into public.jurisdiction_data_depth_authority_bindings
(jurisdiction_key,dimension_key,contract_version,source_registry_id,authority_url,expected_snapshot_sha256,binding_status)
select
 p.jurisdiction_iso2,
 d.dimension_key,
 '2026-09-23.v2',
 s.id,
 p.authority_url,
 lower(p.source_snapshot_sha256),
 case when p.expires_at > now() and p.source_snapshot_sha256 ~ '^[0-9a-fA-F]{64}$' then 'bound' else 'invalid' end
from public.regulatory_market_access_primary_sources p
join public.source_registry s on s.source_url=p.authority_url and s.is_active and s.crawl_allowed
cross join public.jurisdiction_data_depth_dimensions d
where p.authority_url like 'https://%'
on conflict (jurisdiction_key,dimension_key,contract_version) do update
set source_registry_id=excluded.source_registry_id,
    authority_url=excluded.authority_url,
    expected_snapshot_sha256=excluded.expected_snapshot_sha256,
    binding_status=excluded.binding_status,
    updated_at=now();

update public.jurisdiction_data_depth_capture_jobs j
set source_registry_id=b.source_registry_id,
    status='queued',
    last_error=null,
    updated_at=now()
from public.jurisdiction_data_depth_authority_bindings b
where b.jurisdiction_key=j.jurisdiction_key
  and b.dimension_key=j.dimension_key
  and b.contract_version=j.contract_version
  and b.binding_status='bound'
  and j.contract_version='2026-09-23.v2'
  and j.status='blocked';

