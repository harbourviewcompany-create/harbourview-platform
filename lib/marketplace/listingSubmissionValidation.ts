import type { ListingSubmissionInput } from './intakeValidation'

const MAX_MESSAGE_LENGTH = 3500

export type ListingSubmissionDiagnosticCode =
  | 'LISTING_SUBMISSION_VALIDATION_REQUIRED_FIELDS'
  | 'LISTING_SUBMISSION_VALIDATION_EMAIL'
  | 'LISTING_SUBMISSION_VALIDATION_FIELD_LENGTH'
  | 'LISTING_SUBMISSION_VALIDATION_MESSAGE_LENGTH'
  | 'LISTING_SUBMISSION_VALIDATION_TYPE'
  | 'LISTING_SUBMISSION_CONFIG_MISSING'
  | 'LISTING_SUBMISSION_SUPABASE_REQUEST_FAILED'
  | 'LISTING_SUBMISSION_SUPABASE_INSERT_FAILED'
  | 'LISTING_SUBMISSION_INTERNAL_ERROR'
  | 'LISTING_SUBMISSION_OK'

export function withListingSubmissionCode(message: string, code: ListingSubmissionDiagnosticCode) {
  return `${message} [${code}]`
}

export function buildSubmissionMessage(fields: {
  listingType: string
  title: string
  price: string
  location: string
  description: string
}) {
  return [
    'Harbourview marketplace listing submission',
    '',
    `Listing type: ${fields.listingType}`,
    `Title: ${fields.title}`,
    `Price / budget: ${fields.price || 'N/A'}`,
    `Location: ${fields.location || 'N/A'}`,
    '',
    'Description:',
    fields.description,
    '',
    'Harbourview action requested:',
    'Review listing fit, verify required details, and determine whether the opportunity should be published, routed, or declined.',
  ].join('\n')
}

export function validateListingSubmission(data: ListingSubmissionInput): { ok: true; message: string } | { ok: false; code: ListingSubmissionDiagnosticCode; message: string } {
  if (!data.name || !data.email || !data.listingType || !data.title || !data.description) {
    return {
      ok: false,
      code: 'LISTING_SUBMISSION_VALIDATION_REQUIRED_FIELDS',
      message: withListingSubmissionCode('Please complete all required listing submission fields.', 'LISTING_SUBMISSION_VALIDATION_REQUIRED_FIELDS'),
    }
  }

  const message = buildSubmissionMessage(data)
  if (message.length > MAX_MESSAGE_LENGTH) {
    return {
      ok: false,
      code: 'LISTING_SUBMISSION_VALIDATION_MESSAGE_LENGTH',
      message: withListingSubmissionCode('Please keep the listing submission under 3,500 characters.', 'LISTING_SUBMISSION_VALIDATION_MESSAGE_LENGTH'),
    }
  }

  return { ok: true, message }
}
