-- Final entries from the missing-grant audit series (20260729000000,
-- 20260729010000, 20260729020000). regulatory_signals.sources and
-- regulatory_signals.source_snapshots both have api-schema views already
-- granting anon/authenticated SELECT, but the underlying base tables
-- (in the separate `regulatory_signals` Postgres schema) never got the
-- matching grant -- same shape as every prior fix in this series.
--
-- Both tables' RLS already correctly restricts to admin/operator roles
-- (source_snapshots: admin or operator; sources: admin only), so granting
-- SELECT broadly here is safe -- RLS blocks every non-admin/operator role
-- regardless of the grant, this purely restores what the pre-existing
-- api-schema view grants already implied was intended.

grant select on regulatory_signals.sources to anon, authenticated;
grant select on regulatory_signals.source_snapshots to anon, authenticated;
