-- Recovery-only replay foundation.
-- Production's countries relation exposed jurisdiction_level before
-- 20260923001000_full_depth_dynamic_evaluator.sql, but no canonical repository
-- migration creates that column on a zero-state rebuild. This file exists only
-- on the recovery branch for reconstructing the replacement Supabase project.

alter table public.countries
  add column if not exists jurisdiction_level text;

update public.countries
set jurisdiction_level = case
  when iso_alpha2 ~ '^[A-Z]{2}-[A-Z0-9]{2,4}$' then 'subnational'
  else 'national'
end
where jurisdiction_level is null;
