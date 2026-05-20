# AGENTS.md — Repository Operating Rules

This file defines baseline instructions for all agents and contributors working anywhere in this repository.

## Scope & Precedence
- **Scope:** This file applies to the entire repository tree rooted at `/workspace/harbourview-platform`.
- **Precedence rule:** If a subdirectory adds its own `AGENTS.md`, that nested file takes precedence for files under that subtree.
- **Conflict rule:** The most deeply nested `AGENTS.md` wins for style/process details, while higher-level safety/compliance constraints still apply unless explicitly tightened.
- **Stricter subdirectory guidance:** Teams should add nested `AGENTS.md` files in sensitive areas (for example data ingestion, auth, billing, analytics, or infra) when stricter controls are needed.

## Coding & Style Expectations
- Follow existing conventions in touched files; do not introduce a second style system in the same module.
- Keep changes minimal, composable, and reversible; avoid opportunistic refactors unless requested.
- Prefer explicit types and clear naming over clever abstractions.
- Keep functions/components single-purpose and testable.
- Update docs alongside behavior changes (especially under `docs/control/`) when operational impact exists.
- Do not commit generated secrets, credentials, tokens, private keys, or environment dumps.

See also:
- `docs/control/BUILD_CONTROL.md`
- `docs/control/DESIGN_SYSTEM.md`
- `docs/control/PR_REVIEW_CHECKLIST.md`

## Domain Copy & Compliance Text Location
- **Canonical compliance/policy copy** must live in versioned docs under `docs/control/`.
- Product/UI-facing compliance strings should be sourced from a single module per app surface and trace back to a control document.
- If copy affects legal, trust, risk, or customer commitments:
  1. Update or add the controlling document in `docs/control/` first.
  2. Reference that document in code comments or configuration where copy is consumed.
  3. Record verification evidence in `docs/control/EVIDENCE_LOG.md`.

Recommended control docs:
- `docs/control/EVIDENCE_LOG.md`
- `docs/control/PROJECT_REGISTRY.md`
- `docs/control/FINAL_PRODUCTION_READINESS_AUDIT.md`

## Required QA Commands by Change Type
Run the highest applicable set before opening/merging a PR.

### 1) Docs-only changes (`*.md`, comments only, no behavior change)
- `npm run lint:docs` (if available)
- `npm run test -- --passWithNoTests` (sanity)

### 2) Frontend/UI changes
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

### 3) Backend/API/service changes
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- Any route/runtime verification noted in:
  - `docs/control/PRODUCTION_RUNTIME_VERIFICATION.md`
  - `docs/control/VERIFICATION_PLAN.md`

### 4) Data model, migration, or DB-adjacent changes
- All backend checks above, plus:
- Migration dry-run / schema validation command(s) used by the service
- Rollback validation notes
- Update:
  - `docs/control/DATABASE_CONTROL.md`
  - `docs/control/EVIDENCE_LOG.md`

### 5) Deployment/infrastructure/pipeline changes
- Relevant build/test checks for impacted apps/services
- Pipeline verification per:
  - `docs/control/DEPLOYMENT_RUNBOOK.md`
  - `docs/control/PRODUCTION_PROMOTION_RUNBOOK.md`
  - `docs/control/VERCEL_DEPLOYMENT_POLICY.md` (if Vercel-related)

If any expected command is unavailable, document why and provide the closest substitute evidence in the PR body.

## PR Body Template & Evidence Expectations
Use this template for all PRs:

```md
## Summary
- What changed
- Why it changed
- Any non-obvious design decisions

## Scope
- In-scope areas touched
- Out-of-scope explicitly noted

## Risks
- User/business/operational risks
- Mitigations applied

## Validation
- [ ] lint
- [ ] typecheck
- [ ] tests
- [ ] build
- [ ] runtime/route verification (if applicable)

Commands run:
- `...`
- `...`

## Evidence
- Logs, screenshots, traces, preview links, or audit notes
- Links/paths to control docs updated (for example `docs/control/EVIDENCE_LOG.md`)

## Compliance & Data Handling
- Data classification touched (public/internal/confidential/restricted)
- Confirmation that no secrets or private user data were exposed
- Redaction method used for any captured evidence

## Rollback Plan
- Exact rollback approach
- Blast radius and owner
```

Evidence must be reproducible, time-bounded, and tied to changed behavior. For production-impacting work, include an evidence trail in `docs/control/EVIDENCE_LOG.md`.

See also:
- `docs/control/PR_REVIEW_CHECKLIST.md`
- `docs/control/TASK_TICKET_TEMPLATE.md`
- `docs/control/EVIDENCE_LOG.md`

## Safety Constraints: Public vs Private Data
- Treat all non-public operational data as sensitive by default.
- Never paste secrets, tokens, API keys, customer PII, credentials, connection strings, or private logs into commits/PRs/issues.
- Use sanitized fixtures/mocks for tests; avoid real customer payloads.
- Redact identifiers in screenshots/logs unless explicitly approved and documented.
- Store only minimum required data for debugging and only for required retention windows.
- Public release notes and screenshots must contain **public** data only.
- If uncertain about data classification, pause and classify as **private** until clarified in a control doc.

Related controls:
- `docs/control/AGENT_PERMISSIONS.md`
- `docs/control/AI_CHAT_ROUTE_ENV.md`
- `docs/control/DEPLOYMENT_INTEGRATION_CONTROL.md`
