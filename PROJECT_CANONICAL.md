# Harbourview Canonical Project Lock

Status: locked as of 2026-04-25

## Canonical repository

- GitHub account: harbourviewcompany-create
- Repository: harbourview-platform
- Default branch: main
- Local tracked folder: C:\Users\tyler\Documents\GitHub\Harbourview

## Canonical product direction

This repository is the single source of truth for the Harbourview Production Spine.

The current canonical app is the Next.js and Supabase implementation containing:

- app/
- components/
- lib/
- migrations/
- supabase/
- tests/
- scripts/
- package.json
- runbooks and security documentation

## Consolidation decision

The GitHub repository is the production foundation.

The uploaded XFILE archive is not a replacement repository. It is a legacy archive containing older CRM, dashboard, Netlify endpoint, spreadsheet and static prototype bundles. Those files may be mined later for reference material or data assets but must not overwrite the canonical repository.

## Working rule

All future Harbourview platform work must happen in this repository.

Do not create a new Harbourview app, repo or Supabase project unless a written architecture decision explicitly approves it.

## Import rule for legacy files

Legacy files may only be imported if they pass all of these checks:

1. The file is production-relevant.
2. The file does not duplicate current canonical functionality.
3. The file does not introduce a parallel framework or deployment model.
4. The file does not contain secrets.
5. The file is copied into the correct canonical app location.
6. The import is recorded in CONSOLIDATION_AUDIT.md.

## Current verdict

Consolidation baseline is locked.

Canonical source of truth: harbourviewcompany-create/harbourview-platform.
