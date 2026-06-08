import 'server-only';

export type HfErrorCode =
  | 'HF_ENV_MISSING'
  | 'HF_ENV_INVALID'
  | 'HF_AUTH_FAILED'
  | 'HF_REPO_NOT_FOUND'
  | 'HF_REPO_NOT_PRIVATE'
  | 'HF_ENDPOINT_UNREACHABLE'
  | 'HF_OUTPUT_INVALID'
  | 'HF_SCHEMA_VIOLATION'
  | 'HF_RATE_LIMITED'
  | 'HF_FORBIDDEN'
  | 'HF_SERVER_ONLY_VIOLATION';

export class HfError extends Error {
  constructor(
    public readonly code: HfErrorCode,
    message: string,
    public readonly status?: number,
    public readonly detail?: unknown,
  ) {
    super(message);
    this.name = 'HfError';
  }
}
