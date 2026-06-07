import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { AIRTABLE_BASE_ID, getManifestForTables } from './airtableManifest.ts';
import { fetchAirtableRecords } from './airtableClient.ts';
import { isMutationMode, isWritebackAllowed, resolveAllowedTables, resolveBaseId, resolveLimit, resolveMode } from './config.ts';
import { mapRecord } from './mappers.ts';
import { createSupabaseAdmin } from './supabaseAdmin.ts';
import { upsertMappedRecord } from './upsert.ts';
import { validateAirtableRecord, validateMappedRecord, validateModeEligibility } from './validators.ts';
import { createLogId, persistSyncLog } from './audit.ts';
import type { SyncRequest, SyncResponse, TableSummary, ValidationError } from './types.ts';

const DEFAULT_TABLES = ['Countries', 'Source Types', 'Organizations', 'Sources'];

function emptyTableSummary(): TableSummary {
  return { fetched: 0, mapped: 0, valid: 0, invalid: 0, mutationsPlanned: 0, mutationsApplied: 0, writebacksPlanned: 0, writebacksApplied: 0 };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), { status, headers: { 'content-type': 'application/json' } });
}

serve(async (request) => {
  const startedAt = new Date().toISOString();
  const logId = createLogId();
  const body = request.method === 'POST' ? await request.json().catch(() => ({})) as SyncRequest : {};
  const mode = resolveMode(body);
  const limit = resolveLimit(body);
  const allowedTables = resolveAllowedTables();
  const requestedTables = body.tables?.length ? body.tables : DEFAULT_TABLES;
  const tables = requestedTables.filter((table) => !allowedTables || allowedTables.has(table));
  const manifests = getManifestForTables(tables);
  const errors: ValidationError[] = [];
  const perTable: Record<string, TableSummary> = {};
  const client = createSupabaseAdmin();
  const writebackEnabled = isWritebackAllowed(body);
  let status: SyncResponse['status'] = 'ok';

  for (const manifest of manifests) {
    const tableSummary = emptyTableSummary();
    perTable[manifest.tableName] = tableSummary;
    const records = await fetchAirtableRecords(manifest.tableId ?? manifest.tableName, limit, body.recordIds ?? []);
    tableSummary.fetched = records.length;

    for (const record of records) {
      const recordErrors = validateAirtableRecord(record, manifest);
      const mapped = await mapRecord(record, manifest);
      const mappedErrors = validateMappedRecord(mapped);
      const modeErrors = validateModeEligibility(mapped, mode);
      const allErrors = [...recordErrors, ...mappedErrors, ...modeErrors];
      errors.push(...allErrors);
      tableSummary.mapped += 1;

      if (allErrors.some((error) => error.severity === 'error')) {
        tableSummary.invalid += 1;
        continue;
      }

      tableSummary.valid += 1;
      tableSummary.mutationsPlanned += 1;
      if (writebackEnabled) tableSummary.writebacksPlanned += 1;
      if (isMutationMode(mode)) {
        await upsertMappedRecord(client, mapped);
        tableSummary.mutationsApplied += 1;
      }
    }
  }

  if (errors.some((error) => error.severity === 'error')) status = 'error';

  const summary = Object.values(perTable).reduce((accumulator, table) => ({
    fetched: accumulator.fetched + table.fetched,
    mapped: accumulator.mapped + table.mapped,
    valid: accumulator.valid + table.valid,
    invalid: accumulator.invalid + table.invalid,
    mutationsPlanned: accumulator.mutationsPlanned + table.mutationsPlanned,
    mutationsApplied: accumulator.mutationsApplied + table.mutationsApplied,
    writebacksPlanned: accumulator.writebacksPlanned + table.writebacksPlanned,
    writebacksApplied: accumulator.writebacksApplied + table.writebacksApplied,
  }), emptyTableSummary());

  const response: SyncResponse = {
    status,
    mode,
    baseId: resolveBaseId() || AIRTABLE_BASE_ID,
    startedAt,
    finishedAt: new Date().toISOString(),
    summary,
    perTable,
    errors,
    logId,
  };

  if (mode === 'dry_run') {
    console.log(JSON.stringify({ event: 'airtable_sync_dry_run', logId, summary, perTable, errorCount: errors.length }));
  } else {
    await persistSyncLog(client, response);
  }

  return json(response, status === 'ok' ? 200 : 422);
});
