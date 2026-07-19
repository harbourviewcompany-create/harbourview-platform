/**
 * Stage 0 (docs/INTELLIGENCE_ARCHITECTURE_SPEC.md) — client-safe constants and
 * types for the labeled evaluation set.
 *
 * This module has NO `server-only` marker and NO data-client import, so it is
 * safe to import from Client Components (e.g. EvalRowCard). The server-only data
 * layer (evalSet.ts) re-uses these; keep runtime/data logic out of this file.
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

export type SaveLabelInput = {
  signalId: string;
  qualityLabel: QualityLabel;
  contentType: ContentType;
  impact: Impact;
  notes?: string | null;
  labeledBy?: string;
  unlabelable?: boolean;
};
