import { describe, expect, test } from 'vitest'
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const migration = readFileSync(join(root, "supabase/migrations/20260923034000_evidence_architecture_hardening_003.sql"), "utf8");
const prior = readFileSync(join(root, "supabase/migrations/20260923030000_evidence_architecture_hardening_001.sql"), "utf8");

describe("evidence architecture hardening 003", () => {
  it("creates an explicit hierarchy registry with fail-closed unknown state", () => {
    expect(migration).toContain("create table if not exists public.jurisdiction_hierarchy");
    expect(migration).toContain("jurisdiction_level in ('national','subnational','unknown')");
    expect(migration).toContain("resolution_method in ('canonical_iso2','explicit_parent_mapping','unresolved')");
    expect(migration).toContain("Subnational hierarchy requires an explicit parent mapping");
  });

  it("does not use parent inheritance to complete subnational evidence", () => {
    expect(migration).not.toMatch(/parent.*evidence.*complete/i);
    expect(migration).toContain("no key-pattern inference is accepted");
  });

  it("preserves the ungated evaluator for audit and makes the gated evaluator authoritative", () => {
    expect(migration).toContain("v_jurisdiction_data_depth_evaluator_ungated");
    expect(migration).toContain("v_jurisdiction_data_depth_evaluator");
    expect(migration).toContain("v_jurisdiction_verified_snapshot_gate");
    expect(migration).toContain("verified structured evidence exists without a qualifying source snapshot");
  });

  it("requires legacy regulatory evidence to match a successful captured snapshot", () => {
    expect(migration).toContain("lower(ss.snapshot_hash)=lower(e.source_snapshot_sha256)");
    expect(migration).toContain("ss.http_status between 200 and 299");
    expect(migration).toContain("ss.raw_payload is not null");
    expect(migration).toContain("sr.source_url=e.authority_url");
  });

  it("makes aggregate readiness depend on the gated evaluator", () => {
    expect(migration).toContain("from public.v_jurisdiction_data_depth_evaluator group by jurisdiction_key");
    expect(migration).toContain("from public.v_jurisdiction_data_depth_evaluator;");
  });

  it("keeps the first hardening migration replay-safe for historical rows", () => {
    expect(prior).toContain("Phase 1 is intentionally non-destructive");
    expect(prior).not.toContain("add constraint jurisdiction_regulatory_rules_verified_provenance_ck");
    expect(prior).toContain("enforce_verified_evidence_provenance");
  });
});
