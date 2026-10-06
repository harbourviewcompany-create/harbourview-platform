type ServiceProbe = {
  ok: boolean
  status?: number
  error?: 'timeout' | 'network' | 'http'
}

export type PlatformHealth = {
  ok: boolean
  checkedAt: string
  services: {
    auth: ServiceProbe
    database: ServiceProbe
  }
}

const DEFAULT_TIMEOUT_MS = 5_000

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, '')
}

async function probe(
  url: string,
  headers: Record<string, string>,
  timeoutMs: number,
): Promise<ServiceProbe> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!response.ok) {
      await response.body?.cancel().catch(() => {})
      return { ok: false, status: response.status, error: 'http' }
    }
    await response.body?.cancel().catch(() => {})
    return { ok: true, status: response.status }
  } catch (error) {
    const isTimeout =
      error instanceof DOMException && error.name === 'TimeoutError'
    return { ok: false, error: isTimeout ? 'timeout' : 'network' }
  }
}

export async function probePlatformHealth({
  supabaseUrl,
  publicKey,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: {
  supabaseUrl: string
  publicKey: string
  timeoutMs?: number
}): Promise<PlatformHealth> {
  const baseUrl = normalizeBaseUrl(supabaseUrl)
  const commonHeaders = { apikey: publicKey }

  const [auth, database] = await Promise.all([
    probe(`${baseUrl}/auth/v1/health`, commonHeaders, timeoutMs),
    probe(
      `${baseUrl}/rest/v1/countries?select=iso_alpha2&limit=1`,
      {
        ...commonHeaders,
        Authorization: `Bearer ${publicKey}`,
        Accept: 'application/json',
      },
      timeoutMs,
    ),
  ])

  return {
    ok: auth.ok && database.ok,
    checkedAt: new Date().toISOString(),
    services: { auth, database },
  }
}
