import { getScopedSupabase } from '@/lib/queries/_shared';
import { requireRole } from '@/lib/auth';
import { scoreSignal } from '@/lib/services/signal-scoring';
import { linkSignalToCounterparty } from '@/lib/services/signal-linking';

export async function ingestSignal(input: any) {
  const { supabase, profile } = await getScopedSupabase();
  await requireRole(supabase, ['admin', 'analyst']);

  const score = scoreSignal(input);

  const payload = {
    ...input,
    score,
    workspace_id: profile.default_workspace_id,
  };

  const { data, error } = await supabase.from('signals').insert(payload).select().single();
  if (error) throw error;

  await linkSignalToCounterparty(data);

  return data;
}
