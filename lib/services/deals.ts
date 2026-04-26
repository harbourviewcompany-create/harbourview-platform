import { getScopedSupabase } from '@/lib/queries/_shared';
import { requireRole } from '@/lib/auth';
import { DealSchema, DealTransitionSchema } from '@/lib/domain/market.validators';

async function audit(supabase: any, entity_type: string, entity_id: string, action: string, payload: any) {
  await supabase.from('market_audit_events').insert({ entity_type, entity_id, action, payload });
}

export async function createDeal(input: any) {
  const parsed = DealSchema.safeParse(input);
  if (!parsed.success) throw new Error('invalid deal input');

  const { supabase } = await getScopedSupabase();
  await requireRole(supabase, ['admin', 'analyst']);

  const { data, error } = await supabase.from('deals').insert(parsed.data).select().single();
  if (error) throw error;

  await audit(supabase, 'deal', data.id, 'create', parsed.data);
  return data;
}

export async function transitionDeal(id: string, input: any) {
  const parsed = DealTransitionSchema.safeParse(input);
  if (!parsed.success) throw new Error('invalid transition');

  const { supabase } = await getScopedSupabase();
  await requireRole(supabase, ['admin', 'analyst']);

  const { data: existing } = await supabase.from('deals').select('status').eq('id', id).single();

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

  await audit(supabase, 'deal', id, 'transition', parsed.data);
  return data;
}
