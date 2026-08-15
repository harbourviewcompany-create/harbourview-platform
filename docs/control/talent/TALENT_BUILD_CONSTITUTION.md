# Talent Build Constitution

Applies to `TAL-001`–`TAL-100`; acceptance is governed by `TAC-001`–`TAC-050` and hardening controls `CTL-001`–`CTL-025`.

## Non-disappearance rule
No approved capability may be removed, merged away, weakened, silently deferred or reinterpreted during implementation. A deferred capability remains in `TALENT_SCOPE_LEDGER.md` with its dependency, P0 foundation, tests, evidence obligation and phase.

## Status vocabulary — CTL-003
Only these ledger statuses are valid: `APPROVED`, `FOUNDATION_REQUIRED`, `NOT_STARTED`, `IN_PROGRESS`, `IMPLEMENTED_UNVERIFIED`, `VERIFIED`, `DEFERRED_P1`, `DEFERRED_P2`, `BLOCKED`, `SUPERSEDED`, `REJECTED`.

`VERIFIED` is release-significant. `IMPLEMENTED_UNVERIFIED` never satisfies a release gate.

## Traceability gate — CTL-001
No `TAL-*` may become `VERIFIED` without complete traceability in `TALENT_TRACEABILITY_MATRIX.md` to:
1. implementation files/migrations;
2. API/RPC and DTO/view contract where applicable;
3. RLS/authorization contract;
4. positive, negative and leakage tests;
5. acceptance criteria;
6. evidence artifact;
7. implementation SHA;
8. independent verification SHA;
9. explicit N/A justification for genuinely non-applicable cells.

## Change control — CTL-002
Any scope removal, semantic weakening, phase movement, RLS relaxation, privacy change, canonical-entity change, compatibility change or acceptance-criterion change requires `TALENT_CHANGE_CONTROL.md` before implementation.

## Decision authority — CTL-004/005
Material implementation choices are recorded in `TALENT_DECISION_LOG.md`. Unresolved choices that can alter correctness, architecture, permissions, privacy, cost, production behavior or irreversible data state remain open in `TALENT_OPEN_DECISIONS.md`; implementation does not silently choose.

## Release posture
Runtime P0 can start only after the documentation pack passes manifest/file/ID/reference/scope verification. Production GO additionally requires `TALENT_RELEASE_CHECKLIST.md` and independent final verification `CTL-024`.