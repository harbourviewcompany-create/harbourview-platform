# DO NOT TOUCH — Operational Constraints

> **Status: SCAFFOLD (structure only).** This file is the new home for the
> "DO NOT TOUCH" rules currently living in `HANDOFF.md`. The verbatim rule text
> has intentionally NOT been moved yet, to avoid silently dropping or corrupting
> any rule during the split. Until the content migration is reviewed and merged,
> **`HANDOFF.md` remains the source of truth.**

## Purpose
Permanent, low-churn operational constraints that must survive across sessions.
These are "policy, not preference" rules — several exist because they were
violated in practice.

## Rules to migrate here (from HANDOFF.md > DO NOT TOUCH)
1. `supplier_profiles` — do not seed, do not delete rows (archive-only)
2. Concurrent session output — verify before building on it
3. `applicationsQuery.ts` — verify exports before editing
4. `public-assets` storage bucket — do not modify RLS
5. `app/intelligence/licensing-pathways`, `logistics-trade-routes`, and 7
   HAR-39/HAR-40 routes — do not retire to Command Centre redirects

## Migration checklist (do in review, not in this scaffold commit)
- [ ] Copy each rule's full verbatim text from HANDOFF.md into this file
- [ ] Diff old vs new to confirm zero content loss
- [ ] Replace the HANDOFF.md section with a one-line pointer to this file
- [ ] Add EVIDENCE_LOG.md entry per AGENTS.md

See also: `AGENTS.md`, `docs/adr/README.md`

