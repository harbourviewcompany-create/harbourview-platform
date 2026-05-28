# Harbourview Agent Handoff

Last updated: 2026-05-28
Status: Pass 1.5 working-alpha handoff

## Current Target

Harbourview is being built to working-platform / operator-ready alpha, not public launch.

The immediate build target is:

1. Fix the globe.
2. Fix navigation and routing to the dashboard.
3. Make the dashboard route work.
4. Make the dashboard look and function like the intended Harbourview operating surface.
5. Ensure Marketplace, Intelligence, Education, and related sections contain useful content or clear gap states.

## Read First

Use the current `docs/control/` packet as authority:

- `SOURCE_OF_TRUTH.md`
- `CURRENT_STATE.md`
- `FINISH_LINE_BACKLOG.md`
- `AGENT_HANDOFF.md`
- `EVIDENCE_LOG.md`

## Ignore By Default

Ignore unlinked Notion pages, Google Drive files, old Linear tickets, Monday items, prior chats, old AI plans, stale roadmaps, and speculative product ideas.

Do not infer current direction from old workspace material.

## Execution Posture

Complete the assigned alpha task. Do not broaden into public launch, full roadmap, or historical cleanup unless Tyler explicitly asks.

For normal uncertainty, state the assumption, proceed with the safest reversible implementation, and report evidence.

## HOLD Only For

- Destructive schema or database risk
- Production write risk without approval
- Credential or secret exposure
- Public/private data exposure risk
- Unclear target repo, branch, deployment, or environment
- Irreversible workspace action
- Directly conflicting current instructions
- Failed relevant build/test/deploy verification

## Required Output

Every agent must return:

1. Objective completed or not completed
2. Files changed
3. Commands run
4. Verification results
5. Evidence produced or linked
6. Assumptions made
7. Remaining risks
8. GO/HOLD verdict

## Universal Agent Prompt

```text
You are working on Harbourview working-platform / operator-ready alpha.

Objective:
[Insert exact task.]

Use only the current docs/control packet and explicitly linked current sources.

Priority target:
- globe
- dashboard routing
- dashboard operating surface
- core navigation
- Marketplace, Intelligence, Education, and section gap states

Ignore unlinked Notion, Drive, Linear, Monday, prior chat, and old AI-generated material.

Proceed for normal ambiguity by stating assumptions and reporting evidence.

HOLD only for destructive schema risk, production write risk, credential exposure, public/private data exposure, unclear execution target, irreversible workspace action, conflicting current instructions, or failed relevant verification.

Return files changed, commands run, verification, evidence, assumptions, risks, and GO/HOLD.
```
