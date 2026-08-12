# ADR-015: Runtime Relative Time

**Status:** Accepted  
**Date:** 2026-07-31

## Decision

Count-downs and relative dates are calculated from canonical timestamps at request time.

## Consequences

Prevents stale editorial values and makes as-of context explicit.

## Rejected alternative

Stored countdown prose was rejected.

## Verification

The relevant contracts, migration tests, authorization tests, lineage tests or operational evidence must be attached to the phase release record.
