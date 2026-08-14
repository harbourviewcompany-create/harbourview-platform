# Talent Cutover and Rollback

Controls: CTL-006, CTL-007, CTL-008, CTL-009, CTL-010, CTL-023. Anchors: TAL-079–084, TAL-100; TAC-039,045,046,049.

Required cutover sequence: schema deployed dark → deterministic backfill → reconciliation → new APIs deployed dark → shadow reads/comparison → internal activation → limited production activation → canonical read switch → legacy write freeze → observation window → legacy retirement only after criteria pass.

Feature flags/kill switches must independently control Find Jobs, Find Talent, external ingestion, candidate semantic search, identity disclosure, applications, professional claiming and canonical read switch. Kill switches disable behavior without emergency destructive migration.

Rollback classification is explicit per migration/change: reversible SQL, forward-only with compensating migration, data backfill reversible by mapping, or nontrivial recovery requiring restore. Pre-cutover snapshots/checkpoints and rollback window are recorded.

Shadow differences are categorized expected improvement, legacy defect correction, data-model difference or regression. Unexplained difference blocks switch.

Legacy retirement requires zero active consumer, compatibility evidence, restore path, observation window and explicit TAL-100 sign-off.