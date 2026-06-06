import type { AirtableRecord, TableManifest } from './types.ts';

export async function hashPayload(payload: Record<string, unknown>): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(payload, Object.keys(payload).sort()));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

export function field(record: AirtableRecord, fieldId?: string): unknown {
  if (!fieldId) return undefined;
  return record.fields[fieldId];
}

export function asString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(String).join(', ');
  if (value === null || value === undefined) return undefined;
  return String(value);
}

export function normalizeStatus(value: unknown): string {
  return asString(value)?.trim().toLowerCase().replaceAll(' ', '_') ?? 'pending';
}

export function defaultPayload(record: AirtableRecord, manifest: TableManifest): Record<string, unknown> {
  return {
    airtable_record_id: record.id,
    source_payload_hash: undefined,
    unresolved_references: {},
    raw_airtable_fields: manifest.tableName === 'Sources' ? undefined : record.fields,
  };
}
