
-- Internal research queue: no anon/authenticated business reading it. service_role (workers) unaffected.
revoke select on public.local_intel_next_batch   from anon, authenticated;
-- Internal coverage/ops metrics (source_count, review tiers): drop anon. Keep authenticated for internal dashboards.
revoke select on public.platform_coverage_summary from anon;
