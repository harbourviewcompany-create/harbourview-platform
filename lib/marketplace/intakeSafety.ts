const MAX_TEXT_LENGTH = 180;
const MAX_MESSAGE_LENGTH = 2500;

const URL_PATTERN = /(https?:\/\/|www\.)/i;
const MARKUP_PATTERN = /<\/?[a-z][\s\S]*>/i;
const PHONE_PATTERN = /^\+?[0-9()\-\s.]{7,20}$/;

export type IntakePolicyType = 'strict_format' | 'plain_text_unsafe_token_rejection' | 'optional_plain_text';

type IntakeFieldClassification = {
  policy: IntakePolicyType;
  format?: 'email' | 'phone';
  maxLength?: number;
};

export const FIELD_CLASSIFICATION_MATRIX = {
  email: { policy: 'strict_format', format: 'email', maxLength: MAX_TEXT_LENGTH },
  phone: { policy: 'strict_format', format: 'phone', maxLength: MAX_TEXT_LENGTH },
  company: { policy: 'plain_text_unsafe_token_rejection', maxLength: MAX_TEXT_LENGTH },
  message: { policy: 'plain_text_unsafe_token_rejection', maxLength: MAX_MESSAGE_LENGTH },
  requirements: { policy: 'optional_plain_text', maxLength: MAX_MESSAGE_LENGTH },
} as const satisfies Record<string, IntakeFieldClassification>;

export function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string) {
  return PHONE_PATTERN.test(phone);
}

export function isOversized(value: string, maxLength = MAX_TEXT_LENGTH) {
  return value.length > maxLength;
}

export function isUnsafeFreeText(value: string) {
  return URL_PATTERN.test(value) || MARKUP_PATTERN.test(value);
}

export function validateFieldAgainstPolicy(
  value: string,
  classification: IntakeFieldClassification,
): { valid: boolean; reason?: 'invalid_format' | 'oversized' | 'unsafe_tokens' } {
  if (classification.maxLength && isOversized(value, classification.maxLength)) {
    return { valid: false, reason: 'oversized' };
  }

  if (classification.policy === 'strict_format') {
    if (classification.format === 'email') {
      return isValidEmail(value) ? { valid: true } : { valid: false, reason: 'invalid_format' };
    }

    if (!value) return { valid: true };
    return isValidPhone(value) ? { valid: true } : { valid: false, reason: 'invalid_format' };
  }

  if (!value && classification.policy === 'optional_plain_text') {
    return { valid: true };
  }

  return isUnsafeFreeText(value) ? { valid: false, reason: 'unsafe_tokens' } : { valid: true };
}

export function getMaxMessageLength() {
  return MAX_MESSAGE_LENGTH;
}

export function getMaxTextLength() {
  return MAX_TEXT_LENGTH;
}
