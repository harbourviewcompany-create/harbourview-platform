const BLOCKED_KEYS = new Set([
  "token",
  "token_hash",
  "access_token",
  "refresh_token",
  "service_role",
  "service_role_key",
  "secret",
  "api_key",
  "apikey",
  "api_token",          // raw token stored on publish_events — must never reach feed output
  "password",
  "internal_notes",
  "analyst_notes",
  "analyst_interpretation", // internal analyst commentary — not for client consumption
  "reviewer_notes",
  "rejection_reason",
  "return_reason",
  "item_notes",         // internal dossier item notes — not for client consumption
  "snapshot_json",      // raw DB snapshot column — must not be re-embedded in feed output
  // workspace and workspace_id are intentionally included in the published snapshot
  // (workspace.name provides client context). Do NOT add them here.
  "profile_id",
  "owner_id",
  "created_by",
  "updated_by",
  "private_metadata",
  "raw_payload",
  "debug",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeValue);

  if (!isPlainObject(value)) return value;

  const sanitized: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (BLOCKED_KEYS.has(key.toLowerCase())) continue;
    sanitized[key] = sanitizeValue(child);
  }
  return sanitized;
}

export function sanitizeFeedSnapshot(snapshot: unknown): unknown {
  return sanitizeValue(snapshot);
}

export const PUBLIC_FEED_SELECT = "id, status, expires_at, revoked_at, snapshot";
