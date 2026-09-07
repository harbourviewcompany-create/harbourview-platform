# @claude — apply five separately_authorized migrations

**Operator authorization:** explicit “Go on” for all five listed versions (2026-09-07).
Grok cannot reach Supabase. **You own production apply + ledger.**

Project: `zvxdgdkukjrrwamdpqrg`

## Apply order (strict)

1. `20260727163000` — `clinical_api_surface.sql`
2. `20260731120000` — `signal_role_family_routing.sql`
3. `20260801150000` — `api_expose_quality_and_routing_columns.sql`
4. `20260802080000` — `harden_eval_labels_and_alert_delivery.sql`
5. `20260810222500` — `harden_edge_function_cron_auth.sql` **(Vault first)**

Stop on first failure; do not continue the list.

---

### 1. `20260727163000` clinical_api_surface

**What:** `CREATE OR REPLACE VIEW api.clinical_*` with `security_invoker = true` over public clinical tables + grants.

**Preflight:**
```sql
select to_regclass('public.clinical_patients') is not null as patients_ok;
select count(*) from information_schema.views
  where table_schema = 'api' and table_name like 'clinical_%';
```
If base tables missing, **stop** and report (do not create empty invoker views blindly).

**Apply:** full file body via `apply_migration` with name matching file (version `20260727163000`) **or** SQL editor + insert ledger row.

**Verify:**
```sql
select version from supabase_migrations.schema_migrations where version = '20260727163000';
select table_name from information_schema.views
  where table_schema = 'api' and table_name like 'clinical_%' order by 1;
```

---

### 2. `20260731120000` signal_role_family_routing

**What:** Additive role-family dimension on signals / watch rules (new columns + reference data). File documents rollback; no classify writer change.

**Preflight:**
```sql
select column_name from information_schema.columns
  where table_schema = 'public' and table_name = 'signals'
    and column_name like '%role%family%';
```
If columns already exist, still apply only if statements are idempotent; otherwise record equivalence / skip body and insert version only after proof of prior apply.

**Apply + verify ledger row `20260731120000`.**

---

### 3. `20260801150000` api_expose_quality_and_routing_columns

**What:** Expose quality/routing columns on `api.*` views so dashboard (schema `api`) sees what public already has.

**Preflight:** confirm public signals (or source tables) have quality columns the view will select.

**Apply + verify ledger `20260801150000`.**
Smoke: dashboard signal quality fields no longer null solely due to missing api view columns.

---

### 4. `20260802080000` harden_eval_labels_and_alert_delivery

**What:** Hardening for eval labels + alert delivery path.

**Preflight:** read full file; note any REVOKE/GRANT and dependent jobs.

**Apply + verify ledger `20260802080000`.**

---

### 5. `20260810222500` harden_edge_function_cron_auth

**What:** Replace cron invoke helpers to read secrets from Vault (`job_refresh_cron_secret`, `schema_drift_cron_secret`, `hv_source_pull_runner_secret`). Fail closed if missing.

**Preflight (required before apply):**
```sql
select name from vault.decrypted_secrets
where name in (
  'job_refresh_cron_secret',
  'schema_drift_cron_secret',
  'hv_source_pull_runner_secret'
);
```
If any required name is missing, **create Vault secrets first** (operator/dashboard) — do not apply or cron will hard-fail.

**Apply + verify ledger `20260810222500`.**
Optional: single controlled invoke of one helper in a transaction-safe test only if operator requests.

---

## After each successful apply

1. Confirm `schema_migrations` has the **canonical** version, or if Supabase minted a new timestamp, add an entry to `supabase/release-controls/migration-live-version-equivalences.json` (blob SHA pinned) in a follow-up commit.
2. Remove that version from `supabase/release-controls/committed-not-applied-baseline.json` and decrement `counts.baselined`.
3. Comment on this PR with version + verify query results.

## After all five

- Re-run ledger compare CI / `migration-ledger-manifest` drift mode expectation: these five no longer in `committed_not_applied`.
- Close or update PR #1786 triage note.
- Do **not** start the 67 `requiring_forward_reconciliation` files from this task.

## Registry

Harbourview Marketplace Supabase — production data/API surface + cron auth. No registry file change required if project ref unchanged.
