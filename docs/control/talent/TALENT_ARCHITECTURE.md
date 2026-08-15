# Talent Architecture

Capability anchors: TAL-001–TAL-100. Hardening anchors: CTL-001, CTL-002, CTL-007–CTL-010, CTL-015–CTL-020, CTL-024.

Canonical flow:
`Identity → assertions/evidence → permissions → JobOpportunity/Passport → authorized search → eligibility/matching → application/hiring workflow → intelligence`.

Bounded domains:
1. Identity: TAL-001–008.
2. Taxonomy/reference: TAL-009–011, TAL-089.
3. Assertions/evidence/conflict: TAL-012–015.
4. Employer authority/entitlements: TAL-016–022.
5. Requisitions/jobs/source governance: TAL-023–038.
6. Passport/credential/mobility: TAL-039–050.
7. Privacy/consent/data rights: TAL-051–058.
8. Search: TAL-059–064.
9. Match/eligibility: TAL-065–068.
10. Applications/documents: TAL-069–078.
11. Compatibility/cutover: TAL-079–084.
12. Trust/lifecycle/operations: TAL-085–093, TAL-100.
13. P1/P2 extensions: TAL-094–099.

Architectural invariants:
- `workspaces` remains canonical Harbourview-managed organization identity; source organizations map to it only when proven.
- `talent_people` is durable human identity; application/candidate rows never substitute for it.
- `talent_job_opportunities` is canonical job identity; source rows/snapshots remain immutable lineage.
- `hv_professionals` migrates/projections into Passport compatibility without invented credential facts.
- authorization precedes candidate retrieval/ranking, including vector search.
- raw evidence/contact/application/employer notes never become public/search DTOs by column passthrough.
- privacy changes are enforced query-time even while asynchronous indexes/caches converge.
- every material job requirement/match uses versioned inputs.
- cutover uses dark deploy/backfill/shadow comparison/controlled read switch rather than one-step replacement (`CTL-007`).