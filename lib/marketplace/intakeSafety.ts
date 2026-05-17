const DISALLOWED_PAYLOAD_PATTERNS = [
  /<script\b/i,
  /javascript:/i,
  /data:text\/html/i,
  /onerror\s*=/i,
  /onload\s*=/i,
  /\bunion\s+select\b/i,
];

export const MAX_MESSAGE_LENGTH = 3500;
export const MAX_TEXT_LENGTH = 220;

export function hasUnsafeInput(value: string) {
  return DISALLOWED_PAYLOAD_PATTERNS.some((pattern) => pattern.test(value));
}

export function isOversized(value: string, maxLength = MAX_TEXT_LENGTH) {
  return value.length > maxLength;
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function readField(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === 'string' ? value.trim() : '';
}

export function evaluateIntakeAbuse(fields: string[]) {
  if (fields.some((field) => hasUnsafeInput(field))) return 'unsafe_payload';
  if (fields.some((field) => isOversized(field))) return 'oversized';
  return 'ok';
}
