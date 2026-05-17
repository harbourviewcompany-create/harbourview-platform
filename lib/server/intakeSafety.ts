import { z } from 'zod';

const MAX_TEXT = 220;
const MAX_MESSAGE = 3500;

const clean = (value: string) => value.replace(/[\u0000-\u001f\u007f]/g, '').trim();

const safeText = z.string().min(1).max(MAX_TEXT).transform(clean);

export const baseIntakeSchema = z.object({
  name: safeText,
  email: z.string().email().max(MAX_TEXT).transform(clean),
  company: safeText.optional().default(''),
  honeypot: z.string().optional().default(''),
});

export function assertNoHoneypot(honeypot: string) {
  return honeypot.trim().length === 0;
}

export function messageWithinLimit(message: string, max = MAX_MESSAGE) {
  return message.length <= max;
}

export function normalizeFreeText(value: string, maxLength = MAX_TEXT) {
  const cleaned = clean(value);
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
}
