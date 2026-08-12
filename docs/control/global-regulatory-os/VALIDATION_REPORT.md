# Replacement Validation Report

- Controlling archive SHA-256: `33a1b3de6f295aaeaf61017937a21b364bac7c0600f4038706013cb6b47cd136`
- Original manifest SHA-256: `e3d4f2303abbb4271e91e27fcadeef1cac37fc7469fb361618f0893218814146`
- Canonical package version: `1.0.1-harbourview-phase0`
- Source files are committed normally under `canonical/`.
- Exact source archive bytes are committed under `source/`.
- Canonical manifest is regenerated after the trusted-context and Phase 0 proof additions.
- OpenAPI operation metadata and trusted runtime schema grants are included in the regenerated manifest and validated by the replacement workflow.

## Verified GitHub evidence

The complete verification matrix passed on implementation head `1bc3334d6836b97c6409b89b5214d9d29960976a`:

- Global Regulatory OS Phase 0 Replacement: run `30761771045` — source provenance, deterministic manifest, proof matrix, secret scan, migration isolation and ledger parser, OpenAPI, AsyncAPI, PostgreSQL 17 clean install, simulated upgrade, trusted authorization, negative privilege escalation, RLS and public leakage passed.
- Full CI: run `30761771035` — install, critical environment checks, typecheck, security and leakage, domain logic, signal runtime, intake and listings, smoke tests and production build passed.
- Branch Verification: run `30761771031` — typecheck, fixtures, extraction, listing quality, public imagery, leakage probes, production build, Playwright route and mobile probes, and safe no-write production visibility checks passed.
- Regional Routing Verification: run `30761771042` — generated mapping, lint, typecheck, full tests, production build, public-boundary checks and PostgreSQL 17 fixture passed.
- Project Registry Discipline: run `30761771032` — passed.
- Regulatory Signals Verify: run `30761771053` — passed.
- Elite Digest Forward Repair Verification: run `30761771055` — passed.
- Elite Digest Boundary Hardening Verification: run `30761771077` — passed.
- HAR-39/HAR-40 Public Surfaces: run `30761771048` — passed.
- PR 166 equipment verification: run `30761771057` — passed.
- Type check: run `30761771049` — passed.

## Vercel preview status

At the time of this evidence correction, Vercel had not created a deployment for implementation head `1bc3334d6836b97c6409b89b5214d9d29960976a`. The Git status was rejected before build with `build-rate-limit`; this is an external preview-capacity HOLD, not a repository build failure. No production deployment was initiated.

## Decision

- Technical Phase 0 package: GO based on the verified repository and PostgreSQL evidence above.
- Exact Vercel preview gate: HOLD until a READY preview exists for the then-current draft head.
- Operator release status: HOLD pending explicit constitution, source-rights, retention and residency, bounded-context, migration-sequencing, deployment and public-claims decisions.
