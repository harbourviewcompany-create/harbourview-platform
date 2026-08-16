# Migration Execution Runbook
## PRs #1367 (Transactions) + #1368 (Decision Intel)
## Generated: 2026-08-13

---

## ✅ Already Merged Today

| PR | Merged At | What |
|---|---|---|
| **#1365** | 14:08 UTC | Intel activation v2 — corpus watch, commercial bridge |
| **#1366** | 14:22 UTC | Vitest fix — Playwright/node:test exclusion |

---

## 🔄 Remaining to Merge

| PR | Status | Blocker | Action |
|---|---|---|---|
| **#1367** | `mergeable: true`, `mergeable_state: unstable` | CI checks running/failing | Wait for CI green, then merge |
| **#1368** | `mergeable: true`, `mergeable_state: blocked` | Needs review approval | Get admin review, then merge |

---

## 📝 Merge Commit Messages

### PR #1367 — Transaction System Foundation

```
feat(transactions): native transaction system foundation

Rebased from stale PR #1329. Adds entity identity, product/account
management, transaction core, assertion/diligence, economics/decisions,
RLS views, and boundary hardening.

Includes:
- lib/transactions/constants.ts
- lib/transactions/recognition.ts
- scripts/verify-transaction-system.mjs
- 7 Supabase migrations (run BEFORE merge)

Migrations (run in sequence):
1. 20260811010000_transaction_identity_foundation.sql
2. 20260811011000_transaction_product_account_foundation.sql
3. 20260811012000_transaction_core_foundation.sql
4. 20260811013000_transaction_assertion_diligence_foundation.sql
5. 20260811014000_transaction_economics_decisions_foundation.sql
6. 20260811015000_transaction_rls_views_import_staging.sql
7. 20260811015100_transaction_boundary_hardening.sql

Closes #1329 (superseded)
```

### PR #1368 — Decision Intelligence Stage 0

```
feat(intel): decision intelligence stage 0 (rebased)

Rebased from stale PR #1309. Adds authenticated event dossier,
desktop decision intel bridge, and canonical schema documentation.

Includes:
- app/dashboard/intel/events/[id]/page.tsx
- components/dashboard/DesktopDecisionIntelBridge.tsx
- docs/control/INTEL_DECISION_OS_EXISTING_TARGET.md
- docs/control/INTEL_DECISION_OS_RLS_MIGRATION.md
- 3 Supabase migrations (run BEFORE merge)

Migrations (run in sequence):
1. 20260808190000_decision_intel_stage0_first_slice.sql
2. 20260808203000_decision_intel_stage0_review_fixes.sql
3. 20260810202000_decision_intel_stage0_completion_hardening.sql

Note: Dashboard integration files excluded due to conflicts with
PR #1248 Mobile Command Centre rebuild. Post-merge wiring required.

Closes #1309 (superseded)
```

---

## 🗄️ Supabase Migration Execution Order

### Phase 1: Decision Intel Migrations (PR #1368)
Run these FIRST — they create the intel schema that transactions reference.

```sql
-- Step 1: First slice — core tables and enums
\i supabase/migrations/20260808190000_decision_intel_stage0_first_slice.sql

-- Step 2: Review fixes — indexes and constraints
\i supabase/migrations/20260808203000_decision_intel_stage0_review_fixes.sql

-- Step 3: Completion hardening — customer visibility, RLS
\i supabase/migrations/20260810202000_decision_intel_stage0_completion_hardening.sql
```

**What each does:**
1. **First slice** — Creates `intel_events`, `intel_evidence`, `intel_assertions`, `intel_assessments`, `intel_recommendations` tables with pgcrypto extension
2. **Review fixes** — Adds unique constraints on evidence snapshot refs, fixes foreign key relationships
3. **Completion hardening** — Adds `customer_visibility` column to events, completes RLS policies

### Phase 2: Transaction System Migrations (PR #1367)
Run these SECOND — they build on the intel schema.

```sql
-- Step 4: Identity foundation — entity kinds, aliases, facilities
\i supabase/migrations/20260811010000_transaction_identity_foundation.sql

-- Step 5: Products and accounts — product catalog, economic accounts
\i supabase/migrations/20260811011000_transaction_product_account_foundation.sql

-- Step 6: Core transactions — transaction stages, types, networks
\i supabase/migrations/20260811012000_transaction_core_foundation.sql

-- Step 7: Assertions and diligence — verification workflow
\i supabase/migrations/20260811013000_transaction_assertion_diligence_foundation.sql

-- Step 8: Economics and decisions — GTV metrics, decision records
\i supabase/migrations/20260811014000_transaction_economics_decisions_foundation.sql

-- Step 9: RLS and import staging — access control, staging tables
\i supabase/migrations/20260811015000_transaction_rls_views_import_staging.sql

-- Step 10: Boundary hardening — final security constraints
\i supabase/migrations/20260811015100_transaction_boundary_hardening.sql
```

**What each does:**
4. **Identity** — `hv_entity_kind` enum, entity aliases, facility registry, identity resolution
5. **Products** — `hv_product_status` enum, product catalog, batch tracking, economic accounts
6. **Core** — `hv_transaction_stage` enum, transaction records, counterparty links, document attachments
7. **Assertions** — `hv_assertion_status` enum, diligence checks, verification workflow
8. **Economics** — `hv_economics_metric_type` enum, GTV modeling, decision outcome tracking
9. **RLS** — `hv_has_transaction_role()` function, import staging tables, view layer
10. **Boundary** — `hv_transaction_economics_key()` function, final constraint hardening

---

## 🔒 Pre-Migration Safety Checklist

- [ ] Database backup triggered (Supabase → Backups → Manual)
- [ ] Staging migrations tested successfully
- [ ] `scripts/verify-transaction-system.mjs` passes on staging
- [ ] No active long-running transactions
- [ ] Maintenance window announced (if production)

---

## ✅ Post-Migration Verification

```bash
# 1. Verify transaction system
node scripts/verify-transaction-system.mjs

# 2. Verify decision intel tables exist
# In Supabase SQL Editor:
SELECT COUNT(*) FROM intel_events;
SELECT COUNT(*) FROM intel_evidence;
SELECT COUNT(*) FROM intel_assertions;

# 3. Verify transaction tables exist
SELECT COUNT(*) FROM hv_transaction_core;
SELECT COUNT(*) FROM hv_product_catalog;
SELECT COUNT(*) FROM hv_economic_account;

# 4. Verify RLS is active
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'hv_%';
```

---

## 🚨 Rollback

If anything fails after migration:

```sql
-- Decision intel rollback
DROP TABLE IF EXISTS intel_recommendations CASCADE;
DROP TABLE IF EXISTS intel_assessments CASCADE;
DROP TABLE IF EXISTS intel_assertions CASCADE;
DROP TABLE IF EXISTS intel_evidence CASCADE;
DROP TABLE IF EXISTS intel_events CASCADE;

-- Transaction rollback (destructive — only if no data yet)
DROP TABLE IF EXISTS hv_transaction_economics CASCADE;
DROP TABLE IF EXISTS hv_transaction_decisions CASCADE;
DROP TABLE IF EXISTS hv_transaction_diligence CASCADE;
DROP TABLE IF EXISTS hv_transaction_core CASCADE;
DROP TABLE IF EXISTS hv_product_batch CASCADE;
DROP TABLE IF EXISTS hv_product_catalog CASCADE;
DROP TABLE IF EXISTS hv_economic_account CASCADE;
DROP TABLE IF EXISTS hv_entity_facility CASCADE;
DROP TABLE IF EXISTS hv_entity_alias CASCADE;
```
