import { IDataAdapter, ScrapeTarget, ScraperResult } from '../types';
import crypto from 'crypto';

/**
 * JSON API Fetcher.
 *
 * Requests JSON explicitly and confirms the response body actually parses
 * before reporting success. The failure mode this guards against: an API
 * endpoint that starts returning an HTML error/login/rate-limit page (same
 * HTTP 200) is indistinguishable from a real payload to a generic HTML
 * fetcher, and would otherwise be staged for AI extraction as if it were
 * good structured data.
 */
export class APIDataAdapter implements IDataAdapter {
  async fetch(target: ScrapeTarget): Promise<ScraperResult> {
    const timestamp = new Date().toISOString();
    try {
      const response = await fetch(target.base_url, {
        headers: {
          'User-Agent': 'HarbourView Intelligence Engine/1.0 (+https://harbourview.com/bot)',
          'Accept': 'application/json',
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
        };
      }

      const text = await response.text();
      const contentHash = crypto.createHash('sha256').update(text).digest('hex');

      try {
        JSON.parse(text);
      } catch {
        return {
          target_id: target.id,
          timestamp,
          raw_content: text,
          content_hash: contentHash,
          status: 'failed',
          error_message: 'Response was not valid JSON.',
        };
      }

      return {
        target_id: target.id,
        timestamp,
        raw_content: text,
        content_hash: contentHash,
        status: 'success',
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
