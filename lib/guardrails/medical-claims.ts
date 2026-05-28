const prohibitedPatterns = [
  /\bcures?\b/i,
  /\btreats?\b/i,
  /\bdose|dosing\b/i,
  /\bprescrib(e|ing)\b/i,
  /\bguarantee(d)? efficacy\b/i,
  /\bfor you specifically\b/i,
]

export function scanMedicalClaims(content: string) {
  const matches = prohibitedPatterns.filter((pattern) => pattern.test(content)).map((pattern) => pattern.source)
  return {
    blocked: matches.length > 0,
    matches,
    escalation: matches.length > 0 ? 'clinical-review' : 'none',
  }
}
