import 'server-only';

import { assertServerOnly } from './serverOnly';
import { getHfEnv, type HfEnv } from './env';
import { HfError } from './errors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HfRequestOptions {
  method?: 'GET' | 'POST';
  path: string;
  body?: unknown;
  /** Override base URL — use for Inference Endpoint calls */
  baseUrl?: string;
}

export interface HfResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

/**
 * Minimal server-only HF Hub/Inference HTTP client.
 * Reads HF_TOKEN_SERVER from env — never accepts a token as a parameter
 * to prevent accidental token forwarding from request context.
 *
 * Does NOT log the token. Does NOT expose the token in error messages.
 */
export class HfClient {
  private readonly token: string;
  private readonly org: string;
  private readonly hubBase = 'https://huggingface.co/api';

  constructor(env?: HfEnv) {
    assertServerOnly();
    const resolved = env ?? getHfEnv();
    this.token = resolved.HF_TOKEN_SERVER;
    this.org = resolved.HF_ORG;
  }

  async request<T = unknown>(opts: HfRequestOptions): Promise<HfResponse<T>> {
    assertServerOnly();

    const base = opts.baseUrl ?? this.hubBase;
    const url = `${base}${opts.path}`;

    let resp: Response;
    try {
      resp = await fetch(url, {
        method: opts.method ?? 'GET',
        headers: {
          Authorization: `Bearer ${this.token}`,
          ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(opts.body ? { body: JSON.stringify(opts.body) } : {}),
        cache: 'no-store',
      });
    } catch (err) {
      throw new HfError(
        'HF_ENDPOINT_UNREACHABLE',
        `[hf] Network error reaching ${url}: ${String(err)}`,
      );
    }

    if (resp.status === 401 || resp.status === 403) {
      throw new HfError('HF_AUTH_FAILED', `[hf] Auth error ${resp.status} at ${url}`, resp.status);
    }
    if (resp.status === 429) {
      throw new HfError('HF_RATE_LIMITED', `[hf] Rate limited at ${url}`, resp.status);
    }
    if (resp.status === 404) {
      throw new HfError('HF_REPO_NOT_FOUND', `[hf] Not found: ${url}`, resp.status);
    }

    let data: T;
    try {
      data = await resp.json() as T;
    } catch {
      throw new HfError(
        'HF_OUTPUT_INVALID',
        `[hf] Non-JSON response from ${url} (status ${resp.status})`,
        resp.status,
      );
    }

    return { ok: resp.ok, status: resp.status, data };
  }

  /** POST to a private Inference Endpoint. */
  async inferencePost<T = unknown>(endpointUrl: string, inputs: unknown): Promise<T> {
    assertServerOnly();
    if (!endpointUrl.startsWith('https://')) {
      throw new HfError(
        'HF_ENDPOINT_UNREACHABLE',
        `[hf] Endpoint URL must be HTTPS: ${endpointUrl}`,
      );
    }
    const result = await this.request<T>({
      method: 'POST',
      path: '',
      baseUrl: endpointUrl,
      body: { inputs },
    });
    if (!result.ok) {
      throw new HfError(
        'HF_OUTPUT_INVALID',
        `[hf] Inference endpoint returned status ${result.status}`,
        result.status,
        result.data,
      );
    }
    return result.data;
  }

  /** Expose org slug for logging (not the token). */
  get orgSlug(): string {
    return this.org;
  }
}

// ---------------------------------------------------------------------------
// Singleton factory — one client per server process
// ---------------------------------------------------------------------------

let _client: HfClient | null = null;

export function getHfClient(): HfClient {
  assertServerOnly();
  if (!_client) {
    _client = new HfClient();
  }
  return _client;
}

/** Reset singleton — for tests only. */
export function _resetHfClientForTest(): void {
  _client = null;
}
