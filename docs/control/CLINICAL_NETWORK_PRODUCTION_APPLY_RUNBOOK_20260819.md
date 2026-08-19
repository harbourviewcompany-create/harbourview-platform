# Clinical + Network production apply runbook (2026-08-19)

**Status:** Production-ready sequence. Apply via workflow
`Apply Clinical Prescriber OS production migrations`
(`.github/workflows/apply-clinical-prescriber-os-production.yml`) with
`confirm=APPLY` and `phase=full-prescriber` from `main` after this branch merges.

**Supabase project:** `zvxdgdkukjrrwamdpqrg`

---

## Root cause of the DE workspace failure

1. Prescriber OS tables were merged to the repo (`20260818213000`) but **not applied** to production.
2. Even when tables exist in `public`, PostgREST only exposes schema **`api`** (`SUPABASE_DB_SCHEMA = 'api'`).
   Without `api.clinical_*` views the client reports:
   `Could not find the table 'api.clinical_safety_rules' in the schema cache`.

Fix is **not** UI degradation. Fix is:

1. Apply public-table migrations (foundation + Prescriber OS).
2. Apply `20260819210000_clinical_prescriber_os_api_schema_exposure.sql` so `api.*` views exist.

---

## Hard gates

1. Explicit `confirm=APPLY` on the production workflow (or written owner authorization for manual psql).
2. `production-database` GitHub Environment approval if required.
3. Backup / PITR window confirmed.
4. No concurrent migration job.

---

## Ordered apply (preferred: workflow `full-prescriber`)

### A. Evidence foundation (skip if already in `schema_migrations`)

| Version | File |
|---------|------|
| `20260814134500` … `20260814151000` | V1 / V1.1 governance chain |

### B. Prescriber OS

| Version | File |
|---------|------|
| `20260818210936` | monitoring protocols |
| `20260818212800` … `20260818213300` | preflight → OS → provenance → SKU → PV |

### C. API exposure (required for the app)

| Version | File |
|---------|------|
| `20260819210000` | `clinical_prescriber_os_api_schema_exposure.sql` |

Creates `api.clinical_safety_rules`, `api.clinical_regimen_protocols`,
`api.clinical_monitoring_protocols`, `api.clinical_guideline_recommendations`,
plus evidence / interactions / formulary projections with `security_invoker`.

### D. Network Command P0 (separate, optional same window)

`20260818133500` … `20260818133700` — use a dedicated Network apply if not yet live.

---

## Post-apply verification

```sql
select to_regclass('api.clinical_safety_rules') as safety,
       to_regclass('api.clinical_regimen_protocols') as regimen,
       to_regclass('api.clinical_monitoring_protocols') as monitoring,
       to_regclass('api.clinical_guideline_recommendations') as guidelines,
       to_regclass('api.clinical_evidence_records') as evidence;
-- all non-null

select count(*) as foundation_cols
from information_schema.columns
where table_schema = 'public'
  and table_name = 'clinical_evidence_records'
  and column_name in ('publication_scope', 'freshness_status', 'grading_method_key');
-- expect 3 when foundation applied
```

App smoke (authenticated):

- `/dashboard/clinical?country=DE` — no schema-cache error; Evidence search usable
- Safety / Monitoring tabs load empty **or** published rows (empty is OK until jurisdiction seeds exist; missing **tables** is not)

---

## Decision log

| Date | Decision |
|------|----------|
| 2026-08-19 | Runbook authored; no apply yet |
| 2026-08-19 | Added `20260819210000` api exposure + production workflow; production apply still requires `confirm=APPLY` |
