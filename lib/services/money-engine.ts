import { getScopedSupabase } from '@/lib/queries/_shared';

export async function evaluateSignalForOpportunity(signal: any) {
  const { supabase, profile } = await getScopedSupabase();

  const triggers = [];

  if (signal.score >= 70) {
    const { data: deal } = await supabase
      .from('deals')
      .insert({
        workspace_id: profile.default_workspace_id,
        title: signal.title,
        status: 'open',
        signal_id: signal.id,
        priority: 2,
      })
      .select()
      .single();

    triggers.push({
      workspace_id: profile.default_workspace_id,
      signal_id: signal.id,
      deal_id: deal?.id,
      trigger_type: 'auto_deal',
      priority: 2,
      reason: 'high_score',
    });
  }

  if (signal.score >= 60) {
    triggers.push({
      workspace_id: profile.default_workspace_id,
      signal_id: signal.id,
      trigger_type: 'outbound',
      priority: 2,
      reason: 'medium_score_outreach',
    });
  }

  if (signal.score < 40) {
    triggers.push({
      workspace_id: profile.default_workspace_id,
      signal_id: signal.id,
      trigger_type: 'review',
      priority: 4,
      reason: 'low_confidence',
    });
  }

  if (triggers.length) {
    await supabase.from('opportunity_triggers').insert(triggers);
  }
}
