# Regulatory Market Access — live effect reconciliation — 2026-08-31

## Scope

This document reconciles the observable production effects relevant to the Market Access heatmap without claiming to reconstruct the historical SQL of the two unattributed live migration versions:

- `20260830140000` / `full_regulatory_tier_coverage`
- `20260830141000` / `subnational_regulatory_tier_evidence_alignment`

Production project: `zvxdgdkukjrrwamdpqrg`.

## Read-only production evidence

The live migration ledger contains both versions above. Their statement text is not stored in `supabase_migrations.schema_migrations`, so this repository does not manufacture replacement SQL or a statement hash for either version.

Read-only inspection on 2026-08-31 found:

- 291 `public.countries` rows with a renderable jurisdiction identifier.
- 203 country/territory rows.
- 51 U.S. state/DC rows.
- 13 Canadian province/territory rows.
- 8 Australian state/territory rows.
- 16 German Land rows.
- all 291 rows have a non-null legacy `regulatory_tier`;
- all 291 rows have `regulatory_tier_origin = 'override'`;
- 0 rows remain `regulatory_tier_origin = 'auto'`;
- 7 rows currently have `regulatory_tier_needs_review = true`.

These observations are sufficient to describe the current production effect boundary, but not to prove which individual statement in either unattributed migration caused a particular row state.

## Reconciliation decision

The new evidence-backed Market Access authority does **not** register either historical version, rename a repository migration to either version, create an equivalence entry, or assert a historical statement hash.

Instead it creates a new forward-only publication boundary:

1. `countries.regulatory_tier` remains the legacy classifier/review field and is not rewritten by this change.
2. `countries.verified_regulatory_tier` becomes the only tier the public globe may render.
3. A published tier requires a current structured row in `regulatory_market_access_evidence` plus verification and expiry metadata.
4. Missing or expired evidence publishes `NULL`, preserving the existing neutral/fail-closed globe behavior.
5. Briefing prose and `api.derive_regulatory_tier` may continue to generate analyst-review suggestions, but cannot directly publish a colour.
6. Parent inheritance is explicit and limited to Canada, Australia and Germany, where the audited national licensing pathway governs the supported child rows. U.S. federal status never cascades to states.

This supersedes the *publication authority* effects of the two unattributed live migrations without pretending to reconstruct their historical implementation.

## Production correction boundary

No production write was made while preparing this reconciliation. The proposed migrations remain unapplied pending PR review and the normal controlled activation path.

Before production activation, require:

- local production-faithful migration replay green;
- TypeScript, Vitest and Next.js build green;
- complete evidence matrix reviewed;
- production read-only comparison against all 291 current rows;
- no duplicate active direct evidence authority;
- no published tier with missing, future-dated or expired evidence;
- explicit owner approval for the production migration application.

## Historical status

The two live versions remain provenance gaps until exact source SQL or otherwise valid historical provenance is recovered. This change deliberately does not mark those gaps resolved.
