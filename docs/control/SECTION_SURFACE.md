# Section surface infrastructure (launch quality)

## Purpose

Every product section — Command, Marketplace, Intel, Clinical, Genetics, public marketing — must share one institutional surface language. This file is the control for that infrastructure.

Authority for colour and tone remains `DESIGN_SYSTEM.md`.

## Single material stack

| Layer | Source |
|-------|--------|
| Tokens | `styles/design-tokens.css` + `lib/harbourview/design-tokens.ts` |
| Surfaces | `components/ui/HarbourviewPanel.tsx` |
| Public pages | `components/PublicUi.tsx` (wraps shared primitives) |
| Mobile Command | `SectionUI` + `hvm2-*` layout CSS (palette via `--hvm2-*` aliases) |
| Market routing | `HarbourviewBottomSheet` / `RouterBottomSheet` |

## Required primitives

Use these instead of inventing local navy/gold chrome:

- **`HarbourviewCard`** — section tiles (`tone`: `default` | `priority` | `public` | `bare`)
- **`HarbourviewPanel` / `HarbourviewBottomSheet`** — overlays and routing sheets
- **`HarbourviewSectionHeader`** — eyebrow + serif title + body
- **`SectionShell`** — every mobile Command `SectionId`
- **`PublicSection` / `PublicCard` / `SectionHeader`** — public marketing

## Command sections (all `SectionId`s)

All 25 section ids under `contracts.ts` must render inside `SectionShell` (or the overview operator equivalent) so:

1. Eyebrow / title / description hierarchy is consistent
2. Borders and type use token-backed `--hvm2-*` / `--hv-*`
3. Empty states use `EmptyState` (command) or public `EmptyState`
4. Cards use `CommandCard` / `HarbourviewCard`, not one-off gradients

When pairing with legacy `.hvm2-command-brief` / `.hvm2-priority-card`, use `CommandCard tone="bare"` so CSS owns padding/border.

## Public and intel

- Public heroes and sections: `PublicUi` only (tokenized)
- Country intelligence map: shared card + `--hv-*` field; SVG map constants may hold brand hex for stroke fills

## Forbidden

- New hardcoded `#c6a55a` / alternate navy in section-level UI
- Neon, crypto gradients, fake “live demand” chrome
- Parallel design-token files that redefine core brand hex

## Completion check

A section is launch-surface-ready when:

1. It uses shared primitives or `SectionShell`
2. Colours resolve through `--hv-*` / aliases
3. Empty / loading / error states exist and stay institutional
4. Reduced-motion and focus rings are respected on interactive controls
