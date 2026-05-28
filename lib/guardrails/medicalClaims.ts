const MEDICAL_CLAIM_PATTERNS = [
  /\bcure(s|d)?\b/i,
  /\btreat(ment|s|ed)?\b/i,
  /\bdose|dosing|prescrib(e|ing)\b/i,
  /\bguaranteed efficacy|guaranteed relief\b/i,
  /\bpatient-specific|for your condition\b/i,
]

export const scanMedicalClaims = (content: string) => MEDICAL_CLAIM_PATTERNS.filter((pattern) => pattern.test(content)).map((pattern) => pattern.source)
