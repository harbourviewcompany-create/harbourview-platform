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
