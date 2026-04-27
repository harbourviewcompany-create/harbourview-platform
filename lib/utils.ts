export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getUTMParams(searchParams: URLSearchParams): Record<string, string> {
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
  const result: Record<string, string> = {}
  utmKeys.forEach((key) => {
    const val = searchParams.get(key)
    if (val) result[key] = val
  })
  return result
}
