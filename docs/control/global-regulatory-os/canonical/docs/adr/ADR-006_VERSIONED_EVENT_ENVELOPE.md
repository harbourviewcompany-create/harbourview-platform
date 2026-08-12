# ADR-006: Versioned Event Envelope

**Status:** Accepted  
**Date:** 2026-07-31

## Decision

Use CloudEvents-compatible metadata plus tenant, jurisdiction, actor, correlation, causation, classification and evidence references.

## Consequences

Supports traceability, replay and contract evolution.

## Rejected alternative

Unversioned topic-specific payloads were rejected.

## Verification

The relevant contracts, migration tests, authorization tests, lineage tests or operational evidence must be attached to the phase release record.
