-- State-aware internal operations view hardening.
-- Historical environments contain different subsets of these derived views.

-- The research queue is worker-only. No browser role receives direct access.
do $local_intel_queue_hardening$
begin
  if to_regclass('public.local_intel_next_batch') is not null then
    revoke all privileges on table public.local_intel_next_batch
      from public, anon, authenticated;
    grant select on table public.local_intel_next_batch to service_role;
  end if;
end
$local_intel_queue_hardening$;

-- Platform coverage contains operational source/review metrics. It is available
-- to authenticated internal dashboards and service workers, but not guests.
do $platform_coverage_hardening$
begin
  if to_regclass('public.platform_coverage_summary') is not null then
    revoke all privileges on table public.platform_coverage_summary
      from public, anon, authenticated;
    grant select on table public.platform_coverage_summary
      to authenticated, service_role;
  end if;
end
$platform_coverage_hardening$;
