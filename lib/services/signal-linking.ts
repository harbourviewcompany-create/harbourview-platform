import { getScopedSupabase } from '@/lib/queries/_shared';

export async function linkSignalToCounterparty(signal: any) {
  const { supabase, profile } = await getScopedSupabase();

  const name = signal.entity_name || signal.entity_org;
  if (!name) return null;

  const { data: existing } = await supabase
    .from('counterparties')
    .select('id')
    .eq('name', name)
    .eq('workspace_id', profile.default_workspace_id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('signals')
      .update({ linked_counterparty_id: existing.id })
      .eq('id', signal.id);
    return existing.id;
  }

  const { data: created } = await supabase
    .from('counterparties')
    .insert({
      name,
      type: 'operator',
      workspace_id: profile.default_workspace_id,
    })
    .select()
    .single();

  await supabase
    .from('signals')
    .update({ linked_counterparty_id: created.id })
    .eq('id', signal.id);

  return created.id;
}
