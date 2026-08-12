# ADR-003: Modular Core and Isolated Workers

**Status:** Accepted  
**Date:** 2026-07-31

## Decision

Use explicit bounded modules, with acquisition, document processing, AI, notification, indexing and export workers independently isolated.

## Consequences

Preserves boundaries without premature microservice overhead.

## Rejected alternative

A monolith without isolation and a fully fragmented service mesh were rejected.

## Verification

The relevant contracts, migration tests, authorization tests, lineage tests or operational evidence must be attached to the phase release record.
