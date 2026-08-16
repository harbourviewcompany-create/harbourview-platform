# Harbourview Finish-Line Backlog

Last updated: 2026-05-28
Status: **SUPERSEDED — historical record only, not current authority**

> ⚠️ **Do not use this file as current backlog/priority authority.** It is frozen at
> 2026-05-28 ("Pass 1.5 working-alpha backlog lock") and its top priority item
> (HV-ALPHA-002, fixing the globe) has been marked Live since at least
> `docs/control/CURRENT_STATE.md`'s 2026-06-29 update. The live, actively-maintained
> operating handoff is the repo-root `HANDOFF.md` — read that first for current
> priorities, not this one.
>
> `docs/control/SOURCE_OF_TRUTH.md`, `docs/control/CURRENT_STATE.md`, and
> `docs/control/PROJECT_STATE.md` carry the same superseded notice (PR #1440,
> 2026-08-15). This file was named alongside them in `docs/control/AGENT_HANDOFF.md`'s
> original banner (PR #1112, 2026-07-21) but was missed in that pass — closing that
> gap here.
>
> Flagged during a docs-review session, 2026-08-15 — see
> `docs/control/EVIDENCE_LOG.md` for the entry.

---

## Target

The current target is working-platform / operator-ready alpha, not public launch.

## Priority Queue

| ID | Work item | Status |
|---|---|---|
| HV-ALPHA-001 | Inspect the current globe implementation and identify the concrete breakage | Ready |
| HV-ALPHA-002 | Fix the globe so it loads reliably and fits the Harbourview direction | Ready after inspection |
| HV-ALPHA-003 | Inspect the dashboard route and all navigation paths to it | Ready |
| HV-ALPHA-004 | Fix routing so users/operators can reliably reach the dashboard | Ready after inspection |
| HV-ALPHA-005 | Inspect the current dashboard UI and identify what keeps it from being the Harbourview operating surface | Ready |
| HV-ALPHA-006 | Patch the dashboard into the intended Harbourview operating surface | Ready after inspection |
| HV-ALPHA-007 | Inspect Marketplace, Intelligence, Education, and related sections for empty or broken states | Ready |
| HV-ALPHA-008 | Add useful working content or clear gap states to major sections | Ready after inspection |
| HV-ALPHA-009 | Run build, route, dashboard, globe, and section coverage verification | Ready after patches |

## Coverage Rule

A section passes alpha coverage when it either works, contains useful current content, or clearly states what exists, what is missing, and what gets built next.

Empty shells, broken routes, and vague placeholders do not pass.

## Deferred

Public-launch readiness, full historical workspace cleanup, full transaction rails, full automated intelligence, and full education-library completion are deferred unless Tyler promotes them.

## Source Rule

Use the current repo and docs/control packet. Unlinked Notion, Drive, Linear, Monday, prior chat, and old AI material are not active backlog sources.
