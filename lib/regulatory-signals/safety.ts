export function isPublicSafeSignal(s: any) {
  return s && s.public_summary && s.public_implication && s.canonical_source_url
}
