# Harbourview Vercel Deployment Policy

## Objective
Reduce unnecessary Vercel preview deployments while preserving production deployment safety and GitHub Actions verification.

## Canonical Vercel Project
Canonical project:
- harbourview
- project id: prj_FiWMX10YY6MDo2WbTDVUKe6QWF8c

Observed duplicate deployment linkage in PR status/comments:
- harbourview
- harbourviewnetwork
- harbourviewcannabis-3379s-projects

Recommendation:
- Keep harbourview as the canonical deployment target.
- Remove or disable duplicate GitHub/Vercel integrations that deploy the same repository.

## Deployment Rules
Always deploy:
- main
- release/*

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
