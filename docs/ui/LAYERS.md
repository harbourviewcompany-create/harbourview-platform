# Harbourview UI stacking layers

Use this ladder so full-screen Market sheets stay above shell chrome.

| Layer | z-index | Notes |
|-------|---------|--------|
| Content | 0–1 | Main scroll regions |
| Sticky section chrome | 5–10 | In-pane sticky headers |
| Secondary nav / context rail | 5 | `.hvm-op-secondary-nav` |
| Bottom nav | ~20–40 | Mobile command chrome |
| **Portaled sheets** | **10000** (`--hv-portal-z`) | Product detail, inquiry, financing |

## Rules

1. Full-screen overlays **must** use `AppPortal` (mounts into `#hvm-portal-root`).
2. Do not rely on a large `z-index` inside `.hvm-op-main` — parent stacking contexts trap it under the secondary rail.
3. `position: fixed` does not escape a parent stacking context.
4. Representative media badges remain buyer-visible when media kind is `representative` (media trust policy).
