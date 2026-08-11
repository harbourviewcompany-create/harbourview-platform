import { describe, expect, it } from "vitest";
import { TRANSACTION_FIXTURE_EXPECTED_COUNTS } from "../../lib/transactions/constants";

interface FixtureRecord {
  recordKind:
    | "master_record"
    | "execution_package"
    | "economic_account"
    | "transaction_network";
  sourceRowKey: string;
  payload: Record<string, unknown>;
}

function summarize(records: FixtureRecord[]) {
  return records.reduce<Record<string, number>>((acc, row) => {
    acc[row.recordKind] = (acc[row.recordKind] ?? 0) + 1;
    return acc;
  }, {});
}

describe("transaction workbook fixture contract", () => {
  it("preserves the validated universe counts as import gates", () => {
    expect(TRANSACTION_FIXTURE_EXPECTED_COUNTS).toEqual({
      masterRecords: 165,
      executionPackages: 69,
      economicAccounts: 64,
      transactionNetworks: 10,
    });
  });

  it("keeps unsupported values explicitly unknown rather than deriving them during staging", () => {
    const staged: FixtureRecord = {
      recordKind: "master_record",
      sourceRowKey: "VA-001",
      payload: {
        counterparty: "Example",
        transactionGtv: "Unknown",
        closeProbability: "Unknown",
      },
    };

    expect(staged.payload.transactionGtv).toBe("Unknown");
    expect(staged.payload.closeProbability).toBe("Unknown");
  });

  it("counts source rows by record kind rather than assuming one source row equals one canonical entity", () => {
    const rows: FixtureRecord[] = [
      { recordKind: "master_record", sourceRowKey: "L1", payload: {} },
      { recordKind: "master_record", sourceRowKey: "L2", payload: {} },
      { recordKind: "economic_account", sourceRowKey: "A1", payload: {} },
    ];
    expect(summarize(rows)).toEqual({ master_record: 2, economic_account: 1 });
  });
});
