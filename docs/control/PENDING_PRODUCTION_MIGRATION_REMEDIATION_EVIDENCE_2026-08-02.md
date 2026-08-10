# Pending production migration remediation evidence — 2026-08-02

Status: **HOLD**

## Audited sources

- Requested source commit: `7134bb6cd696779b3429d98272ce1e3cd7e8236c`
- Exact Git tree: `c50c393d3b61052886030a16e296f44cf53d75d8`
- Control repair base: `f7a28c0e78b0ce693eded1dd7284731b7c3b3d43`
- Read-only GitHub Actions run: `30766999778`
- Evidence artifact: `8839263343`
- Artifact digest: `sha256:0fd8a01b6e85e5da2533dbd67a4a74023fddd17cb860e3f27fa271ee0ced12ee`
- Supabase project: `zvxdgdkukjrrwamdpqrg`

The evidence job checked out the exact requested source commit, read the linked migration ledger, generated the activation-preflight manifest, ran the committed SQL preflight in a read-only transaction, and attempted the GitHub environment endpoint. It did not apply a migration or invoke an application mutation.

## Bound evidence files

The repair commits the exact source evidence required for deterministic verification:

- `supabase/release-controls/evidence/elite-digest-preflight-manifest-30766999778.json`
- `supabase/release-controls/evidence/production-migration-ledger-30766999778.txt`
- `supabase/release-controls/pending-production-migration-integrity.json`

The integrity record binds the source commit, tree, workflow run, artifact ID, artifact digest, evidence-file digests, all 784 repository migration files and Git blob hashes, and all 798 remote migration versions.

## Exact findings

- Repository files: 784
- Repository unique versions: 782
- Live versions: 798
- Repository-only versions: 36 across 37 files
- Live-only versions: 52
- Approved pending versions: 3
- Unexpected pending versions: 33
- Duplicate repository versions: `20260722120000`, `20260729000000`
- Pending duplicate version: `20260729000000`
- Invalid filenames: 0
- Approved-file mismatches: 0
- SQL preflight: success
- Environment Administration probe: inconclusive HTTP 404

## Corrected deployment wording

Opening and updating release-control pull requests can trigger **automatic repository integrations**, including Vercel and Cloudflare preview builds. Those integration-created previews are not production database activation and were not manually requested by this repair.

The release-control evidence and repair workflows performed **no manual deployment action**, did not approve a protected environment, did not create a production database deployment, and did not move a production alias. Automatic preview activity must not be described as though no deployment object or preview build existed anywhere in connected systems.

## Direct-main process deviation during evidence collection

A connector call created a one-line temporary placeholder workflow directly on `main` in commit `88ac08d6e9d62cc3484e40a93addd3fe2d2c8e7b`. It was immediately removed in commit `64f2bc0877f9372188f86bde1bb7406ece07e76f`.

Comparison from the requested source commit to the restored tree reported zero changed files. No valid workflow remained and no production operation occurred. The merge-discipline deviation remains recorded rather than concealed.

## Repair validation

The follow-up repair replaces the self-referential count checks with complete evidence recomputation and adds negative tests for:

- coordinated record and count edits;
- missing or changed repository migrations;
- remote ledger or normalized version drift;
- artifact manifest drift;
- source commit, tree, run, artifact ID, and artifact digest mutation;
- allowlist broadening;
- duplicate-prefix and invalid-filename drift;
- false verified-environment states;
- credential material in a redacted export;
- fail-open Git diff logic and mutable action tags.

## Safety boundary

No migration is applied, no production row is written, no environment approval is issued, no manual deployment is created, no alias is moved, and no secret value is read or exposed.
