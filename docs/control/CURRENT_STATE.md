# Harbourview Current State

Last updated: 2026-05-28
Status: Finish-line reset scaffold
Authority: Canonical current-state worksheet for Harbourview finish-line execution

## Purpose

This document captures the current Harbourview build state from verified current sources only. It must not import stale facts from old Notion pages, Google Drive files, Linear tickets, Monday boards, prior chats, or AI-generated plans unless those sources are explicitly promoted into the current source-of-truth packet.

Pass 1 intentionally creates the structure without pretending to know every current state fact. Later passes must fill unknowns from current repo, deployment, CI, and approved evidence.

## Current Repo State

| Field | Current value | Evidence | Status |
|---|---|---|---|
| Repository | `harbourviewcompany-create/harbourview-platform` | Connected GitHub repo lookup during Pass 1 | Confirmed |
| Default branch | `main` | Connected GitHub repo lookup during Pass 1 | Confirmed |
| Active implementation branch | To be confirmed per task | Not captured in Pass 1 | Unknown |
| Current commit | To be captured in Pass 2+ | Not captured in Pass 1 | Unknown |
| Open PRs relevant to finish line | To be captured in Pass 2+ | Not captured in Pass 1 | Unknown |
| Last merged PR relevant to finish line | To be captured in Pass 2+ | Not captured in Pass 1 | Unknown |

## Current Deployment State

| Field | Current value | Evidence | Status |
|---|---|---|---|
| Production URL | To be confirmed | Not captured in Pass 1 | Unknown |
| Preview URL | To be confirmed per active PR | Not captured in Pass 1 | Unknown |
| Last verified deployment | To be confirmed | Not captured in Pass 1 | Unknown |
| Known deployment issues | To be confirmed | Not captured in Pass 1 | Unknown |
| Production write gates | To be confirmed before any production write | Not captured in Pass 1 | Unknown |

## Current Feature State

Use only current repo, deployment, CI, and evidence-backed checks to fill this table.

| Area | Status | Evidence | Notes |
|---|---|---|---|
| Homepage | Unknown | Pending Pass 2+ verification | Do not infer from old screenshots or plans |
| Public route structure | Unknown | Pending Pass 2+ verification |  |
| Marketplace hub | Unknown | Pending Pass 2+ verification |  |
| Marketplace listings | Unknown | Pending Pass 2+ verification |  |
| Seller intake | Unknown | Pending Pass 2+ verification |  |
| Wanted requests | Unknown | Pending Pass 2+ verification |  |
| Intake / confidential discussion flow | Unknown | Pending Pass 2+ verification |  |
| Signals route | Unknown | Pending Pass 2+ verification |  |
| Intelligence route | Unknown | Pending Pass 2+ verification |  |
| Admin shell | Unknown | Pending Pass 2+ verification |  |
| Admin authorization | Unknown | Pending Pass 2+ verification |  |
| Auth roles | Unknown | Pending Pass 2+ verification |  |
| Database migrations | Unknown | Pending Pass 2+ verification |  |
| RLS policies | Unknown | Pending Pass 2+ verification |  |
| Public/private leakage controls | Unknown | Pending Pass 2+ verification |  |
| CI workflows | Unknown | Pending Pass 2+ verification |  |
| Build/typecheck/lint/test gates | Unknown | Pending Pass 2+ verification |  |

## Known Blockers

Pass 1 should not invent blockers. Add blockers only when supported by current evidence.

| Blocker | Severity | Blocks build? | Required decision/evidence | Status |
|---|---:|---|---|---|
| Current repo/deployment state not yet captured in this reset packet | Medium | No, unless executing environment-specific work | Capture current branch, commit, PR, deployment, and verification state in Pass 2+ | Open |

## Known Risks That Do Not Block Build

| Risk | Assumption | Mitigation |
|---|---|---|
| Old unlinked material may contain stale or hallucinated instructions | It is non-authoritative by default | Use `SOURCE_OF_TRUTH.md` stale-context quarantine rule |
| Some current-state fields are unknown after Pass 1 | Unknowns are acceptable until relevant work begins | Fill from current repo/deployment evidence before affected execution |
| Notion, Drive, Linear, and Monday may contain duplicates | Cleanup is separate from finish-line execution | Do not read or use unlinked material for implementation |

## Completion Definition

Harbourview finish-line completion must be defined from current evidence in a later pass. Until then, the working completion definition is:

1. The current source-of-truth packet exists and is linked from the operating surfaces.
2. The current repo/deployment state is captured from live evidence.
3. The finish-line backlog contains only required completion work.
4. Active agents work only from the current packet and linked tickets.
5. Build, deployment, admin/auth/RLS, marketplace, and public/private leakage checks have evidence in `EVIDENCE_LOG.md`.

## Current-State Update Rule

When updating this document:

- Use evidence from current repo, branch, PR, deployment, CI, or approved linked artifacts.
- Do not use unlinked old Notion, Drive, Linear, Monday, prior-chat, or AI-generated content.
- If evidence is missing, write `Unknown` instead of guessing.
- Unknown does not automatically mean HOLD.
- HOLD only when the missing state affects a concrete execution task covered by the reduced GO/HOLD policy in `SOURCE_OF_TRUTH.md`.

## Pass 1 Verification Status

Pass 1 created this current-state scaffold only.

Expected Pass 1 evidence:

- No app code changed.
- No schema changed.
- No route changed.
- No auth/RLS changed.
- No deployment setting changed.
- No Notion, Drive, Linear, or Monday workspace changed.
