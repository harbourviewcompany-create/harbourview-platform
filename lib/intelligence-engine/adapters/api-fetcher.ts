import { IDataAdapter, ScrapeTarget, ScraperResult } from '../types';
import { parseRetryAfterSeconds } from './http-helpers';
import crypto from 'crypto';

/**
 * JSON API Fetcher — enhanced for legal-tech and regulatory APIs.
 *
 * Requests JSON explicitly and confirms the response body actually parses
 * before reporting success. The failure mode this guards against: an API
 * endpoint that starts returning an HTML error/login/rate-limit page (same
 * HTTP 200) is indistinguishable from a real payload to a generic HTML
 * fetcher, and would otherwise be staged for AI extraction as if it were
 * good structured data.
 *
 * Metadata contract (source_registry.metadata JSON, optional):
 * {
 *   "headers": { "X-API-Key": "…", … },
 *   "accept": "application/json",          // override Accept header
 *   "timeout_ms": 20000,                   // default 15000, max 60000
 *   "auth_env": "CANNABIZ_API_KEY",        // injects Authorization: Bearer ${env}
 *   "last_etag": "\"abc\"",                 // If-None-Match (set by orchestrator)
 *   "previous_hash": "sha256hex…"          // post-download early-abort (orchestrator)
 * }
 *
 * Credentials must never be stored in the registry row. Use env vars
 * referenced by auth_env, or inject headers at deploy time via secrets.
 */
export class APIDataAdapter implements IDataAdapter {
  async fetch(target: ScrapeTarget): Promise<ScraperResult> {
    const timestamp = new Date().toISOString();
    const meta = (target.metadata ?? {}) as Record<string, unknown>;

    try {
      const headers: Record<string, string> = {
        'User-Agent': 'HarbourView Intelligence Engine/1.0 (+https://harbourview.com/bot)',
        Accept: typeof meta.accept === 'string' ? meta.accept : 'application/json',
      };

      // Static headers from registry metadata (no secrets).
      if (meta.headers && typeof meta.headers === 'object' && !Array.isArray(meta.headers)) {
        for (const [k, v] of Object.entries(meta.headers as Record<string, unknown>)) {
          if (typeof v === 'string' && v.length > 0) headers[k] = v;
        }
      }

      // Conditional request when orchestrator supplies last ETag.
      if (typeof meta.last_etag === 'string' && meta.last_etag.length > 0) {
        headers['If-None-Match'] = meta.last_etag;
      }

      // Env-backed auth: never store the secret in source_registry.
      if (typeof meta.auth_env === 'string' && meta.auth_env.length > 0) {
        const secret = process.env[meta.auth_env];
        if (secret) {
          if (!headers['Authorization'] && !headers['authorization']) {
            headers['Authorization'] = `Bearer ${secret}`;
          }
        } else {
          return {
            target_id: target.id,
            timestamp,
            raw_content: '',
            content_hash: '',
            status: 'failed',
            error_message: `API auth_env "${meta.auth_env}" is set but process.env value is missing.`,
          };
        }
      }

      const timeoutMs =
        typeof meta.timeout_ms === 'number' && meta.timeout_ms > 0
          ? Math.min(meta.timeout_ms, 60000)
          : 15000;

      const response = await fetch(target.base_url, {
        headers,
        signal: AbortSignal.timeout(timeoutMs),
      });

      // Server supports conditional GET — body unchanged, no transfer cost.
      if (response.status === 304) {
        const previousHash =
          typeof meta.previous_hash === 'string' ? meta.previous_hash : '';
        const etag =
          response.headers.get('etag') ??
          (typeof meta.last_etag === 'string' ? meta.last_etag : undefined);
        return {
          target_id: target.id,
          timestamp,
          raw_content: '',
          content_hash: previousHash,
          status: 'unchanged',
          http_status: 304,
          etag: etag || undefined,
        };
      }

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

      // Post-download hash match (when server has no ETag support).
      if (
        typeof meta.previous_hash === 'string' &&
        meta.previous_hash.length > 0 &&
        contentHash === meta.previous_hash
      ) {
        const etag = response.headers.get('etag') ?? undefined;
        return {
          target_id: target.id,
          timestamp,
          raw_content: '',
          content_hash: contentHash,
          status: 'unchanged',
          http_status: response.status,
          etag: etag || undefined,
        };
      }

      try {
        JSON.parse(text);
      } catch {
        return {
          target_id: target.id,
          timestamp,
          raw_content: text.slice(0, 2000),
          content_hash: contentHash,
          status: 'failed',
          error_message: 'Response was not valid JSON.',
          http_status: response.status,
        };
      }

      const etag = response.headers.get('etag') ?? undefined;
      return {
        target_id: target.id,
        timestamp,
        raw_content: text,
        content_hash: contentHash,
        status: 'success',
        http_status: response.status,
        etag: etag || undefined,
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
