# Market Entry OS — Scaffold

**Status:** Execution-layer composition scaffold (v1)
**Date:** 2026-09-12

## What this delivers

Composes existing intelligence into explicit execution engines:

| Engine | Module | Source |
|--------|--------|--------|
| Workflow | `lib/intelligence/workflowEngine.ts` | Playbook steps + corridor depth |
| Documentation | `lib/market-entry-os/documentationEngine.ts` | Checklist from plan |
| Cost | `lib/market-entry-os/costEngine.ts` | Playbook cost ranges |
| Timeline | `lib/market-entry-os/timelineEngine.ts` | Step weeks + critical path |
| Compose | `lib/market-entry-os/index.ts` | `buildMarketEntryPlan()` |

## Coverage (applicable trade jurisdictions)

Not the full UN list — only jurisdictions with a realistic medical/controlled-cannabis trade role (see `APPLICABLE_TRADE_JURISDICTIONS` in `tradeCorridors.ts`).

- **Europe** — EEA + CH + GB + several Balkan origins
- **Americas** — CA, US, MX, CO, UY, BR, AR, PE, CL, JM, PA, CR
- **MENA** — IL, TR, AE, MA
- **Africa** — ZA, LS, MW, RW, UG, GH, NG, ZW
- **APAC** — AU, NZ, TH, KR, JP, PH, IN, LK, SG

Full origin→destination matrix is generated for all role-compatible pairs.

## Data dependency

Plans require published `jurisdiction_playbooks` (or static fallback) for **both** origin and destination. Without a playbook, `buildMarketEntryPlan` returns `null`.

## Not in this scaffold

- `corridor_reports` persistence / purchase records
- Stripe one-time payment path
- UI mission workspace
- Fabricated regulatory data for countries outside playbook coverage
- Primary-source re-verification of retired tiers

## Usage

```ts
import { buildMarketEntryPlan, getCoverageStats } from '@/lib/market-entry-os'

const plan = await buildMarketEntryPlan('CA', 'DE', 'flower')
const stats = getCoverageStats()
```
