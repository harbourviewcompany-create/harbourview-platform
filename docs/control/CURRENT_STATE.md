# Harbourview Current State

Last updated: 2026-05-28
Status: Pass 1.5 working-alpha scope lock

## Current Completion Target

The current target is working-platform / operator-ready alpha, not public launch.

The immediate objective is to make Harbourview coherent, navigable, and mostly working.

## Priority Order

1. Fix the globe.
2. Fix routing and navigation to the dashboard.
3. Make the dashboard route work reliably.
4. Make the dashboard look and function like the intended Harbourview operating surface.
5. Ensure Marketplace, Intelligence, Education, and other major sections contain useful content or clear gap states.
6. Capture evidence for what works and what remains.

## Current Repo State

| Field | Current value | Status |
|---|---|---|
| Repository | `harbourviewcompany-create/harbourview-platform` | Confirmed |
| Default branch | `main` | Confirmed |
| Active implementation branch | To be confirmed before code patching | Unknown |
| Current implementation state | Needs targeted repo inspection | Unknown |

## Current Feature State

| Area | Target for working-alpha | Current state |
|---|---|---|
| Globe | Usable, stable, aligned with Harbourview | Needs inspection |
| Dashboard route | Reliable route from site navigation | Needs inspection |
| Dashboard surface | Real Harbourview operating surface, not generic placeholder | Needs inspection |
| Core routing | No dead ends in core experience | Needs inspection |
| Marketplace | Useful content or clear gap state | Needs inspection |
| Intelligence | Useful content or clear gap state | Needs inspection |
| Education | Useful content or clear gap state | Needs inspection |
| Admin/operator area | Clear route/state if part of current dashboard path | Needs inspection |
| Evidence | Current checks recorded in `EVIDENCE_LOG.md` | Incomplete |

## Known Build Direction

The next build work should inspect and patch the actual app experience, starting with globe, dashboard route, dashboard UI, routing, and section coverage.

Do not start with public-launch hardening, broad workspace cleanup, or speculative roadmap expansion.

## Stale Context Rule

Unlinked Notion pages, Drive files, Linear tickets, Monday items, prior chats, and old AI-generated plans are not current instructions.

## Current GO/HOLD

GO to inspect and patch the working-alpha core experience.

HOLD only for material execution blockers such as destructive schema changes, production writes without approval, credential exposure, unclear target branch/environment, irreversible workspace actions, or failed relevant verification.
