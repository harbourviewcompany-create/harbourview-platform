-- Recovery reconstruction: canonical authority-to-dimension source bindings.
create table if not exists public.jurisdiction_data_depth_authority_bindings (
  jurisdiction_key text not null references public.countries(iso_alpha2) on delete cascade,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on delete cascade,
  contract_version text not null default '2026-09-23.v2',
  source_registry_id uuid not null references public.source_registry(id) on delete restrict,
  authority_url text not null,
  expected_snapshot_sha256 text,
  binding_status text not null default 'bound'
    check (binding_status in ('bound','snapshot_mismatch','expired','invalid')),
  bound_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (jurisdiction_key, dimension_key, contract_version)
);

alter table public.jurisdiction_data_depth_authority_bindings enable row level security;

drop policy if exists "full depth authority bindings read"
  on public.jurisdiction_data_depth_authority_bindings;
create policy "full depth authority bindings read"
  on public.jurisdiction_data_depth_authority_bindings
  for select to authenticated using (true);

revoke insert, update, delete, truncate
  on public.jurisdiction_data_depth_authority_bindings
  from anon, authenticated;
