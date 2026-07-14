'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import {
  saveEvalLabel,
  QUALITY_LABELS,
  CONTENT_TYPES,
  IMPACTS,
  type QualityLabel,
  type ContentType,
  type Impact,
} from '@/lib/intelligence-automation/evalSet';

export type SaveActionState = { ok: boolean; message?: string };

/**
 * Stage 0 labeling action. Records the operator's human label for one eval row.
 * label_status (confirmed vs corrected) is derived server-side in the RPC by
 * comparing to the assistant draft — the client never sets it.
 */
export async function saveLabelAction(
  _prev: SaveActionState,
  formData: FormData,
): Promise<SaveActionState> {
  await requireAdminAuth();

  const signalId = String(formData.get('signalId') ?? '');
  const unlabelable = formData.get('unlabelable') === 'true';

  if (!signalId) return { ok: false, message: 'Missing signal id.' };

  // "Unlabelable" (dead link / empty body) skips the label validation.
  if (unlabelable) {
    const res = await saveEvalLabel({
      signalId,
      // values below are ignored by the RPC when unlabelable=true
      qualityLabel: 'spam',
      contentType: 'noise',
      impact: 'low',
      notes: str(formData.get('notes')),
      unlabelable: true,
    });
    if (!res.ok) return { ok: false, message: res.error.message };
    revalidatePath('/admin/intel-eval');
    return { ok: true, message: 'Marked unlabelable.' };
  }

  const qualityLabel = String(formData.get('qualityLabel') ?? '');
  const contentType = String(formData.get('contentType') ?? '');
  const impact = String(formData.get('impact') ?? '');

  if (!(QUALITY_LABELS as readonly string[]).includes(qualityLabel)) {
    return { ok: false, message: `Invalid quality_label: ${qualityLabel}` };
  }
  if (!(CONTENT_TYPES as readonly string[]).includes(contentType)) {
    return { ok: false, message: `Invalid content_type: ${contentType}` };
  }
  if (!(IMPACTS as readonly string[]).includes(impact)) {
    return { ok: false, message: `Invalid impact: ${impact}` };
  }

  const res = await saveEvalLabel({
    signalId,
    qualityLabel: qualityLabel as QualityLabel,
    contentType: contentType as ContentType,
    impact: impact as Impact,
    notes: str(formData.get('notes')),
  });

  if (!res.ok) return { ok: false, message: res.error.message };

  revalidatePath('/admin/intel-eval');
  return { ok: true, message: 'Saved.' };
}

function str(v: FormDataEntryValue | null): string | null {
  const s = typeof v === 'string' ? v.trim() : '';
  return s.length ? s : null;
}
