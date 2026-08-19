# Clinical + Network production apply runbook (2026-08-19)

**Status:** Prepared only. This document does **not** authorize production migration application, Auth changes, or data writes.
**Repo head reference:** post-merge of Clinical (#1521, #1479, #1527) and Network Command P0 (#1517).
**Supabase project (read-only audit target historically):** `zvxdgdkukjrrwamdpqrg`

---

## Why this exists

Repository `main` now contains Clinical Evidence OS, corpus governance, Prescriber OS reconciliation, and Network Command P0 migrations. Live production has lagged on Evidence V1/V1.1 governance columns and still shows weak provenance on many published clinical rows. Applying repo history without an ordered, fail-closed plan risks partial schema and incorrect prescriber-facing projections.

---

## Hard gates (all required before any production apply)

1. Explicit written authorization from the production owner for **this** sequence.
2. Confirmed backup / point-in-time recovery window for the production project.
3. Maintenance window agreed; Clinical and Network write APIs can tolerate brief lock/DDL.
4. Local zero-state replay green on the exact commit being applied.
5. Migration Drift Check compared and understood (remote-only versions, missing governance).
6. No concurrent migration apply from another agent or CI job.

If any gate fails: **STOP**. Do not apply.

---

## Pre-flight (read-only)

```sql
-- Applied versions
select version
from supabase_migrations.schema_migrations
order by version;

-- Clinical evidence shape (expect missing columns if V1.1 not applied)
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'clinical_evidence_records'
  and column_name in (
    'publication_scope',
    'freshness_status',
    'grading_method_key',
    'review_due_at',
    'source_currentness_checked_at'
  )
order by column_name;

-- Published row counts
select 'evidence' as kind, count(*) filter (where review_status = 'published') as published
from public.clinical_evidence_records
union all
select 'interactions', count(*) filter (where review_status = 'published')
from public.clinical_medication_interactions
union all
select 'monitoring', count(*) filter (where review_status = 'published')
from public.clinical_monitoring_protocols;
```

Record outputs in the evidence log before proceeding.

---

## Ordered apply (repository versions)

Apply **only** versions not already present in `schema_migrations`. Skip any version already recorded. Do not reorder.

### A. Clinical Evidence foundation (if still missing on production)

| Version | File |
|---------|------|
| `20260814134500` | `clinical_evidence_v1_governance.sql` |
| `20260814135500` | `clinical_evidence_v1_source_reconciliation.sql` |
| `20260814143500` | `clinical_evidence_v1_production_foundation.sql` |
| `20260814144000` | `clinical_evidence_v1_audit_immutability.sql` |
| `20260814150000` | `clinical_evidence_v1_1_operations.sql` |
| `20260814151000` | `clinical_evidence_v1_1_canadian_nabilone_source.sql` |

After each file: re-run the column check above until foundation columns exist.

### B. Clinical Evidence OS + corpus governance

| Version | File |
|---------|------|
| `20260816150000` | `clinical_evidence_operating_system.sql` |
| `20260816150100` | `clinical_evidence_operating_system_retrieval_hardening.sql` |
| `20260816150200` | `clinical_evidence_domain_separation.sql` |
| `20260818110000` | `clinical_evidence_release_publication_guard.sql` |
| `20260818120000` … | formulary / evidence seed chain as present on `main` |
| `20260818192000` | graded evidence / interactions depth (guarded) |

### C. Monitoring + Prescriber OS reconciliation

| Version | File |
|---------|------|
| `20260818210936` | `clinical_monitoring_protocols.sql` (canonical; do not re-add deleted duplicate `20260818200000`) |
| `20260818212800` | `clinical_prescriber_governance_preflight.sql` |
| `20260818212900` | `clinical_interaction_published_uniqueness.sql` |
| `20260818213000` | `clinical_prescriber_os_reconciliation.sql` |
| `20260818213100` | `clinical_provenance_remediation_audit.sql` |
| `20260818213200` | `clinical_prescriber_sku_links.sql` |
| `20260818213300` | `clinical_prescriber_pharmacovigilance.sql` |
| `20260819100621` | `clinical_evidence_spine_reconcile.sql` (if not applied) |

### D. Network Command P0

| Version | File |
|---------|------|
| `20260818133500` | `network_command_p0_core.sql` |
| `20260818133600` | `network_command_p0_security.sql` |
| `20260818133700` | `network_command_p0_identity_backfill.sql` |

Timestamps interleave with Clinical on disk; production apply should follow **dependency**, not pure filename sort when a version is already applied. Prefer: complete Clinical foundation → OS/corpus → monitoring/prescriber → Network, skipping any version already in `schema_migrations`.

---

## Post-apply verification

```sql
-- Governance columns present
select count(*) as foundation_cols
from information_schema.columns
where table_schema = 'public'
  and table_name = 'clinical_evidence_records'
  and column_name in (
    'publication_scope', 'freshness_status', 'grading_method_key'
  );
-- expect 3

-- Non-inspectable published clinical surfaces should be 0 after remediation migrations
select count(*) as bad_published_evidence
from public.clinical_evidence_records
where review_status = 'published'
  and not public.clinical_source_is_prescriber_inspectable(primary_source_url);

-- Network Command tables exist
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name like 'network_%'
order by 1;

-- Latest provenance audit event (if operations table present)
select event_type, event_payload, recorded_at
from public.clinical_evidence_operation_events
where event_type = 'prescriber-provenance-remediation'
order by recorded_at desc
limit 1;
```

App smoke (authenticated, non-destructive):

- `/dashboard?page=clinical` — Command Clinical links to `/dashboard/clinical`
- `/dashboard/clinical?country=CA` — workspace loads without fixture fallback in production
- `/dashboard/network` — Network Command shell loads for workspace members

---

## Explicit non-goals

- No invented clinical claims or replacement source URLs in this runbook.
- No patient-schema production authorization (`2026072716*` remains separately gated).
- No force-reset of `main` or production if a step fails — repair forward with a new migration.

---

## Rollback posture

DDL-heavy steps are not trivially reversible. Prefer:

1. Stop the sequence at the failed version.
2. Capture `schema_migrations` and error text.
3. Ship a forward repair migration on a branch; do not delete production history rows.

---

## Decision log

| Date | Decision |
|------|----------|
| 2026-08-19 | Runbook authored after Clinical + Network repo merges. **No production apply performed.** |
