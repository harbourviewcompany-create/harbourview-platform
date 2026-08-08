# Harbourview Release-Safety Adoption Plan

## Stage 0 — inventory

- Merge the shadow workflow and verifier scripts.
- Make no required-check, branch-protection, Vercel production, Supabase policy, or secret changes.
- Observe repository audit and migration-boundary artifacts across representative PRs.

Exit evidence: shadow workflow executes reliably and findings are understandable, reproducible, and non-disruptive.

## Stage 1 — shadow verification

- Keep existing `CI` authoritative.
- Run `Release Safety Shadow` on pull requests.
- Record mutable Action references, deployment-control gaps, migration-risk categories, and stack versions.
- Compare findings with current production-security and leakage tests before promoting anything to a blocking gate.

Exit evidence: no false-GO path is introduced and no shadow finding is promoted without repository-specific proof.

## Stage 2 — Preview verification

Future PR only:
- bind the real Vercel Preview deployment event/URL;
- verify deployment SHA;
- run the existing Playwright suite against the deployed Preview;
- add repository-specific authenticated role and cross-user RLS checks;
- run the existing public-leakage denylist against Preview network/HTML/RSC surfaces.

## Stage 3 — required PR release gate

Future PR only after Stage 2 is stable:
- promote selected shadow checks to required status;
- add `merge_group` support if merge queue is enabled;
- configure exact branch-protection requirements through GitHub settings/API after those current settings are readable and reviewed.

## Stage 4 — staged production shadow

Future PR only:
- create a production-configured Vercel deployment without assigning production domains;
- verify exact SHA and production-class smoke against the staged URL;
- retain the current production path until repeated staged runs pass.

## Stage 5 — production promotion ownership

Future explicit cutover only:
- move production-domain assignment behind protected promotion or Vercel Deployment Checks;
- record last-known-good deployment and rollback path;
- perform post-promotion production verification.

## Stage 6 — controlled production writes

Future explicit enablement only:
- synthetic create;
- authoritative read-back;
- cleanup;
- cleanup verification;
- idempotency/replay protection.

Production writes remain disabled until this contract is implemented against a real Harbourview-safe mutation path.

## Current blockers to later stages

1. Branch-protection settings could not be read through the connected GitHub integration, so no protection changes are made or inferred in this PR.
2. Exact Vercel project/environment credential topology is not changed in Stage 0/1.
3. Live Supabase RLS verification must use the actual Harbourview role/resource matrix rather than a generic table list.
4. Action SHA pinning should be performed as a dedicated reviewed change because the current repository contains many workflows using release tags.
