# Harbourview Intelligence OS Extraction V1.1

## Purpose

This extraction adds a private-first typed foundation for Harbourview Intelligence OS without changing public routes, admin routes, Supabase, authentication, UI, scraping, AI calls or marketplace behavior.

The extraction is intentionally limited to TypeScript models, lightweight runtime validators, controlled fixtures, public/private projection helpers, forbidden-field leakage tests and acceptance gates.

## Scope Included

- Market intelligence records
- Source registry records
- Signal review lifecycle
- Raw source quarantine types
- Evidence record types
- Counterparty and contact types
- Mission Builder scoring contract
- Mandate review types
- IC memo types
- Public/private projection helpers
- Public safety forbidden-field tests

## Explicitly Excluded

- No UI
- No public routes
- No admin routes
- No Supabase migrations
- No live scraping
- No crawler execution
- No browser-side AI calls
- No server-side AI calls
- No localStorage persistence
- No automated publication
- No public contact exposure
- No legal advice generation
- No production data import
- No marketplace behavior changes
- No auth/admin behavior changes

## Public/Private Rules

Public projections may include only reviewed, intentionally public-safe summaries.

Never expose publicly by default:

- sourceUrl / source_url
- sourceName / source_name
- contactEmail / contact_email
- email
- linkedin_url
- private_notes
- internal_notes
- provenance
- evidence URL or hash
- licence evidence
- diligence status
- raw scraped text
- gatekeepers
- red flags
- what’s next
- private scoring
- mandate reviews
- IC memos
- contact records

## Review Gates

GO only if no route files, admin route files, Supabase migrations or UI components are changed, no AI or scraping code is added, fixtures validate, public projections strip private fields, forbidden leakage strings are absent from public projections, typecheck passes, build passes and visibility/leakage tests pass.

HOLD if raw contact detail appears in a public projection, source URLs or source names leak publicly by default, AI calls or live scraping are introduced, route/auth/admin/public marketplace behavior changes or fixture-only scope expands without explicit approval.

## Future PR Sequence

1. Intelligence OS Extraction V1.1, typed fixtures and projection tests only.
2. Private `/admin/intelligence` shell behind existing admin/operator authorization.
3. Source registry and signal review queue, private only.
4. Mission Builder V1, deterministic scoring only.
5. Mandate Screener V1, private only.
6. IC Memo V1, private only.
7. Controlled public intelligence summaries, reviewed/published only.
