import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260925060000_dimension_specific_adjudication_engine.sql"),
  "utf8",
);

describe("dimension-specific adjudication engine", () => {
  it("defines the five gate contracts without parent inheritance", () => {
    const required = ["access_rules", "change_history", "freshness", "uncertainty", "research_queue"];
    for (const dimension of required) {
      expect(migration).toContain(`('${dimension}','v1'`);
    }
    expect(migration).not.toContain("jurisdiction_intelligence");
    expect(migration).toContain("parent_inheritance_allowed boolean not null default false");
  });

  it("keeps the research queue separate from authoritative evidence and locked to service_role", () => {
    expect(migration).toContain("create table if not exists public.jurisdiction_data_depth_research_queue");
    expect(migration).toContain("revoke all on public.jurisdiction_data_depth_research_queue from public;");
    expect(migration).toContain("grant select on public.jurisdiction_data_depth_research_queue to service_role;");
    expect(migration).not.toContain("insert into jurisdiction_data_depth_evidence\n  (jurisdiction_key,dimension_key");
  });

  it("requires source lineage for authoritative derived dimensions", () => {
    for (const dimension of ["access_rules", "change_history", "freshness", "uncertainty"]) {
      const row = migration.match(new RegExp(`\\('${dimension}'[^\\n]*\\n`));
      expect(row).not.toBeNull();
      expect(row?.[0]).not.toContain("false,false,false,false");
    }
  });

  it("is transactionally replayable and has no malformed DDL boundary", () => {
    expect(migration).not.toMatch(/\\)\\s*alter table\\s*$/m);
    expect(migration).toContain("on conflict (dimension_key) do update set");
    expect(migration).toContain("requires_source_registry");
    expect(migration).toContain("requires_source_snapshot");
    expect(migration).toContain("requires_quote");
    expect(migration).toContain("requires_effective_date");
    expect(migration).toContain("verification_status='verified'");
    expect(migration).toContain("alter table public.jurisdiction_data_depth_dimension_gate_contract enable row level security;");
    expect(migration).toContain("alter table public.jurisdiction_data_depth_research_queue enable row level security;");
    expect(migration).toContain("revoke all on function public.refresh_depth_research_queue(integer) from public;");
    expect(migration).toContain("revoke all on function public.adjudicate_depth_source_metadata(integer) from public;");
    expect(migration).toContain("revoke all on function public.adjudicate_structured_access_rules_v1(integer) from public;");
  });
});
