# Harbourview Platform - Comprehensive Features Roadmap

**Status**: Active Planning Document  
**Owner**: Tyler / Harbourview Team  
**Last Updated**: July 28, 2026  
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
| PROJECT_REGISTRY reconciliation | 🟡 Partial | Supplier directory + financing + my-briefings routes noted; full system-by-system re-verify still HOLD. |

## Phase 2 remaining depth (not residual blockers)

1. LLM synthesis job for daily/weekly briefings from watch rules  
2. Email / in-app delivery via signal subscription patterns  
3. User preference storage for cadence and markets  
4. Logistics & trade route simulator  
5. Mobile globe + PWA  
6. Genetics marketplace core beyond basic catalog  
7. Education CPD / certificates / premium modules  
8. Full BNPL partner embed  
9. Full PROJECT_REGISTRY live re-verification pass  

## Next Action

Prefer production smoke on `/marketplace/financing`, `/dashboard/my-briefings`, `/supplier-directory`, and dashboard watchlist. Then either LLM briefing synthesis or registry reconciliation.
