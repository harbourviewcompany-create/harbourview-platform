# Harbourview Source of Truth

Last updated: 2026-05-28
Status: Finish-line reset scaffold
Authority: Canonical index for Harbourview finish-line build execution

## Purpose

This document locks the source-precedence model for Harbourview finish-line execution. It exists to prevent stale Notion pages, Google Drive files, Linear tickets, Monday items, prior chats, and AI-generated plans from drifting the project.

This is not a historical cleanup project. This is a finish-line control reset so the current platform can be completed from a small, current, evidence-backed packet.

## Current Canonical Packet

The canonical Harbourview finish-line packet is:

1. `docs/control/SOURCE_OF_TRUTH.md`
2. `docs/control/CURRENT_STATE.md`
3. `docs/control/FINISH_LINE_BACKLOG.md`
4. `docs/control/AGENT_HANDOFF.md`
5. `docs/control/EVIDENCE_LOG.md`

Agents may use only this packet plus explicitly linked current sources.

## Repository Authority

- Repository: `harbourviewcompany-create/harbourview-platform`
- Default branch observed for this reset: `main`
- Active implementation branch: To be confirmed per task or PR
- Production deployment: To be confirmed in `CURRENT_STATE.md`
- Preview deployment: To be confirmed in `CURRENT_STATE.md`

## Source Precedence

When sources conflict, use this order:

1. Current repository code on the confirmed target branch
2. These repo control docs under `docs/control/`
3. The Harbourview Command Center Notion page, once linked here
4. Active Linear tickets linked from this packet or the Command Center
5. Google Drive evidence linked from `EVIDENCE_LOG.md`
6. All other material is non-authoritative by default

## Tool Roles

### GitHub

GitHub is the implementation authority. Code, migrations, tests, workflows, PRs, branches, and repo control docs are the highest source for build execution.

### Notion

Notion is the command dashboard and human-readable mirror. It must point back to this packet. It must not contain competing implementation truth.

### Linear

Linear is the active finish-line execution queue only. A Linear ticket is executable only when it links back to this packet or to the approved Harbourview Command Center.

### Google Drive

Google Drive is evidence and artifact storage. Drive files are not authoritative unless linked from this packet, the Command Center, or `EVIDENCE_LOG.md`.

### Monday

Monday is parked for Harbourview finish-line execution. Agents must not read from or write to Monday for Harbourview unless Tyler explicitly assigns Monday a narrow role later.

## Product Identity Lock

Current product identity is intentionally not restated from old material during Pass 1. It must be filled from verified current repo/deployment state and Tyler-approved source material in a later pass.

Until then:

- Do not infer product positioning from old pages, old tickets, old decks, old chats, or old AI plans.
- Do not broaden Harbourview into a new product category.
- Do not reduce Harbourview into a generic marketplace, listing board, CRM, dashboard, or website.
- Use only current, linked, approved source material.

## Finish-Line Scope Lock

The finish-line build must focus on completing the current Harbourview platform, not rebuilding strategy history.

In scope for the reset:

- Locking authority hierarchy
- Capturing current state
- Defining finish-line backlog
- Creating agent handoff rules
- Recording evidence
- Enabling controlled build execution

Out of scope for Pass 1:

- App code changes
- Route changes
- Database/schema changes
- Auth/RLS changes
- Deployment settings changes
- Notion changes
- Google Drive changes
- Linear changes
- Monday changes
- Historical cleanup
- Deleting, renaming, archiving, or moving old material

## Stale-Context Quarantine Rule

Any Harbourview-related Notion page, Google Drive file, Linear ticket, Monday item, prior chat, AI-generated plan, exported document, checklist, roadmap, or strategy note is non-authoritative unless explicitly linked from:

1. `docs/control/SOURCE_OF_TRUTH.md`
2. `docs/control/CURRENT_STATE.md`
3. `docs/control/FINISH_LINE_BACKLOG.md`
4. `docs/control/AGENT_HANDOFF.md`
5. `docs/control/EVIDENCE_LOG.md`
6. The approved Harbourview Command Center Notion page, once created and linked here

Agents must not search old workspaces and infer current direction from stale material.

If stale material appears useful, the agent may identify it as a candidate reference, but must not use it for implementation unless Tyler approves it or it is promoted into the current source-of-truth packet.

## Reduced GO/HOLD Policy

The Harbourview finish-line process is execution-first. HOLD is reserved for material blockers only.

### Return GO when

- The assigned scope is complete.
- Relevant checks pass or are explicitly not applicable.
- Changed files are listed.
- Evidence is captured or the evidence gap is clearly identified.
- No critical blocker remains.
- Assumptions are documented.
- No public/private leakage risk is introduced.
- No destructive change was made without approval.

### Return HOLD only for

1. Destructive database/schema migration risk
2. Production write risk without explicit approval
3. Credential, secret, or security exposure
4. Public/private data leakage risk
5. Unclear repo, branch, deployment, or target environment for an execution task
6. Irreversible deletion, archive, rename, or move action
7. Directly conflicting active instructions inside the current packet
8. Failed build, test, deploy, or verification check directly relevant to the assigned task

### Do not HOLD for

- Normal ambiguity that can be handled with a stated assumption
- Missing historical context
- Old unlinked Notion, Drive, Linear, Monday, or prior-chat material
- Speculative future roadmap questions
- Incomplete workspace cleanup
- Lack of perfect documentation
- Style uncertainty
- Non-critical TODOs

Default behavior for normal uncertainty:

`State assumption -> proceed safely -> report evidence.`

## Override Rule

Only Tyler can override this source-of-truth model.

Any override must state:

- What is being changed
- Why it is being changed
- What it supersedes
- Whether it affects code, schema, deployment, public/private boundaries, or active tickets

## Pass 1 Verification Status

Pass 1 is documentation-only.

Expected Pass 1 evidence:

- These five control docs exist under `docs/control/`.
- No app code changed.
- No schema changed.
- No route changed.
- No auth/RLS changed.
- No deployment setting changed.
- No Notion, Drive, Linear, or Monday workspace changed.
