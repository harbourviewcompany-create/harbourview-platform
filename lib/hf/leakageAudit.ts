import 'server-only';

import { assertServerOnly } from './serverOnly';
import {
  HV_FORBIDDEN_PUBLIC_KEYS,
  HV_PASSPORT_TABLES_NO_PUBLIC_DTO,
  type HvForbiddenPublicKey,
} from '../harbourview/dto/allowlists';

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export type LeakageAuditStatus = 'pass' | 'fail';

export interface LeakageAuditResult {
  status: LeakageAuditStatus;
  forbidden_fields_found: string[];
  unsupported_claims: string[];
  required_removals: string[];
  requires_review: boolean;
  safe_public_payload: Record<string, unknown>;
}

export interface UnsupportedClaim {
  field: string;
  value: string;
  reason: string;
}

// ---------------------------------------------------------------------------
// Forbidden field detection
// ---------------------------------------------------------------------------

const FORBIDDEN_SET = new Set<string>(HV_FORBIDDEN_PUBLIC_KEYS);
const PASSPORT_TABLE_SET = new Set<string>(HV_PASSPORT_TABLES_NO_PUBLIC_DTO);

/**
 * Recursively collects all key paths in a nested object.
 * Returns dot-notation paths: e.g. "supplier.reviewer_id"
 */
function collectKeyPaths(
  obj: unknown,
  prefix = '',
  depth = 0,
): string[] {
  if (depth > 10 || obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return [];
  }
  const paths: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k;
    paths.push(path);
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      paths.push(...collectKeyPaths(v, path, depth + 1));
    }
  }
  return paths;
}

/**
 * Finds all forbidden field paths in a payload (including nested).
 */
function findForbiddenFields(payload: Record<string, unknown>): string[] {
  const allPaths = collectKeyPaths(payload);
  return allPaths.filter((path) => {
    const key = path.split('.').pop() ?? '';
    return FORBIDDEN_SET.has(key as HvForbiddenPublicKey);
  });
}

// ---------------------------------------------------------------------------
// Unsupported claim detection
// ---------------------------------------------------------------------------

/** Patterns that indicate model-generated rationale leaking into public output. */
const MODEL_RATIONALE_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /\bconfidence[:\s]+[\d.]+%?/i,
    reason: 'Contains raw confidence score — model output not approved for public release',
  },
  {
    pattern: /\bprobabilit(?:y|ies)[:\s]+[\d.]+/i,
    reason: 'Contains raw probability value — model output not approved for public release',
  },
  {
    pattern: /\bmodel\s+(?:output|says|predicts|suggests|believes)/i,
    reason: 'References model output directly — requires human reviewer approval before public release',
  },
  {
    pattern: /\bprompt[:\s]+v[\d.]+/i,
    reason: 'Contains prompt version reference — internal metadata not for public release',
  },
];

/** Patterns that indicate unreviewed medical/regulatory/legal claims. */
const UNREVIEWED_CLAIM_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /\b(?:treats?|cures?|prevents?|heals?|diagnoses?)\b.{0,60}\b(?:cancer|disease|disorder|condition|illness)/i,
    reason: 'Unqualified medical efficacy claim — requires expert medical review before public release',
  },
  {
    pattern: /\b(?:FDA|EMA|Health Canada)\s+(?:approved?|cleared?|authorised?)\b/i,
    reason: 'Regulatory approval claim — requires verified evidence document before public release',
  },
  {
    pattern: /\b(?:legally?\s+required|mandatory\s+by\s+law|compliance\s+required)\b/i,
    reason: 'Legal obligation claim — requires legal review before public release',
  },
  {
    pattern: /\b(?:certified|accredited|licensed)\b.{0,40}\b(?:ISO|EU.?GMP|GMP|WHO.?GMP|GACP)\b/i,
    reason: 'Certification/accreditation claim — requires verified licence or evidence document',
  },
];

/** Patterns that indicate raw internal data bleeding through. */
const RAW_DATA_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  {
    // Supabase/Postgres UUIDs in fields that should be display values
    pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    reason: 'Raw UUID value — likely an internal record ID, not a display value',
  },
  {
    pattern: /<\/?(?:html|body|div|span|script|style|table|tr|td)[^>]*>/i,
    reason: 'HTML fragment detected — raw scraped content not approved for public release',
  },
  {
    pattern: /\bprivate[:\s]+(?:note|comment|internal)/i,
    reason: 'Contains "private note/comment/internal" marker — internal annotation leakage',
  },
  {
    pattern: /(?:reviewer|operator)\s*(?:note|comment|feedback)[:\s]+/i,
    reason: 'Contains reviewer/operator annotation — internal metadata not for public release',
  },
];

/**
 * Scans all string values in a payload for unsupported claim patterns.
 * Returns findings with field path, value snippet, and reason.
 */
