export type AuthorityFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export type AuthorityFetchResult = {
  response: Response;
  raw: string;
  retriedWithBrowserProfile: boolean;
};

export const SOURCE_ENGINE_USER_AGENT = "HarbourviewSourceEngine/2.3 (+official-source-monitoring)";
export const BROWSER_COMPATIBLE_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export function containsHtmlTable(raw: string): boolean {
  return /<table(?:\s|>)/i.test(raw);
}

export function sourceEngineHeaders(): HeadersInit {
  return {
    "User-Agent": SOURCE_ENGINE_USER_AGENT,
    "Accept": "application/json,text/csv,application/csv,application/rss+xml,application/atom+xml,application/xml,text/xml,text/html,*/*;q=0.5",
  };
}

export function browserCompatibleHtmlHeaders(): HeadersInit {
  return {
    "User-Agent": BROWSER_COMPATIBLE_USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-AU,en;q=0.9",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
  };
}

async function fetchOnce(
  url: string,
  timeoutMs: number,
  headers: HeadersInit,
  fetchImpl: AuthorityFetch,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, {
      redirect: "follow",
      signal: controller.signal,
      headers,
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch an authority URL without changing its provenance identity.
 *
 * Some regulator/CDN stacks return a reduced server representation to a
 * machine-style User-Agent while returning the canonical HTML tables to a
 * normal browser request. For sources explicitly configured as HTML tables we
 * retry the exact same first-party URL once with ordinary browser content
 * negotiation only when the first successful representation contains no
 * <table>. There is no proxy, mirror, renderer, alternate domain, or identity
 * fallback.
 */
export async function fetchAuthorityRepresentation(
  url: string,
  options: {
    structuredHtmlTable?: boolean;
    timeoutMs?: number;
    fetchImpl?: AuthorityFetch;
  } = {},
): Promise<AuthorityFetchResult> {
  const timeoutMs = options.timeoutMs ?? 12000;
  const fetchImpl = options.fetchImpl ?? fetch;
  const first = await fetchOnce(url, timeoutMs, sourceEngineHeaders(), fetchImpl);
  const firstRaw = await first.text();

  if (!options.structuredHtmlTable || !first.ok || containsHtmlTable(firstRaw)) {
    return { response: first, raw: firstRaw, retriedWithBrowserProfile: false };
  }

  const retry = await fetchOnce(url, timeoutMs, browserCompatibleHtmlHeaders(), fetchImpl);
  const retryRaw = await retry.text();
  return { response: retry, raw: retryRaw, retriedWithBrowserProfile: true };
}
