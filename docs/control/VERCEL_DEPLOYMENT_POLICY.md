# Harbourview Vercel Deployment Policy

## Objective
Reduce unnecessary Vercel preview deployments while preserving production deployment safety and GitHub Actions verification.

## Canonical Vercel Project
Canonical project:
- harbourview
- project id: prj_Zp8HBDstqAAOCN6W7LAElahsq3qS

Observed duplicate deployment linkage in PR status/comments:
- harbourview
- harbourviewnetwork
- harbourviewcannabis-3379s-projects

Recommendation:
- Keep harbourview as the canonical deployment target.
- Remove or disable duplicate GitHub/Vercel integrations that deploy the same repository.

## Deployment Rules
Production deployment is gated by GitHub Actions. A push to `main` must **not** auto-deploy or auto-alias through Vercel's Git integration.

Canonical production path:
1. `.github/workflows/promote-production.yml` waits for the exact SHA's required checks, critical environment check, and live migration-ledger check.
2. The workflow reruns the release verification suite and confirms the SHA is still current `main`.
3. The workflow explicitly creates the exact-SHA Vercel production deployment through the Vercel REST API.
4. The workflow verifies READY state, exact commit identity, production alias assignment, runtime/leakage, and post-deploy migration drift.

`vercel.json` therefore keeps automatic Git deployment disabled for `main`. This does not disable explicit REST/CLI deployments from the controlled promotion workflow.

Preview deployments require explicit deploy intent.

Allowed branch patterns:
- deploy/*
- preview/*
- *deploy-preview*

Allowed commit markers:
- [deploy-preview]
- [vercel-preview]
- [preview]

All other preview branches skip Vercel deployment and rely on GitHub Actions verification only.
