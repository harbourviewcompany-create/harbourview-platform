# ADR-011: Derived Graph Projection

**Status:** Accepted  
**Date:** 2026-07-31

## Decision

Entity and relationship records are canonical in PostgreSQL; graph databases are projections.

## Consequences

Preserves one authoritative write path while enabling graph workloads.

## Rejected alternative

Independent graph edits were rejected.

## Verification

The relevant contracts, migration tests, authorization tests, lineage tests or operational evidence must be attached to the phase release record.
