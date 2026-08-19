# Apply regulatory tier classifier release chain — production

**Status:** PENDING controlled production apply after PR #1569 merges  
**Production action:** not performed by PR #1569  
**Canonical workflow:** `.github/workflows/apply-regulatory-tier-classifier-negation-fix.yml`

## Migration chain

| Version | Name | Role |
|---------|------|------|
| `20260819125403` | `regulatory_tier_import_aware_classifier` | import-aware base classifier |
| `20260819150000` | `regulatory_tier_classifier_negation_fix` | immediate negated trade fix |
| `20260819151000` | `correct_de_br_program_status_commercial_import` | DE/BR source correction |
| `20260819152000` | `tier_classify_all_countries_from_briefing_prose` | canonical full-briefing classifier input |
| `20260819153000` | `regulatory_tier_classifier_clause_scope_hardening` | clause-local negation/discussion hardening |

## Verified production checkpoint

Migration Drift evidence captured at 2026-08-19 15:16 UTC showed these exact rows already present remotely:

- `20260819125403 / regulatory_tier_import_aware_classifier`
- `20260819150000 / regulatory_tier_classifier_negation_fix`
- `20260819151000 / correct_de_br_program_status_commercial_import`

`20260819152000` merged afterward in PR #1570, so its live status must be read from the production ledger at dispatch time rather than assumed. `20260819153000` remains the forward hardening migration introduced by PR #1569.

The canonical workflow handles both coherent remaining states:

| Live state before dispatch | Behavior |
|----------------------------|----------|
| `25403 + 150000 + 151000` present; `152000 + 153000` absent | apply `152000 + 153000` atomically |
| `25403 + 150000 + 151000 + 152000` present; `153000` absent | apply `153000` atomically |
| all five present | refuse; nothing to do |
| any required prerequisite missing/inconsistent | refuse |
| `153000` present while `152000` missing | refuse inconsistent state |
| duplicate or version/name mismatch | refuse inconsistent state |

Do not manually alter the migration ledger to force an accepted state.

## Why this release chain is necessary

Production run `32266967342` applied and ledgered `20260819125403`, then failed a post-commit semantic probe because `no licensed export industry` still matched affirmative export language. That exposed a release-control flaw: verification happened after the migration and ledger write had already committed.

PR #1567 added `20260819150000` to correct the immediate negated-export false positive. Two classifier-contract gaps remained:

1. trade-direction negation was global, so historical negative import/export text could suppress a separate current affirmative trade clause;
2. broad `under discussion` handling could erase established medical status when only import/export licensing was under discussion.

PR #1570 then introduced `20260819152000`, making full briefing prose the canonical classifier source by combining:

- `program_status`
- `public_summary`
- `market_dynamics`
- `regulatory_outlook`

using `api.briefing_classifier_text(...)`, with fields joined by ` | `.

`20260819153000` preserves that full-prose contract while hardening clause semantics. It treats `|`, punctuation, `but`, and `however` as clause boundaries so a negative statement in one field or clause cannot suppress a separate affirmative current pathway. It also scopes medical future/negation handling to medical-specific language.

## Transaction safety contract

The canonical workflow does not use `apply → commit → ledger → probe`.

Inside one database transaction it:

1. snapshots override-country tier fields;
2. applies `20260819152000` only if it is still absent from the live ledger;
3. applies `20260819153000`;
4. verifies `api.briefing_classifier_text(...)` exists;
5. runs full classifier semantic assertions;
6. proves override-country tier fields are unchanged;
7. inserts the exact missing migration ledger rows;
8. commits only if every assertion succeeds.

Any SQL error or failed semantic assertion aborts the transaction. A failed verification cannot intentionally leave `152000` or `153000` newly committed and ledgered.

## Superseded workflow

`.github/workflows/apply-tier-classify-all-countries-briefing-prose.yml` is superseded by the canonical release-chain workflow and must not be used to apply `20260819152000` after PR #1569 merges.

PR #1569 converts that old workflow into a fail-closed pointer to the canonical workflow. This prevents two production workflows from racing to apply the same migration or recreating the earlier commit-before-probe failure mode.

## Required semantic probes

| Sample | Expected |
|--------|----------|
| Adult-use short status + full-prose licensed medical import market | `legal_commercial_access` |
| Medical legal + active licensed export permit | `legal_commercial_access` |
| Medical legal + `no licensed export industry` | `medical_limited_trade` |
| Medical legal + `no commercial import pathway` | `medical_limited_trade` |
| Medical legal in one field + export licensing under discussion in another | `medical_limited_trade` |
| Negative export field + separate active export-permit field | `legal_commercial_access` |
| Negative import field + separate active licensed-importer field | `legal_commercial_access` |
| Override-country tier fields | unchanged |

The assertions deliberately use constructed deterministic text rather than hard-coding a live-country tier beyond the source contract. Live country results depend on current governed briefing prose.

## Apply procedure

### Preconditions

- [ ] PR #1569 is merged and `20260819153000` exists on `main`.
- [ ] Dispatch branch is `main`.
- [ ] `production-database` environment approval is available.
- [ ] `SUPABASE_DB_PASSWORD` is configured for that environment.
- [ ] No other production migration/classifier apply is running.
- [ ] The operator has read this runbook and the canonical workflow end-to-end.

### Dispatch

Use only:

```bash
gh workflow run apply-regulatory-tier-classifier-negation-fix.yml \
  --ref main \
  -f production_action=APPLY_PRODUCTION_MIGRATIONS
```

Approve the `production-database` environment when prompted.

Do not dispatch `apply-tier-classify-all-countries-briefing-prose.yml`.

## Required evidence

A successful run must retain artifact:

`regulatory-tier-classifier-release-<run_id>`

including:

- `migration-state-before.txt`
- `before-distribution.txt`
- `before-tiers.txt`
- `override-fingerprint-before.txt`
- `apply-transaction.sql`
- `apply.log`
- `migration-state-after.txt`
- `after-distribution.txt`
- `after-tiers.txt`
- `override-fingerprint-after.txt`
- `classifier-probes.txt`

The post-run ledger must contain all five exact migration rows listed above.

## Product verification

After the workflow is fully green:

1. Hard-refresh the production market-access globe.
2. Confirm known import-heavy markets classify from their current full briefing prose rather than `program_status` alone.
3. Confirm negative trade wording does not itself create `legal_commercial_access`.
4. Confirm separate current affirmative trade evidence is not suppressed by historical negative wording in another clause or briefing field.
5. Confirm a separate trade reform under discussion does not erase established medical status.
6. Confirm manually overridden country tiers remain unchanged.
7. For any unexpected country result, inspect the four canonical briefing fields before changing classifier logic.

## Closeout

- [ ] Paste the successful Actions run URL into the tracking PR/issue.
- [ ] Retain the evidence artifact.
- [ ] Update this document status to `Applied — <YYYY-MM-DD> — run <url>` in an evidence-only follow-up.
- [ ] Record remaining jurisdiction/source discrepancies separately with their source evidence.

## Non-goals

- Do not use `supabase db push --include-all` for this release.
- Do not manually re-run historical migration files.
- Do not manually change override tiers during this apply.
- Do not use the superseded single-`152000` workflow.
- Do not mark an unsuccessful workflow complete merely because a migration ledger row exists; inspect the exact transaction evidence.
- Do not combine unrelated dependency-lock, Vercel, RLS, or application changes with this production apply.
