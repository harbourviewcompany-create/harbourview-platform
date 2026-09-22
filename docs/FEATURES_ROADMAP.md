# Harbourview Platform - Comprehensive Features Roadmap

**Status**: Active Planning Document  
**Owner**: Tyler / Harbourview Team  
**Last Updated**: September 22, 2026  
**Purpose**: Single source of truth for all planned features. All implementation must reference this document and update PROJECT_REGISTRY.md.

## Phase 0–1 — CLOSED (2026-07-28)

See prior audit. Public supplier directory closed in `e0f87ff`.

## Phase 2 — Feature spines (2026-08-18) — SHIPPED

| Item | Status | Evidence |
|------|--------|----------|
| Corridor Execution Plan v1 | ✅ | `/api/corridor-plan`, `/intelligence/corridor-plan`, `/dashboard/corridor-plan` |
| Corridor coverage transparency | ✅ | `/api/corridor-coverage`, `/intelligence/corridor-coverage` |
| Logistics simulator | ✅ | `/intelligence/logistics-simulator` |
| Landed cost calculator | ✅ | `/api/landed-cost`, `/intelligence/landed-cost` |
| Briefing cadence + email | ✅ | briefing preferences API, personal-briefings-tick, Resend |
| Genetics public catalog | ✅ | `/marketplace/genetics` + passport detail |
| PWA spine | ✅ | manifest + SW |
| Education CPD / certificates | ✅ spine | `/education/cpd` |
| BNPL partner embed | ✅ slot | env-gated iframe |
| Operator tools hub | ✅ | `/dashboard/tools` |
| Orientation feedback loop | ✅ | `POST /api/orientation-feedback` |
| Production smoke checklist | ✅ docs | `docs/control/PHASE2_PRODUCTION_SMOKE.md`, `scripts/smoke-phase2.sh` |
| Env wiring doc | ✅ | `docs/control/ENV_PHASE2_WIRING.md` |
| Registry Phase 2 rows | ✅ docs | `docs/control/PHASE2_REGISTRY_ROWS.md` |

## Phase 3 — Signal enrichment + full briefing automation (IN PROGRESS — 2026-09)

Goal: close the loop from external media → classified signals → personalized, scheduled briefings so the live feed and digests stay fresh and commercially useful.

| Item | Status | Notes / Evidence |
|------|--------|------------------|
| Meltwater connector (production-grade) | ✅ | Hashing, snapshot mapping, real HTTP client, safe no-op |
| meltwater-enrich cron (production-grade) | ✅ | Writes `source_snapshots` with `pending_extraction`, content-hash dedupe, metrics, schema-tolerant insert |
| BigQuery enrichment skeleton | ✅ | `lib/connectors/bigquery.ts` + SQL template |
| Digest narrative optimization | ✅ | Stronger commercial framing |
| Personal briefings tick | ✅ | Already live; Resend + cadence |
| Canonical pipeline integration | ✅ | source_snapshots → intelligence-extract → promote |
| BigQuery job for bulk quality re-score | ⬜ | After credentials |
| Preference storage + calendar sync | ⬜ | HubSpot / Google Calendar stubs present |
| Unified signal store cleanup | ⬜ | Address parallel tables |
| Feed freshness SLO (promote within 24–48 h) | ◐ partial | Product thresholds in `lib/dashboard/pipelineSlo.ts` (6h healthy / 24h warning); Briefing `/api/dashboard/pipeline-health`; SignalStrip content band aligned to same SLO; ops still need Meltwater + promote cadence monitoring |

## Still operator / partner dependent

| Item | Status | Notes |
|------|--------|-------|
| Live production HOLD gates | ⬜ HOLD | Leakage, admin denial, secret mapping — operator |
| Repo public vs private | ⬜ Decision | Tyler — registry Master Register |
| Partner-accredited CPD issuance | ⬜ | Commercial education partner |
| Live BNPL partner URL | ⬜ | Set `NEXT_PUBLIC_HARBOURVIEW_BNPL_EMBED_URL` |
| Mobile globe | ⬜ | Product priority |
| Published playbooks for all tracked corridors | ⬜ editorial | Use coverage API to prioritise |

## Next Action

1. Create/select a `source_registry` row for Meltwater and set `MELTWATER_SOURCE_ID`.
2. Provision `MELTWATER_API_KEY` + `MELTWATER_SEARCH_IDS`.
3. Dry-run `meltwater-enrich?dry=1`, then live; confirm `source_snapshots` rows with `pending_extraction`.
4. Monitor next `intelligence-extract` (04:00 UTC) and digests/briefings.
5. Decide repository visibility and update PROJECT_REGISTRY.
