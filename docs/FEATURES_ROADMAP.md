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
| Watchlist interactive rule builder | ✅ Complete | `components/dashboard/pages/WatchlistPage.tsx` |
| Public supplier directory | ✅ Complete | `/supplier-directory` |
| BNPL / financing inquiry | ✅ Complete (inquiry + embed slot) | `/marketplace/financing` + `PartnerEmbedSlot` (`NEXT_PUBLIC_HARBOURVIEW_BNPL_EMBED_URL`) |
| AI personalized briefings | ✅ Complete (spine + email) | cadence API, MyBriefingsPanel, personal-briefings-tick + Resend |
| PROJECT_REGISTRY reconciliation | ✅ Complete (scoped) | Live RLS/Vercel re-verify remains HOLD |

## Phase 2 — In progress (2026-08-18)

| Item | Status | Evidence |
|------|--------|----------|
| Corridor Execution Plan v1 | ✅ Shipped | `/api/corridor-plan`, `/intelligence/corridor-plan`, `/dashboard/corridor-plan` |
| Logistics simulator | ✅ Shipped | `/intelligence/logistics-simulator` |
| Landed cost calculator | ✅ Shipped | `/api/landed-cost`, `/intelligence/landed-cost` |
| Briefing cadence + email | ✅ Shipped | briefingCadence, personalBriefingEmail, cron |
| Genetics public catalog | ✅ Shipped | `/marketplace/genetics` + `[slug]` passport depth |
| PWA spine | ✅ Shipped | `manifest.webmanifest`, `sw.js`, `RegisterServiceWorker`, layout metadata |
| Education CPD / certificates | ✅ Shipped (spine) | `/education/cpd`, `cpdCatalog`, certificate interest → marketplace_inquiries |
| BNPL partner embed | ✅ Shipped (slot) | Env-gated iframe; no fake partner UI |
| Operator tools hub (CC-adjacent) | ✅ Shipped | `/dashboard/tools` — avoids 650k CommandCentre.tsx edit |
| Mobile globe | ⬜ Remaining | |
| Partner-accredited CPD issuance | ⬜ Remaining | Requires commercial education partner |
| Full PROJECT_REGISTRY live re-verification | ⬜ HOLD | Requires operator production access |

## Next Action

1. Production smoke of all Phase 2 public + auth routes after Vercel READY.
2. Set `NEXT_PUBLIC_HARBOURVIEW_BNPL_EMBED_URL` when partner contract is live.
3. Mobile globe / map when product prioritises geographic discovery.
4. Accredited CPD issuance only with named professional-body partnership.
