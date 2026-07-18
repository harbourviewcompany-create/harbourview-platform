// Shared org/workspace type registry — single source of truth for
// app/api/org/create and any UI that creates or displays a workspace.
// Do not redefine this list elsewhere (see HANDOFF ADR #9/#10 pattern
// on drift from duplicated definitions).

export const ORG_TYPES = [
  "supplier", "buyer", "broker", "lab", "pharmacy", "clinic",
  "equipment", "service", "financial", "distributor", "exporter", "importer",
] as const

export type OrgType = (typeof ORG_TYPES)[number]

export const ORG_TYPE_LABELS: Record<OrgType, string> = {
  supplier: "Supplier / Cultivator",
  buyer: "Buyer / Importer",
  broker: "Broker / Trade Intermediary",
  lab: "Testing Laboratory",
  pharmacy: "Pharmacy",
  clinic: "Clinic",
  equipment: "Equipment / Technology Provider",
  service: "Professional Service Provider",
  financial: "Financial / Investment",
  distributor: "Distributor",
  exporter: "Exporter",
  importer: "Importer",
}
