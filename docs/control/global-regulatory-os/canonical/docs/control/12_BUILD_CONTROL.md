# Build Control

## Change unit

Every implementation change identifies:

- Ticket and epic.
- Bounded context and owner.
- Data classification.
- API/event/schema changes.
- Migrations and backfill.
- Source-rights impact.
- AI/model impact.
- Security/privacy impact.
- Verification evidence.
- Rollback or roll-forward path.

## Required pull-request gates

1. Scope and affected contracts declared.
2. Architecture decision referenced or new ADR approved.
3. Database migration reviewed by data owner.
4. Authorization and leakage tests added for new fields/routes.
5. API and event compatibility checks pass.
6. Data-quality rules added for new canonical values.
7. Model/prompt evaluation attached when affected.
8. Domain reviewer approves regulated logic.
9. Operational dashboards and alerts updated.
10. Release evidence and GO/HOLD completed.

## Prohibited release states

- Placeholder evidence on production claims.
- Unreviewed high-risk model output.
- Direct public serialization of canonical rows.
- Undocumented source or redistribution rights.
- Destructive migration without rehearsed recovery.
- Canonical value duplicated in another editable store.
- Fixed relative-time prose.
- Missing tenant or classification tests.
- “Global” coverage claims not backed by the coverage registry.

## Branch and environment control

Main remains releasable. Feature flags protect incomplete capabilities. Development may use synthetic data only. Staging uses sanitized or explicitly approved sources. Production writes, migrations, source imports and public releases require distinct permissions and recorded evidence.
