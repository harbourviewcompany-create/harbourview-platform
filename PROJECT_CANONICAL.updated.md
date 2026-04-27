# PROJECT_CANONICAL.updated.md

Date: 2026-04-27
Project: Harbourview Marketplace v1
Authority: This file is the active operating law for the Harbourview Marketplace v1 fresh-start build.

## 0. Source of truth

Active repository: harbourviewcompany-create/harbourview-platform.
Active build line: Harbourview Marketplace v1.
Active database target must be live-verified before SQL is applied.

This file supersedes prior chat memory, older Production Spine assumptions, legacy Supabase state, old migrations, AI agent claims and unverified local work.

No agent may claim implementation success without repo-visible evidence, live Supabase evidence or executable test output.

## 1. Build objective

Build a broad commercial marketplace for the regulated cannabis industry. The initial product is a discovery, listing, inquiry and admin-review system. It is not checkout, escrow, order orchestration, shipment management, GMP batch-record management or medical prescribing infrastructure.

## 2. Marketplace v1 sections

The marketplace has seven public sections:

1. New Products
2. Used & Surplus
3. Cannabis Inventory
4. Wanted Requests
5. Services
6. Business Opportunities
7. Supplier Directory

Liquidations, auctions, facility closures and bulk asset packages are listing types under Used & Surplus, not top-level sections in v1.

## 3. Out of scope for v1

The following are excluded from v1:

- Jobs
- Investor opportunities
- Escrow
- Checkout
- Open user-to-user messaging
- Payment processing
- Shipment state tracking
- GMP batch or serialization record management
- Telemedicine workflows
- Country dossiers
- Advanced strategic-intelligence modules

## 4. Hard gates

Database verification must happen before frontend claims are treated as real.
SQL must be drafted, security-reviewed and then applied. No SQL should be applied before security review.
Public users must never read private fields.
Base tables containing private fields must not be exposed directly to public clients.
Public reads must use safe SQL views or server-side sanitized responses.
Service-role access must remain server-only.
RLS must be verified for anon, authenticated member and admin contexts.

## 5. Zero-tolerance public leakage fields

These fields and equivalents must not appear in public SQL views, public API response types, client components, public route handlers, SELECT * responses or anonymous-readable base tables:

- lead_quality
- estimated_deal_value
- monetization_path
- admin_priority
- internal_notes
- analyst_notes
- reviewer_notes
- rejection_reason
- private_notes
- item_notes
- api_token
- token_hash
- service_role_key
- contact_email
- contact_phone
- private supplier contacts
- admin notes
- review decision notes

These may exist only in private/admin-only tables when required for operations.

## 6. Required database objects

Required core objects:

- marketplace_listings
- marketplace_listing_private
- marketplace_wanted_requests
- marketplace_wanted_private
- marketplace_suppliers
- marketplace_supplier_private
- marketplace_inquiries
- marketplace_review_queue
- audit_events

Required public views:

- marketplace_listings_public
- marketplace_listing_detail_public
- marketplace_wanted_requests_public
- marketplace_suppliers_public

## 7. Security model

Public users may read approved public views only.
Public users may submit inquiries through controlled server-side endpoints or tightly-scoped insert policies.
Authenticated admins may review listings, wanted requests, suppliers and inquiries.
Private tables are admin-only.
audit_events is append-only. Update and delete are blocked.
All sensitive operational fields stay in private tables or review tables.

## 8. Regulatory posture

Marketplace v1 is a discovery and controlled-introduction platform. It must not present inquiries as binding orders. It must not collect or manage GMP batch serialization data, shipment manifests, prescription data or fulfillment workflow state.

Public copy and UI should clearly frame inquiries as non-binding commercial inquiries subject to regulatory, licensing and counterparty review.

## 9. Implementation order

1. Commit this canonical file.
2. Verify repository branch and live Supabase target.
3. Draft marketplace baseline migration.
4. Security-review migration for public leakage and RLS gaps.
5. Apply migration only after review.
6. Generate Supabase types only after migration is applied.
7. Build server-side sanitized API routes.
8. Build frontend only against safe public views and sanitized API types.
9. Add test matrix for RLS, leakage and inquiry flows.
10. Enable branch protection before treating main as production-grade.

## 10. Agent roles

ChatGPT: commander, spec controller, final synthesis.
Claude Code: implementation agent with actual repo access.
WH: Supabase verifier and database executor.
WA: database migration drafter.
THC: security reviewer.
THV: UX/page-spec reviewer.
BG: frontend builder after database verification.
OT: verification and test-matrix owner.
Gemini: outside reviewer.
Perplexity: research/intelligence input only, not implementation authority.

## 11. Current audit status

As of this file date, older Production Spine schema work is not assumed to satisfy Marketplace v1. Marketplace v1 must be verified against the objects and controls above.
