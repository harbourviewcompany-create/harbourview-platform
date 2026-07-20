# DO NOT TOUCH — Operational Constraints

> **Status: ACTIVE.** This file is now the source of truth for the "DO NOT TOUCH" operational constraints. The verbatim rule text below was migrated from `HANDOFF.md` (see PR #1093 for the scaffold). The corresponding section in `HANDOFF.md` now points here.

## Purpose

Permanent, low-churn operational constraints that must survive across sessions. These are "policy, not preference" rules — several exist because they were violated in practice.

## Rules

### 1. `supplier_profiles` — do not seed, do not delete rows

The Jun 24 backward audit deleted 10 migration files that would have inserted fake "VERIFIED SUPPLIER" businesses. The table stays empty. The apply flow + admin approval is the correct population path. This rule was violated in a second session (Jul 1 2026) — 18 rows were seeded and reverted. It is now **policy, not preference**. The table also carries a `supplier_profiles_no_delete` rule (archive-only) — rows must be archived, not deleted.

### 2. Concurrent session output — verify before building on it

Multiple sessions have shipped code that built on fictional schemas or deleted working functions with placeholder comments (`// Keep other functions as they were` committed as literal code). Treat another agent's prior work with the same scrutiny as your own: check live schema, check what exists, don't assume.

### 3. `applicationsQuery.ts` — verify exports before editing

This file has been gutted and restored twice. Before touching it, check that `listPendingProfessionals`, `decideProfessionalApplication`, and `decideSupplierApplication` still exist and that the status value is `pending_review` (not `pending`).

### 4. `public-assets` storage bucket — do not modify RLS

The bucket has a broad SELECT policy enabling file listing. Whether this should be restricted is Tyler's call. Don't tighten or loosen it without explicit instruction.

### 5. `app/intelligence/licensing-pathways/page.tsx`, `app/intelligence/logistics-trade-routes/page.tsx`, and 7 HAR-39/HAR-40 routes — do not retire to Command Centre redirects

The first two were rebuilt with real live-data wiring on Jul 2-3, after the #937 Command Centre consolidation branch had already retired both to 2-line redirect stubs. The remaining 7 — `app/intelligence/source-engine`, `app/intelligence/watchlists`, `app/education/compliance-readiness`, `app/education/export-import-readiness`, `app/education/pharmaceutical-medical-cannabis`, `app/education/cannabis-history-library`, `app/policy-standards/regulatory-change-tracker` — are required verbatim by `scripts/test-har39-har40-public-surfaces.mjs`, a compliance gate that runs on every PR to `main` checking for specific legal/medical/copy-safety disclaimer language. Do not silently re-retire any of them.

## Migration checklist

- [x] Copy each rule's full verbatim text from HANDOFF.md into this file
- [ ] Diff old vs new to confirm zero content loss
- [ ] Replace the HANDOFF.md section with a one-line pointer to this file
- [ ] Add EVIDENCE_LOG.md entry per AGENTS.md

See also: `AGENTS.md`, `docs/adr/README.md`
