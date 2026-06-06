# Harbourview Airtable + Supabase Integration Contract

## Purpose

This contract defines Airtable as Harbourview's upstream operator cockpit and Supabase as the downstream secure application database. Airtable remains the human review, source verification, commercial triage, evidence, approval, and operator workflow layer. Supabase serves application-grade auth, RLS-protected storage, public/private DTOs, marketplace records, commercial objects, search, audit logs, and API access.

## Non-negotiable Architecture

- Airtable is upstream review/control.
- Supabase is downstream execution/serving.
- No uncontrolled two-way sync is allowed.
- Public app routes must not query Airtable directly.
- Supabase privileged credentials may be used only in server-only code or Supabase Edge Functions.
- Public pages must read only allowlisted public DTO views or typed DTO APIs.
- Private evidence, source provenance, review notes, raw source rows, rejected records, counterparty intelligence, operator notes, and unsupported claims remain private.

## Schemas

The foundation creates these schemas:

- `hv_core`
- `hv_private`
- `hv_public`
- `hv_commercial`
- `hv_marketplace`
- `hv_education`
- `hv_sync`
- `hv_audit`
- `hv_search`

## Airtable Base and Locked Manifest

- Base ID: `appdZ25lTQvMTWqcx`
- Runtime field mapping is locked in `supabase/functions/airtable-sync/airtableManifest.ts`.
- Runtime sync must use explicit table mappings and field IDs where known. Loose field-name inference is not allowed.

### Required Table Mappings

| Airtable table | Airtable ID | Supabase destination |
| --- | --- | --- |
| Countries | `tblm9u8SsuHBf7Hd9` | `hv_core.jurisdictions` |
| Sources | `tblWdXXDalJHc7dE7` | `hv_core.sources` |
| Organizations | n/a | `hv_core.source_organizations` |
| Source Types | n/a | `hv_core.source_types` |
| Verification Queue | n/a | `hv_private.verification_queue` |
| Rejected Records | n/a | `hv_private.rejected_records` |
| Import Ledger | n/a | `hv_sync.airtable_sync_log` |
| Evidence / Proof Log | n/a | `hv_private.evidence_items` |
| Companies | n/a | `hv_commercial.companies` |
| People | n/a | `hv_commercial.people` |
| Offers | n/a | `hv_commercial.offers` |
| Opportunities | n/a | `hv_commercial.opportunities` |
| Assets | n/a | `hv_marketplace.listings` only after approval |
| Search Index | n/a | `hv_search.search_documents` |
| Connector Health | n/a | sync status only |
| Data Quality | n/a | `hv_audit.action_log` data-quality events |
| Approvals | n/a | `hv_audit.action_log` approval events |
| Sync Log | n/a | `hv_sync.airtable_sync_log` |

## Sync Modes

The Supabase Edge Function lives at `supabase/functions/airtable-sync/index.ts` and supports:

- `dry_run` — default; fetch, map, validate, summarize, and return a log-shaped response with no Supabase mutation and no Airtable writeback.
- `staging` — mutation-capable for local/non-production Supabase only.
- `private_sync` — mutation-capable for private review tables only when configured.
- `public_approved_only` — mutation-capable only for approved public-safe records when configured.
- `writeback_test` — writeback planning mode only; Airtable writeback remains disabled unless explicitly enabled and scoped.

Default request:

```json
{"mode":"dry_run","tables":["Countries","Source Types","Organizations","Sources"],"limit":100,"recordIds":[],"writeback":false,"force":false}
```

## Required Environment Variables

- `AIRTABLE_PAT`
- `AIRTABLE_BASE_ID`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SYNC_DRY_RUN=true`
- `SYNC_WRITEBACK_ENABLED=false`
- `SYNC_ALLOWED_TABLES`
- `SYNC_MAX_RECORDS_PER_RUN=500`
- `SYNC_RATE_LIMIT_MS=250`
- `SYNC_PUBLICATION_MODE=staging`

## Writeback Policy

Writeback is disabled by default. It requires:

1. `SYNC_WRITEBACK_ENABLED=true`.
2. Request body `writeback=true`.
3. Non-production/sample record scope unless explicitly approved.

Allowed writeback fields only:

- Backend Sync ID
- Sync Status
- Last Synced At
- External Provider
- External ID / Source Object ID
- Sync Error
- Public URL, only where applicable
- App Admin URL, only where applicable

Never write back:

- public/private decisions
- human notes
- commercial scores
- source verification decisions
- evidence text
- offer readiness
- private review comments

## RLS Roles

Supported application roles:

- `anon`
- `authenticated`
- `buyer`
- `supplier`
- `sponsor`
- `educator`
- `operator`
- `admin`
- `service_role`

RLS helper functions:

- `hv_core.current_role()`
- `hv_core.is_operator_or_admin()`
- `hv_core.is_admin()`

Policy intent:

- Public and anonymous users read only approved public DTO views.
- Operators/admins can read private review, evidence, sync, and audit data.
- Admins can manage privileged records.
- Server-side sync uses service-role execution only.
- Supplier/buyer account-scoped access is scaffolded through `account_id` and app profiles without exposing unrelated account records.

## Dedupe Rules

- Sources: Airtable record ID first, then normalized URL, then dedupe key.
- Companies: Airtable record ID, then normalized website domain.
- People: Airtable record ID, then email.
- Offers: Airtable record ID, then Offer ID.
- Opportunities: Airtable record ID, then Opportunity ID.
- Duplicates are never auto-deleted. They must be logged as data-quality or rejected-record candidates.

## Verification SQL

The migration `20260606090400_hv_integration_verification.sql` installs verification views for:

- RLS enabled checks across Harbourview schemas.
- Public DTO private column leakage.
- Public unverified source checks.
- Public unapproved marketplace checks.
