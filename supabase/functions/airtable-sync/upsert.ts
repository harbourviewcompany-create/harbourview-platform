import type { MappedRecord } from './types.ts';

export async function upsertMappedRecord(client: ReturnType<typeof import('./supabaseAdmin.ts').createSupabaseAdmin>, mapped: MappedRecord): Promise<void> {
  if (!client) return;
  const [schema, table] = mapped.destination.split('.');
  const { error } = await client.schema(schema).from(table).upsert(mapped.payload, { onConflict: 'airtable_record_id' });
  if (error) throw error;
}
