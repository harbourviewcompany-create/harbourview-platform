import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260924170000_structured_dimension_adjudication_engine_v2.sql",
  "utf8",
);

describe("structured dimension adjudication engine v2", () => {
  it("defines the fail-closed gate ledger", () => {
    expect(migration).toContain("jurisdiction_data_depth_gate_results");
    for (const gate of [
      "source_gate",
      "quote_gate",
      "effective_date_gate",
      "jurisdiction_scope_gate",
      "semantics_gate",
      "authority_gate",
    ]) expect(migration).toContain(gate);
  });

  it("requires all gates before promotion", () => {
    expect(migration).toContain(
      "ok:=src_ok and quote_ok and eff_ok and scope_ok and sem_ok and auth_ok",
    );
    expect(migration).toContain("source_snapshot_sha256");
    expect(migration).toContain("source_effective_date");
    expect(migration).toContain("source_registry");
    expect(migration).toContain("source_snapshots");
  });

  it("does not allow parent inheritance for regulatory tier adjudication", () => {
    expect(migration).toContain("and e.parent_iso2 is null");
  });

  it("keeps generic keyword extraction out of automatic promotion", () => {
    expect(migration).toContain("conservative_keyword_v1");
    expect(migration).toContain("status='needs_review'");
  });

  it("uses dimension-specific quote extraction", () => {
    expect(migration).toContain("extract_dimension_quote");
    expect(migration).toContain("'claims'");
    expect(migration).toContain("'regulatory_tier'");
  });
});
