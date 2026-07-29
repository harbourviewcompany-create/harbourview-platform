// lib/marketplace/piiScanner.ts
// PII redaction scanner for intake forms.
// Quarantines submissions containing suspected PII for manual review.

export interface PIIScanResult {
  clean: boolean
  detections: Array<{ type: string; match: string; position: number }>
  redactedText: string
}

// Detection patterns
const PII_PATTERNS = [
  {
    type: 'credit_card',
    pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
  },
  {
    type: 'ssn',
    pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
  },
  {
    type: 'phone_number',
    // Only flag excessive phone numbers (3+ in one text = likely PII dump)
    pattern: /\b\+?[1-9]\d{1,2}[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
  },
  {
    type: 'email_in_message',
    // Flag emails in free-text fields that aren't the designated email field
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  },
  {
    type: 'api_key',
    pattern: /\b(?:sk-|pk-|api[_-]?key[:\s]*)([a-zA-Z0-9_-]{20,})\b/gi,
  },
  {
    type: 'bitcoin_address',
    pattern: /\b(?:bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}\b/g,
  },
]

/** Scan text for PII. Returns detections and redacted version. */
export function scanForPII(text: string): PIIScanResult {
  const detections: Array<{ type: string; match: string; position: number }> = []
  let redactedText = text

  for (const { type, pattern } of PII_PATTERNS) {
    const matches = [...text.matchAll(pattern)]

    // For phone numbers, only flag if 3+ found (avoid false positives from normal business contact)
    if (type === 'phone_number' && matches.length < 3) continue

    for (const match of matches) {
      const position = match.index ?? 0
      detections.push({ type, match: match[0], position })

      // Redact in output
      const redaction = `[${type.toUpperCase()}_REDACTED]`
      redactedText = redactedText.replace(match[0], redaction)
    }
  }

  return {
    clean: detections.length === 0,
    detections,
    redactedText,
  }
}

/** Check if a submission should be quarantined */
export function shouldQuarantine(text: string): { quarantine: boolean; reason?: string } {
  const result = scanForPII(text)

  if (!result.clean) {
    const types = [...new Set(result.detections.map((d) => d.type))]
    return {
      quarantine: true,
      reason: `Detected potential PII: ${types.join(', ')}`,
    }
  }

  return { quarantine: false }
}

/** Sanitise intake text before storage */
export function sanitiseIntakeText(text: string): { safe: boolean; text: string; reason?: string } {
  const quarantine = shouldQuarantine(text)
  if (quarantine.quarantine) {
    const scan = scanForPII(text)
    return { safe: false, text: scan.redactedText, reason: quarantine.reason }
  }
  return { safe: true, text }
}
