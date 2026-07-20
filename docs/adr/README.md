# Architecture Decision Records (ADR)

> **Status: SCAFFOLD (structure only).** This is the new permanent home for the
> numbered ADR log currently embedded in `HANDOFF.md > DECISIONS (ADR)`.
> The verbatim ADR entries have intentionally NOT been moved yet, to avoid
> dropping or truncating any decision during the split (the source table is
> large — 21+ entries). Until migrated and reviewed, **`HANDOFF.md` remains
> the source of truth for ADRs #1–#21+.**

## Why ADRs live separately from HANDOFF.md
`HANDOFF.md` mixes volatile current-state (status board, session log) with
permanent decisions. The status content rots weekly; ADRs must not. Splitting
them keeps the permanent record stable and reduces merge conflicts on the
large monolithic file.

## Convention going forward
- One decision per numbered entry, append-only. Never re-number.
- "Do not re-litigate without new information" (carried over from HANDOFF.md).
- Recommended: one file per ADR (`docs/adr/0001-title.md`) once migrated, or a
  single `docs/adr/LOG.md` — decide during the migration PR.

## Migration checklist (do in review, not in this scaffold commit)
- [ ] Copy ADR #1 through the latest entry verbatim from HANDOFF.md
- [ ] Confirm count matches (no truncated/dropped entries)
- [ ] Replace HANDOFF.md's ADR table with a pointer to this directory
- [ ] Reconcile the ADR #16 vs #18 conflict on GitHub PAT access path
- [ ] Add EVIDENCE_LOG.md entry per AGENTS.md

See also: `AGENTS.md`, `docs/DO_NOT_TOUCH.md`

