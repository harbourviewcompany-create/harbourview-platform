# Clinical Evidence Platform — Execution Status

**Started:** 2026-08-18  
**Goal:** Production-ready cannabinoid clinical evidence OS  
**Boundary:** Human-gated synthesis, jurisdiction-first, fail-closed publication.

## Current phase: production-shape reconciliation

### Completed
- [x] Re-fetched current main, PR #1523, PR #1525 and live production Supabase state.
- [x] Traced the August 18 Clinical seed path that published the current graded evidence corpus.
- [x] Confirmed production uses `condition_label`, `cannabinoids` and `jurisdictions` and lacks the #1523 governance/currentness fields.
- [x] Confirmed production has no credential-bound Clinical review provenance or Clinical admin-audit events for the existing graded rows.
- [x] Replaced the unsafe unversioned migration with `20260818224000_clinical_evidence_spine_reconcile.sql`.
- [x] Added fail-closed publication scope, credential-bound review provenance, currentness compatibility, supporting tables and authenticated-only RLS.
- [x] Corrected `productionQuery.ts` to the live plural schema and made successful live zero-result responses authoritative.
- [x] Added a production-shaped replay workflow that applies the migration repeatedly and proves record preservation, RLS, #1525 event compatibility and the credentialed publication gate.

### Production state
- No migration from this PR has been applied to production.
- Existing production records remain unchanged until an operator explicitly authorizes the forward migration.
- Expected migration effect: preserve all 14 evidence rows; retain the 3 ungraded regulatory/guidance rows as published `source-metadata`; move the 11 graded/claim-bearing rows to `clinical-synthesis` + `under-review` unless genuine credential-bound approval exists at apply time.

### Remaining before production apply
1. Exact-head migration replay and required PR checks must be green.
2. Review the 3/11 affected-record classification against the live pre-apply snapshot.
3. Apply only `20260818224000_clinical_evidence_spine_reconcile.sql` when explicitly authorized.
4. Merge/wire PR #1525 only after its currentness contract remains green against the reconciled schema.
5. D4 credentialed reviewer approval remains required before any clinical-synthesis publication.
