export type SyncMode = 'dry_run' | 'staging' | 'private_sync' | 'public_approved_only' | 'writeback_test';

export type SyncRequest = {
  mode?: SyncMode;
  tables?: string[];
  limit?: number;
  recordIds?: string[];
  writeback?: boolean;
  force?: boolean;
};

export type AirtableRecord = {
  id: string;
  createdTime?: string;
  fields: Record<string, unknown>;
};

export type TableManifest = {
  tableName: string;
  tableId?: string;
  destination: string;
  requiredFieldIds: string[];
  fieldIds: Record<string, string>;
  publicEligible?: boolean;
  writebackFields?: string[];
};

export type ValidationError = {
  table: string;
  recordId?: string;
  message: string;
  severity: 'error' | 'warning';
};

export type MappedRecord = {
  table: string;
  destination: string;
  airtableRecordId: string;
  payload: Record<string, unknown>;
  payloadHash: string;
  idempotencyKey: string;
  unresolvedReferences: Record<string, unknown>;
};

export type TableSummary = {
  fetched: number;
  mapped: number;
  valid: number;
  invalid: number;
  mutationsPlanned: number;
  mutationsApplied: number;
  writebacksPlanned: number;
  writebacksApplied: number;
};

export type SyncResponse = {
  status: 'ok' | 'error';
  mode: SyncMode;
  baseId: string;
  startedAt: string;
  finishedAt: string;
  summary: {
    fetched: number;
    mapped: number;
    valid: number;
    invalid: number;
    mutationsPlanned: number;
    mutationsApplied: number;
    writebacksPlanned: number;
    writebacksApplied: number;
  };
  perTable: Record<string, TableSummary>;
  errors: ValidationError[];
  logId: string;
};
