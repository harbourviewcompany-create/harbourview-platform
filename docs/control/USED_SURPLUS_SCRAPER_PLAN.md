# Used Surplus Scraper Scaffold

## Objective
Build a controlled intake pipeline for Used & Surplus listings.

## Phase 1
- Source registry
- Typed candidate normalization
- Admin review requirement
- Public-safe projection rules
- Mock intake feed

## Phase 2
- Server-side fetch workers
- Source snapshots
- Candidate approval queue
- Image attribution enforcement
- Public projection publishing

## Leakage Controls
Never expose:
- sourceUrl
- sourceName
- contactEmail
- internal notes
- raw ingestion payloads
- reviewer metadata

## Current Status
Scaffold only. No autonomous publishing enabled.
