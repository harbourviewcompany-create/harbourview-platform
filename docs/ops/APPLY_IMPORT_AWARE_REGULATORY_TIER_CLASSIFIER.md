# Apply import-aware regulatory tier classifier — production

**Status:** HOLD until this PR merges; then PENDING controlled production apply  
**Owner for apply:** an operator with `production-database` environment approval  
**Production action:** not performed by this PR  
**Symptom before apply:** import-heavy lawful medical markets can remain on the wrong market-access globe tier.

| Item | Value |
|------|-------|
| Workflow | `.github/workflows/apply-import-aware-regulatory-tier-classifier.yml` |
| Base migration | `supabase/migrations/20260819125403_regulatory_tier_import_aware_classifier.sql` |
| Base version | `20260819125403` |
| Hardening migration | `supabase/migrations/20260819150000_regulatory_tier_trade_negation_hardening.sql` |
| Hardening version | `20260819150000` |
| Target DB | `zvxdgdkukjrrwamdpqrg` (pooler `aws-1-us-west-2.pooler.supabase.com`) |
| Environment | GitHub Actions `production-database` |
| Secret | `SUPABASE_DB_PASSWORD` |

## Why the apply is explicit

Production has a drifted repository-versus-live migration set, so this release must not use a bulk `supabase db push --include-all`. The workflow applies only the reviewed classifier migration files and records only their exact repository versions.

The original import-aware migration is already merged to `main` but was verified as not applied to production during PR #1564 review. The hardening migration in this PR is a forward repair rather than a rewrite of that merged migration.

## What is being fixed

The base migration adds licensed/operating import pathways as a peer to export pathways for `legal_commercial_access`.

Review of the original production workflow found two classifier-contract defects that must be repaired before production apply:

1. Explicitly negated trade language such as `no licensed export industry` still matched the affirmative `export industry` regex and could be promoted to `legal_commercial_access`.
2. A separate phrase such as `export licensing under discussion` could suppress an otherwise established `Medical legal` state and fall through to `prohibited`.

`20260819150000_regulatory_tier_trade_negation_hardening.sql` corrects both cases while preserving affirmative import/export behavior and re-deriving only automatic country tiers. Manual override rows are not eligible for reclassification.

## Transaction safety contract

The workflow no longer applies SQL, commits it, writes the ledger, and only then checks classifier semantics.

The controlled apply now performs these actions inside one transaction:

1. Snapshot override-country tier fields into a temporary table.
2. Apply the base migration if version `20260819125403` is still missing.
3. Apply hardening migration `20260819150000`.
4. Run affirmative-import, affirmative-export, negated-export, negated-import, trade-discussion and mixed-clause classifier assertions.
5. Prove override-country tier fields are unchanged.
6. Insert the exact missing migration ledger rows.
7. Commit only if every assertion succeeds.

Any SQL error or failed semantic assertion aborts the transaction, so the workflow cannot intentionally leave classifier mutations committed with a success-looking migration ledger row.

## Agent procedure

### Preconditions

- [ ] This PR has merged and the workflow plus hardening migration are present on repository `main`.
- [ ] You are dispatching the workflow from branch **`main`**; the job refuses any other ref.
- [ ] You can approve the **`production-database`** GitHub Environment, or an authorized operator is available to approve it.
- [ ] Secret **`SUPABASE_DB_PASSWORD`** is configured for that environment.
- [ ] No concurrent production classifier/migration apply is running.
- [ ] You have read the workflow YAML and this runbook end-to-end.

### Step 1 — Inspect the ledger

Optional manual verification:

```sql
select version, name
from supabase_migrations.schema_migrations
where version in ('20260819125403', '20260819150000')
   or name in (
     'regulatory_tier_import_aware_classifier',
     'regulatory_tier_trade_negation_hardening'
   )
order by version;
```

The workflow independently verifies version/name consistency and supports these safe states:

| State | Workflow behavior |
|-------|-------------------|
| Neither version applied | Apply base + hardening atomically |
| Base applied, hardening missing | Apply hardening atomically |
| Both applied | Refuse; nothing to do |
| Hardening applied while base missing | Refuse inconsistent state |
| Version/name mismatch or duplicate rows | Refuse inconsistent state |

Do not manually repair a mismatched ledger as part of this procedure.

### Step 2 — Dispatch the controlled workflow

1. Open GitHub Actions workflow `apply-import-aware-regulatory-tier-classifier.yml`.
2. Choose branch **`main`**.
3. Set `production_action` to **`APPLY_PRODUCTION_MIGRATIONS`**.
4. Run the workflow.
5. Approve the **`production-database`** environment gate when prompted.

CLI equivalent for an authenticated operator with the required permissions:

```bash
gh workflow run apply-import-aware-regulatory-tier-classifier.yml \
  --ref main \
  -f production_action=APPLY_PRODUCTION_MIGRATIONS
```

