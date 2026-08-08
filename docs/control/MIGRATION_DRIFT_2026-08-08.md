# Migration drift: repo vs production, 2026-08-08

**Status: diagnosis complete, remediation NOT started. Nothing in this document has been applied.**

Production project `zvxdgdkukjrrwamdpqrg`. All figures below were read live on
2026-08-08 with read-only queries.

```text
migrations in supabase/migrations   836
applied per schema_migrations       804
unapplied, dated 2026-07-01 or later 68
```

The 68 are listed in full at the foot of this document.

## Why this matters more than any single bug

Five separate defects were being tracked as independent problems. They are one
problem. Each is a live call site whose database object exists in this
repository and has never been applied to production:

| Symptom | Call sites | Unapplied migration |
| --- | --- | --- |
| Nobody can pass clinician verification | `app/api/clinical/**`, `lib/clinical/auth.ts` | `20260727160000`–`20260727163000` |
| Licence submissions never enqueue for review | `app/api/org/licences/submit/route.ts` and 5 others | review-queue API surface |
| Signal relevance feedback fails on write and is never read back | `app/api/signals/feedback/route.ts`, `lib/signals/feedbackScores.ts` | `20260802152500` |
| Intelligence graph writer targets a schema that does not exist | `lib/intelligence-engine/graph-writer.ts` | `20260607140000` |
| Curated signal tier was dead until 2026-08-08 | fixed in #1294 | `20260801150000` (superseded) |

Verified absent from **every** schema in production: `is_verified_clinician`,
`clinical_request_verification`, `clinical_admin_verify_professional`,
`clinical_my_professional`, `submit_signal_relevance_feedback`,
`signal_relevance_feedback_for_ranking`, `ci_jurisdiction_id_for_iso`, and the
schema `cannabis_intelligence`. `hv_admin_review_queue` exists in `public` only,
while every caller is pinned to `api`.

The pattern is consistent: **the code shipped, the schema did not.** Reviewing
any of these as an application bug leads to the wrong fix.

## Security migrations that were written and never applied

These are the ones worth acting on first. Each was authored specifically to
close an access gap, and none of them ran.

| Migration | Intent |
| --- | --- |
| `20260722031500_revoke_anon_authenticated_hv_pipeline_functions` | Remove anon/authenticated EXECUTE on pipeline functions |
| `20260723180000_revoke_legacy_jurisdiction_briefings_grants` | Drop legacy briefing grants |
| `20260805234000_revoke_anon_execute_on_net_http` | Remove anon/authenticated EXECUTE on `net.http_get` / `net.http_post` |
| `20260807000900_revoke_data_api_execute_on_secret_accessors` | Remove Data API EXECUTE on secret accessors |
| `20260807001000_revoke_data_api_default_privileges_on_public` | Remove Data API default privileges on `public` |

Confirmed still open on production 2026-08-08:

```text
net.http_get  -> anon, authenticated
net.http_post -> anon, authenticated
```

**Severity, stated honestly:** `net` is not in `pgrst.db_schemas`
(`public, graphql_public, job_search, api`), so these are not directly callable
over the Data API. This is a defence-in-depth gap, not a proven reachable SSRF:
it means any `security invoker` function in an exposed schema that reaches
`net.http_*` would succeed as the caller instead of being denied. That is the
exact scenario the migration was written to foreclose. It should be closed, and
it should not be described as an active breach.

Supabase's own security advisor does **not** flag it, for the same
not-directly-exposed reason. Advisor output on the same date was otherwise
clean: `rls_enabled_no_policy` at INFO on internal job tables (RLS on with no
policy denies all — expected), `pg_net` installed in `public` at WARN, several
`SECURITY DEFINER` helpers callable by `authenticated` at WARN, and leaked
password protection disabled.

## What has already been fixed in the repository

Repository-side only. No production object was touched.

**`20260801150000_api_expose_quality_and_routing_columns.sql` was neutralised
before it could ever run.** As drafted it appended the ten Pipeline B classifier
columns and the generated `analysis` payload to `api.signals` *and*
`api.signals_quality`. Both are granted SELECT to `anon`:

```text
api.signals              anon, authenticated, postgres, service_role
api.signals_quality      anon, authenticated, postgres, service_role
api.signals_with_quality       authenticated, postgres, service_role
```

Applying it would have published every internal classifier verdict to
unauthenticated callers — precisely the exposure #1294 avoided by putting those
columns on a separate restricted view. Because the file was unapplied, any
`supabase db push` would have fired it. The two view definitions are now removed
with the reasoning recorded inline.

**`app/api/org/licences/submit/route.ts` no longer discards its enqueue error.**
The insert result was unchecked, so an unmatched licence flipped the org to
`pending_review` and was then never queued, silently. It now logs. That does not
create the missing relation; it stops the compliance gap from being invisible.

**The visual gate now also runs on `push` to `main`, unfiltered.** Its paths
filter is what let #1292 through — that PR changed only `lib/` and `app/api/`
files, so the gate never ran against it, went red on the next unrelated mobile
PR, and was misattributed there twice.

## Remediation plan — requires explicit sign-off, tranche by tranche

Applying 68 migrations in one pass is not safe and is not proposed. They include
`restore_*` foundations, ~35KB of catalog seed data, cron schedule changes and
pipeline rewrites, any of which may conflict with what production has diverged
into. Production is ahead of the repo in places, not only behind: `api.signals_
with_quality` is live under version `20260808112235` while the repo tracks the
same DDL as `20260808120000`.

Proposed order, smallest blast radius first. Each tranche is a separate decision.

