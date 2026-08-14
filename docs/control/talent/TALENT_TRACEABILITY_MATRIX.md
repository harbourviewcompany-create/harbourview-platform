# Talent Traceability Matrix

Hardening control: CTL-001. Scope: TAL-001–TAL-100; acceptance: TAC-001–TAC-050.

A capability cannot become `VERIFIED` unless every required cell below is populated or marked `N/A:<reason>` through accepted change control.

Columns: TAL ID | architecture/control docs | implementation files/migrations | API/RPC | DTO/view | RLS/auth | tests | acceptance IDs | evidence artifact | implementation SHA | independent verification SHA | status.

The pre-runtime matrix intentionally leaves implementation-specific cells `TBD`; this is not a deficiency and must not be misreported as VERIFIED.

| TAL range | Required controlling documents | Minimum acceptance links | Pre-runtime status |
|---|---|---|---|
| TAL-001–008 | ENTITY_MODEL, IDENTITY_RESOLUTION, EVIDENCE_PROVENANCE | TAC-002,003,036 | APPROVED |
| TAL-009–015 | TAXONOMY_CONTROL, EVIDENCE_PROVENANCE | TAC-004,005,037 | APPROVED |
| TAL-016–022 | EMPLOYER_AUTHORITY, RLS_MATRIX, ENTITLEMENTS | TAC-006,007,038 | APPROVED |
| TAL-023–038 | JOB_REQUISITION_MODEL, SOURCE_GOVERNANCE, MIGRATION_PLAN | TAC-008–012,039 | APPROVED |
| TAL-039–050 | PASSPORT_CREDENTIAL_MODEL, PRIVACY_CONSENT | TAC-013–016,040 | APPROVED |
| TAL-051–058 | PRIVACY_CONSENT, RETENTION_DATA_RIGHTS, RLS_MATRIX | TAC-017–020,041 | APPROVED |
| TAL-059–064 | SEARCH_CONTRACT, SEARCH_EVALUATION | TAC-021–023,042 | APPROVED |
| TAL-065–068 | MATCH_ELIGIBILITY | TAC-024,025,043 | APPROVED |
| TAL-069–078 | APPLICATION_DOCUMENT_MODEL, TEST_MATRIX | TAC-026–029,044 | APPROVED |
| TAL-079–084 | LEGACY_COMPATIBILITY, CUTOVER_ROLLBACK | TAC-030–032,045 | APPROVED |
| TAL-085–093 | TRUST_SAFETY, RETENTION_DATA_RIGHTS, PERFORMANCE_OBSERVABILITY | TAC-033–035,046–048 | APPROVED |
| TAL-094–100 | DEPENDENCY_GRAPH, OPERATIONS_RUNBOOK, RELEASE_CHECKLIST | TAC-049,050 | phase-dependent |

Runtime implementation must expand this table to one row per TAL ID before any capability is marked `IMPLEMENTED_UNVERIFIED`. Independent verifier must reject any implementation where a TAL row lacks implementation SHA or verification SHA.