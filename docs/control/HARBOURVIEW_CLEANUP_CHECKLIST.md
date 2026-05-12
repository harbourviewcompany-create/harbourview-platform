# Harbourview Cleanup Checklist

Status: Draft execution checklist  
Scope: Stale GitHub PRs, Vercel scope resolution and Supabase consolidation  
Change policy: This checklist is not approval to delete, pause, merge, deploy or migrate. Each destructive or production-impacting action requires explicit operator confirmation.

## A. Stale GitHub PR Cleanup

### `harbourview-platform`

| Priority | PR | Current Read | Action | Acceptance Criteria |
|---:|---:|---|---|---|
| 1 | #277 | Superseded by main; body says do not merge | Closed stale on 2026-05-12 after applying `control/stale-pr` label | Closed unmerged with comment referencing superseding main commit |
| 2 | #273 | Old build-import blocker superseded by current main | Closed stale on 2026-05-12 after applying `control/stale-pr` label | Closed unmerged with comment noting current main resolves the build path and branch is not mergeable |
| 3 | #52 | Old admin role-guard repair superseded by current admin/auth implementation | Closed stale on 2026-05-12 after applying `control/stale-pr` label | Closed unmerged with comment noting current main contains the user_roles admin/operator guard and migration |
| 4 | #278 | Temporary Signal Engine runtime verification | Labeled `control/temporary-verification` on 2026-05-12 and kept open as draft | Remains draft-only until proof is run once and closed, or closed obsolete |
| 5 | #275 | Vercel branch policy | Labeled `decision/HOLD` and `control/vercel-scope` on 2026-05-12; kept open pending Vercel scope resolution | Must not merge until canonical Harbourview Vercel project/team/account mapping is resolved |
| 6 | #279 | Homepage build fix superseded by current main | Closed stale on 2026-05-12 after applying `control/stale-pr` label | Closed unmerged with comment noting current main already contains the `publicSections` fix |
| 7 | #280 | Network static foundation | Already closed/merged before this cleanup pass | No active PR action required |

### Repo metadata cleanup

- [ ] Add or update repo description for `harbourview-platform`.
- [ ] Add or update repo description for `harbourview-network`.
- [ ] Add or update repo description for `chatbot`.
- [ ] Add or update repo description for `contractor`.
- [ ] Add or update repo description for `Harbourview`.
- [ ] Add or update repo description for `hv-telnyx-webhook`.
- [ ] Add README status block to every repo:
  - canonical status;
  - production status;
  - deployment target;
  - database target;
  - owner;
  - safe next action.

## B. Vercel Scope Resolution

### Objective

Find the actual Harbourview production Vercel project and make deployment ownership unambiguous.

### Checklist

- [ ] Confirm all Vercel teams/accounts Tyler controls.
- [ ] Locate the Vercel project serving `https://harbourview.vercel.app`, if still active.
- [ ] Record Vercel team ID.
- [ ] Record Vercel project ID.
- [ ] Record linked GitHub repo.
- [ ] Record production branch.
- [ ] Record custom/generated domains.
- [ ] Record environment groups and required variables by name only.
- [ ] Confirm whether duplicate `harbourview`, `harbourview-platform` or `harbourview-network` projects exist.
- [ ] Confirm whether duplicate/stale preview contexts still consume build quota.
- [ ] Update `docs/control/PROJECT_REGISTRY.md` with the confirmed Vercel mapping.
- [ ] Only then adjust Vercel ignore/branch policy.

### Stale external preview integration evidence

Observed on PR #294 after all requested GitHub verification workflows passed:

