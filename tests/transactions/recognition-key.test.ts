import { describe, expect, it } from "vitest";
import {
  buildEconomicsRecognitionKey,
  buildTransactionNetworkKey,
  currentRecognizedEconomics,
  sumRecognizedAmount,
} from "../../lib/transactions/recognition";

const buyer = "11111111-1111-4111-8111-111111111111";
const seller = "22222222-2222-4222-8222-222222222222";
const transaction = "33333333-3333-4333-8333-333333333333";

describe("transaction network recognition keys", () => {
  it("normalizes formatting deterministically while preserving buyer/seller roles", () => {
    const key = buildTransactionNetworkKey({
      jurisdictionCode: " us-me ",
      buyerEconomicAccountId: buyer,
      sellerEconomicAccountId: seller,
      transactionObject: " Compliance   Testing ",
      commercialPeriod: " 2026 q3 ",
    });

    expect(key).toBe(
      `NETWORK|US-ME|${buyer}|${seller}|compliance-testing|2026-Q3`,
    );

    const reversed = buildTransactionNetworkKey({
      jurisdictionCode: "US-ME",
      buyerEconomicAccountId: seller,
      sellerEconomicAccountId: buyer,
      transactionObject: "Compliance Testing",
      commercialPeriod: "2026 Q3",
    });
    expect(reversed).not.toBe(key);
  });

  it("rejects separator injection in normalized tokens", () => {
    expect(() =>
      buildTransactionNetworkKey({
        jurisdictionCode: "US-ME",
        buyerEconomicAccountId: buyer,
        sellerEconomicAccountId: seller,
        transactionObject: "testing|duplicate",
        commercialPeriod: "2026-Q3",
      }),
    ).toThrow("cannot contain '|'");
  });
});

describe("economics recognition", () => {
  it("builds one event key beneath the network double-count key", () => {
    const networkKey = buildTransactionNetworkKey({
      jurisdictionCode: "US-ME",
      buyerEconomicAccountId: buyer,
      sellerEconomicAccountId: seller,
      transactionObject: "compliance testing",
      commercialPeriod: "2026-Q3",
    });

    expect(
      buildEconomicsRecognitionKey({
        networkKey,
        transactionId: transaction,
        metricType: "transacted_gtv",
        economicEvent: "Invoice 23984",
        currency: "usd",
      }),
    ).toBe(
      `ECON|${networkKey}|transacted_gtv|invoice-23984|USD`,
    );
  });

  it("uses the current immutable supersession leaf and excludes scenarios", () => {
    const recognitionKey = "ECON|NETWORK|TEST|transacted_gtv|invoice-1|USD";
    const entries = [
      {
        id: "old",
        recognitionKey,
        validated: true,
        scenarioOnly: false,
        amount: 50_000,
      },
      {
        id: "replacement",
        recognitionKey,
        supersedesEntryId: "old",
        validated: true,
        scenarioOnly: false,
        amount: 47_500,
      },
      {
        id: "scenario",
        recognitionKey: "ECON|NETWORK|TEST|harbourview_addressable_revenue|scenario|USD",
        validated: true,
        scenarioOnly: true,
        amount: 2_375,
      },
    ];

    expect(currentRecognizedEconomics(entries).map((entry) => entry.id)).toEqual([
      "replacement",
    ]);
    expect(sumRecognizedAmount(entries)).toBe(47_500);
  });

  it("fails closed if one recognition key has two current validated leaves", () => {
    const recognitionKey = "ECON|NETWORK|TEST|transacted_gtv|invoice-1|USD";
    expect(() =>
      currentRecognizedEconomics([
        { id: "a", recognitionKey, validated: true, scenarioOnly: false },
        { id: "b", recognitionKey, validated: true, scenarioOnly: false },
      ]),
    ).toThrow("Multiple current economics leaves");
  });
});
