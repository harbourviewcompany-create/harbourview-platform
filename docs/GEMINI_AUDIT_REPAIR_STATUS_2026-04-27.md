# Gemini Audit Repair Status

Date: 2026-04-27
Branch: feat/marketplace-v1

## Summary

This repair pass addressed the immediate Gemini block by making the missing Marketplace v1 canonical law repo-visible and adding a draft baseline migration for Marketplace v1 review.

## Completed

- Added `PROJECT_CANONICAL.updated.md`.
- Added `supabase/migrations/001_marketplace_v1_baseline.sql` as a draft migration for security review before application.
- Defined required core marketplace tables.
- Defined required sanitized public views:
  - `marketplace_listings_public`
  - `marketplace_listing_detail_public`
  - `marketplace_wanted_requests_public`
  - `marketplace_suppliers_public`
- Kept zero-tolerance operational fields out of public views.
- Isolated sensitive operational fields into private/admin-only tables.
- Added RLS policies for public reads, submissions, admin management and audit reads.
- Added append-only design intent for `audit_events` by not creating update/delete policies.

## Important limits

This pass did not apply SQL to Supabase.
This pass did not delete legacy migrations.
This pass did not rotate keys.
This pass did not verify live Supabase state.
This pass did not confirm CI status.

## Required next audit checks

Gemini/THC should review the new migration for:

1. Public leakage through safe views.
2. Whether base table public read policies should be removed so public reads are forced through views only.
3. Whether anonymous inquiry insert should remain direct or be server-route-only.
4. Whether `audit_events` needs a database trigger to hard-block updates/deletes even for privileged roles.
5. Whether private field names in private tables are acceptable under the canonical rule.
6. Whether enum usage is appropriate for future migration flexibility.
7. Whether old Production Spine migrations must be archived before this migration is applied.

## Current verdict

Repair is partial and repo-visible. It is not production-cleared.

The correct next move is security review of `001_marketplace_v1_baseline.sql`, then WH live Supabase verification, then controlled application only after review.
