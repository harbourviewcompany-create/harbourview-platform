const MAX_TEXT_LENGTH = 180;
const MAX_MESSAGE_LENGTH = 2500;

const URL_PATTERN = /(https?:\/\/|www\.)/i;
const MARKUP_PATTERN = /<\/?[a-z][\s\S]*>/i;

export function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isOversized(value: string, maxLength = MAX_TEXT_LENGTH) {
  return value.length > maxLength;
}

export function isUnsafeFreeText(value: string) {
  return URL_PATTERN.test(value) || MARKUP_PATTERN.test(value);
}

export function getMaxMessageLength() {
  return MAX_MESSAGE_LENGTH;
}

export function getMaxTextLength() {
  return MAX_TEXT_LENGTH;
}

