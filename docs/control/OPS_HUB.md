# Harbourview Intelligence Operations Hub

## Status

`/admin/hub` is an internal read-only admin/operator surface. It is not a public product route and is not canonical Command OS state.

## Access model

The route uses the existing Harbourview admin guard in `lib/auth/adminGuard.ts`. Access is limited to users with `admin` or `operator` roles through the existing `user_roles` model. No separate `HUB_ADMIN_EMAIL` allowlist is used.

## Data sources

The first PR reads only from server-side connector credentials:

- `NOTION_API_KEY`
- `NOTION_SHARED_MEMORY_PAGE_ID`
- `NOTION_STACK_PAGE_ID`
- `NOTION_PROMPT_LIBRARY_PAGE_ID`
- `LINEAR_API_KEY`
- `LINEAR_PROJECT_ID`

These values must be configured as server-side environment variables. Do not expose them with `NEXT_PUBLIC_` prefixes.

## Disabled scope

The first PR intentionally does not enable:

- AI chat proxying;
- Anthropic/OpenAI provider dependencies;
- Notion writes;
- Linear issue mutation;
- session logging;
- proposal queue creation;
- active-context replacement;
- confirmed-decision promotion;
- Airtable canonical cockpit synchronization.

## Canonical cockpit note

This hub is a read-only context viewer until Airtable/Command OS source-of-truth rules are resolved. It must not be treated as the canonical operations cockpit without a follow-up PR that explicitly defines Airtable interaction, write approval gates, audit events and rollback behavior.

## Registry discipline note

PR #322 is scoped to the existing Harbourview Platform registry row. It does not introduce a new deploy target, Supabase project, external service owner, production domain, or standalone system.

## Verification

Run:

```bash
npm run test:admin-hub
npm run test:admin-guard
npm run typecheck
npm run build
```

The first PR is releasable only if the admin/operator guard remains intact, public/private leakage probes pass, and the build is green.