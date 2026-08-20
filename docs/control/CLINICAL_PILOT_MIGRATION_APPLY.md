# AU/GB/BR local_authorities migration — apply policy

**Migration:** `supabase/migrations/20260820120000_clinical_pilot_local_authorities_au_gb_br.sql`  
**Status (2026-08-20):** **Not applied to production.** Owner-gated.

## Authorization

This agent pass does **not** apply production Supabase migrations.

Apply only when:

1. PR containing the migration is reviewed and merged (or explicitly approved for preview DB)  
2. Owner confirms target (preview vs production project ref)  
3. Standard Harbourview migration gate / runbook is followed  

## Idempotency

Migration uses `WHERE NOT EXISTS` on `(country_code, authority_name)` and safe coverage inserts/updates. Re-run is safe.

## Related

- Inventory: `docs/control/CLINICAL_PILOT_AUTHORITY_INVENTORY.md`  
- Capability matrix: **deferred** — see `CLINICAL_JURISDICTION_AUTHORITY_DEFER.md`
