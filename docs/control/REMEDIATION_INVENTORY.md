# Governance Remediation Inventory (Authoritative)

**Source of truth:** Exact failing lists from governance run `34854431313` / job `104009754267` (and any subsequent re-runs).

Do **not** invent or approximate these lists. After every remediation push, re-run governance and replace the sections below with the new exact failing lists (or record `EMPTY` when a category is closed).

## 1. Mutable external action / reusable-workflow references (target: 0 remaining)

```
# Paste exact list from audit here. Format example:
# .github/workflows/foo.yml:12  uses: actions/checkout@v4
# (must become full 40-char SHA + optional # vX.Y.Z comment)
```

**Count at last audit:** 27

## 2. PR-triggered workflows with production credential references (target: 0)

```
# Paste exact list from audit here.
```

**Count at last audit:** 11

## 3. Workflows granting `contents: write` outside approved allowlist (target: 0)

```
# Paste exact list from audit here.
```

**Count at last audit:** 3

See also: `docs/control/CONTENTS_WRITE_ALLOWLIST.md`

## 4. Privileged workflows that check out / fetch / execute untrusted PR-head code (target: 0)

```
# Paste exact list from audit here.
```

**Count at last audit:** 9

See also: `docs/control/WORKFLOW_ISOLATION_PATTERNS.md`

## Update protocol

1. Retrieve exact lists from the governance job logs / artifacts.
2. Replace the four sections above.
3. Commit the update in the same PR that performs the corresponding patches.
4. Re-run governance; the new run must show the reduced (or empty) lists.
5. Record the new run URL in the PR evidence section.

Governance remains fail-closed. The scanner is never weakened to make CI pass.