1. **Security revokes** (5 migrations, table above). Pure `revoke`. Reversible by
   re-granting. Verify no service path depends on the grants first — cron and
   edge functions run as `service_role` and should be unaffected.
2. **Chronology reconciliation.** Decide whether `20260808120000` is marked
   applied to match production's `20260808112235`, or renamed. Until then
   `supabase db push` will attempt to re-run it. The DDL is `create or replace`,
   so a re-run is harmless, but the histories disagree.
3. **Review queue API surface.** Unblocks licence verification. Admin-only data:
   grants must be checked line by line before applying.
4. **Signal feedback RPCs** (`20260802152500`). Self-contained, unblocks the
   feedback loop end to end.
5. **Clinical module** (4 migrations, ~63KB). Largest and most sensitive — it is
   a verification and patient-data system. Deserves its own review pass, not a
   tranche slot.
6. **Everything else**, triaged individually. Several are probably obsolete and
   should be deleted from the repo rather than applied; the `restore_*` set in
   particular predates work that has since superseded it.

**Recommended before tranche 1:** a `supabase db diff` against production to see
what each migration would actually do, rather than trusting the file. That is a
read-only operation and should be the next step.

## Standing gap this exposes

There is no check anywhere that compares `supabase/migrations` against
`schema_migrations`. The drift accumulated over five weeks without a single
alarm, and was found only by manual inspection while chasing an unrelated
dashboard bug. A CI job that fails when the repo contains an unapplied migration
older than N days would have caught all five defects above at the time each was
introduced. Not built here — flagged as the structural fix.

## Full unapplied list, 2026-07-01 onward

```text
20260708214306  restore_status_history_foundation
20260708214307  restore_sources_foundation
20260708214309  restore_project_vault_foundation
20260708214310  restore_project_control_refs_foundation
20260708214311  restore_internal_admin_notes_foundation
20260708214312  restore_hv_review_decisions_foundation
20260708214313  restore_hv_updated_at_function
20260708214314  restore_hv_relations_foundation
20260708214315  restore_hv_evidence_foundation
20260708214316  restore_external_sync_inbox_foundation
20260708214317  restore_counterparty_stubs_foundation
20260709085216  restore_sig_extract_jobs_foundation
20260710094129  restore_hv_public_profile_snapshots_foundation
20260710114720  restore_countries_live_view_columns
20260710235323  restore_hv_passports_foundation
20260719190928  reconcile_marketplace_candidates_price_amount
20260722021500  enable_hv_quality_pipeline_and_promote_crons
20260722021600  deprecate_unused_stage3_pipeline_a
20260722021700  fix_rows_needing_titles_pipeline_b
20260722022000  hv_promote_signals_structural_confidence_floor
20260722022100  rows_needing_titles_promoted_only
20260722030000  analyze_hv_classify_jobs_fix_harvest_timeout
20260722031500  revoke_anon_authenticated_hv_pipeline_functions      [security]
20260722120002  cron_housekeeping_optimization
20260723180000  revoke_legacy_jurisdiction_briefings_grants          [security]
20260724000000  fix_entity_decode_blanking_bug_in_signal_extraction
20260727160000  clinical_control_foundation                          [clinical]
20260727161000  clinical_patient_core                                [clinical]
20260727162000  clinical_workflows                                   [clinical]
20260727163000  clinical_api_surface                                 [clinical]
20260728000000  professional_service_providers
20260728010000  rename_professional_service_providers_table
20260728020000  grant_public_view_access_to_approved_listings
20260728201439  restore_marketplace_candidates_source_id
20260729000000  platform_optimizations
20260729000002  fix_jurisdiction_playbooks_missing_grant
20260729010000  fix_missing_public_read_grants
20260729020000  fix_candidate_review_and_pathway_template_grants
20260729130000  source_registry_metadata_and_api_seeds
20260730110000  fix_hv_dedup_assign_timeout_and_ranking
20260730123000  harvest_stamp_classifier_v2_summary_fix
20260730180000  search_public_signals_rpc
20260730215959  restore_listings_unit
20260730220000  add_harbourview_supply_catalog
20260730220050  reconcile_listings_production_columns
20260730220100  seed_harbourview_supply_catalog_canada
20260730220200  seed_harbourview_supply_catalog_canada_batch2_4
20260730221500  automate_entity_extraction_stop_rescan_ungate
20260730222000  entities_dispatch_ungated_and_reaping
20260731013000  search_public_signals_stage_d_consistency
20260731120000  signal_role_family_routing
20260801150000  api_expose_quality_and_routing_columns               [neutralised 2026-08-08]
20260802073000  hv_dedup_assign_restore_hnsw_knn
20260802080000  harden_eval_labels_and_alert_delivery
20260802152500  signal_feedback_api_rpcs                             [feedback loop]
20260802163000  elite_digest_rpc_boundary_hardening
20260804233000  marketplace_inquiries_conversion_repair
20260804234000  marketplace_exposure_forward_repair
20260804234500  backfill_source_registry_category
20260804235000  separate_marketplace_source_intake
20260804235500  fix_source_import_batch_function
20260805000000  countries_table_replay_repair
20260805233500  service_only_digest_enrichment
20260805234000  revoke_anon_execute_on_net_http                      [security]
20260807000900  revoke_data_api_execute_on_secret_accessors          [security]
20260807001000  revoke_data_api_default_privileges_on_public         [security]
20260807001100  fix_promote_staging_null_object_class
20260808120000  expose_signal_quality_to_api                         [applied as 20260808112235]
```

Migrations dated before 2026-07-01 were not audited. `20260607140000_cannabis_
data_contract_v1_p0_p1` is known unapplied because the `cannabis_intelligence`
schema it creates does not exist in production.
