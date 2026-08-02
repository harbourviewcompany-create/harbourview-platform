# ADR-007: Layered Authorization

**Status:** Accepted  
**Date:** 2026-07-31

## Decision

Combine application policy, PostgreSQL RLS and explicit output projections.

## Consequences

No single layer covers business authorization, tenant isolation and publication leakage.

## Rejected alternative

RLS-only and application-only authorization were rejected.

## Verification

The relevant contracts, migration tests, authorization tests, lineage tests or operational evidence must be attached to the phase release record.
