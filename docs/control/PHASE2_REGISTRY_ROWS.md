# Phase 2 systems — registry catch-up (2026-08-18)

**Status:** Code-presence registration for systems shipped on `main` through material-gaps closure.  
**Not** a full live RLS / deployment re-verification (see `PROJECT_REGISTRY.md` HOLD gates).

| System | Routes / key files | Tables / data | Status |
|--------|--------------------|---------------|--------|
| Corridor execution plan | `/intelligence/corridor-plan`, `/dashboard/corridor-plan`, `GET /api/corridor-plan`, `lib/intelligence/workflowEngine.ts` | `jurisdiction_playbooks` (published) | Active — orientation |
| Corridor coverage transparency | `/intelligence/corridor-coverage`, `GET /api/corridor-coverage` | Same playbooks + `TRADE_CORRIDORS` | Active |
| Logistics simulator | `/intelligence/logistics-simulator`, `tradeCorridors.ts` | Static corridor reference | Active |
| Landed cost calculator | `/intelligence/landed-cost`, `GET /api/landed-cost`, `landedCostData.ts` | Static reference economics | Active |
| Briefing cadence + email | `/api/dashboard/briefing-preferences`, `personal-briefings-tick`, `personalBriefingEmail.ts` | `signal_subscriptions` | Active when Resend/cron wired |
| Genetics public catalog | `/marketplace/genetics`, `/marketplace/genetics/[slug]` | `cultivar_passports` RLS public | Active |
| Education CPD spine | `/education/cpd`, `cpdCatalog.ts`, `submitCpdCertificateInterest` | `marketplace_inquiries` (`cpd_certificate_interest`) | Active spine |
| BNPL embed slot | `/marketplace/financing`, `PartnerEmbedSlot` | Env URL + `trade_financing` inquiries | Slot ready; partner optional |
| Operator tools hub | `/dashboard/tools` | Auth only | Active |
| PWA | `manifest.webmanifest`, `sw.js`, `RegisterServiceWorker` | — | Progressive enhancement |
| Orientation feedback | `POST /api/orientation-feedback` | `marketplace_inquiries` (`orientation_feedback`) | Active |

**Registry impact:** Additive documentation. Canonical Vercel/Supabase HOLD gates in `PROJECT_REGISTRY.md` unchanged until operator completes `PHASE2_PRODUCTION_SMOKE.md`.

**Open decision:** Repository visibility (public vs private) — see PROJECT_REGISTRY Master Register; not changed by this doc.
