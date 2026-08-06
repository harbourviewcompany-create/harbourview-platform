-- Repaired 2026-08-05. The comment block below was committed as one physical
-- line carrying literal backslash-n escapes instead of real newlines, ending
-- with this migration's first statement, `UPDATE public.classifier_validation`.
-- The leading `--` commented that line out, leaving the SET clause to be parsed
-- as a statement in its own right:
--   ERROR: syntax error at or near "=" (SQLSTATE 42601)
--
-- Only the comment block on line 1 was expanded. The backslash-n sequences
-- inside the E'...' literal in the SET clause are NOT the same defect -- they
-- are correct escape-string syntax that Postgres interprets as newlines in the
-- notes text, they are present in the production-recorded statement verbatim,
-- and expanding them would corrupt the literal.
--
-- The UPDATE is unchanged and matches statements[1] of the live ledger row
-- exactly: 394 chars, md5 7206668a7fba8c5b8d01bccc8e00001d.

-- Ships the hv-classify/openai/v1 classifier at its current measured quality
-- (precision 1.000, recall 0.559, n=181 eval rows, validated 2026-07-23) rather than
-- holding for further prompt-tuning against the 0.70 recall bar proposed in spec
-- Section 6.2. Decision made and confirmed directly by Tyler (2026-07-29).
--
-- This flips classifier_gate_hv_v1 to passed and re-enables the two crons that were
-- deliberately held inactive pending exactly this decision (see hv_pipeline_health()):
-- hv-quality-pipeline (public.hv_pipeline_tick -- translate/classify/embed/entity-
-- resolve dispatch+harvest) and hv-quality-promote (public.hv_quality_promote_tick).
-- Both scheduled every 10 minutes, matching this pipeline generation's existing cadence.
--
-- Applied directly to production via Supabase MCP; committed here per
-- docs/control/CONCURRENT_SESSION_COORDINATION.md (same-turn convention).

UPDATE public.classifier_validation
SET gate_passed = true,
    notes = notes || E'\n\nDecision (2026-07-29): Tyler confirmed ship-as-is. Precision (1.000) clears the bar with no false positives; recall (0.559) accepted rather than holding for further prompt-tuning. Gate flipped, hv-quality-pipeline and hv-quality-promote crons re-enabled.'
WHERE classifier_version = 'hv-classify/openai/v1';

SELECT cron.alter_job(48, schedule := '*/10 * * * *', active := true); -- hv-quality-promote

SELECT cron.schedule('hv-quality-pipeline', '*/10 * * * *', 'select public.hv_pipeline_tick();');