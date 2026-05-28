const RULES = [
  { pattern: /\bcure(s|d|)?\b/i, type: 'cure-claim' },
  { pattern: /\btreat(ment|ing)?\b/i, type: 'treatment-claim' },
  { pattern: /\bdos(e|ing)\b/i, type: 'dosing-guidance' },
  { pattern: /\bprescrib(e|ing)\b/i, type: 'prescribing-language' },
  { pattern: /\bguarantee(d)?\b/i, type: 'efficacy-guarantee' },
  { pattern: /\byou should take\b/i, type: 'patient-specific-instruction' },
]

export function scanMedicalClaims(content: string) {
  const hits = RULES.filter((rule) => rule.pattern.test(content)).map((rule) => rule.type)
  const blocked = hits.length > 0
  return { blocked, hits }
}
