function normalizeKeyToken(value: string, mode: "upper" | "lower"): string {
  const normalized = value.trim().replace(/\s+/g, "-");
  if (!normalized) throw new Error("Recognition-key token cannot be empty");
  if (normalized.includes("|")) throw new Error("Recognition-key token cannot contain '|'");
  return mode === "upper" ? normalized.toUpperCase() : normalized.toLowerCase();
}

function requiredId(value: string, label: string): string {
  const normalized = value.trim().toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(normalized)) {
    throw new Error(`${label} must be a UUID`);
  }
  return normalized;
}

export interface TransactionNetworkKeyInput {
  jurisdictionCode: string;
  buyerEconomicAccountId: string;
  sellerEconomicAccountId: string;
  transactionObject: string;
  commercialPeriod: string;
}

export function buildTransactionNetworkKey(input: TransactionNetworkKeyInput): string {
  return [
    "NETWORK",
    normalizeKeyToken(input.jurisdictionCode, "upper"),
    requiredId(input.buyerEconomicAccountId, "buyerEconomicAccountId"),
    requiredId(input.sellerEconomicAccountId, "sellerEconomicAccountId"),
    normalizeKeyToken(input.transactionObject, "lower"),
    normalizeKeyToken(input.commercialPeriod, "upper"),
  ].join("|");
}

export interface EconomicsRecognitionKeyInput {
  networkKey?: string | null;
  transactionId: string;
  metricType: string;
  economicEvent: string;
  currency: string;
}

export function buildEconomicsRecognitionKey(input: EconomicsRecognitionKeyInput): string {
  const transactionId = requiredId(input.transactionId, "transactionId");
  const parentKey = input.networkKey?.trim()
    ? input.networkKey.trim()
    : `TX|${transactionId}`;

  if (parentKey.includes("\n") || parentKey.includes("\r")) {
    throw new Error("networkKey cannot contain line breaks");
  }
  if (input.networkKey && !parentKey.startsWith("NETWORK|")) {
    throw new Error("networkKey must begin with NETWORK|");
  }

  return [
    "ECON",
    parentKey,
    normalizeKeyToken(input.metricType, "lower"),
    normalizeKeyToken(input.economicEvent, "lower"),
    normalizeKeyToken(input.currency, "upper"),
  ].join("|");
}

export interface EconomicsEntryLike {
  id: string;
  recognitionKey: string;
  supersedesEntryId?: string | null;
  validated: boolean;
  scenarioOnly: boolean;
  amount?: number | null;
}

/**
 * Returns the one authoritative leaf per recognition key.
 * This mirrors transaction_current_economics_v1 and is useful for fixture/test proof.
 */
export function currentRecognizedEconomics<T extends EconomicsEntryLike>(entries: T[]): T[] {
  const validated = entries.filter((entry) => entry.validated && !entry.scenarioOnly);
  const superseded = new Set(
    validated
      .map((entry) => entry.supersedesEntryId)
      .filter((id): id is string => Boolean(id)),
  );

  const leaves = validated.filter((entry) => !superseded.has(entry.id));
  const keys = new Set<string>();
  for (const entry of leaves) {
    if (keys.has(entry.recognitionKey)) {
      throw new Error(`Multiple current economics leaves for ${entry.recognitionKey}`);
    }
    keys.add(entry.recognitionKey);
  }
  return leaves;
}

export function sumRecognizedAmount(entries: EconomicsEntryLike[]): number {
  return currentRecognizedEconomics(entries).reduce(
    (total, entry) => total + (entry.amount ?? 0),
    0,
  );
}
