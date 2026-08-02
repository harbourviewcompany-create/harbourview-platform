# Replacement Validation Report

- Controlling archive SHA-256: `33a1b3de6f295aaeaf61017937a21b364bac7c0600f4038706013cb6b47cd136`
- Original manifest SHA-256: `e3d4f2303abbb4271e91e27fcadeef1cac37fc7469fb361618f0893218814146`
- Canonical package version: `1.0.1-harbourview-phase0`
- Source files are committed normally under `canonical/`.
- Exact source archive bytes are committed under `source/`.
- Canonical manifest is regenerated after the trusted-context and Phase 0 proof additions.
- OpenAPI operation metadata and trusted runtime schema grants are included in the regenerated manifest and validated by the replacement workflow.

## Verified GitHub evidence

The complete verification matrix passed on package head `d0127a1c4abb3b22b957c3ab2365c3e8d5665fba`:

- Global Regulatory OS Phase 0 Replacement: run `30757139130` — source provenance, deterministic manifest, proof matrix, secret scan, OpenAPI, AsyncAPI, PostgreSQL 17 clean install, simulated upgrade, trusted authorization, negative privilege escalation, RLS and public leakage passed.
- Full CI: run `30757139129` — install, critical environment checks, typecheck, security/leakage, domain logic, signal runtime, intake/listings, smoke tests and production build passed.
- Branch Verification: run `30757139138` — typecheck, fixtures, extraction, listing quality, public imagery, leakage probes, production build, Playwright route/mobile probes and safe no-write production visibility checks passed.
- Migration Drift Check: run `30757139149` — passed.
- Project Registry Discipline: run `30757139186` — passed.
- Regulatory Signals Verify, Regional Routing Verification, Elite Digest Forward Repair Verification, HAR-39/HAR-40 Public Surfaces and PR 166 equipment verification — passed.

This report update is documentation-only and exists to activate an exact-head Vercel preview after the earlier Vercel request was rejected before build by account build-rate capacity.

- Technical Phase 0 status: GO after all final-head automated gates and exact preview pass.
- Operator release status: HOLD pending explicit policy, migration, merge and production authorization.
