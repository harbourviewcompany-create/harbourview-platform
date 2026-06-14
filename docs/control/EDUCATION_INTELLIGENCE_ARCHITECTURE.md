# Harbourview Education Intelligence Architecture

## Objective

This pass adds the foundation for Harbourview Education as a country-aware, role-aware, source-controlled education layer. It adds rails for claim control, source review, DTO allowlisting, admin review and safe release gates.

## First PR scope

Included: schema, CSV templates, placeholder seed controls, TypeScript guardrails, public `/education` shell, guarded `/admin/education` shell and tests.

Excluded: real jurisdiction conclusions, restricted professional content, import/export conclusions, licensing conclusions, live source scraping, search indexing, RAG, vector indexing and automated answer surfaces.

## Layer model

1. Global base layer for safe general concepts.
2. Country and subjurisdiction overlays after source review.
3. Role overlays for professional, commercial, general and admin contexts.
4. Module overlays for public guides, professional tools, commercial tools, quality modules and admin review.

## Claim-level storage rule

Education content is stored as claim-level data before prose. Public content must be generated only from allowed fields and accepted review states. Private evidence, source work, reviewer notes, conflicts and unpublished material remain admin-only.

## Source hierarchy

Tier 1: primary authority or official standards source.
Tier 2: official guidance or official forms.
Tier 3: peer-reviewed literature or clinical guideline.
Tier 4: recognized quality or accreditation source.
Tier 5: industry or media context for discovery only.
Tier 6: unverified context, not release-supporting without independent review.

## Review states

Release-supporting states: verified_primary_source, verified_professional_body, verified_peer_reviewed and low-risk verified_secondary_source.

Blocked states: conflicting_sources, stale_source, jurisdiction_unclear, clinical_review_required, legal_review_required, review_pending and do_not_publish.

## Public DTO rule

Public output must use static safe copy, server-side DTO allowlisting or a public-safe content surface with no private columns. Anonymous users must not read raw claim, source, review, conflict, freshness or audit tables.

## RLS expectations

All education tables enable RLS. Raw education tables have no anonymous read policy. Review access is tied to existing Harbourview user roles. Service-role work remains server-side only.

## Rollback

Disable public education by reverting the `/education` shell or routing it to a holding page. Do not run placeholder seeds unless `HARBOURVIEW_EDUCATION_SEED_PLACEHOLDERS=1` is deliberately set. Roll back the migration only in staging after confirming no dependent data exists.

## GO/HOLD

GO only when schema is additive, RLS is enabled, anonymous raw-table reads are denied, public DTO output strips private fields, placeholder seeds are manually gated, admin route is guarded, public route renders safe shell content only, and verification passes.

HOLD if the migration is not additive, any raw education table is publicly readable, public route uses raw table queries, admin route is anonymous-accessible, placeholder seeds run automatically, restricted claims appear publicly, existing Harbourview leakage/auth/RLS behavior is weakened, or DTO/RLS behavior cannot be proven.
