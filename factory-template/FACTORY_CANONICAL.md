# Factory Canonical

## Non-negotiable purpose

This repo section exists to reduce build friction. Every new software project should be created from a repeatable factory workflow instead of ad hoc prompts, loose files and manual command guessing.

## Default build sequence

1. Intake
2. Product definition
3. Workflow map
4. Data model
5. Permission and security model
6. Architecture
7. Scaffold generation
8. Implementation
9. Contract tests
10. Runtime smoke tests
11. Hardening
12. Installer or launch wrapper
13. Release packet

## AI routing model

### ChatGPT
Use for product architecture, specification, code review, prompt generation, workflow design, debugging plans, acceptance criteria and operator decision making.

### GitHub / Codex-style agent
Use for repo inspection, file edits, branch creation, tests, commits, pull requests and CI repair when available.

### Claude
Use as critique engine, second-pass code reviewer, security reviewer and long-context document auditor.

### Supabase
Use for database, auth, RLS, audit logs, storage and operational data.

### Local machine
Use only for runtime verification, Windows packaging, local installers and actions not available through GitHub tools.

## Hard stop rules

- Do not build without a canonical file.
- Do not change production schema without migration notes.
- Do not expose internal notes, private fields or admin-only metadata through public views.
- Do not claim tests passed unless a real test command ran.
- Do not assume Supabase access exists. Mark it unverified if unavailable.
- Do not rely on manual command sequences when a script can be created.
- Do not create multiple competing project roots.

## Default output packet for every build session

- Repo inspected
- Branch used
- Canonical files read
- Objective
- Files changed
- Files intentionally not touched
- Commands run
- Tests passed
- Tests failed
- Security impact
- Migration impact
- Deployment impact
- What remains unverified
- Exact next action
