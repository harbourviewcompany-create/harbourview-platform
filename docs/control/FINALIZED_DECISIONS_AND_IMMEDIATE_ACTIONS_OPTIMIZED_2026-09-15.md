# Harbourview Platform — Finalized Decisions & Immediate Actions (Optimized)

**Governance remediation status | 15 September 2026**  
Supersedes the 14 September 2026 HOLD memo with full implementation of the recommended optimizations and gap closures. Original decision (HOLD) remains in force until every gate below is green.

## 1. Finalized Decision

**HOLD — PR #1823 must not merge yet.**  
The governance audit is correctly fail-closed. Remaining gaps must be fixed and revalidated before merge. The required GitHub main protection ruleset is an external P0 blocker because the connected GitHub integration can read rulesets but cannot create or update them.

## 2. Current Verified State

| Item | Verified state |
|------|----------------|
| Repository | harbourviewcompany-create/harbourview-platform |
| Base main SHA | a87cdf34a70e278cf33a90ebdf5dab55438d9b6e (update on each re-verify) |
| PR #1823 head | (update to current head) |
| Governance run / job | 34854431313 / 104009754267 (and successors) |
| Live main rulesets | 0 — required ruleset absent |
| Production migration drift | 20260912162110 found live and restored as exact repository ledger artifact |
| Production DDL replay | None — ddl_reapplied=false |

## 3. Immediate Gaps to Fill (risk-ordered)

1. **Highest blast radius** — Eliminate the 9 privileged workflows that check out, fetch, or execute untrusted PR-head code in privileged contexts. Move privileged execution to trusted events/jobs only. Follow `docs/control/WORKFLOW_ISOLATION_PATTERNS.md`.
2. Remove or safely isolate production credential references from the 11 PR-triggered workflows. Prefer PR-safe execution without production credentials or isolate trusted production execution. Prefer OIDC.
3. Fix the 3 workflows granting `contents: write` outside the approved allowlist (`docs/control/CONTENTS_WRITE_ALLOWLIST.md`).
4. Pin all 27 remaining mutable external action/reusable-workflow references to immutable 40-character commit SHAs. Do not weaken the scanner. Prefer internal reusable wrappers where the same action is repeated.
5. Re-run the governance audit and treat its exact failing lists as the authoritative inventory (`docs/control/REMEDIATION_INVENTORY.md`).
6. Have an authorized GitHub administrator create the active main ruleset (see `docs/control/MAIN_RULESET_ADMIN_RUNBOOK.md`), then verify the live configuration. The repository JSON payload is a specification, not proof that the ruleset exists.

## 4. Non-negotiable principles

1. Preserve fail-closed governance behavior.
2. Do not weaken scanners to make CI pass.
3. Do not claim GO from repository intent or a local ruleset payload when live rulesets are absent.
4. Do not replay production DDL as part of migration reconciliation unless explicitly authorized.
5. For secret-bearing PR workflows, inspect actual usage; prefer PR-safe execution without production credentials or isolate trusted production execution.
6. For privileged PR-head checkout/fetch patterns, prevent attacker-controlled code from reaching privileged execution; superficial conditions are insufficient.
7. After patches, run applicable governance, typecheck, security/leakage, build, test, migration, and repository QA suites and record reproducible evidence.

## 5. Completed Controls Already in Place

- CODEOWNERS corrected with explicit ownership for production/security-sensitive surfaces.
- PR Agent permissions reduced and action pinned.
- CI, security-scan, governance, and multiple other workflows hardened through action pinning and permission reduction.
- production-governance-audit.yml refactored to static governance checks without production secrets.
- production-database-governance-audit.yml isolated to trusted schedule/manual execution on main.
- Canonical required-status-check specification at `docs/control/REQUIRED_MAIN_STATUS_CHECKS.txt`.
- Main ruleset specification at `docs/control/MAIN_RULESET_PAYLOAD.json` and documented in `docs/control/GITHUB_RULESET_REQUIRED.md`.
- Production migration 20260912162110 reconciled exactly without replaying DDL.

## 6. New control artifacts (this optimization pass)

| Artifact | Purpose |
|----------|---------|
| `REMEDIATION_INVENTORY.md` | Single source of truth for the four exact failing lists |
| `WORKFLOW_ISOLATION_PATTERNS.md` | Mandatory patterns for secrets + untrusted PR-head isolation |
| `CONTENTS_WRITE_ALLOWLIST.md` | Approved write surface + exception process |
| `MAIN_RULESET_ADMIN_RUNBOOK.md` | Parallel-track admin steps + evidence requirements |
| `GOVERNANCE_METRICS_AND_OWNERSHIP.md` | Named owners, metrics, rollback criteria |
| `CONTINUOUS_ENFORCEMENT.md` | Post-merge schedule, alerts, drift prevention, OIDC preference |

## 7. Release Gate

**HOLD until:**
- all 27 mutable references are eliminated;
- 11 PR credential exposures are remediated;
- 3 unauthorized contents-write workflows are remediated;
- 9 privileged untrusted-code paths are eliminated or safely isolated;
- governance passes;
- the required main ruleset exists live and matches the canonical specification;
- applicable CI/QA suites pass;
- reproducible validation evidence is recorded in PR #1823 (or successor);
- named owners and metrics are populated.

## 8. Immediate Execution Sequence (optimized)

1. Retrieve the exact audit lists from run 34854431313 / job 104009754267 and freeze them in `REMEDIATION_INVENTORY.md`.
2. Assign named owners in `GOVERNANCE_METRICS_AND_OWNERSHIP.md`.
3. (Parallel) Hand the ruleset runbook + payload to the authorized GitHub administrator.
4. Fetch each affected workflow at its current blob SHA and patch the actual files, risk-ordered (privileged untrusted paths → credentials → contents:write → pins).
5. Pin every external action/reusable-workflow reference to a full commit SHA.
6. Remove production secrets from PR paths or isolate trusted jobs; preserve required PR-safe checks.
7. Remove unnecessary contents: write and restrict necessary writes to the allowlist.
8. Eliminate privileged execution of untrusted PR code using the structural patterns.
9. Push remediation and re-run governance; update inventory + PR evidence.
10. Run applicable QA/security checks and update PR #1823 with exact evidence.
11. Administrator creates the main ruleset and posts live verification evidence.
12. Only after every gate passes: merge PR #1823. Otherwise remain HOLD.

## Decision Record

**Status: HOLD.** No merge authorized. No production DDL replay authorized. Repository remediation is authorized; external GitHub administrator action is required for the main ruleset. The governance scanner remains authoritative and must not be weakened.

All optimizations and previously identified gaps are now embodied in the control documents listed above.
