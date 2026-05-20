import { describe, expect, it } from 'vitest';

import { FIELD_CLASSIFICATION_MATRIX, validateClassifiedField } from '@/lib/marketplace/intakeSafety';

describe('FIELD_CLASSIFICATION_MATRIX policies', () => {
  it('documents expected policy classification per field', () => {
    expect(FIELD_CLASSIFICATION_MATRIX.email.policy).toBe('strict_format');
    expect(FIELD_CLASSIFICATION_MATRIX.phone.policy).toBe('strict_format');
    expect(FIELD_CLASSIFICATION_MATRIX.company.policy).toBe('plain_text_unsafe_token_rejection');
    expect(FIELD_CLASSIFICATION_MATRIX.message.policy).toBe('plain_text_unsafe_token_rejection');
    expect(FIELD_CLASSIFICATION_MATRIX.requirements.policy).toBe('optional_plain_text');
  });

  it('accepts and rejects email under strict format policy', () => {
    expect(validateClassifiedField('email', 'ops@harbourview.com')).toEqual({ valid: true });
    expect(validateClassifiedField('email', 'ops-at-harbourview.com')).toEqual({
      valid: false,
      reason: 'invalid_format',
    });
  });

  it('accepts and rejects phone under strict format policy', () => {
    expect(validateClassifiedField('phone', '+1 (613) 555-1234')).toEqual({ valid: true });
    expect(validateClassifiedField('phone', 'call-me-maybe')).toEqual({
      valid: false,
      reason: 'invalid_format',
    });
  });

  it('rejects unsafe tokens for company plain text policy', () => {
    expect(validateClassifiedField('company', 'Harbourview Capital')).toEqual({ valid: true });
    expect(validateClassifiedField('company', 'Harbourview <b>Capital</b>')).toEqual({
      valid: false,
      reason: 'unsafe_tokens',
    });
  });

  it('rejects unsafe tokens for message plain text policy', () => {
    expect(validateClassifiedField('message', 'Please verify this listing and advise next steps.')).toEqual({ valid: true });
    expect(validateClassifiedField('message', 'Please review https://example.com now.')).toEqual({
      valid: false,
      reason: 'unsafe_tokens',
    });
  });

  it('supports optional plain text policy for requirements', () => {
    expect(validateClassifiedField('requirements', '')).toEqual({ valid: true });
    expect(validateClassifiedField('requirements', 'Need GMP-capable supplier in Ontario.')).toEqual({ valid: true });
    expect(validateClassifiedField('requirements', 'Need details at www.example.com')).toEqual({
      valid: false,
      reason: 'unsafe_tokens',
    });
  });
});
