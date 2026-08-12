# ADR-002: Immutable Evidence

**Status:** Accepted  
**Date:** 2026-07-31

## Decision

Original source bytes and integrity metadata are persisted before parser, OCR, translation or model processing.

## Consequences

Makes conclusions reproducible and corrections auditable.

## Rejected alternative

Processed-text-only storage was rejected because it cannot prove the original evidence.

## Verification

The relevant contracts, migration tests, authorization tests, lineage tests or operational evidence must be attached to the phase release record.
