import { IDataAdapter, ScrapeTarget, ScraperResult } from '../types';
import { parseRetryAfterSeconds } from './http-helpers';
import crypto from 'crypto';

/**
 * Standard Light-weight HTML Fetcher
 */
export class HTMLDataAdapter implements IDataAdapter {
  async fetch(target: ScrapeTarget): Promise<ScraperResult> {
    const timestamp = new Date().toISOString();
    try {
      const response = await fetch(target.base_url, {
        headers: {
          'User-Agent': 'HarbourView Intelligence Engine/1.0 (+https://harbourview.com/bot)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        // We add a 15-second timeout to prevent stalling
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

      const text = await response.text();
      const contentHash = crypto.createHash('sha256').update(text).digest('hex');

      return {
        target_id: target.id,
        timestamp,
        raw_content: text,
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