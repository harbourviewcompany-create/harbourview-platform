export function fmtStatus(v: string | null | undefined, fallback = '—'): string {
  if (!v) return fallback
  return v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
