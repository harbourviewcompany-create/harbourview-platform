# Talent Release Checklist

Anchors: TAC-001–TAC-050; CTL-001–CTL-025.

## Runtime P0 start
GO only when:
- all manifest files exist;
- TAL/TAC/CTL IDs are unique/stable and ranges match manifest;
- internal references resolve;
- branch diff remains documentation-only;
- scope ledger retains TAL-001–084 and approved expansions;
- no open decision blocks the first implementation gate.

## Production GO
Requires evidence for architecture integrity, schema/migration replay, legacy/backfill reconciliation, RLS/authorization, privacy/leakage, identity reversal, source rights/freshness, search quality, semantic isolation, match reproducibility/invalidation, application/document integrity, audit/moderation/retention, accessibility, performance/SLO, observability, cutover/shadow/rollback, restore, secret lifecycle, production-safe verification and independent traceability reconciliation.

Any critical failed or missing-evidence item is HOLD. `IMPLEMENTED_UNVERIFIED` is HOLD. Explicitly deferred P1/P2 scope does not block P0 only when its required P0 foundation is VERIFIED.

Independent verifier (`CTL-024`) must search for: remaining production `JOB_LISTINGS` usage; direct generalized reads from protected legacy tables; missing RLS; stale compatibility paths; dead/new schema with no consumer; mock-only acceptance tests; undocumented API surfaces; untraced TAL rows; unsafe derivative data; and control-pack drift.