# Talent Change Control

Controls: CTL-002, CTL-004, CTL-005. Applies to TAL-001–TAL-100 and TAC-001–TAC-050.

A change record is mandatory before any: capability removal/merge; semantic narrowing; P0 foundation deferral; phase movement; canonical entity change; RLS relaxation; privacy/disclosure change; source-rights relaxation; compatibility retirement; acceptance-criterion weakening; traceability N/A designation affecting a material control.

Required amendment record:
- `TCHG-###` ID and date;
- proposed exact change;
- affected TAL/TAC/CTL IDs;
- reason and evidence;
- alternatives considered;
- data/migration/backfill impact;
- API/DTO/RLS/privacy impact;
- tests/evidence requiring update;
- reversibility/rollback;
- approval state: `PROPOSED|APPROVED|REJECTED|SUPERSEDED`;
- implementation SHA if executed.

No implementation agent may approve its own material scope relaxation by merely editing the control pack. Unapproved changes keep runtime/release status HOLD.