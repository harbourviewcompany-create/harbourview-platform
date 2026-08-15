export const TRANSACTION_FIXTURE_EXPECTED_COUNTS = Object.freeze({
  masterRecords: 165,
  executionPackages: 69,
  economicAccounts: 64,
  transactionNetworks: 10,
} as const);

export const HARBOURVIEW_INTERNAL_ECONOMICS_METRICS = new Set([
  "harbourview_addressable_revenue",
  "harbourview_accrued_revenue",
  "harbourview_invoiced_revenue",
  "harbourview_collected_revenue",
  "gross_margin",
] as const);

export type HarbourviewInternalEconomicsMetric =
  | "harbourview_addressable_revenue"
  | "harbourview_accrued_revenue"
  | "harbourview_invoiced_revenue"
  | "harbourview_collected_revenue"
  | "gross_margin";

export function isHarbourviewInternalEconomicsMetric(metric: string): boolean {
  return HARBOURVIEW_INTERNAL_ECONOMICS_METRICS.has(
    metric as HarbourviewInternalEconomicsMetric,
  );
}
