# Country identity enrichment

This tooling separates country identity/geography coverage from regulatory intelligence.

## Policy

- ISO-3166 identity data may be seeded without making a regulatory claim.
- `country_intel` writes are limited to `country_code`, `country_name`, and `review_status`.
- No cannabis tier, hemp status, licensing claim, commercial pathway, score, or legal summary is synthesized.
- Unresolved markets are queued for research instead of assigned a default `restricted` state.
- Draft playbooks are not auto-created from signal presence alone.
- Regulatory publication must use the evidence-backed path and primary-source bar already enforced by the globe data layer.

## Registry and evidence boundary

The identity registry is not a regulatory authority. Country presence, ISO identifiers, names, and geography may be complete even when regulatory intelligence is unresolved. An unresolved jurisdiction must remain explicitly unknown; downstream publication may use only the evidence-backed regulatory fields with a valid evidence key, verification timestamp, and unexpired freshness window.

## Dry run

```bash
DRY_RUN=1 SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  node scripts/safe-country-intel-enrichment.mjs
```

## Live identity-only run

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  node scripts/safe-country-intel-enrichment.mjs
```

The script writes only identity rows when run live and emits a research queue under `scripts/country-data/out/`.
