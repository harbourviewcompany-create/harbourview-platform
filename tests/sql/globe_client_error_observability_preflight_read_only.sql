-- Zero rows means GO. This is read-only and runs before production activation.

select 'missing_client_error_reports_table'
where to_regclass('public.client_error_reports') is null;

select 'unexpected_existing_boundary:' || boundary
from public.client_error_reports
where boundary not in ('country_role', 'global', 'admin', 'globe')
group by boundary
order by boundary;
