import { IDataAdapter, ScrapeTarget, ScraperResult } from '../types';
import { parseRetryAfterSeconds } from './http-helpers';
import crypto from 'crypto';

/**
 * RSS / Atom Feed Fetcher.
 *
 * Requests the feed with feed-appropriate Accept headers and checks the
 * response actually contains <item>/<entry> elements before reporting
 * success. A feed URL that has been retired, redirects to an HTML error
 * page, or starts returning a login wall would otherwise look identical to
 * a real feed to a generic HTML fetcher — this adapter is what lets that
 * distinction surface as a `failed` snapshot instead of silently going
 * into the AI extraction queue as if it were good feed content.
 */
export class RSSDataAdapter implements IDataAdapter {
  async fetch(target: ScrapeTarget): Promise<ScraperResult> {
    const timestamp = new Date().toISOString();
    try {
      const response = await fetch(target.base_url, {
        headers: {
          'User-Agent': 'HarbourView Intelligence Engine/1.0 (+https://harbourview.com/bot)',
          'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        return {
          target_id: target.id,
          timestamp,
          raw_content: '',
          content_hash: '',
          status: 'failed',
          error_message: `HTTP ${response.status}: ${response.statusText}`,
          http_status: response.status,
          retry_after_seconds: parseRetryAfterSeconds(response),
        };
      }

      const xml = await response.text();
      const contentHash = crypto.createHash('sha256').update(xml).digest('hex');
      const itemCount = (xml.match(/<(?:item|entry)[\s>]/gi) ?? []).length;

      if (itemCount === 0) {
        return {
          target_id: target.id,
          timestamp,
          raw_content: xml,
          content_hash: contentHash,
          status: 'failed',
          error_message: 'No <item>/<entry> elements found — response does not look like a valid RSS/Atom feed.',
          http_status: response.status,
        };
      }

      return {
        target_id: target.id,
        timestamp,
        raw_content: xml,
        content_hash: contentHash,
        status: 'success',
        http_status: response.status,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        target_id: target.id,
        timestamp,
        raw_content: '',
        content_hash: '',
        status: 'failed',
        error_message: message,
      };
    }
  }
}
