-- Security hardening: the dimension contract is public metadata, not a public-write surface.
-- Preserve read access while preventing client-side mutation.
alter table public.jurisdiction_data_depth_dimensions enable row level security;

drop policy if exists jurisdiction_data_depth_dimensions_read on public.jurisdiction_data_depth_dimensions;
create policy jurisdiction_data_depth_dimensions_read
on public.jurisdiction_data_depth_dimensions
for select
to anon, authenticated
using (true);

revoke insert, update, delete, truncate
on public.jurisdiction_data_depth_dimensions
from anon, authenticated;

grant select on public.jurisdiction_data_depth_dimensions
to anon, authenticated;

comment on table public.jurisdiction_data_depth_dimensions is
  'Contract metadata for the Harbourview jurisdiction data-depth model. Client-readable; client-write access is prohibited.';
