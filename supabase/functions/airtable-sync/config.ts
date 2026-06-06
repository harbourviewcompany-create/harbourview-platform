import type { SyncMode, SyncRequest } from './types.ts';

const DEFAULT_BASE_ID = 'appdZ25lTQvMTWqcx';
const DEFAULT_MAX_RECORDS = 500;

export function getEnv(name: string): string | undefined {
  return Deno.env.get(name) ?? undefined;
}

export function resolveBaseId(): string {
  return getEnv('AIRTABLE_BASE_ID') ?? DEFAULT_BASE_ID;
}

export function resolveMode(request: SyncRequest): SyncMode {
  if (request.mode) return request.mode;
  return getEnv('SYNC_DRY_RUN') === 'false' ? 'staging' : 'dry_run';
}

export function resolveLimit(request: SyncRequest): number {
  const maxRecords = Number(getEnv('SYNC_MAX_RECORDS_PER_RUN') ?? DEFAULT_MAX_RECORDS);
  const requested = Number(request.limit ?? 100);
  return Math.max(1, Math.min(requested, maxRecords));
}

export function resolveAllowedTables(): Set<string> | undefined {
  const raw = getEnv('SYNC_ALLOWED_TABLES');
  if (!raw) return undefined;
  return new Set(raw.split(',').map((value) => value.trim()).filter(Boolean));
}

export function isMutationMode(mode: SyncMode): boolean {
  return mode !== 'dry_run' && mode !== 'writeback_test';
}

export function isWritebackAllowed(request: SyncRequest): boolean {
  return getEnv('SYNC_WRITEBACK_ENABLED') === 'true' && request.writeback === true;
}

export function rateLimitMs(): number {
  return Number(getEnv('SYNC_RATE_LIMIT_MS') ?? 250);
}
