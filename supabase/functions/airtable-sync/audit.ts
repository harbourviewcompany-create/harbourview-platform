import type { SyncResponse } from './types.ts';

export function createLogId(): string {
  return `hv_sync_${crypto.randomUUID()}`;
}

export async function persistSyncLog(client: ReturnType<typeof import('./supabaseAdmin.ts').createSupabaseAdmin>, response: SyncResponse): Promise<void> {
  if (!client) return;
  const { error } = await client.schema('hv_sync').from('airtable_sync_log').insert({
    log_id: response.logId,
    mode: response.mode,
    base_id: response.baseId,
    status: response.status,
    tables: Object.keys(response.perTable),
    dry_run: response.mode === 'dry_run',
    writeback_requested: response.summary.writebacksPlanned > 0,
    summary: { summary: response.summary, perTable: response.perTable },
    errors: response.errors,
    started_at: response.startedAt,
    finished_at: response.finishedAt,
  });
  if (error) throw error;
}
