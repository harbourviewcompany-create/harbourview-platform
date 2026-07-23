# Command Centre CSS: Design-System Token & Accessibility Fixes

Status: proposed, unstarted. Scoped for direct pickup — no further audit needed.
Origin: findings from a Claude (chat) session reviewing `components/dashboard/CommandCentre.css`
(80KB) against `docs/control/DESIGN_SYSTEM.md` and `docs/control/DASHBOARD_DESIGN_HANDOFF.md`,
requested by Tc, 2026-07-23. Complements (does not duplicate) the data-wiring/monolith-split
findings in `docs/control/FRONTEND_DASHBOARD_OPTIMIZATION_PLAN.md` (PR #1083) — this doc covers
visual/CSS-layer issues only.

## Method note

All findings below are verified against the live file as of this session (fetched via
`get_blob`, not the lossy `get_file` — see `supabase/functions/github-bridge/index.ts`'s own
encoding-bug comment before re-reading this file for edits).

## Finding 1: token drift between spec and shipped CSS

`CommandCentre.css`'s `:root` block defines its own values that don't match the locked tokens in
`DESIGN_SYSTEM.md`/`DASHBOARD_DESIGN_HANDOFF.md`:

| Token | Shipped (CommandCentre.css) | Spec (DESIGN_SYSTEM.md) |
|---|---|---|
| gold primary | `--cc-gold: #d4a84b` | `#D9A441` |
| ink/text | `--cc-ink: #f5f0e8` | `#F7F1E6` |
| page background | `linear-gradient(135deg,#030711 0%,#07111d 47%,#030812 100%)` | `#02070D` base |
| panel background | (ad hoc per-component rgba) | `#08131F` |

**Task:** reconcile — either update `:root` to match the spec exactly, or update the spec if the
shipped values are the actual intended design (confirm with Tc which is source of truth before
editing either file).

## Finding 2: hardcoded colors bypass tokens

Dozens of status/badge selectors use inline hex/rgba instead of `var(--cc-*)`, e.g. `#e05555`,
`#5b9bd5`, `rgba(245,240,232,.45)`. A future palette change requires grepping the whole 80KB file
rather than editing `:root` once.

**Task:** add semantic status tokens to `:root` (`--cc-status-critical`, `--cc-status-warn`,
`--cc-status-ok`, `--cc-status-info` + translucent-background variants), then replace inline colors
with `var()` references throughout.

## Finding 3: only one responsive breakpoint

CSS has a single `@media (max-width:1024px)` collapsing straight to mobile layout. There's no
tablet/medium-desktop tier for the ~1024–1280px range, contrary to the 4-tier responsive model in
`DASHBOARD_DESIGN_HANDOFF.md`.

**Task:** add an intermediate breakpoint (e.g. `@media (max-width:1280px)`) for a two-column
tablet layout before the mobile collapse.

## Finding 4: no `prefers-reduced-motion` guard

`pulseDot`, `fadeSlideUp`, and the digest-pulse `@keyframes` animations run unconditionally.
`DESIGN_SYSTEM.md` explicitly requires reduced-motion support (documented for the globe; not
implemented here for these CSS animations).

**Task:** wrap all `@keyframes`-driven animation declarations in
`@media (prefers-reduced-motion: no-preference)`, or add a `(prefers-reduced-motion: reduce)`
override that sets `animation: none` on the affected classes.

## Finding 5: color-only status indicators

Several badges/dots (e.g. `.cc-status-dot`, impact/verify pills) communicate state through color
alone, with no icon or text redundancy — a colorblind-accessibility gap `DESIGN_SYSTEM.md` also
flags. Confirm against the TSX (`CommandCentre.tsx`, `MobileCommandCentre.tsx`) whether a text
label already renders alongside each dot before assuming a CSS-only fix suffices — some may need a
small TSX change to add an icon/label, not just CSS.

**Task:** audit each color-only indicator; add icon or text redundancy where missing.

## Finding 6: repeated table scaffolding

Marketplace/Regulatory Watch/Watchlist/Evidence tables each redefine near-identical
`grid-template-columns` header/row/mobile-breakpoint rules with hardcoded px widths, 3x per table.

**Task:** consolidate shared structural rules (sticky thead, row hover, cell truncation) into
grouped selectors across all four tables; keep only the per-table column-width declarations
separate.

## Suggested order of pickup

1. Finding 1 (token reconciliation) — blocks everything else; confirm source of truth first.
2. Finding 4 (reduced motion) — small, independent, no visual risk.
3. Finding 3 (tablet breakpoint) — independent, additive.
4. Finding 2 (hardcode → token replacement) — mechanical once Finding 1 is settled.
5. Finding 5 (accessibility redundancy) — needs the TSX check noted above.
6. Finding 6 (table dedupe) — largest diff, do last, in its own PR.

## Tooling note

`github-bridge` had no branch-creation operation when this session started, which blocks any
edit-and-push-back workflow that needs its own branch + PR rather than committing to an existing
one. Added `create_ref` (v11, `POST /git/refs`) to fix this — purely additive, no existing
operation changed. Deployed and verified working (branch `claude/dashboard-design-system-tokens`
created successfully from `main`).
