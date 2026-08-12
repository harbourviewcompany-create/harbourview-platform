# ADR-001: Canonical PostgreSQL

**Status:** Accepted  
**Date:** 2026-07-31

## Decision

PostgreSQL owns canonical transactional facts, effective-dated records, review state and tenant data. Search, graph, cache and analytical stores are rebuildable projections.

## Consequences

Avoids multiple editable sources of truth and permits transactional lineage and RLS.

## Rejected alternative

A graph-first or search-first authoritative store was rejected because business invariants and temporal review state require transactional constraints.

## Verification

The relevant contracts, migration tests, authorization tests, lineage tests or operational evidence must be attached to the phase release record.
