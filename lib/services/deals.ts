import { getScopedSupabase } from '@/lib/queries/_shared';
import { requireRole } from '@/lib/auth';
import { DealSchema, DealTransitionSchema } from '@/lib/domain/market.validators';

async function audit(supabase: any, workspace_id: string, entity_type: string, entity_id: string, action: string, payload: any) {
  await supabase.from('market_audit_events').insert({ workspace_id, entity_type, entity_id, action, payload });
}

export async function createDeal(input: any) {
  const parsed = DealSchema.safeParse(input);
  if (!parsed.success) throw new Error('invalid deal input');

  const { supabase, profile } = await getScopedSupabase();
  await requireRole(supabase, ['admin', 'analyst']);

  const payload = {
    ...parsed.data,
    workspace_id: profile.default_workspace_id,
  };

  const { data, error } = await supabase.from('deals').insert(payload).select().single();
  if (error) throw error;

  await audit(supabase, profile.default_workspace_id, 'deal', data.id, 'create', payload);
  return data;
}

export async function transitionDeal(id: string, input: any) {
  const parsed = DealTransitionSchema.safeParse(input);
  if (!parsed.success) throw new Error('invalid transition');

  const { supabase, profile } = await getScopedSupabase();
  await requireRole(supabase, ['admin', 'analyst']);

  const { data: existing } = await supabase
    .from('deals')
    .select('status, workspace_id')
    .eq('id', id)
    .single();

  if (existing.workspace_id !== profile.default_workspace_id) {
    throw new Error('cross-tenant access denied');
  }

  const allowed: Record<string, string[]> = {
    open: ['qualified', 'lost', 'archived'],
    qualified: ['negotiation', 'lost', 'archived'],
    negotiation: ['closed', 'lost', 'archived'],
    closed: [],
    lost: [],
    archived: [],
  };

  if (!allowed[existing.status]?.includes(parsed.data.status)) {
    throw new Error('invalid transition');
  }

  const { data, error } = await supabase
    .from('deals')
    .update({ status: parsed.data.status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await audit(supabase, profile.default_workspace_id, 'deal', id, 'transition', parsed.data);
  return data;
}
