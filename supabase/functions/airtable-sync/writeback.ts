import type { MappedRecord, TableManifest } from './types.ts';

export function planWriteback(manifest: TableManifest, mapped: MappedRecord, enabled: boolean): Record<string, unknown> | undefined {
  if (!enabled) return undefined;
  return {
    'Backend Sync ID': mapped.idempotencyKey,
    'Sync Status': 'dry-run-safe',
    'Last Synced At': new Date().toISOString(),
    'External Provider': 'supabase',
    'External ID / Source Object ID': mapped.airtableRecordId,
  };
}

export async function writebackAirtableStatus(): Promise<void> {
  throw new Error('Airtable writeback is intentionally disabled in this foundation unless explicitly enabled and scoped.');
}
