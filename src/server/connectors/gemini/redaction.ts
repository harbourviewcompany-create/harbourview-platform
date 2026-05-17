import type { RedactionOutcome } from './types';

const patterns: Array<{ type: string; regex: RegExp; replace?: string }> = [
  { type: 'google_api_key', regex: /AIza[0-9A-Za-z\-_]{20,}/g, replace: '[REDACTED_GOOGLE_API_KEY]' },
  { type: 'bearer_token', regex: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, replace: 'Bearer [REDACTED_BEARER_TOKEN]' },
  { type: 'github_token', regex: /gh[pousr]_[A-Za-z0-9_]{20,}/g, replace: '[REDACTED_GITHUB_TOKEN]' },
  { type: 'slack_token', regex: /xox[baprs]-[A-Za-z0-9-]{10,}/g, replace: '[REDACTED_SLACK_TOKEN]' },
  { type: 'aws_access_key_id', regex: /AKIA[0-9A-Z]{16}/g, replace: '[REDACTED_AWS_ACCESS_KEY_ID]' },
];

const privateKeyRegex = /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/m;

export function redactOrBlockSecrets(input: string): RedactionOutcome {
  if (privateKeyRegex.test(input)) {
    return { blocked: true, reason: 'private_key_detected', redactedText: '[BLOCKED_PRIVATE_KEY_MATERIAL]', events: [{ type: 'private_key_block', count: 1 }] };
  }

  let redactedText = input;
  const events: Array<{ type: string; count: number }> = [];
  for (const pattern of patterns) {
    const matches = redactedText.match(pattern.regex);
    if (matches?.length) {
      events.push({ type: pattern.type, count: matches.length });
      redactedText = redactedText.replace(pattern.regex, pattern.replace ?? '[REDACTED]');
    }
  }

  return { blocked: false, redactedText, events };
}

export function redactErrorMessage(message: string): string {
  return redactOrBlockSecrets(message).redactedText.replace(privateKeyRegex, '[REDACTED_PRIVATE_KEY]');
}
