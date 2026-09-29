-- Zero rows means GO. Verify the durable boundary constraint after activation.

with boundary_constraint as (
  select pg_get_constraintdef(c.oid) as definition
  from pg_constraint c
  where c.conrelid = 'public.client_error_reports'::regclass
    and c.conname = 'client_error_reports_boundary_check'
    and c.contype = 'c'
)
select 'missing_boundary_constraint'
where not exists (select 1 from boundary_constraint)
union all
select 'constraint_missing_country_role'
where not exists (
  select 1 from boundary_constraint where definition like '%country_role%'
)
union all
select 'constraint_missing_global'
where not exists (
  select 1 from boundary_constraint where definition like '%global%'
)
union all
select 'constraint_missing_admin'
where not exists (
  select 1 from boundary_constraint where definition like '%admin%'
)
union all
select 'constraint_missing_globe'
where not exists (
  select 1 from boundary_constraint where definition like '%globe%'
);
