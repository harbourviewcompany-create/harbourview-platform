'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';

const VALID_STATUSES = new Set([
  'proposed',
  'disclosure_requested',
  'disclosure_approved',
  'introduced',
  'closed_won',
  'closed_lost',
]);

function value(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed.length ? trimmed : null;
}

export async function updateDealAction(formData: FormData) {
  const id = value(formData, 'id');
  const status = value(formData, 'status');
  const successFeeAmount = value(formData, 'success_fee_amount');
  const successFeeCurrency = value(formData, 'success_fee_currency') ?? 'USD';
  const monetizationPath = value(formData, 'monetization_path');
  const introSummary = value(formData, 'intro_summary');

  const nextAction = value(formData, 'next_action');
  const nextActionDueAt = value(formData, 'next_action_due_at');
  const priority = value(formData, 'priority');
  const ownerName = value(formData, 'owner_name');

  if (!id) throw new Error('Missing deal id');
  if (status && !VALID_STATUSES.has(status)) throw new Error('Invalid deal status');

  const update: Record<string, unknown> = {};

  if (status) {
    update.status = status;
    if (status === 'introduced') update.introduced_at = new Date().toISOString();
    if (status === 'closed_won' || status === 'closed_lost') update.closed_at = new Date().toISOString();
  }

  update.success_fee_amount = successFeeAmount ? Number(successFeeAmount) : null;
  update.success_fee_currency = successFeeCurrency.toUpperCase();
  update.monetization_path = monetizationPath;
  update.intro_summary = introSummary;

  update.next_action = nextAction;
  update.next_action_due_at = nextActionDueAt ? new Date(nextActionDueAt).toISOString() : null;
  update.priority = priority || 'normal';
  update.owner_name = ownerName;
  update.last_touch_at = new Date().toISOString();

  update.updated_at = new Date().toISOString();

  const supabase = createAdminClient();
  const { error } = await supabase.from('matches').update(update).eq('id', id);
  if (error) throw new Error(error.message);

  await supabase.from('audit_events').insert({
    entity_type: 'match',
    entity_id: id,
    action: 'deal_updated',
    actor: 'admin_dashboard',
    metadata: update,
  });

  revalidatePath('/admin/matches');
}

export async function addDealNoteAction(formData: FormData) {
  const id = value(formData, 'id');
  const note = value(formData, 'note');

  if (!id) throw new Error('Missing deal id');
  if (!note) throw new Error('Missing note');

  const supabase = createAdminClient();

  const { error } = await supabase.from('internal_admin_notes').insert({
    entity_type: 'match',
    entity_id: id,
    note,
    created_by: 'admin_dashboard',
  });

  if (error) throw new Error(error.message);

  await supabase.from('audit_events').insert({
    entity_type: 'match',
    entity_id: id,
    action: 'deal_note_added',
    actor: 'admin_dashboard',
    metadata: { note_length: note.length },
  });

  revalidatePath('/admin/matches');
}
