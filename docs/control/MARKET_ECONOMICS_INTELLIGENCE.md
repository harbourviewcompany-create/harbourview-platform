# Market Economics Intelligence Control

Status: implemented on feature branch, pending PR validation  
Owner: Harbourview market intelligence  
Updated: 2026-10-08

## Purpose

Harbourview's public market surfaces may show reviewed commercial economics alongside regulatory intelligence. This layer is intentionally separate from the automated signal-promotion pipeline.

The first slice covers current medical-cannabis flower price signals on `/markets` and the authenticated market-comparison surface.

## Data contract

Every displayed price metric must include:

- market ISO2
- numeric value
- currency and unit
- a plain-language basis
- an explicit `asOf` date
- confidence
- source label in the client-visible snapshot
- source type
- HTTPS source URL in the server-only provenance registry

The UI must distinguish:

1. **Upstream / wholesale signal** — a declared trade value or other B2B benchmark.
2. **Downstream comparator** — a pharmacy/patient price used only as context.
3. **Import context** — physical volume, kept separate from price.

No downstream retail/pharmacy price may be labelled wholesale.

## Source hierarchy

Preferred order:

1. regulator / government dataset
2. customs or official trade data
3. analysis that directly processes official trade data and discloses methodology
4. transparent market tracker with a stated sample and timestamp

Private contract pricing may only be shown when Harbourview has a publishable, permissioned source.

## Current caveat

Canadian declared export values are directional upstream benchmarks. Shipment-level Incoterms, quality tiers, processing scope, payment terms and private distributor contracts are not visible in the public customs data. The UI states this explicitly.

## Freshness

A metric older than 183 days is marked **Refresh due** by the public component. Stale data remains visible with its original date rather than being silently rewritten or inferred.

## Pipeline boundary

This module does not:

- write to `signals`
- modify the canonical `hv_*` intelligence pipeline
- auto-promote unreviewed research
- change Supabase schema or production data

Updates are code-reviewed snapshots until a dedicated reviewed-data ingestion path is designed and validated.

## Provenance boundary

Raw source URLs live in `data/harbourview/market-economics-sources.server.ts`, which imports `server-only`. The client-visible snapshot deliberately carries source labels but no URLs. This follows `PR_REVIEW_CHECKLIST.md`'s public-leakage boundary while preserving reproducible internal provenance.

## Competitive benchmark

Prohibition Partners and other market-research products provide country-level market sizing and narrative. Price-comparison sites provide highly current retail pricing but little market-access context.

Harbourview's differentiator on this surface is the combination of **regulatory market access + reviewed upstream trade pricing + downstream comparator + freshness/confidence + reviewed provenance** in the same country decision workflow. Public surfaces show source labels only; raw source URLs remain server-only under the public-leakage control.

## Verification

Required for this slice:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npx vitest run tests/markets/marketEconomics.test.ts`

No production merge or deployment occurs without the existing Harbourview promotion/sign-off rules.
