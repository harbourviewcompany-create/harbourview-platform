# Harbourview Finish-Line Backlog

Last updated: 2026-05-28
Status: Pass 1.5 working-alpha backlog lock

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
