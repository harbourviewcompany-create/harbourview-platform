# Automatic Heat Map from Regulatory Signals

**Status:** Implemented (migration `20260816120000_auto_heatmap_from_signals.sql`)  
**Goal:** When the crawler surfaces high-confidence regulatory signals, the globe heat map updates automatically — no human review gate.

## Source of truth

The heat map reads **`countries.regulatory_tier`** (public view: `api.country_market_access_public`).

Do **not** colour the map from `market_access_status` / `import_status` / `export_status` — those columns are known-unsourced (see migration `20260710114637`).

## Pipeline (closed loop)

```
public.signals (reviewed / quality_confidence ≥ 0.8)
        │
        ▼
GET /api/cron/market-access-promote   // every 15 min
        │
        ├─ extractMarketAccessImpactsRuleBased()
        ├─ api.record_market_access_event(...)   // idempotent
        └─ api.promote_market_access_from_signals()
                │
                ├─ kill switch off? → stop
                ├─ country frozen? → reject
                ├─ confidence rules → auto_applied | rejected_*
                │
                ▼
        countries.regulatory_tier updated
        regulatory_tier_audit + market_access_proposals ledger
                │
                ▼
globe / heat map repaints on next read
```

The extractor is **wired inside the promote cron** so any surfaceable regulatory
signal written to `public.signals` (classifier, review queue, or backfill) is
picked up within 15 minutes without a separate post-promote hook.

## Decision rules (fully automatic)

| Condition | Decision |
|-----------|----------|
| Global flag `market_access_auto_apply_enabled = false` | No changes |
| `countries.regulatory_tier_auto_frozen = true` | Reject |
| Proposed status already current | Reject (stale) |
| ≥1 primary regulator/gazette source **and** confidence ≥ 0.92 | **Auto-apply** |
| ≥2 independent sources **and** confidence ≥ 0.85 | **Auto-apply** |
| Otherwise | Reject (low confidence) |

Primary source = `source_registry.tier ≤ 1` **or** `source_type` in (`regulator`, `government_official`, `gazette`, `official_gazette`).

## Kill switches

```sql
-- Global off
select api.set_market_access_auto_apply(false, 'ops');

-- Freeze one country (e.g. DE)
select api.set_country_auto_freeze('DE', true);

-- Unfreeze
select api.set_country_auto_freeze('DE', false);
```

## Cron

`GET /api/cron/market-access-promote`  
Auth: `Authorization: Bearer $CRON_SECRET`  
Schedule in `vercel.json`: `*/15 * * * *`

Response shape:

```json
{
  "ok": true,
  "signals_scanned": 42,
  "impacts_extracted": 3,
  "events_recorded": 3,
  "record_errors": 0,
  "promote": { "applied": 1, "rejected": 2 }
}
```

## Eligibility (extractor gate)

A signal is extracted only when:

- `country_iso2` is present (ISO-2)
- `quality_confidence ≥ 0.8` (or reviewed with ≥ 0.85)
- `quality_label` / `content_type` in regulatory vocabulary, **or** reviewed

Rule patterns map headlines/summaries → pathway + proposed legend status
(`legal_commercial_access`, `medical_limited_trade`, `domestic_only`,
`cbd_hemp_only`, `prohibited`).

Optional: replace the rule-based extractor with an LLM call later; the DB
contract (`record_market_access_event`) stays the same.

## What was missing and is now covered

| Gap | Resolution |
|-----|------------|
| Single source of truth for map | `countries.regulatory_tier` + `api.country_market_access_public` |
| Extractor wiring | Promote cron scans `public.signals` every 15m |
| Cron schedule | `vercel.json` `*/15 * * * *` |
| Pathway → overall status | `public.roll_up_market_access_status` |
| Concurrent promote | Transaction advisory lock |
| Primary-source definition | `is_primary_market_access_source` |
| Kill switch | `platform_feature_flags` + per-country freeze |
| Audit / revert | `regulatory_tier_audit` + `market_access_proposals` |
| Public DTO safety | Public view exposes only iso, name, region, status, timestamps |

## Staging test plan

1. Apply migration on staging.
2. Insert a synthetic high-confidence primary-source row into `market_access_events` (or promote a real regulatory signal with clear "export licence" language).
3. `curl -H "Authorization: Bearer $CRON_SECRET" https://<staging>/api/cron/market-access-promote`
4. Confirm response: `impacts_extracted` / `events_recorded` > 0 when eligible signals exist; `promote.applied` when thresholds met.
5. Confirm `countries.regulatory_tier` + `regulatory_tier_audit` updated.
6. Confirm low-confidence / single secondary source lands in `market_access_proposals` as `rejected_low_confidence`.
7. `select api.set_market_access_auto_apply(false, 'test');` → promote is a no-op.
8. Freeze a country → `reject_frozen`.
9. Hit cron without `CRON_SECRET` → 401.
10. Globe / country brief still reads `regulatory_tier` (or `api.country_market_access_public`).

## Ops notes

- Auto-apply starts **enabled**. Turn it off immediately if a bad flip is observed.
- Prefer adding native primary regulators (BfArM, ANVISA, INVIMA, gazettes) to raise auto-apply quality — see `docs/SOURCE_EXPANSION_PLAN.md`.
- For tier-1 markets you can freeze them until primary-source coverage is solid.
