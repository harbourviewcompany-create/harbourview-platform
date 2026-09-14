# Interactive Charts — Wiring Guide

## Status
- Core components: PR #1832 / included in `feat/interactive-charts-wiring`
- Wiring + CTA + production fixes: PR #1833
- Mobile mount: `feat/mobile-charts-workspace`

## Required dependencies
```bash
npm install recharts framer-motion html-to-image jspdf
# Commit the resulting package-lock.json before merge
```

## Production readiness (2026-09-13)
| Item | Status |
|------|--------|
| Select API (native, matches `components/ui/select.tsx`) | Fixed |
| Live data transform (`chartDataFromSignals`) | Done — pass `CommandCentreSignal[]` into panel |
| Command Centre styling tokens | Aligned (gold/dark panel) |
| Smoke test | `tests/dashboard/chartDataFromSignals.test.ts` |
| package-lock.json | **Must run `npm install` locally and commit lockfile** |

## Mount (implemented)
- Desktop: `/dashboard?tool=charts` → `DesktopCommandWorkspace` → `InteractiveChartsPanel`
- Mobile: `/dashboard?tool=charts` → `MobileChartsWorkspace` → `InteractiveChartsPanel`
  - Hosted from `DashboardResponsiveShell` when `isMobile` (max-width 767px)
  - `MarketplaceWorkspacePanel` explicitly ignores `charts` so intake UI does not flash
- CTA: Next Actions → “Open interactive charts” (`buildChartsToolHref`)

## Live data
`InteractiveChartsPanel` accepts `signals?: CommandCentreSignal[]`.
`chartDataFromSignals` aggregates public-safe fields only.
Pass session signals into the panel; do not call service-role fetchers from the client.

## Public/private boundary
`routeToOpportunity` only passes public-safe fields (`country`, `signalType`, `score`, `id`).

## Reduced motion
Charts respect `prefers-reduced-motion` via Framer Motion `useReducedMotion`.

## Evidence
- Date: 2026-09-14
- Scope: Mobile Interactive Charts mount parity
- Changes: `MobileChartsWorkspace` host; shell wire; marketplace panel exclusion; docs
- Status: code complete; visual QA on mobile viewport pending
