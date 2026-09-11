# Country intel enrichment

## Safe expansion script

```bash
DRY_RUN=1 SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  node scripts/safe-country-intel-enrichment.mjs
```

### Policy
- Identity-only upserts into `country_intel` (code, name, active)
- Never synthesizes `commercial_pathway_summary` or regulatory claims
- Draft playbooks only when reviewed signals exist (`status=draft`)
- Research queue written to `scripts/country-data/out/`

### After live run
1. Work P0 rows in `out/country-intel-research-queue.json`
2. Promote draft playbooks only after legal_framework_summary + steps reviewed
3. Re-check `/api/corridor-coverage`
