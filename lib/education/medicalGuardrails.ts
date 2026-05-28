const CLAIM_PATTERNS = [
  /\bcures?\b/i,
  /\btreat(?:s|ment)?\b/i,
  /\bdos(?:e|ing)\b/i,
  /\bprescrib(?:e|ing)\b/i,
  /\bguaranteed efficacy\b/i,
  /\bpatient-specific\b/i,
]

export type GuardrailScanResult = {
  blocked: boolean
  warnings: string[]
}

export function scanMedicalClaims(text: string): GuardrailScanResult {
  const warnings = CLAIM_PATTERNS.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source)
  return { blocked: warnings.length > 0, warnings }
}
