import { describe, expect, it } from 'vitest';

import { FIELD_CLASSIFICATION_MATRIX, validateFieldAgainstPolicy } from '@/lib/marketplace/intakeSafety';

describe('FIELD_CLASSIFICATION_MATRIX policies', () => {
  it('accepts and rejects email under strict format policy', () => {
    expect(validateFieldAgainstPolicy('ops@harbourview.com', FIELD_CLASSIFICATION_MATRIX.email)).toEqual({ valid: true });
    expect(validateFieldAgainstPolicy('ops-at-harbourview.com', FIELD_CLASSIFICATION_MATRIX.email)).toEqual({
      valid: false,
      reason: 'invalid_format',
    });
  });

  it('accepts and rejects phone under strict format policy', () => {
    expect(validateFieldAgainstPolicy('+1 (613) 555-1234', FIELD_CLASSIFICATION_MATRIX.phone)).toEqual({ valid: true });
    expect(validateFieldAgainstPolicy('call-me-maybe', FIELD_CLASSIFICATION_MATRIX.phone)).toEqual({
      valid: false,
      reason: 'invalid_format',
    });
  });

  it('rejects unsafe tokens for company plain text policy', () => {
    expect(validateFieldAgainstPolicy('Harbourview Capital', FIELD_CLASSIFICATION_MATRIX.company)).toEqual({ valid: true });
    expect(validateFieldAgainstPolicy('Harbourview <b>Capital</b>', FIELD_CLASSIFICATION_MATRIX.company)).toEqual({
      valid: false,
      reason: 'unsafe_tokens',
    });
  });

  it('rejects unsafe tokens for message plain text policy', () => {
    expect(validateFieldAgainstPolicy('Please verify this listing and advise next steps.', FIELD_CLASSIFICATION_MATRIX.message)).toEqual({ valid: true });
    expect(validateFieldAgainstPolicy('Please review https://example.com now.', FIELD_CLASSIFICATION_MATRIX.message)).toEqual({
      valid: false,
      reason: 'unsafe_tokens',
    });
  });

  it('supports optional plain text policy for requirements', () => {
    expect(validateFieldAgainstPolicy('', FIELD_CLASSIFICATION_MATRIX.requirements)).toEqual({ valid: true });
    expect(validateFieldAgainstPolicy('Need GMP-capable supplier in Ontario.', FIELD_CLASSIFICATION_MATRIX.requirements)).toEqual({ valid: true });
    expect(validateFieldAgainstPolicy('Need details at www.example.com', FIELD_CLASSIFICATION_MATRIX.requirements)).toEqual({
      valid: false,
      reason: 'unsafe_tokens',
    });
  });
});
