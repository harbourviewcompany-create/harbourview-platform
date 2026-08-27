# Intel freshness repair findings

- Mobile Intel currently renders session/SSR signals first and replaces them after `/api/dashboard/signals` resolves.
- Weekly Signals orders contextual rows first but otherwise preserves API order.
- `/api/dashboard/signals` orders by confidence before date and has no true event/source freshness cutoff.
- Existing `useDashboardSignalsRealtime` provides a country-scoped no-store refresh + Realtime INSERT subscription but is not wired into the mobile Intel model.
- `PersonalBriefingSection` only uses `/api/dashboard/my-briefings` to hydrate cadence controls; the returned personal/synth/static briefing payload is ignored by the mobile surface.
- `jurisdiction_briefings` production data has not been regenerated since 2026-06-18.
- The current production deployment predates the `synthesize-jurisdictions` schedule now present on main; later production deployments are blocked by TypeScript errors in `components/admin/AdminControlShell.tsx`.
