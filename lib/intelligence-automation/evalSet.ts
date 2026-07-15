import 'server-only';
import {
  fetchAdminSupabaseJson,
  fetchAdminSupabaseJsonMutation,
  type AdminDataResult,
} from '@/lib/supabase/adminDataClient';

/**
 * Stage 0 (docs/INTELLIGENCE_ARCHITECTURE_SPEC.md) — the labeled evaluation set.
 *
 * Reads/writes go through the `api` schema surface created in migration
 * `expose_intel_eval_set_via_api_schema`:
 *   - read  : GET  /rest/v1/intel_eval_labeling   (view api.intel_eval_labeling)
 *   - write : POST /rest/v1/rpc/save_intel_eval_label (fn api.save_intel_eval_label)
 *
 * The table physically lives in `public` but PostgREST only exposes `api`
 * (see lib/supabase/env.ts). Never query `public.intel_eval_set` over REST.
 */

export const QUALITY_LABELS = ['signal', 'boilerplate', 'spam', 'nav', 'duplicate'] as const;
export const CONTENT_TYPES = ['regulatory', 'market', 'story', 'research', 'noise'] as const;
export const IMPACTS = ['high', 'medium', 'low'] as const;

export type QualityLabel = (typeof QUALITY_LABELS)[number];
export type ContentType = (typeof CONTENT_TYPES)[number];
export type Impact = (typeof IMPACTS)[number];
export type LabelStatus = 'unlabeled' | 'drafted' | 'confirmed' | 'corrected' | 'unlabelable';

export type EvalRow = {
  id: string;
  signalId: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  lang: string;
  country: string;
  score: number;
  topLane: string;
  stratum: string;
  draftQualityLabel: QualityLabel | null;
  draftContentType: ContentType | null;
  draftImpact: Impact | null;
  draftReason: string | null;
  qualityLabel: QualityLabel | null;
  contentType: ContentType | null;
  impact: Impact | null;
  labelNotes: string | null;
  labeledBy: string | null;
  labeledAt: string | null;
  labelStatus: LabelStatus;
  needsHuman: boolean;
  structIsJunk: boolean | null;
};

type Row = Record<string, unknown>;

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}
function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' ? v : fallback;
}
function asEnum<T extends readonly string[]>(v: unknown, allowed: T): T[number] | null {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T[number]) : null;
}

function rowToEval(r: Row): EvalRow {
  return {
    id: str(r.id),
    signalId: str(r.signal_id),
    headline: str(r.headline),
    summary: str(r.summary),
    source: str(r.source),
    url: str(r.url),
    lang: str(r.lang_at_sample),
    country: str(r.country_at_sample),
    score: num(r.score_at_sample),
    topLane: str(r.top_lane_at_sample),
    stratum: str(r.sample_stratum),
    draftQualityLabel: asEnum(r.draft_quality_label, QUALITY_LABELS),
    draftContentType: asEnum(r.draft_content_type, CONTENT_TYPES),
    draftImpact: asEnum(r.draft_impact, IMPACTS),
    draftReason: (r.draft_reason as string) ?? null,
    qualityLabel: asEnum(r.quality_label, QUALITY_LABELS),
    contentType: asEnum(r.content_type, CONTENT_TYPES),
    impact: asEnum(r.impact, IMPACTS),
    labelNotes: (r.label_notes as string) ?? null,
    labeledBy: (r.labeled_by as string) ?? null,
    labeledAt: (r.labeled_at as string) ?? null,
    labelStatus: (asEnum(r.label_status, [
      'unlabeled',
      'drafted',
      'confirmed',
      'corrected',
      'unlabelable',
    ]) ?? 'unlabeled') as LabelStatus,
    needsHuman: r.needs_human === true,
    structIsJunk: typeof r.struct_is_junk === 'boolean' ? r.struct_is_junk : null,
  };
}

/** All eval rows, ordered by stratum then signal id (stable). */
export async function listEvalRows(): Promise<AdminDataResult<EvalRow[]>> {
  const path =
    '/rest/v1/intel_eval_labeling' +
    '?select=*&order=sample_stratum.asc,signal_id.asc';
  const result = await fetchAdminSupabaseJson<Row[]>(path);
  if (!result.ok) return result;
  const rows = Array.isArray(result.data) ? result.data.map(rowToEval) : [];
  return { ok: true, data: rows, source: result.source };
}

export type SaveLabelInput = {
  signalId: string;
  qualityLabel: QualityLabel;
  contentType: ContentType;
  impact: Impact;
  notes?: string | null;
  labeledBy?: string;
  unlabelable?: boolean;
};

/** Persist a human label via the api.save_intel_eval_label RPC. */
export async function saveEvalLabel(input: SaveLabelInput): Promise<AdminDataResult<null>> {
  return fetchAdminSupabaseJsonMutation<null>('/rest/v1/rpc/save_intel_eval_label', 'POST', {
    p_signal_id: input.signalId,
    p_quality_label: input.qualityLabel,
    p_content_type: input.contentType,
    p_impact: input.impact,
    p_notes: input.notes ?? null,
    p_labeled_by: input.labeledBy ?? 'human:tyler',
    p_unlabelable: input.unlabelable ?? false,
  });
}

/** Progress + draft-vs-human agreement, computed on human-confirmed rows only. */
export function summarize(rows: EvalRow[]) {
  const total = rows.length;
  const humanDone = rows.filter(
    (r) => r.labelStatus === 'confirmed' || r.labelStatus === 'corrected',
  );
  const confirmed = rows.filter((r) => r.labelStatus === 'confirmed').length;
  const corrected = rows.filter((r) => r.labelStatus === 'corrected').length;
  const unlabelable = rows.filter((r) => r.labelStatus === 'unlabelable').length;
  const remaining = total - humanDone.length - unlabelable;
  const agreementPct =
    humanDone.length > 0 ? Math.round((confirmed / humanDone.length) * 100) : null;
  return { total, confirmed, corrected, unlabelable, remaining, agreementPct };
}
