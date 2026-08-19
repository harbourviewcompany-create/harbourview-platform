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
| Corridor Execution Plan v1 | ✅ Shipped (this PR) | `lib/intelligence/workflowEngine.ts` expanded (product class, doc checklist, trust meta, more CORRIDOR_NOTES); `GET /api/corridor-plan`; public `/intelligence/corridor-plan`; `lib/intelligence/corridorSimulator.ts` |
| Logistics & trade route simulator (orientation) | 🟡 Partial | `tradeCorridors.ts` + simulator helpers + link from corridor-plan; interactive UI depth still Phase 2 follow-up |
| LLM synthesis job for daily/weekly briefings | ⬜ Remaining | Spine exists (`personalBriefing.ts`, `/api/dashboard/my-briefings`) |
| Email / in-app delivery via signal subscription | ⬜ Remaining | |
| User preference storage for cadence and markets | ⬜ Remaining | `user_dashboard_preferences` exists for country/role/heatmap only |
| Mobile globe + PWA | ⬜ Remaining | |
| Genetics marketplace core beyond basic catalog | ⬜ Remaining | |
| Education CPD / certificates / premium modules | ⬜ Remaining | |
| Full BNPL partner embed | ⬜ Remaining | |
| Full PROJECT_REGISTRY live re-verification | ⬜ HOLD | Requires operator production access |

## Next Action

1. Production smoke: `/intelligence/corridor-plan?origin=CA&destination=DE`, `/api/corridor-plan?origin=CA&destination=DE`.
2. Wire corridor plan into Command Centre Compliance / trade-calc panel if product prioritises authenticated depth next.
3. Briefings Phase 2 depth: cadence preferences + scheduled synthesis + delivery.
