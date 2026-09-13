# Interactive Charts — Wiring Guide

## Status
- Core components live on branch `feat/interactive-charts-complete` (PR #1832)
- This follow-up adds dependencies + a mountable panel

## Required dependencies
```bash
npm install recharts framer-motion html-to-image jspdf
```

## Safe mount options (do not edit CommandCentre.tsx directly)

### Option A — DesktopCommandWorkspace tool
1. Add `'charts'` to `WORKSPACE_TOOLS` in `DesktopCommandWorkspace.tsx`
2. Render `<InteractiveChartsPanel />` when `tool === 'charts'`
3. Open via `?tool=charts`

### Option B — Command Centre module registry
Add a new entry in `lib/platform/commandCentreRegistry` that points to the panel.

### Option C — Temporary test mount
Import and render the panel next to an existing workspace for visual QA, then remove.

## Public/private boundary
`routeToOpportunity` only passes public-safe fields (`country`, `signalType`, `score`, `id`).
No private provenance or contact data is exposed.

## Reduced motion
Both charts respect `prefers-reduced-motion` via Framer Motion's `useReducedMotion`.
