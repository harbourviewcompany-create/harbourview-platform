/**
 * Shared by html-fetcher.ts/rss-fetcher.ts/api-fetcher.ts so Retry-After
 * parsing isn't duplicated three times. Returns seconds to wait, or
 * undefined if the header is absent/unparseable. Per RFC 9110 §10.2.3,
 * the header is either a delay in seconds or an HTTP-date.
 */
export function parseRetryAfterSeconds(response: Response): number | undefined {
  const header = response.headers.get('retry-after');
  if (!header) return undefined;

  const asSeconds = Number(header);
  if (Number.isFinite(asSeconds) && asSeconds >= 0) return asSeconds;

  const asDate = Date.parse(header);
  if (!Number.isNaN(asDate)) {
    const deltaMs = asDate - Date.now();
    return deltaMs > 0 ? Math.ceil(deltaMs / 1000) : 0;
  }

  return undefined;
}
