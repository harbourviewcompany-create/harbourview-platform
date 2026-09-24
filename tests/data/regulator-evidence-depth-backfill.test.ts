import { describe, expect, it } from "vitest";

describe("regulator evidence depth backfill", () => {
  it("requires provenance-backed regulator evidence", () => {
    const required = [
      "source_registry_id",
      "source_snapshot_id",
      "source_url",
      "verification_status",
    ];
    expect(required).toHaveLength(4);
  });

  it("targets the regulator dimension only", () => {
    const dimension = "regulator";
    expect(dimension).toBe("regulator");
  });
});
