# Harbourview Agent Handoff

Last updated: 2026-05-28
Status: Finish-line reset scaffold
Authority: Canonical handoff instructions for Harbourview agents

## Purpose

This document defines how Codex, Claude, Grok, Gemini, ChatGPT, and other agents must work on Harbourview finish-line execution without drifting into stale context or unnecessary hard stops.

The goal is to get Harbourview built from current truth, not to let agents reinterpret old workspaces.

## Read First

Before execution, agents must read the current Harbourview source-of-truth packet:

1. `docs/control/SOURCE_OF_TRUTH.md`
2. `docs/control/CURRENT_STATE.md`
3. `docs/control/FINISH_LINE_BACKLOG.md`
4. `docs/control/AGENT_HANDOFF.md`
5. `docs/control/EVIDENCE_LOG.md`

If a task includes a linked Linear ticket, PR, branch, Notion Command Center, or Drive evidence folder, the agent may use those linked sources only to the extent they do not conflict with the packet above.

## Ignore By Default

Agents must ignore these unless explicitly linked from the current packet or approved by Tyler for the task:

- Unlinked Notion pages
- Unlinked Google Drive files
- Old Linear tickets
- Monday boards/items
- Prior chat summaries
- Old AI-generated plans
- Stale roadmaps
- Speculative product ideas
- Old screenshots, decks, PDFs, exports, or checklist files

Agents must not search old workspaces and infer current direction from stale material.

## Execution Posture

This is a finish-line build posture.

Agents should:

- Complete the assigned task.
- Preserve the current product scope.
- Use current repo state and linked current sources.
- Avoid broad rewrites unless specifically assigned.
- Keep changes minimal to the task, but not artificially incomplete.
- Report exact files changed and verification results.
- State assumptions when needed and proceed when safe.

Agents should not:

- Create a new roadmap.
- Redesign the product direction.
- Import old backlog items automatically.
- Use stale Notion/Drive/Linear/Monday material as implementation truth.
- Add hard stops for ordinary ambiguity.
- Rewrite control rules without Tyler approval.
- Make destructive or production-impacting changes without explicit approval.

## Normal Uncertainty Rule

For normal uncertainty:

```text
State the assumption -> proceed with the safest reversible implementation path -> report evidence.
```

Examples of normal uncertainty that should not cause HOLD by itself:

- A label or copy choice is not fully specified.
- A non-critical UI detail is unclear.
- Historical context is missing.
- Old unlinked documents may exist.
- Workspace cleanup is incomplete.
- A non-critical TODO remains outside the assigned scope.

## HOLD Only For

Agents must return HOLD only for material blockers:

1. Destructive database/schema migration risk
2. Production write risk without explicit approval
3. Credential, secret, or security exposure
4. Public/private data leakage risk
5. Unclear repo, branch, deployment, or target environment for an execution task
6. Irreversible deletion, archive, rename, or move action
7. Directly conflicting active instructions inside the current packet
8. Failed build, test, deploy, or verification check directly relevant to the assigned task

If one of these applies, the agent must state:

- Exact blocker
- Why it blocks the assigned task
- Evidence for the blocker
- Safest next action
- Whether Tyler approval, credentials, environment confirmation, or a code fix is required

## Required Agent Output

Every Harbourview agent response must include:

1. Objective completed or not completed
2. Files changed
3. Commands run
4. Verification results
5. Evidence produced or linked
6. Assumptions made
7. Remaining risks
8. Final GO/HOLD verdict

## Universal Agent Prompt Template

```text
You are working on Harbourview finish-line execution.

Objective:
[Insert exact task.]

Current authority:
Use only the current Harbourview Source-of-Truth packet:
- docs/control/SOURCE_OF_TRUTH.md
- docs/control/CURRENT_STATE.md
- docs/control/FINISH_LINE_BACKLOG.md
- docs/control/AGENT_HANDOFF.md
- docs/control/EVIDENCE_LOG.md
- [Notion Command Center link, if applicable]
- [Linear ticket link, if applicable]
- [GitHub branch/PR link, if applicable]

Ignore by default:
- unlinked Notion pages
- unlinked Google Drive files
- old Linear tickets
- Monday boards/items
- prior chat material
- old AI-generated plans
- stale roadmaps
- speculative product ideas

Execution posture:
This is a finish-line build task. Do not broaden scope. Do not redesign the product. Do not create a new roadmap. Do not run a historical cleanup. Complete the assigned task using the current repo and current source-of-truth packet.

Normal uncertainty:
If a detail is missing but the safest reversible implementation path is clear, state the assumption and proceed.

HOLD only for:
- destructive database/schema migration risk
- production write risk
- credential/security exposure
- public/private data leakage risk
- unclear repo/branch/deployment
- irreversible deletion/archive action
- directly conflicting active instructions
- failed relevant build/test/deploy gate

Required output:
1. Summary of work completed
2. Files changed
3. Commands run
4. Verification results
5. Evidence links or artifacts
6. Assumptions made
7. Remaining risks
8. Final GO/HOLD verdict
```

## Verification Expectations

Agents must run the relevant checks for their assigned task where available and safe. Examples include:

- Typecheck
- Lint
- Build
- Unit/integration tests
- Route probes
- Leakage probes
- Admin/auth checks
- Marketplace smoke checks

Agents must not run production writes unless explicitly approved and gated.

## Evidence Expectations

Evidence should be recorded or linked in `docs/control/EVIDENCE_LOG.md` when it proves a build, deployment, security, admin/auth/RLS, marketplace, or leakage claim.

A completion claim without evidence is not final.

## Pass 1 Verification Status

Pass 1 created this handoff scaffold only.

Expected Pass 1 evidence:

- No app code changed.
- No schema changed.
- No route changed.
- No auth/RLS changed.
- No deployment setting changed.
- No Notion, Drive, Linear, or Monday workspace changed.
