# Harbourview Platform - Comprehensive Features Roadmap

**Status**: Active Planning Document  
**Owner**: Tyler / Harbourview Team  
**Last Updated**: August 18, 2026  
**Purpose**: Single source of truth for all planned features. All implementation must reference this document and update PROJECT_REGISTRY.md.

## Phase 0–1 — CLOSED (2026-07-28)

See prior audit. Public supplier directory closed in `e0f87ff`.

## Residual closure pass (2026-07-28, same session)

| Residual | Status | Evidence |
|----------|--------|----------|
| Watchlist interactive rule builder | ✅ Complete (was already live) | `components/dashboard/pages/WatchlistPage.tsx` — add/pause/delete `cc_watch_rules`, items CRUD, notifications. Public `/intelligence/watchlists` updated to point at Command Centre + My Briefings. |
| Public supplier directory | ✅ Complete | `/supplier-directory` list + `/supplier-directory/[id]` (`e0f87ff`) |
| BNPL / financing inquiry | ✅ Complete (inquiry spine) | `/marketplace/financing` + `submitFinancingInquiry` → `marketplace_inquiries` with `inquiry_type=trade_financing` (no new table; avoids migration drift). Partner embed remains Phase 3. |
| AI personalized briefings spine | ✅ Complete (spine) | `/dashboard/my-briefings` — authenticated; assembles active watch rules + published jurisdiction briefings. Full LLM synthesis / email delivery still Phase 2 depth. |
| PROJECT_REGISTRY reconciliation | ✅ Complete (scoped code-presence) | Supplier directory public surface, financing, my-briefings, watchlists routes registered in `docs/control/PROJECT_REGISTRY.md`. Full system-by-system live RLS/Vercel re-verify remains Phase 2 HOLD (requires operator production access). |

## Phase 2 — In progress (2026-08-18)

| Item | Status | Evidence |
|------|--------|----------|
| Corridor Execution Plan v1 | ✅ Shipped | `lib/intelligence/workflowEngine.ts`; `GET /api/corridor-plan`; `/intelligence/corridor-plan`; `lib/intelligence/corridorSimulator.ts` |
| Logistics & trade route simulator | ✅ Shipped | `/intelligence/logistics-simulator` + `tradeCorridors.ts` filters |
| Dashboard corridor plan panel | ✅ Shipped | `/dashboard/corridor-plan` (auth; avoids editing 650k CommandCentre.tsx) |
| Briefing cadence preferences | ✅ Shipped | `lib/intelligence/briefingCadence.ts`; `GET/PATCH /api/dashboard/briefing-preferences`; MyBriefingsPanel cadence UI |
| LLM synthesis + email delivery | ✅ Shipped (spine) | `personal-briefings-tick` cron + `lib/intelligence/personalBriefingEmail.ts` (Resend); requires RESEND_API_KEY |
| Landed cost calculator (public) | ✅ Shipped | `GET /api/landed-cost`; `/intelligence/landed-cost`; bridges from corridor plan via `landedCostBridge.ts` |
| Mobile globe + PWA | ⬜ Remaining | |
| Genetics marketplace core beyond basic catalog | ⬜ Remaining | Cultivar passport + access request exist; commercial depth still thin |
| Education CPD / certificates / premium modules | ⬜ Remaining | |
| Full BNPL partner embed | ⬜ Remaining | |
| Full PROJECT_REGISTRY live re-verification | ⬜ HOLD | Requires operator production access |

## Next Action

1. Production smoke: corridor-plan, logistics-simulator, landed-cost, briefing preference PATCH, personal-briefings-tick `?dry=1`.
2. Genetics: public comparison / passport depth without commercial leakage.
3. Optional: in-CC nav entry for corridor-plan without large CommandCentre edit.
4. Education / BNPL partner embed when commercial partners are ready.