### Step 3 — Required workflow evidence

All applicable steps must pass:

1. Require `main` branch dispatch.
2. Inspect exact base/hardening migration ledger state.
3. Capture DE/BR/CA/US pre-application tiers.
4. Capture the pre-application override-country fingerprint.
5. Apply the missing reviewed migration file(s) and all semantic assertions in one transaction.
6. Commit exact ledger rows only after assertions pass.
7. Verify both exact ledger rows exist after commit.
8. Capture DE/BR/CA/US post-application tiers.
9. Confirm the post-application override fingerprint exactly equals the pre-application fingerprint.
10. Publish classifier probes and upload the evidence artifact.

Artifact name:

`import-aware-classifier-apply-<run_id>`

Key artifact files include:

- `migration-state-before.txt`
- `before-tiers.txt`
- `override-fingerprint-before.txt`
- `apply-transaction.sql`
- `apply.log`
- `migration-state-after.txt`
- `after-tiers.txt`
- `override-fingerprint-after.txt`
- `classifier-probes.txt`

### Step 4 — Acceptance contract

| Check | Required result |
|-------|-----------------|
| Affirmative medical import market | `legal_commercial_access` |
| Affirmative licensed export permit | `legal_commercial_access` |
| `Medical legal; ... no licensed export industry` | `medical_limited_trade` |
| `Medical legal; no commercial import pathway` | `medical_limited_trade` |
| `Medical legal; export licensing under discussion` | `medical_limited_trade` |
| Negated export clause + separate active licensed-import clause | `legal_commercial_access` |
| Override-country fingerprint | unchanged |
| Base ledger | `20260819125403 / regulatory_tier_import_aware_classifier` present |
| Hardening ledger | `20260819150000 / regulatory_tier_trade_negation_hardening` present |

Optional manual probes after a successful workflow:

```sql
select api.derive_regulatory_tier(
  'Adult-use social club framework; Europe''s largest medical import market with licensed importers.'
) as affirmative_import;
-- expect: legal_commercial_access

select api.derive_regulatory_tier(
  'Medical legal; prescription programme; no licensed export industry'
) as negated_export;
-- expect: medical_limited_trade

select api.derive_regulatory_tier(
  'Medical legal; no commercial import pathway'
) as negated_import;
-- expect: medical_limited_trade

select api.derive_regulatory_tier(
  'Medical legal; export licensing under discussion'
) as trade_discussion;
-- expect: medical_limited_trade

select iso_alpha2, regulatory_tier, regulatory_tier_origin, regulatory_tier_source
from public.countries
where iso_alpha2 in ('DE','BR','CA','US')
order by iso_alpha2;
```

### Step 5 — Product verification

After the workflow is fully green:

1. Hard-refresh the production Harbourview market-access globe.
2. Confirm DE/import-heavy lawful medical markets are no longer downgraded solely because import pathways were ignored.
3. Confirm medical-only/negated-trade markets are not falsely promoted because a negative sentence contains words such as `export industry` or `import pathway`.
4. Confirm known override countries retain their manually controlled tiers.

### Step 6 — Closeout

- [ ] Paste the successful GitHub Actions run URL into the tracking PR/issue.
- [ ] Retain the uploaded production evidence artifact.
- [ ] Update this document's Status line in a follow-up evidence commit to `Applied — <YYYY-MM-DD> — run <url>`.
- [ ] Record any remaining globe-data discrepancy as a separate data/source issue rather than manually changing an automatic tier without evidence.

## Explicit non-goals

- Do not run `supabase db push --include-all` against production for this release.
- Do not dispatch from a feature branch.
- Do not manually edit override tiers as part of the classifier apply.
- Do not mark a failed workflow as applied merely because one of the migrations appears in a ledger; investigate the exact transaction/ledger evidence first.
- Do not change unrelated Vercel, RLS, dependency or application behavior in the production apply session.

## Rollback / failure behavior

Before transaction commit, any migration or assertion failure rolls back the transaction automatically and the controlled workflow must remain failed.

After a successful commit there is no automatic down-migration. A later semantic regression must be repaired by a new reviewed forward migration that restores the desired classifier definition and re-derives only `regulatory_tier_origin = 'auto'` rows. Do not casually re-run historical migration files.

## Related

- Workflow: `.github/workflows/apply-import-aware-regulatory-tier-classifier.yml`
- Base migration: `supabase/migrations/20260819125403_regulatory_tier_import_aware_classifier.sql`
- Hardening migration: `supabase/migrations/20260819150000_regulatory_tier_trade_negation_hardening.sql`
- TypeScript parity mirror: `lib/globe/derive-regulatory-tier.ts`
- Regression tests: `tests/globe/derive-regulatory-tier.test.ts`
- Live path: briefing `program_status` → `trg_sync_regulatory_tier` → `countries.regulatory_tier` → `GlobeProvider` / `/api/globe`
