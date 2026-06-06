import type { AirtableRecord, MappedRecord, TableManifest } from './types.ts';
import { asString, defaultPayload, field, hashPayload, normalizeStatus } from './transforms.ts';

export async function mapRecord(record: AirtableRecord, manifest: TableManifest): Promise<MappedRecord> {
  const f = manifest.fieldIds;
  let payload: Record<string, unknown> = defaultPayload(record, manifest);

  if (manifest.tableName === 'Countries') {
    payload = {
      airtable_record_id: record.id,
      country_name: asString(field(record, f.countryName)),
      iso_code: asString(field(record, f.isoCode)),
      region: asString(field(record, f.region)),
      cannabis_market_status: asString(field(record, f.cannabisMarketStatus)),
      priority_tier: asString(field(record, f.priorityTier)),
      notes_private: asString(field(record, f.notes)),
      verification_status: 'pending',
      review_status: 'pending',
      public_visibility: false,
      sensitivity: 'internal',
      unresolved_references: {},
    };
  }

  if (manifest.tableName === 'Sources') {
    payload = {
      airtable_record_id: record.id,
      source_name: asString(field(record, f.sourceName)),
      source_url: asString(field(record, f.sourceUrl)),
      normalized_url: asString(field(record, f.normalizedUrl)),
      dedupe_key: asString(field(record, f.dedupeKey)),
      country_text: asString(field(record, f.countryText)),
      source_type_text: asString(field(record, f.sourceTypeText)),
      organization_text: asString(field(record, f.organizationText)),
      jurisdiction_level: asString(field(record, f.jurisdictionLevel)),
      verification_status: normalizeStatus(field(record, f.verificationStatus)),
      confidence_score: Number(field(record, f.confidenceScore) ?? 0) || undefined,
      commercial_relevance: asString(field(record, f.commercialRelevance)),
      last_checked: asString(field(record, f.lastChecked)),
      import_batch_id: asString(field(record, f.importBatchId)),
      raw_row_id: asString(field(record, f.rawRowId)),
      raw_source_file: asString(field(record, f.rawSourceFile)),
      notes_private: asString(field(record, f.notes)),
      public_visibility: false,
      sensitivity: 'internal',
      unresolved_references: {},
    };
  }

  const payloadHash = await hashPayload(payload);
  payload.source_payload_hash = payloadHash;

  return {
    table: manifest.tableName,
    destination: manifest.destination,
    airtableRecordId: record.id,
    payload,
    payloadHash,
    idempotencyKey: `${manifest.destination}:${record.id}:${payloadHash}`,
    unresolvedReferences: {},
  };
}
