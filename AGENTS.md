# AGENTS.md — Repository Operating Rules

This file defines baseline instructions for all agents and contributors working anywhere in this repository.

## Scope & Precedence
- **Scope:** This file applies to the entire repository tree rooted at `/workspace/harbourview-platform`.
- **Precedence rule:** If a subdirectory adds its own `AGENTS.md`, that nested file takes precedence for files under that subtree.
- **Conflict rule:** The most deeply nested `AGENTS.md` wins for style/process details, while higher-level safety/compliance constraints still apply unless explicitly tightened.
- **Stricter subdirectory guidance:** Teams should add nested `AGENTS.md` files in sensitive areas (for example data ingestion, auth, billing, analytics, or infra) when stricter controls are needed.

## Claude-Specific Operating Preferences
Tyler's personal operating preferences for Claude sessions (action-on-reversibility rules, credential handling, the merge/deploy sign-off boundary) live in `CLAUDE.md` at the repo root and apply to any Claude session working in this codebase. Where the two files both speak to process (PR discipline, QA gates, etc.), this file is the more specific and authoritative source for this repository.

## Merge Discipline — No Direct Commits to `main`
- Every change — including docs-only edits — lands via a pull request. Direct commits or pushes to `main` are not permitted, regardless of how small or reversible the change looks. This applies equally to human contributors and agents.
- `main` currently has no branch-protection rule technically blocking direct pushes (open gap — see `docs/control/EVIDENCE_LOG.md`). That gap does not relax this rule; treat it as binding regardless of what the platform happens to allow.
- A PR is not done when it merges. It is done when the QA commands for its change type (below) were actually run with their output quoted in the PR body, and a corresponding `docs/control/EVIDENCE_LOG.md` entry exists (see Evidence Logging under PR Body Template below) — not only for "production-impacting" work, for every merged PR.
- This rule exists because it was violated in practice: a prior session pushed a run of commits straight to `main` with no PR, no QA gate, and no evidence-log entry, discovered only when this file was read for an unrelated reason. Reading this file before the first edit (see Coding & Style Expectations below) is what would have caught it.

## Coding & Style Expectations
- Follow existing conventions in touched files; do not introduce a second style system in the same module.
- Keep changes minimal, composable, and reversible; avoid opportunistic refactors unless requested.
- Prefer explicit types and clear naming over clever abstractions.
- Keep functions/components single-purpose and testable.
- Update docs alongside behavior changes (especially under `docs/control/`) when operational impact exists.
- Do not commit generated secrets, credentials, tokens, private keys, or environment dumps.

See also:
- `docs/INTELLIGENCE_ARCHITECTURE_SPEC.md` — read before any intelligence/scraping/signals pipeline work
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

## Depth & Competitive Bar (Required Before Marking Any Feature "Done")
This is a content/architecture gate, separate from and in addition to the QA commands below. `npm run build` passing does not satisfy it. The goal: every public-facing surface should be deeper than comparable products in the space, not just functionally correct.

1. **Entity audit before judging a page "thin."** Don't eyeball it — query the schema for every concept the page touches:
   `select table_name from information_schema.tables where table_schema='public' and table_name ilike '%<concept>%'`
   If a table already holds the relevant data, a page that doesn't surface or link to it is thin — regardless of how polished its own copy is.

2. **Cross-link check.** If a public page describes a concept that also has live, entity-specific data elsewhere in the app (e.g. a per-country, per-listing, or per-signal detail page), the generic page must link to it. Two pages covering the same entity with zero cross-reference between them is a defect, even if both individually render and pass CI.

3. **Static-wrapper pages require a stated justification.** Patterns like `IntelligenceModulePage` (static copy, no live data) are reserved for genuine privacy/RLS boundaries. The PR body must cite the specific RLS policy or data-sensitivity reason. If no such reason exists and live public data is available, wire it — don't default to static because the template is already there.

4. **Competitive benchmark, logged in the PR.** Before building or rebuilding a public intelligence/marketplace surface, note how 1–2 comparable products (e.g. Prohibition Partners, BDSA, Citeline, Brightfield Group) present the equivalent surface, and what Harbourview does that they don't (semantic search, 348-source registry, live signal pipeline, etc.). That differentiator must be visible on the page itself, not just present in `lib/`.

5. **Multi-level depth, not single-page depth.** A genuinely deep feature has an index view, an entity-detail view, and — where the data supports it — a sub-entity view (mirrors the playbooks pattern: index → country detail → step-level data). One well-written static page is not depth.

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
- [ ] depth & competitive bar cleared (entity audit, cross-links, static-wrapper justified if used, competitive note)

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

Evidence must be reproducible, time-bounded, and tied to changed behavior. Every PR — including docs-only changes — adds a corresponding entry to `docs/control/EVIDENCE_LOG.md` before merge. Scale the entry to the change: a one-line row (date, scope, command/source, result, PR link, status) is sufficient for docs-only or trivial changes; production-impacting work requires the fuller evidence trail already modeled in that file's Gate 4 section. A PR with no `EVIDENCE_LOG.md` entry is not ready to merge, per the Merge Discipline section above.

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


## Additional Operational Cross-Links
- `docs/control/VERIFICATION_PLAN.md`
- `docs/control/PRODUCTION_RUNTIME_VERIFICATION.md`
- `docs/control/DEPLOYMENT_RUNBOOK.md`
- `docs/control/PRODUCTION_PROMOTION_RUNBOOK.md`
