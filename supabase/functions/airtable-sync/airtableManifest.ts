import type { TableManifest } from './types.ts';

export const AIRTABLE_BASE_ID = 'appdZ25lTQvMTWqcx';

export const ALLOWED_WRITEBACK_FIELDS = [
  'Backend Sync ID',
  'Sync Status',
  'Last Synced At',
  'External Provider',
  'External ID / Source Object ID',
  'Sync Error',
  'Public URL',
  'App Admin URL',
] as const;

export const airtableManifest: Record<string, TableManifest> = {
  Countries: {
    tableName: 'Countries',
    tableId: 'tblm9u8SsuHBf7Hd9',
    destination: 'hv_core.jurisdictions',
    requiredFieldIds: ['fldFL8bmUXItBahxB'],
    publicEligible: true,
    fieldIds: {
      countryName: 'fldFL8bmUXItBahxB',
      isoCode: 'fldmc4yz4H9LccyIu',
      region: 'fld2rTj41kuOoCbvs',
      cannabisMarketStatus: 'fldAdjKfkLiqhOnqg',
      priorityTier: 'fldhiK0ApJPUj95pg',
      notes: 'fldtLwMaCEXZ4K3JT',
    },
    writebackFields: [...ALLOWED_WRITEBACK_FIELDS],
  },
  Sources: {
    tableName: 'Sources',
    tableId: 'tblWdXXDalJHc7dE7',
    destination: 'hv_core.sources',
    requiredFieldIds: ['fld5wzxGi06ht2pK4'],
    publicEligible: true,
    fieldIds: {
      sourceName: 'fld5wzxGi06ht2pK4',
      sourceUrl: 'flddNlrmRlNZM70rX',
      normalizedUrl: 'fldt20O070G9Nw3cM',
      dedupeKey: 'fld8c1gJFRPIJJZzZ',
      countryText: 'fld66fLITCIfec1Tz',
      sourceTypeText: 'fldizTy7ocXEfambx',
      organizationText: 'flddRQT7z0HKiGEju',
      jurisdictionLevel: 'fldxLJ1tTwxI8ACm7',
      verificationStatus: 'fld5IUSatwhKiESgQ',
      confidenceScore: 'fldwvjiGr7OLxEqRC',
      commercialRelevance: 'fldfmb8RrJgLp2rfR',
      lastChecked: 'fldgMV9VWzrM3d4dK',
      importBatchId: 'fldKVdU8MAC3XFXco',
      rawRowId: 'fldAR4MCpFvRRyp62',
      rawSourceFile: 'fldNIwldKooaUe4gh',
      notes: 'fld3ll1qT6L4TBiYt',
    },
    writebackFields: [...ALLOWED_WRITEBACK_FIELDS],
  },
  Organizations: { tableName: 'Organizations', destination: 'hv_core.source_organizations', requiredFieldIds: [], fieldIds: {}, writebackFields: [...ALLOWED_WRITEBACK_FIELDS] },
  'Source Types': { tableName: 'Source Types', destination: 'hv_core.source_types', requiredFieldIds: [], fieldIds: {}, writebackFields: [...ALLOWED_WRITEBACK_FIELDS] },
  'Verification Queue': { tableName: 'Verification Queue', destination: 'hv_private.verification_queue', requiredFieldIds: [], fieldIds: {}, writebackFields: [...ALLOWED_WRITEBACK_FIELDS] },
  'Rejected Records': { tableName: 'Rejected Records', destination: 'hv_private.rejected_records', requiredFieldIds: [], fieldIds: {}, writebackFields: [...ALLOWED_WRITEBACK_FIELDS] },
  'Import Ledger': { tableName: 'Import Ledger', destination: 'hv_sync.airtable_sync_log', requiredFieldIds: [], fieldIds: {}, writebackFields: [...ALLOWED_WRITEBACK_FIELDS] },
  'Evidence / Proof Log': { tableName: 'Evidence / Proof Log', destination: 'hv_private.evidence_items', requiredFieldIds: [], fieldIds: {}, writebackFields: [...ALLOWED_WRITEBACK_FIELDS] },
  Companies: { tableName: 'Companies', destination: 'hv_commercial.companies', requiredFieldIds: [], fieldIds: {}, writebackFields: [...ALLOWED_WRITEBACK_FIELDS] },
  People: { tableName: 'People', destination: 'hv_commercial.people', requiredFieldIds: [], fieldIds: {}, writebackFields: [...ALLOWED_WRITEBACK_FIELDS] },
  Offers: { tableName: 'Offers', destination: 'hv_commercial.offers', requiredFieldIds: [], publicEligible: true, fieldIds: {}, writebackFields: [...ALLOWED_WRITEBACK_FIELDS] },
  Opportunities: { tableName: 'Opportunities', destination: 'hv_commercial.opportunities', requiredFieldIds: [], fieldIds: {}, writebackFields: [...ALLOWED_WRITEBACK_FIELDS] },
  Assets: { tableName: 'Assets', destination: 'hv_marketplace.listings', requiredFieldIds: [], publicEligible: true, fieldIds: {}, writebackFields: [...ALLOWED_WRITEBACK_FIELDS] },
  'Search Index': { tableName: 'Search Index', destination: 'hv_search.search_documents', requiredFieldIds: [], fieldIds: {}, writebackFields: [...ALLOWED_WRITEBACK_FIELDS] },
  'Connector Health': { tableName: 'Connector Health', destination: 'hv_sync.airtable_sync_log', requiredFieldIds: [], fieldIds: {}, writebackFields: [...ALLOWED_WRITEBACK_FIELDS] },
  'Data Quality': { tableName: 'Data Quality', destination: 'hv_audit.action_log', requiredFieldIds: [], fieldIds: {}, writebackFields: [...ALLOWED_WRITEBACK_FIELDS] },
  Approvals: { tableName: 'Approvals', destination: 'hv_audit.action_log', requiredFieldIds: [], fieldIds: {}, writebackFields: [...ALLOWED_WRITEBACK_FIELDS] },
  'Sync Log': { tableName: 'Sync Log', destination: 'hv_sync.airtable_sync_log', requiredFieldIds: [], fieldIds: {}, writebackFields: [...ALLOWED_WRITEBACK_FIELDS] },
};

export function getManifestForTables(tables: string[]): TableManifest[] {
  return tables.map((table) => airtableManifest[table]).filter(Boolean);
}
