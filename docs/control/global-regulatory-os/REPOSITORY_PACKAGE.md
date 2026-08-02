# Global Regulatory OS repository package

The controlling input is `global-cannabis-regulatory-os-control-pack-v1.0.zip` with SHA-256:

`33a1b3de6f295aaeaf61017937a21b364bac7c0600f4038706013cb6b47cd136`

This branch stores the Harbourview Phase 0 repository artifacts, tests, canonical migrations, OpenAPI, AsyncAPI, JSON Schemas, ADRs and ticket specifications in the checksum-controlled archive `phase0-overlay-v1.0.3.tar.gz.*`. The archive was produced from the controlling ZIP without changing the global target architecture; phases control execution order only.

Run:

```bash
bash scripts/global-reg-os/bootstrap-phase0.sh --materialize
```

The command reconstructs the ordered archive parts, verifies SHA-256, and materializes the files into their canonical repository paths. CI performs the same operation before contract and PostgreSQL 17 validation.

The 13 Global Regulatory OS migrations remain isolated under the canonical control-pack path. They are not copied into Harbourview's active Supabase migration directory and are not applied to Harbourview production by this branch.

Repository preview compatibility uses Harbourview's existing daily `/api/cron/intelligence-health` schedule. This deployment constraint does not change the Global Regulatory OS architecture or its execution model.

PR #1234 is rebased onto repaired `main`. The inherited `MobileCommandCentre.tsx` merge conflict is resolved by retaining the repaired main implementation, which renders market-entry steps as strings and handles `key_regulators` through its `primary` value and `secondary[]` collection. The Global Regulatory OS artifacts and service architecture are unchanged.

Current-main synchronization evidence: the branch was rebuilt on `2eb6384e825c98d5eba044ed3148ac0cfe2b8b54`; current-main package, extraction, supply imagery, supply-image audit and Vercel changes were retained; `package-lock.json` was regenerated from the combined manifest; and `MobileCommandCentre.tsx` plus `vercel.json` remain outside the PR diff.

The final preview was retriggered after an external Vercel build-rate-limit response. This evidence-only commit changes no application, contract, database, migration, authorization, or deployment configuration.
