-- Keep durable client-error telemetry aligned with the application boundary
-- contract. The original table constraint allowed only country_role/global,
-- while the application already emitted admin errors. The globe render
-- boundary now reports failures too so WebGL/Three.js crashes are diagnosable
-- without taking down the landing shell.

alter table public.client_error_reports
  drop constraint if exists client_error_reports_boundary_check;

alter table public.client_error_reports
  add constraint client_error_reports_boundary_check
  check (boundary in ('country_role', 'global', 'admin', 'globe'))
  not valid;

alter table public.client_error_reports
  validate constraint client_error_reports_boundary_check;
