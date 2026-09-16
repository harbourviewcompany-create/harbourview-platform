# Cron route disposition — 2026-09-14

**Status:** Decision required (defaults below are audit recommendations, not auto-applied)  
**Related:** `vercel.json`, `app/api/cron/*`, `docs/INTELLIGENCE_ARCHITECTURE_SPEC.md`

## Currently scheduled (`vercel.json`)

Keep all 17 existing entries (intelligence-ingest through ops-autonomy-tick).

## Implemented but not scheduled

| Path | Recommended disposition | Notes |
|------|-------------------------|-------|
| `/api/cron/embed-signals` | **SCHEDULE** `0 9 * * *` if product needs `signals.embedding_1024` | BGE-M3; requires HF endpoint env |
| `/api/cron/embed-artifacts` | **SCHEDULE** `0 5 * * *` after extract | Aligns with file header pipeline comment |
| `/api/cron/marketplace-match` | **SCHEDULE** or **HOLD** | Product decision |
| `/api/cron/deep-discovery` | **HOLD** or weekly | Entity resolver cost |
| `/api/cron/intelligence-graph` | **RETIRED** | Confirmed nothing reads cannabis_intelligence |
| `/api/cron/scraper-partition-{0,1,2,3}` | **HOLD** | Optional partition scale-out |

## Proposed `vercel.json` additions (apply only after operator GO)

```json
{ "path": "/api/cron/embed-artifacts", "schedule": "0 5 * * *" },
{ "path": "/api/cron/embed-signals", "schedule": "0 9 * * *" }
```

Do **not** re-enable historical pg_cron `hv-quality-pipeline` / `hv-quality-promote` every 2–10 minutes without compute capacity review.
