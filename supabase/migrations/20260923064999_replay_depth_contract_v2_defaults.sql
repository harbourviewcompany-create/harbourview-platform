-- Recovery-only replay foundation.
-- The v2 full-depth control-plane migration uses CREATE TABLE IF NOT EXISTS.
-- On a replayed v1 schema that does not update existing column defaults, so
-- omitted contract_version values remain 2026-09-22.v1 and the v2 matrix stays
-- empty. Align the existing defaults before replaying the v2 migration.

alter table public.jurisdiction_data_depth_dimensions
  alter column contract_version set default '2026-09-23.v2';

alter table public.jurisdiction_data_depth_dimension_state
  alter column contract_version set default '2026-09-23.v2';
