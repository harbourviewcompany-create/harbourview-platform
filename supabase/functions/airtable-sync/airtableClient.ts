import { getEnv, rateLimitMs, resolveBaseId } from './config.ts';
import type { AirtableRecord } from './types.ts';

const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchAirtableRecords(tableIdOrName: string, limit: number, recordIds: string[] = []): Promise<AirtableRecord[]> {
  const pat = getEnv('AIRTABLE_PAT');
  if (!pat) {
    return [];
  }

  const baseId = resolveBaseId();
  const tablePath = encodeURIComponent(tableIdOrName);
  const url = new URL(`${AIRTABLE_API_URL}/${baseId}/${tablePath}`);
  url.searchParams.set('pageSize', String(Math.min(limit, 100)));
  if (recordIds.length > 0) {
    const filter = `OR(${recordIds.map((id) => `RECORD_ID()='${id.replaceAll("'", "\\'")}'`).join(',')})`;
    url.searchParams.set('filterByFormula', filter);
  }

  const records: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    if (offset) url.searchParams.set('offset', offset);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${pat}` } });
    if (!response.ok) {
      throw new Error(`Airtable fetch failed for ${tableIdOrName}: ${response.status}`);
    }
    const body = await response.json() as { records?: AirtableRecord[]; offset?: string };
    records.push(...(body.records ?? []));
    offset = body.offset;
    if (offset) await sleep(rateLimitMs());
  } while (offset && records.length < limit);

  return records.slice(0, limit);
}
