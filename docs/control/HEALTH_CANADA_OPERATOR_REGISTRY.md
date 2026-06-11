# Health Canada Canadian Licensed Operator Registry

## Purpose

The Health Canada Canadian Licensed Operator Registry is private Harbourview intelligence and CRM infrastructure. It is not a public supplier directory and must not feed public marketplace DTOs, public listing cards, public APIs, public HTML, public search, or client bundles.

The registry stages Health Canada licence-holder evidence, canonicalizes operator/site rows, preserves exclusions and conflicts, and creates an admin/operator-only outreach queue.

## Source status

The initial seed package is marked `transcript/reconciled-hold` unless replaced by a direct official machine parse of the current Health Canada table.

A proof-grade completeness claim requires direct row-by-row reconciliation against the official Canada.ca licence-holder table. Until then, use the seed for private import-structure testing, admin workflow, CRM preparation, and controlled enrichment only.

## Private tables

- `health_canada_source_snapshots`
- `health_canada_raw_source_rows`
- `canadian_operator_canonical`
- `canadian_operator_licence_sites`
- `canadian_operator_outreach_queue`
- `canadian_operator_exclusions`
- `canadian_operator_duplicate_clusters`
- `canadian_operator_conflicts`
- `canadian_operator_individual_holds`

## Privacy model

All registry tables are RLS-enabled and admin/operator-only. Anonymous users are denied. Viewer users are denied. Analyst access is not granted by this migration.

Private fields include raw source rows, source snapshots, source row IDs, phone numbers, outreach state, duplicate clusters, conflicts, verification holds, exclusion rows, source evidence payloads, and admin notes.

## Tracks

- `integrated_operator`
- `medical_processing`
- `processor_cultivator`
- `micro_craft`
- `nursery_starting_material`
- `medical_only`
- `strategic_corporate_cluster`
- `individual_name_verification_hold`
- `exclusion`
- `review_required`

## No-public-exposure rule

Public marketplace DTOs must remain allowlisted. Do not add registry fields to public DTOs. Public routes must not render registry row IDs, Health Canada source evidence, phone numbers, outreach readiness, conflict notes, revoked/expired/suspended ledgers, or verification holds.

## HOLD conditions

HOLD if any registry data leaks publicly, RLS is incomplete, import is not idempotent, exclusions can become outreach-ready, individual-name rows are not held, duplicate/second-site rows cannot be reviewed, validation cannot run, or proof-grade Health Canada completeness is claimed without direct official machine-parse reconciliation.
