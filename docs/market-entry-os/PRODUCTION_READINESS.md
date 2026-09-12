# Market Entry OS — Production Readiness Contract

## Implemented in this release

The Market Entry OS is now a durable execution boundary rather than a report-only composition layer.

- A canonical plan builder calls the corridor intelligence planner once and derives all downstream outputs from that snapshot.
- Regulatory readiness is fail-closed: missing, stale, unverified, or non-primary evidence cannot become an executable plan.
- Evidence is snapshotted with a deterministic hash and freshness window so a plan can be reproduced against the same source state.
- Product class is explicit (`flower`, `extract`, `finished_product`, `starting_material`, or `any`).
- Workflow steps are converted into a dependency graph with prerequisite validation and critical-path calculation.
- Cost output distinguishes structured numeric ranges from unknown/unstructured costs and does not present an editorial range as a quote.
- Authenticated mission workspaces persist the plan snapshot, evidence snapshot, tasks, reproducibility key, and audit events.
- Mission and task tables use owner-scoped RLS with FORCE ROW LEVEL SECURITY and no anonymous grants.
- API input is authenticated and invalid inputs fail closed.

## Readiness semantics

`ready` means all readiness gates pass with no warnings. It does **not** mean Harbourview is granting regulatory approval.

The current `jurisdiction_playbooks` contract exposes verification timestamps and regulator names but does not attach primary-source URLs, effective dates, or claim-level evidence. Consequently, plans generated from that contract are intentionally `orientation` or `blocked`, not executable. This is a deliberate safety property.

To make a corridor executable, the evidence contract must be upgraded so every material regulatory claim has:

1. authoritative source name;
2. authoritative URL or document identifier;
3. effective date;
4. retrieval date;
5. last verified date;
6. product-class scope;
7. jurisdiction scope;
8. evidence status;
9. expiry/freshness policy;
10. immutable content hash.

## Still required before production GO

These are release gates, not silently deferred implementation:

- Apply and verify `20260912130000_market_entry_os_mission_workspace.sql` in the production Supabase project.
- Run the full migration replay/drift suite against the resulting repository and production ledger.
- Populate claim-level authoritative evidence for each supported corridor/product combination before marking plans executable.
- Add a production UI mission workspace after the API/data contract is accepted; the backend is deliberately not coupled to a guessed UI.
- Wire one-time Stripe Checkout to a persisted mission/report identifier before charging customers. No payment endpoint is exposed by this release.
- Complete production provider verification (Vercel, Supabase, GitHub Actions) and the repository's security/visibility suites.
- Resolve the known Wrangler → Miniflare → sharp dependency chain using a registry-generated lockfile update; no hand-edited lockfile is accepted as proof.

## Non-goals

- No automated regulatory advice.
- No fabricated source citations.
- No public exposure of private counterparties or commercial terms.
- No production database mutation from this PR.
- No claim that an orientation plan is a legal authorization, permit, licence, or customs clearance.
