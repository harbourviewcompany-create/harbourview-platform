export const FORBIDDEN_PUBLIC_SIGNAL_STRINGS = [
  'deal flow',
  'buyer demand',
  'supplier',
  'Harbourview Network activity',
  'private_notes',
  'analyst_notes'
]

export function containsForbiddenSignalLeakage(text: string): boolean {
  const lower = text.toLowerCase()
  return FORBIDDEN_PUBLIC_SIGNAL_STRINGS.some(s => lower.includes(s))
}

export function assertPublicSafe(summary: string, implication: string) {
  if (containsForbiddenSignalLeakage(summary) || containsForbiddenSignalLeakage(implication)) {
    throw new Error('Signal failed public safety check')
  }
}
