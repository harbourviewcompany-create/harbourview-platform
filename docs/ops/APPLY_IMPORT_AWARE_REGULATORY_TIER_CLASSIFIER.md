# Apply import-aware regulatory tier classifier — production

**Status:** PENDING production apply  
**Owner for apply:** any agent with `production-database` environment approval  
**Code:** already on `main` (migration + workflow)  
**Symptom if not applied:** Germany / Brazil-style markets stay wrong colours on the market-access globe (import pathways treated as non-commercial).

| Item | Value |
|------|--------|
| Workflow | `.github/workflows/apply-import-aware-regulatory-tier-classifier.yml` |
| Migration | `supabase/migrations/20260819125403_regulatory_tier_import_aware_classifier.sql` |
| Version | `20260819125403` |
| Name | `regulatory_tier_import_aware_classifier` |
| Target DB | `zvxdgdkukjrrwamdpqrg` (pooler `aws-1-us-west-2.pooler.supabase.com`) |
| Environment | GitHub Actions `production-database` |
| Secret | `SUPABASE_DB_PASSWORD` |

## Why this is blocked until an explicit apply

The migration is **merged to main** but is **not** part of a bulk `supabase db push --include-all`. Production uses a single-file, workflow_dispatch apply with explicit `APPLY_PRODUCTION_MIGRATIONS` so a drifted pending set cannot be force-applied.

Until this runs:

- `api.derive_regulatory_tier` remains the export-only commercial classifier
- DE / BR-style **import** markets stay `medical_limited_trade` or `domestic_only` on the globe
- `/api/globe` and `GlobeProvider` continue to paint the wrong tier colours

## What the migration does

1. Replaces `api.derive_regulatory_tier(program_status)` so **licensed import** language ranks as `legal_commercial_access` (peer to export).
2. Reclassifies every `countries` row with `regulatory_tier_origin = 'auto'` from current `cc_jurisdiction_briefings.program_status`.
3. Leaves **override** rows alone.
4. Writes `regulatory_tier_audit` rows with `trigger_source = 'classifier_upgrade'`.

## Agent procedure (production apply)

### Preconditions

- [ ] You are operating from repository **main** (workflow refuses non-main refs).
- [ ] You have permission to approve the **`production-database`** GitHub Environment (or an operator who does is available).
- [ ] Secret **`SUPABASE_DB_PASSWORD`** is present for that environment.
- [ ] No concurrent production migration workflow is running.
- [ ] You have read this runbook and the workflow YAML end-to-end.

### Step 1 — Confirm not already applied

Optional manual check (if you have psql access):

```sql
select version, name
from supabase_migrations.schema_migrations
where version = '20260819125403'
   or name = 'regulatory_tier_import_aware_classifier';
```

If any row exists, **stop**. The workflow will also refuse with `Already recorded in the ledger`.

### Step 2 — Dispatch the workflow

1. Open:  
   https://github.com/harbourviewcompany-create/harbourview-platform/actions/workflows/apply-import-aware-regulatory-tier-classifier.yml
2. Click **Run workflow**.
3. Use branch **`main`** (required).
4. Set **production_action** to **`APPLY_PRODUCTION_MIGRATIONS`** (not `HOLD`).
5. Run workflow.
6. Approve the **`production-database`** environment gate when GitHub prompts.

CLI equivalent (if `gh` is authenticated with environment approval rights):

```bash
gh workflow run apply-import-aware-regulatory-tier-classifier.yml \
  --ref main \
  -f production_action=APPLY_PRODUCTION_MIGRATIONS
```

### Step 3 — Watch the job

Expected steps (all must pass):

1. Require main branch dispatch  
2. Refuse if already applied  
3. Capture pre-application tier sample (DE/BR/CA/US) → `artifacts/before-tiers.txt`  
4. Apply the migration in one transaction  
5. Record the ledger row under version `20260819125403`  
6. Capture post-application tier sample → `artifacts/after-tiers.txt`  
7. Prove classifier function is import-aware:
   - DE-style sample text → **`legal_commercial_access`**
   - Medical-only sample text → **`medical_limited_trade`**
8. Upload artifact `import-aware-classifier-apply-<run_id>`

### Step 4 — Acceptance checks

From the workflow summary / artifact:

| Check | Pass condition |
|-------|----------------|
| Ledger | Row `20260819125403` / `regulatory_tier_import_aware_classifier` present |
| Classifier probe | Import-market sample → `legal_commercial_access` |
| Classifier probe | Medical-only sample → `medical_limited_trade` |
| DE / BR sample | Post tiers reflect import-aware classification where briefings contain import language (not stuck on wrong pre-apply colour solely due to old function) |

Manual SQL (optional):

```sql
-- Classifier probes (same as workflow)
select api.derive_regulatory_tier(
  'Adult-use social club framework; Europe''s largest medical import market with licensed importers.'
) as de_style;
-- expect: legal_commercial_access

select api.derive_regulatory_tier(
  'Medical legal; prescription programme; no licensed export industry'
) as medical_only;
-- expect: medical_limited_trade

select iso_alpha2, regulatory_tier, regulatory_tier_origin, regulatory_tier_source
from public.countries
where iso_alpha2 in ('DE','BR','CA','US')
order by iso_alpha2;
```

### Step 5 — Product verification

1. Hard-refresh https://harbourview.vercel.app (or production dashboard) with market-access / globe layer.
2. Confirm DE / import-heavy medical markets no longer paint as non-commercial solely due to the old classifier.
3. Confirm override countries (if any) were **not** rewritten (`regulatory_tier_origin <> 'auto'`).

### Step 6 — Close the loop

- [ ] Paste the Actions run URL into the tracking issue / PR comment.
- [ ] Attach or link the workflow artifact (`before-tiers.txt`, `after-tiers.txt`, `apply.log`).
- [ ] Update this doc **Status** line to: `Applied — <YYYY-MM-DD> — run <url>`.
- [ ] Comment on any globe colour regression issues that this was the production apply.

## Explicit non-goals

- Do **not** run `supabase db push --include-all` against production for this change.
- Do **not** re-dispatch if the ledger already contains `20260819125403`.
- Do **not** edit override tiers by hand as part of this apply.
- Do **not** change Vercel config, RLS unrelated to this migration, or app code in the same apply session.

## Rollback note

There is no automatic down-migration. Recovery is restore `api.derive_regulatory_tier` from the previous migration definition and re-derive `origin = 'auto'` rows only under a new, reviewed migration — not a casual re-run of this file.

## Related

- Workflow: `.github/workflows/apply-import-aware-regulatory-tier-classifier.yml`
- Migration: `supabase/migrations/20260819125403_regulatory_tier_import_aware_classifier.sql`
- Live path: briefing `program_status` → `trg_sync_regulatory_tier` → `countries.regulatory_tier` → GlobeProvider / `/api/globe`
