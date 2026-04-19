# Harbourview

Harbourview is the system of record for commercial intelligence, strategic introductions and market-access operations.

## Source of truth

This repository is the canonical source of truth for:

- app structure
- database migrations
- Supabase functions
- RLS and permission model
- RPC contracts
- operating docs

## Initial structure

- `app/` Next.js App Router entry points
- `src/` shared app code
- `supabase/migrations/` database source of truth
- `supabase/functions/` Supabase Edge Functions
- `docs/` platform docs and operating contracts

## Principles

1. Database changes must land through migrations
2. Human-owned fields must be explicitly protected
3. Agent writes must go through approved RPCs
4. Reviewable curation actions must be auditable
5. Production state should be reproducible from this repo

## Next recommended actions

1. wire Supabase project linkage
2. replace placeholder migration with full migration pack
3. add typed RPC client layer
4. add auth and role-aware dashboard routes
5. add CI checks for SQL and app build
