# Apply regulatory tier classifier negation fix — production

**Status:** PENDING production apply  
**Prerequisite:** `20260819125403` already applied (ledger present)  
**Symptom fixed:** medical-only briefing text with *negated* export language was promoted to `legal_commercial_access`

| Item | Value |
|------|--------|
| Workflow | `.github/workflows/apply-regulatory-tier-classifier-negation-fix.yml` |
| Migration | `supabase/migrations/20260819150000_regulatory_tier_classifier_negation_fix.sql` |
| Version | `20260819150000` |
| Name | `regulatory_tier_classifier_negation_fix` |

## What changed

Export/import commercial promotion now requires **affirmative** language and rejects windows like:

- `no licensed export industry`
- `without licensed import`
- `lack of export market`

Probes (must all pass):

| Sample | Expected |
|--------|----------|
| Adult-use + medical import market + licensed importers | `legal_commercial_access` |
| Medical legal; … **no** licensed export industry | `medical_limited_trade` |
| Licensed export industry | `legal_commercial_access` |
| Adult-use social clubs only | `domestic_only` |

## Apply

```bash
gh workflow run apply-regulatory-tier-classifier-negation-fix.yml \
  --ref main \
  -f production_action=APPLY_PRODUCTION_MIGRATIONS
```

Approve `production-database` environment when prompted.

## Note on DE / BR colours

If DE or BR remain `domestic_only` after apply, the live `cc_jurisdiction_briefings.program_status` text for that ISO does not contain affirmative import/export commercial phrases. Fix the **briefing content**, not the classifier, then re-derive (trigger or re-run this migration’s reclassify path under a new version).
