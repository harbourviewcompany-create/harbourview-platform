import { test, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const batchTuningMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260925190000_progressive_depth_cycle_batch_tuning.sql"),
  "utf8",
);

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260925130000_progressive_depth_cycle_v1.sql"),
  "utf8",
);

test("progressive cycle serializes work and preserves fail-closed stages", () => {
  expect(migration).toContain("pg_try_advisory_lock");
  expect(migration).toContain("extract_depth_candidates(5)");
  expect(migration).toContain("adjudicate_structured_pathway_regulator_v4(500)");
  expect(migration).toContain("adjudicate_structured_commercial_rules_v5(500)");
  expect(migration).toContain("adjudicate_structured_evidence_v6(500)");
  expect(migration).toContain("adjudicate_structured_access_rules_v1(500)");
  expect(migration).toContain("adjudicate_structured_status_format_v1(500)");
  expect(migration).toContain("refresh_depth_freshness_v2(291)");
  expect(migration).toContain("refresh_depth_research_queue(10000)");
  expect(migration).toContain("harbourview-progressive-depth-cycle");
  expect(migration).toContain("exception when others");
  expect(migration).toContain("revoke all on function public.run_progressive_depth_cycle_v1()");
});

test("progressive cycle bounds extraction to the cron execution budget", () => {
  expect(batchTuningMigration).toContain("extract_depth_candidates(5)");
  expect(batchTuningMigration).not.toContain("extract_depth_candidates(300)");
});

test("progressive cycle does not invoke known-broken legacy stages", () => {
  expect(migration).not.toContain("adjudicate_depth_source_metadata(");
  expect(migration).not.toContain("adjudicate_structured_depth_extended(");
});
