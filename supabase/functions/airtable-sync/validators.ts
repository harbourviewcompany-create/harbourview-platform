import type { AirtableRecord, MappedRecord, TableManifest, ValidationError } from './types.ts';

const PRIVATE_PUBLIC_COLUMNS = new Set([
  'private_notes',
  'notes_private',
  'summary_private',
  'description_private',
  'raw_row_id',
  'raw_source_file',
  'import_batch_id',
  'sensitivity',
  'operator_comments',
  'review_notes_private',
]);

export function validateAirtableRecord(record: AirtableRecord, manifest: TableManifest): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!record.id) {
    errors.push({ table: manifest.tableName, message: 'Airtable record ID is required.', severity: 'error' });
  }
  for (const fieldId of manifest.requiredFieldIds) {
    if (!(fieldId in record.fields)) {
      errors.push({ table: manifest.tableName, recordId: record.id, message: `Required Airtable field ${fieldId} is missing.`, severity: 'error' });
    }
  }
  return errors;
}

export function validateMappedRecord(mapped: MappedRecord): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!mapped.payload.airtable_record_id) {
    errors.push({ table: mapped.table, recordId: mapped.airtableRecordId, message: 'Destination airtable_record_id is required.', severity: 'error' });
  }
  if (mapped.payload.public_visibility === true) {
    if (mapped.payload.verification_status !== 'verified') {
      errors.push({ table: mapped.table, recordId: mapped.airtableRecordId, message: 'Public visibility requires verified status.', severity: 'error' });
    }
    if (mapped.payload.sensitivity !== 'public') {
      errors.push({ table: mapped.table, recordId: mapped.airtableRecordId, message: 'Public visibility requires public sensitivity.', severity: 'error' });
    }
  }
  return errors;
}

export function validateDtoAllowlist(columns: string[]): ValidationError[] {
  const leaked = columns.filter((column) => PRIVATE_PUBLIC_COLUMNS.has(column));
  return leaked.map((column) => ({ table: 'hv_public', message: `Private column ${column} is not allowed in public DTOs.`, severity: 'error' as const }));
}
