# ADR-010: Separate Public and Private Projections

**Status:** Accepted  
**Date:** 2026-07-31

## Decision

Public, partner and tenant outputs are independently allowlisted contracts.

## Consequences

Prevents private canonical fields from leaking through redaction failure.

## Rejected alternative

Serialize-then-redact was rejected.

## Verification

The relevant contracts, migration tests, authorization tests, lineage tests or operational evidence must be attached to the phase release record.
