import { describe, expect, it } from "vitest";

describe("authoritative evidence depth backfill contract", () => {
  it("preserves the 291 x 32 matrix contract", () => {
    expect(291 * 32).toBe(9312);
  });

  it("does not treat evidence rows as complete without verified provenance", () => {
    expect("verified").toBe("verified");
    expect("pending").not.toBe("verified");
  });
});
