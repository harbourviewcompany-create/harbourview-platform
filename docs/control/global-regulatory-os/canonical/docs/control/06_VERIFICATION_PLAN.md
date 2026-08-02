# Verification Plan

## Layers

Static contract validation; unit tests; property/invariant tests; migration and RLS tests; connector/parser fixtures; event and API contract tests; workflow replay/failure tests; AI evaluation and red-team tests; search relevance; end-to-end workflows; security/leakage; performance/resilience; backup/DR; domain-specialist acceptance; production smoke and monitoring.

## Core invariants

- Every published claim has evidence linked to an immutable snapshot.
- Current obligations reference effective source versions.
- Superseded obligations are excluded from current evaluations.
- Tenant records cannot cross tenant boundaries.
- Public projections cannot expose drafts, reviewer notes, customer data, privileged evidence or licensed restricted fields.
- Search cannot bypass authorization.
- Corridors are bound to product, purpose, parties, route, quantity and as-of date.
- Market totals reconcile or show an approved exception.
- AI high-risk output cannot publish without required approval.
- Relative dates are computed at runtime.
- Derived stores can be rebuilt from canonical data.

## Release evidence bundle

Commit/artifact IDs, SBOM, migration checksums, static analysis, unit/integration/E2E results, RLS matrix, public leakage probe, contract compatibility, AI evaluation, source freshness, security scans, performance baseline, UI screenshots where applicable, rollback/forward-fix plan and final GO/HOLD.
