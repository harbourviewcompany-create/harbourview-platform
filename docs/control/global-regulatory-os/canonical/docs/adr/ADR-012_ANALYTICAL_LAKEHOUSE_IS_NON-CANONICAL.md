# ADR-012: Analytical Lakehouse Is Non-Canonical

**Status:** Accepted  
**Date:** 2026-07-31

## Decision

Object storage and open table formats hold raw/standardized analytical datasets; canonical definitions and approvals remain transactional.

## Consequences

Supports scale without allowing analytical transformations to redefine truth.

## Rejected alternative

Warehouse-only canonical governance was rejected.

## Verification

The relevant contracts, migration tests, authorization tests, lineage tests or operational evidence must be attached to the phase release record.
