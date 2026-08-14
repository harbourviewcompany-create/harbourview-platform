# Talent Entitlements

Anchors: TAL-022, TAL-076–078, TAL-097–099; CTL-012.

Stable capability keys include: `talent.jobs.search`, `talent.jobs.save`, `talent.jobs.apply`, `talent.passport.manage`, `talent.people.search`, `talent.people.identity_reveal`, `talent.people.contact`, `talent.jobs.post`, `talent.requisitions.manage`, `talent.hiring.manage`, `talent.analytics.read`, `talent.export`, `talent.api.access`.

The resolver is server-side and combines account/workspace/Talent role, recruiter/agency authority, assignment and product entitlement. P0 freezes capability semantics without speculating about pricing plans.

Bulk operations and exports have separate capability/limits from single-record access. Entitlements cannot override candidate privacy, consent, employer blocks or RLS.

Capacity/cost instrumentation (CTL-012) records usage by capability so future commercial packaging does not require authorization redesign.