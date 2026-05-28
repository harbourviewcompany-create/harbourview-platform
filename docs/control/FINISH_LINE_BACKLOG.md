# Harbourview Finish-Line Backlog

Last updated: 2026-05-28
Status: Finish-line reset scaffold
Authority: Canonical completion backlog structure for Harbourview finish-line execution

## Purpose

This document replaces broad roadmap drift with a hard completion queue for the current Harbourview finish-line build.

It is not a product-vision document, future roadmap, workspace cleanup tracker, or idea backlog. It should contain only work required to complete the current Harbourview platform.

## Backlog Rule

Only add work to this backlog when it is required for finish-line completion and supported by current evidence or a Tyler-approved decision.

Do not import old Linear tickets, Notion tasks, Drive checklists, Monday items, or prior-chat plans automatically.

## Source Rule

Every active backlog item must have at least one current source:

- current repo evidence
- current CI/deployment evidence
- a linked issue/PR
- a Tyler-approved decision
- a verified gap recorded in `CURRENT_STATE.md`
- an evidence gap recorded in `EVIDENCE_LOG.md`

If the source is stale or unlinked, the item is not executable.

## Status Values

Use these statuses only:

- `Candidate`
- `Ready`
- `In Progress`
- `Evidence Needed`
- `Blocked`
- `Done`
- `Superseded`
- `Deferred`

`Blocked` should be used only when the reduced GO/HOLD policy applies.

## Required Before Completion

| ID | Work item | Source | Owner/agent | Evidence required | Status |
|---|---|---|---|---|---|
| HV-FL-001 | Create finish-line source-of-truth control docs | Tyler-approved Pass 1 instruction | ChatGPT/GitHub connector | Five docs under `docs/control/`; no non-doc changes | In Progress |
| HV-FL-002 | Capture current repo, branch, PR, deployment, and verification state | `CURRENT_STATE.md` unknown fields | TBD | Current commit, active PRs, deployment URLs, relevant checks | Candidate |
| HV-FL-003 | Convert verified finish-line gaps into active Linear tickets only | Requires HV-FL-002 | TBD | Linear ticket list linked to this packet | Candidate |
| HV-FL-004 | Link/create Notion Command Center mirror | Requires approval for Notion write | TBD | Notion page link; confirms repo docs remain authoritative | Candidate |
| HV-FL-005 | Create Drive evidence/archive folder structure | Requires approval for Drive write | TBD | Drive folder link and folder tree | Candidate |

## Required Before Public Use

| ID | Work item | Source | Owner/agent | Evidence required | Status |
|---|---|---|---|---|---|
| HV-PUBLIC-001 | Verify public routes and public/private leakage boundaries | To be confirmed from current repo/deployment state | TBD | Route probe results, forbidden-token leakage results, deployment URL | Candidate |

## Required Before Admin/Operator Use

| ID | Work item | Source | Owner/agent | Evidence required | Status |
|---|---|---|---|---|---|
| HV-ADMIN-001 | Verify admin access boundaries and role behavior | To be confirmed from current repo/deployment state | TBD | Auth/admin verification evidence; denied/allowed role matrix | Candidate |

## Required Before Marketplace Transaction Flow

| ID | Work item | Source | Owner/agent | Evidence required | Status |
|---|---|---|---|---|---|
| HV-MP-001 | Verify marketplace flow readiness from current code and deployment | To be confirmed from current repo/deployment state | TBD | Listing/seller/wanted/intake flow evidence as applicable | Candidate |

## Required Before Private Intelligence Work

| ID | Work item | Source | Owner/agent | Evidence required | Status |
|---|---|---|---|---|---|
| HV-INTEL-001 | Confirm intelligence/private-data boundaries before any private intelligence execution | To be confirmed from current repo/deployment state | TBD | Boundary verification evidence; no public leakage | Candidate |

## Required Before Production Writes

| ID | Work item | Source | Owner/agent | Evidence required | Status |
|---|---|---|---|---|---|
| HV-PRODWRITE-001 | Confirm production write gates and explicit approval before any production write smoke test | Reduced GO/HOLD policy | TBD | Required env gates, explicit approval, cleanup plan, evidence target | Candidate |

## Explicitly Deferred Until After Finish-Line Build

| Deferred item | Reason | Revisit trigger |
|---|---|---|
| Full historical Notion cleanup | Not required to complete the build if stale material is quarantined | After source-of-truth lock is live and agents are no longer using stale pages |
| Full Google Drive cleanup | Drive is evidence/archive only; cleanup can wait | After current evidence folder is created and linked |
| Full Linear backlog cleanup | Old tickets can be ignored unless active agents are using them | After active finish-line tickets are created |
| Monday integration/use | Adds another stale-context surface | Only if Tyler assigns a narrow post-finish-line role |
| New product roadmap expansion | Finish-line build must not broaden scope | After Harbourview completion approval |

## Ticket Template

Use this structure for every executable Linear or GitHub issue derived from this backlog:

```text
Title: HV-FL-[###] — [specific build outcome]

Objective:
[One concrete outcome required for finish-line completion.]

Canonical source:
- SOURCE_OF_TRUTH.md:
- CURRENT_STATE.md:
- FINISH_LINE_BACKLOG.md:
- Relevant PR/branch:

Allowed scope:
-

Out of scope:
-

Likely files touched:
-

Acceptance criteria:
-

Verification required:
-

Evidence required:
-

GO/HOLD:
GO if:
HOLD only if:
```

## Update Rule

When adding or changing backlog items:

- Do not add speculative work.
- Do not import old tasks automatically.
- Do not expand the product.
- Do not convert old plans into active tickets without current evidence.
- Keep completion work visible, but separate from deferred work.
- Use `Candidate` until evidence confirms the item is required.

## Pass 1 Verification Status

Pass 1 created this backlog scaffold only.

Expected Pass 1 evidence:

- No app code changed.
- No schema changed.
- No route changed.
- No auth/RLS changed.
- No deployment setting changed.
- No Notion, Drive, Linear, or Monday workspace changed.
