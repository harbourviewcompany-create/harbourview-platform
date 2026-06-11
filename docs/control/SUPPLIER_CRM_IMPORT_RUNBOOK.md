# Harbourview Supplier CRM Private Import Runbook

This runbook controls the private Harbourview supplier CRM import for the supplier outreach dataset. It loads named supplier contacts and channel-specific outreach rows into a private Supabase schema for admin use only.

This import is not a marketplace DTO, public supplier directory, public fixture, public route feed, or public API source.

## Data classification

Classification: private operator/admin CRM data.

Public exposure rule: no supplier CRM rows, named contacts, evidence URLs, company routes, email routes, phone routes, LinkedIn profile URLs, message templates, or channel-status fields may be exposed through public routes, marketplace DTOs, client components, public fixtures, static JSON, public seed data, or client bundles.

## Tables

Private schema: `harbourview_crm`

| Table | Source CSV | Expected rows | Purpose |
|---|---|---:|---|
| `harbourview_crm.crm_supplier_company_rollup` | `supabase/imports/supplier-crm/crm_supplier_company_rollup.csv` | 42 | Company/account rollup |
| `harbourview_crm.crm_supplier_contacts` | `supabase/imports/supplier-crm/crm_supplier_contacts.csv` | 107 | Authoritative no-loss named-contact table |
| `harbourview_crm.crm_supplier_email_outreach` | `supabase/imports/supplier-crm/crm_supplier_email_outreach.csv` | 94 | Email channel subset |
| `harbourview_crm.crm_supplier_linkedin_outreach` | `supabase/imports/supplier-crm/crm_supplier_linkedin_outreach.csv` | 107 | LinkedIn channel subset |
| `harbourview_crm.crm_supplier_phone_outreach` | `supabase/imports/supplier-crm/crm_supplier_phone_outreach.csv` | 99 | Phone channel subset |

Channel tables are subsets/views for operating workflows. They must not be interpreted as dropped contacts. The authoritative all-contact table is `crm_supplier_contacts` with 107 named people.

## Access model

The migration enables and forces Row Level Security on all five CRM tables.

Default posture:

- `anon`: no schema or table access.
- `public`: no schema or table access.
- `authenticated`: table privileges granted only so RLS can evaluate access.
- RLS policy: admin-only using `harbourview_crm.current_user_is_supplier_crm_admin()`.
- `service_role`: permitted for controlled server-side import and maintenance only.

The helper checks the existing Harbourview `public.user_roles(user_id, role)` model for `admin`, and also supports JWT `app_metadata.roles` or `app_metadata.role` admin evidence.

## Import order

Run migration first, then import CSVs in this exact order:

1. company rollup
2. contacts
3. email outreach
4. LinkedIn outreach
5. phone outreach

## CI-safe package validation

Run this before any database import:

```bash
node scripts/validate-supplier-crm-import.mjs
```

This validates the checked-in CSV and SQL package without requiring Supabase credentials and without writing to production. It proves:

- 42 companies
- 107 named contacts
- 94 email rows
- 107 LinkedIn rows
- 99 phone rows
- zero contacts with missing companies
- zero orphan email rows
- zero orphan LinkedIn rows
- zero orphan phone rows
- no duplicate stable IDs
- no company-only rows in the named-contact table
- private/RLS SQL posture is present
- public-facing directories do not reference the private supplier CRM schema/data

## Database import command

Use a direct database-owner/service connection. Do not use a browser/client Supabase key. Do not run against production unless the migration/import has been approved for that environment.

```bash
psql "$DATABASE_URL" -f supabase/migrations/20260611170000_create_harbourview_supplier_crm_private.sql
psql "$DATABASE_URL" -f supabase/sql/import_supplier_crm.psql
psql "$DATABASE_URL" -f supabase/sql/validate_supplier_crm.sql
```

The import script has default CSV paths under `supabase/imports/supplier-crm/`. To override paths:

```bash
psql "$DATABASE_URL" \
  -v company_csv=/absolute/path/crm_supplier_company_rollup.csv \
  -v contacts_csv=/absolute/path/crm_supplier_contacts.csv \
  -v email_csv=/absolute/path/crm_supplier_email_outreach.csv \
  -v linkedin_csv=/absolute/path/crm_supplier_linkedin_outreach.csv \
  -v phone_csv=/absolute/path/crm_supplier_phone_outreach.csv \
  -f supabase/sql/import_supplier_crm.psql
```

## Post-import validation

Run:

```bash
psql "$DATABASE_URL" -f supabase/sql/validate_supplier_crm.sql
```

Required database proof:

- companies = 42
- contacts = 107
- email_rows = 94
- linkedin_rows = 107
- phone_rows = 99
- email_orphans = 0
- linkedin_orphans = 0
- phone_orphans = 0
- RLS enabled and forced for all five tables
- only admin policies exist on the private CRM schema tables

## Rollback

Rollback is destructive for this private CRM schema only:

```bash
psql "$DATABASE_URL" -f supabase/sql/rollback_supplier_crm.sql
```

Rollback must not touch marketplace, public listings, source registry, intelligence, education, signals, or other Harbourview schemas.

## GO/HOLD gate

GO only when:

- package validation passes locally/CI
- migration applies cleanly in target environment
- import completes without row-count mismatch
- post-import SQL validation passes
- zero orphan channel records are proven
- RLS is enabled and forced on every table
- `anon`/`public` access is revoked
- no public route, client bundle, public DTO, public fixture, or marketplace code references supplier CRM data

HOLD when:

- any expected row count differs
- any duplicate stable ID exists
- any channel row is orphaned
- any contact is missing a company
- any named-contact row is company-only
- CRM data appears in public code or public DTOs
- RLS/admin policy compatibility is ambiguous
- rollback path is missing or unsafe
