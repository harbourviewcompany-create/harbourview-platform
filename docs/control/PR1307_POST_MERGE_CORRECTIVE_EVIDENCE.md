# PR #1307 Post-Merge Corrective Evidence

Date: 2026-08-10
Base main: `150c24eec7d76b9be7322ac0e6926134dcd17d6f`
Source incident: PR #1307 squash merge `11f0b3becdfea5306be6f5cdbefb5319850aa4c8`
Scope: repository-only marketplace media corrective work. No Supabase, production data, migration history, seed, Vercel production, rollout, or Edge Function changes are authorized by this packet.

## Review-thread reconciliation

The non-outdated PR #1307 review findings were revalidated against the base SHA before implementation.

### FIX

- Highest-ranked approved media could be selected before URL renderability was established, masking a lower-ranked renderable approved image.
- Optional media timeout did not abort the underlying request and did not preserve an explicit degraded enrichment state.
- Public-image query failures collapsed into the same empty result as legitimate no-image state.
- Country-role marketplace pages loaded legacy rows without the shared marketplace media projection.
- Representative/catalogue fallback strings were duplicated rather than sourced from a controlled marketplace-media copy contract.
- The authenticated visual workflow omitted the image-trust reconciliation and merge-readiness contract tests from its trigger/execution set.

### ALREADY FIXED ON BASE

- Non-evidence `MANUFACTURER_CATALOGUE` media is already represented as `catalogue`, not `actual`.
- Marketplace media is already keyed by `view + listing id`.
- Public image pagination already uses deterministic `image_role.asc,id.asc` ordering.
- Browser Supabase media URLs are already restricted to the public `marketplace-item-public` bucket.
- The marketplace source already has an explicit zero-row `isEmpty` classifier.
- The authenticated workflow already triggers for the core marketplace media implementation paths.
- The extracted live marketplace client module is already covered by the client-boundary security scan.

### OBSOLETE

- The old PR #1307 final-head evidence thread is superseded by this post-merge corrective PR and its own exact-head checks.
- Review findings anchored to removed per-card image routes or migration files are outside this corrective application scope and were already outdated in PR #1307.

## Implementation evidence

The corrective implementation reuses the previously isolated, focused patch logic represented by commit `407000fee182005cf3f7857552c53d3ccdd84b39`, which had passed `npx tsc --noEmit` and 46 focused marketplace/dashboard/security tests before its original branch push was blocked by workflow-token permissions. This PR adds an explicit country-role regression assertion and preserves the later `main` history as its base.

Exact-head GitHub Actions, authenticated Playwright, build, security and preview results belong in the draft PR body so they can be updated without rewriting this historical evidence document.
