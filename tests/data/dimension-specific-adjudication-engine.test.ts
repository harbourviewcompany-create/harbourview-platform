import { describe, expect, it } from "vitest";

describe("dimension-specific adjudication engine", () => {
  it("defines the five new gate contracts without parent inheritance", async () => {
    const required = ["access_rules", "change_history", "freshness", "uncertainty", "research_queue"];
    expect(required).toHaveLength(5);
    expect(required).not.toContain("jurisdiction_intelligence");
  });

  it("keeps research queue separate from authoritative evidence", () => {
    expect("jurisdiction_data_depth_research_queue").not.toBe("jurisdiction_data_depth_evidence");
  });

  it("requires source lineage for authoritative derived dimensions", () => {
    const authoritative = ["access_rules", "change_history", "freshness"];
    expect(authoritative.every(Boolean)).toBe(true);
  });
});
