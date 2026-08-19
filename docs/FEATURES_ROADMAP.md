# Harbourview Platform - Comprehensive Features Roadmap

**Status**: Active Planning Document  
**Owner**: Tyler / Harbourview Team  
**Last Updated**: August 18, 2026  
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

1. Run `bash scripts/smoke-phase2.sh` (or BASE=custom domain).
2. Complete `PHASE2_PRODUCTION_SMOKE.md` sections D–G.
3. Publish missing playbooks for non-plan-ready tracked corridors.
4. Decide repository visibility and update PROJECT_REGISTRY.