function findUnsupportedClaims(
  payload: Record<string, unknown>,
  prefix = '',
  depth = 0,
): UnsupportedClaim[] {
  if (depth > 10) return [];
  const findings: UnsupportedClaim[] = [];

  for (const [k, v] of Object.entries(payload)) {
    const path = prefix ? `${prefix}.${k}` : k;

    if (typeof v === 'string' && v.length > 0) {
      const allPatterns = [
        ...MODEL_RATIONALE_PATTERNS,
        ...UNREVIEWED_CLAIM_PATTERNS,
        ...RAW_DATA_PATTERNS,
      ];
      for (const { pattern, reason } of allPatterns) {
        if (pattern.test(v)) {
          findings.push({
            field: path,
            value: v.slice(0, 120) + (v.length > 120 ? '…' : ''),
            reason,
          });
          break; // one finding per field per value
        }
      }
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      findings.push(
        ...findUnsupportedClaims(v as Record<string, unknown>, path, depth + 1),
      );
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Safe payload generator
// ---------------------------------------------------------------------------

/**
 * Returns a copy of the payload with all forbidden fields removed.
 * Does NOT remove fields with unsupported claims — those require human decision.
 */
function buildSafePayload(
  payload: Record<string, unknown>,
  depth = 0,
): Record<string, unknown> {
  if (depth > 10) return {};
  const safe: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(payload)) {
    if (FORBIDDEN_SET.has(k as HvForbiddenPublicKey)) continue;

    if (v && typeof v === 'object' && !Array.isArray(v)) {
      safe[k] = buildSafePayload(v as Record<string, unknown>, depth + 1);
    } else {
      safe[k] = v;
    }
  }

  return safe;
}

// ---------------------------------------------------------------------------
// Prompt injection detection
// ---------------------------------------------------------------------------

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(?:previous|above|all)\s+instructions?/i,
  /system\s*:\s*you\s+are/i,
  /\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>/,
  /<!--.*?(?:inject|override|system).*?-->/i,
];

function findInjectionAttempts(payload: Record<string, unknown>): string[] {
  const findings: string[] = [];
  const paths = collectKeyPaths(payload);

  for (const path of paths) {
    const parts = path.split('.');
    let val: unknown = payload;
    for (const part of parts) {
      val = (val as Record<string, unknown>)?.[part];
    }
    if (typeof val === 'string') {
      for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(val)) {
          findings.push(`${path}: possible prompt injection attempt`);
          break;
        }
      }
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Passport table name leakage
// ---------------------------------------------------------------------------

function findPassportTableReferences(payload: Record<string, unknown>): string[] {
  const findings: string[] = [];
  const str = JSON.stringify(payload);

  for (const table of PASSPORT_TABLE_SET) {
    if (str.includes(table)) {
      findings.push(`Payload references passport table "${table}" — no public DTO scope defined`);
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Main audit function
// ---------------------------------------------------------------------------

/**
 * Audits a candidate public payload for leakage, unsupported claims,
 * prompt injection, and passport table references.
 *
 * Server-only. Never call from client code or public routes.
 * This is the second-layer check — the first layer is structural Pick<> types.
 *
 * @param payload - The candidate public payload to audit.
 * @param context - Descriptive label for logging (e.g. "supplier/abc123").
 */
export function auditPublicPayload(
  payload: Record<string, unknown>,
  context = 'unknown',
): LeakageAuditResult {
  assertServerOnly();

  const forbiddenFields = findForbiddenFields(payload);
  const unsupportedClaimsRaw = findUnsupportedClaims(payload);
  const injectionAttempts = findInjectionAttempts(payload);
  const passportRefs = findPassportTableReferences(payload);

  const unsupportedClaims: string[] = [
    ...unsupportedClaimsRaw.map((c) => `${c.field}: ${c.reason}`),
    ...injectionAttempts,
    ...passportRefs,
  ];

  const requiredRemovals: string[] = [
    ...forbiddenFields.map((f) => `Remove field: ${f}`),
    ...unsupportedClaims.map((c) => `Requires review: ${c}`),
  ];

  const status: LeakageAuditStatus =
    forbiddenFields.length === 0 &&
    unsupportedClaims.length === 0
      ? 'pass'
      : 'fail';

  const requiresReview =
    status === 'fail' ||
    unsupportedClaimsRaw.some((c) =>
      UNREVIEWED_CLAIM_PATTERNS.some(({ pattern }) =>
        pattern.test(c.value),
      ),
    );

  return {
    status,
    forbidden_fields_found: forbiddenFields,
    unsupported_claims: unsupportedClaims,
    required_removals: requiredRemovals,
    requires_review: requiresReview,
    safe_public_payload: buildSafePayload(payload),
  };
}

/**
 * Throws if the payload fails the leakage audit.
 * Use as a hard gate before any public release.
 */
export function assertAuditPass(
  payload: Record<string, unknown>,
  context = 'unknown',
): void {
  assertServerOnly();
  const result = auditPublicPayload(payload, context);
  if (result.status === 'fail') {
    throw new Error(
      `[leakageAudit] Public payload audit FAILED (${context}).\n` +
        `Forbidden fields: ${result.forbidden_fields_found.join(', ') || 'none'}\n` +
        `Unsupported claims: ${result.unsupported_claims.length}\n` +
        `Required removals: ${result.required_removals.join('; ')}`,
    );
  }
}

/**
 * Returns the safe payload only, discarding audit metadata.
 * Does NOT throw — call auditPublicPayload() if you need the full result.
 */
export function getSafePublicPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  assertServerOnly();
  return buildSafePayload(payload);
}

// Re-export patterns for test access
export { FORBIDDEN_SET };
