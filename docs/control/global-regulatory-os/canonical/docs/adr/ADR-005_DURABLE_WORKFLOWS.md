# ADR-005: Durable Workflows

**Status:** Accepted  
**Date:** 2026-07-31

## Decision

Use a durable workflow engine for retries, timers, human review, corrections, alerts and corridor evaluations.

## Consequences

Long-running regulated workflows must resume after failure and retain versioned state.

## Rejected alternative

Ad hoc cron/job chains were rejected for multi-step human workflows.

## Verification

The relevant contracts, migration tests, authorization tests, lineage tests or operational evidence must be attached to the phase release record.
