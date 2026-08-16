# Automatic Heat Map from Regulatory Signals

**Status:** Implemented (migration `20260816120000_auto_heatmap_from_signals.sql`)  
**Goal:** When the crawler surfaces high-confidence regulatory signals, the globe heat map updates automatically — no human review gate.

## Source of truth

The heat map reads **`countries.regulatory_tier`** (public view: `api.country_market_access_public`).

Do **not** colour the map from `market_access_status` / `import_status` / `export_status` — those columns are known-unsourced (see migration `20260710114637`).

## Pipeline

```
signal promoted (quality brain)
        │
        ▼
extractMarketAccessImpactsRuleBased()   // lib/intelligence/marketAccessAutoApply.ts
        │
        ▼
api.record_market_access_event(...)     // market_access_events row
        │
        ▼
api.promote_market_access_from_signals() // cron every 10–15 min
        │
        ├─ kill switch off? → stop
        ├─ country frozen? → reject
        ├─ confidence rules → auto_applied | rejected_*
        │
        ▼
countries.regulatory_tier updated
regulatory_tier_audit row written
market_access_proposals ledger row written
        │
        ▼
globe / heat map repaints on next read
```

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

Add to `vercel.json` (example):

```json
{
  "path": "/api/cron/market-access-promote",
  "schedule": "*/15 * * * *"
}
```

## Wiring the extractor

After a signal is promoted, call:

```ts
import {
  extractMarketAccessImpactsRuleBased,
  isEligibleForMarketAccessExtraction,
} from '@/lib/intelligence/marketAccessAutoApply'

if (isEligibleForMarketAccessExtraction(signal)) {
  for (const impact of extractMarketAccessImpactsRuleBased(signal)) {
    await supabase.schema('api').rpc('record_market_access_event', {
      p_signal_id: signal.id,
      p_country_iso2: signal.country_iso2,
      p_pathway: impact.pathway,
      p_direction: impact.direction,
      p_proposed_status: impact.proposed_status,
      p_confidence: impact.confidence,
      p_source_id: signal.source_id,
      p_evidence_snippet: impact.evidence_snippet,
      p_evidence_url: signal.url,
    })
  }
}
```

Optional: replace the rule-based extractor with an LLM call later; the DB contract stays the same.

## What was missing and is now covered

| Gap | Resolution |
|-----|------------|
| Single source of truth for map | `countries.regulatory_tier` + `api.country_market_access_public` |
| Seed | Existing reviewed tiers remain; auto path only updates on new evidence |
| Pathway → overall status | `public.roll_up_market_access_status` |
| Concurrent promote | Transaction advisory lock |
| Primary-source definition | `is_primary_market_access_source` |
| Kill switch | `platform_feature_flags` + per-country freeze |
| Audit / revert | `regulatory_tier_audit` + `market_access_proposals` |
| Public DTO safety | Public view exposes only iso, name, region, status, timestamps |

## Ops notes

- Auto-apply starts **enabled**. Turn it off immediately if a bad flip is observed.
- Prefer adding native primary regulators (BfArM, ANVISA, INVIMA, gazettes) to raise auto-apply quality — see `docs/SOURCE_EXPANSION_PLAN.md`.
- For tier-1 markets you can freeze them until primary-source coverage is solid.
