# Harbourview Cleanup Checklist

Status: Draft execution checklist  
Scope: Stale GitHub PRs, Vercel scope resolution and Supabase consolidation  
Change policy: This checklist is not approval to delete, pause, merge, deploy or migrate. Each destructive or production-impacting action requires explicit operator confirmation.

## A. Stale GitHub PR Cleanup

### `harbourview-platform`

| Priority | PR | Current Read | Action | Acceptance Criteria |
|---:|---:|---|---|---|
| 1 | #277 | Superseded by main; body says do not merge | Closed stale on 2026-05-12 after applying `control/stale-pr` label | Closed unmerged with comment referencing superseding main commit |
| 2 | #273 | Old build-import blocker | Compare against current main, then close if superseded | No unique required patch remains |
| 3 | #52 | Old admin role-guard repair | Compare against current admin/auth files | Either closed as superseded or converted into a current issue |
| 4 | #278 | Temporary Signal Engine runtime verification | Run once and close, or close obsolete | No temporary verification PR remains open indefinitely |
| 5 | #275 | Vercel branch policy | Reassess after Vercel project scope is known | Kept only if it targets the confirmed canonical Vercel project |
| 6 | #279 | Homepage build fix | Check if current main already contains fix | Closed or rebased cleanly |
| 7 | #280 | Network static foundation | Keep draft only if canonical strategy supports it | Not treated as production release PR until strategy decided |

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

### Acceptance Criteria

- Exactly one canonical Harbourview Vercel production project is identified.
- Every active Vercel project maps to one GitHub repo.
- No unknown Harbourview-like Vercel project remains unclassified.
- Branch/deployment policy names the canonical project explicitly.
- Future agents can identify where Harbourview production deploys without guessing.

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
- [ ] Label temporary verification PRs with `control/temporary-verification` if labels exist.
- [ ] Convert this checklist into Linear issues after the registry is merged.