| Context | Observed status | Evidence | Control read | Required action |
|---|---|---|---|---|
| `Vercel – harbourview` | Failed | Vercel bot reported `Resource is limited - try again in 24 hours (more than 100, code: "api-deployments-free-per-day")` | External preview/status integration is consuming deployment quota and can block or confuse merge decisions even for documentation-only PRs | Resolve canonical Vercel project/team/account mapping, then disable duplicate/stale auto-deploy previews or remove from required status checks if non-canonical |
| `Vercel – harbourview-platform-rod3` | Passed | Commit status reported success for a separate Vercel project/context | Indicates more than one Vercel context may be attached to this repo | Classify as canonical or stale after Vercel inventory is complete |
| `netlify/harbourview-platform/deploy-preview` | Failed | Netlify bot reported failed deploy preview for the `harbourview-platform` Netlify project | Likely stale or duplicate preview integration unless intentionally canonical | Confirm whether Netlify is required for any active Harbourview deployment; otherwise disconnect or remove as required context |
| `netlify/harbourviewns/deploy-preview` | Passed/canceled | Netlify bot reported canceled deploy preview with successful status | Indicates another attached Netlify integration | Classify and disconnect if not canonical |
| `netlify/harbourview-international/deploy-preview` | Passed/canceled | Netlify bot reported canceled deploy preview with successful status | Indicates another attached Netlify integration | Classify and disconnect if not canonical |

Control rule: documentation-only PRs should not burn production preview quota or be blocked by stale preview integrations. The registry must identify exactly one canonical Harbourview deployment target before deployment-policy PR #275 is revived.

### Acceptance Criteria

- Exactly one canonical Harbourview Vercel production project is identified.
- Every active Vercel project maps to one GitHub repo.
- No unknown Harbourview-like Vercel project remains unclassified.
- Branch/deployment policy names the canonical project explicitly.
- Future agents can identify where Harbourview production deploys without guessing.
- Non-canonical Vercel/Netlify preview integrations are disconnected, disabled or documented as non-required.

## C. Supabase Project Consolidation

### Canonical project

`Harbourview Marketplace` / `zvxdgdkukjrrwamdpqrg`

Actions:

- [ ] Confirm it is the canonical Harbourview production DB.
- [ ] Review public SECURITY DEFINER smoke RPCs.
- [ ] Revoke public RPC execution unless still intentionally required.
- [ ] Review `wurx_ottawa_leads` anon insert policy.
- [ ] Review `wurx-lead-notify` edge function auth because JWT verification is disabled.
- [ ] Enable leaked password protection if Auth is used.
- [ ] Document intentional RLS-enabled/no-policy tables as deny-by-default.
- [ ] Move `vector` extension out of public schema when safe.
- [ ] Add missing indexes only where table usage justifies it.
- [ ] Update `docs/control/DATABASE_CONTROL.md` or equivalent with current schema ownership.

### Legacy signal project

`harbourviewcompany-create's Project` / `fgdrvqqezdiraqyuofte`

Actions:

- [ ] Freeze new writes until classified.
- [ ] Export schema.
- [ ] Export representative rows from `signals`.
- [ ] Count and classify `editorials`, `workspaces`, `sources`, `source_documents` and `dossiers`.
- [ ] Determine whether the 430 `signals` rows are useful, duplicate, stale or production-relevant.
- [ ] Decide one of:
  - migrate selected rows into canonical DB;
  - keep as read-only sandbox;
  - archive after export;
  - delete only after backup and explicit confirmation.
- [ ] Create a migration plan if data is retained.
- [ ] Document final disposition in `PROJECT_REGISTRY.md`.

### Acceptance Criteria

- One canonical Supabase project is named.
- Legacy project has a documented disposition.
- No data-bearing Supabase project remains ambiguous.
- Security advisor warnings are converted into tracked cleanup tasks or documented intentional exceptions.

## D. Launch-Control Adoption

- [x] Merge the registry adoption PR (#287).
- [x] Confirm PR template appears for new PRs.
- [x] Confirm issue template appears for new Harbourview tasks.
- [x] Confirm registry discipline workflow runs on PRs.
- [x] Label stale PR #277 with `control/stale-pr` and close it unmerged.
- [x] Label stale PRs #273, #52 and #279 with `control/stale-pr` and close them unmerged.
- [x] Label temporary verification PR #278 with `control/temporary-verification` and keep it open as draft.
- [x] Label Vercel policy PR #275 with `decision/HOLD` and `control/vercel-scope` and keep it open pending Vercel scope resolution.
- [x] Merge PR #294 recording stale PR cleanup actions.
- [ ] Convert this checklist into Linear issues after the registry is merged.
