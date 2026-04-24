# Agent Lock

## Active lock
Status: locked
Agent: Claude
Branch: agent/claude/HV-001-repair-env-key-name
Task: HV-001 repair
Files/areas reserved:
- agent-workspace/**
- lib/security/env.ts
- tests/golden-path.test.ts
Started: 2026-04-24
Expires: 2026-04-25

## Rules
- Only one agent may hold a lock for the same task area.
- The lock must list files or directories being touched.
- A stale lock may be overridden only after documenting why in HANDOFF_LOG.md.
- If another active lock touches the same files or task area, do not edit those files.
- The agent that completes the task must change status to unlocked before final handoff, unless a PR is still actively open.
