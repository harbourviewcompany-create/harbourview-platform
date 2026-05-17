import 'server-only';
import { getAdminDataClient } from '@/lib/supabase/adminDataClient';
import type { GeminiProposalType, GeminiRunResult, HubArtifact } from './types';

async function supabaseWrite(path: string, method: string, body?: unknown) {
  const client = getAdminDataClient();
  if (!client.ok) throw new Error(client.error.message);
  const res = await fetch(`${client.data.url}${path}`, {
    method,
    headers: { apikey: client.data.serviceRoleKey, Authorization: `Bearer ${client.data.serviceRoleKey}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Supabase write failed: ${res.status}`);
  const txt = await res.text();
  return txt ? JSON.parse(txt) : null;
}

export async function loadHubArtifactForGemini(artifactId: string): Promise<HubArtifact | null> {
  const rows = await supabaseWrite(`/rest/v1/hub_artifacts?id=eq.${encodeURIComponent(artifactId)}&select=id,content,sensitivity,metadata`, 'GET');
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}
export async function createGeminiProcessingRun(artifactId: string, operation: string) {
  const rows = await supabaseWrite('/rest/v1/hub_ai_processing_runs', 'POST', [{ artifact_id: artifactId, operation, connector_key: 'gemini', status: 'running' }]);
  return rows[0];
}
export async function finalizeGeminiProcessingRun(runId: string, result: GeminiRunResult) {
  await supabaseWrite(`/rest/v1/hub_ai_processing_runs?id=eq.${encodeURIComponent(runId)}`, 'PATCH', { status: result.status, result_payload: result });
}
export async function persistGeminiProposal(runId: string, artifactId: string, proposalType: GeminiProposalType, proposal: Record<string, unknown>) {
  await supabaseWrite('/rest/v1/hub_ai_proposals', 'POST', [{ run_id: runId, artifact_id: artifactId, proposal_type: proposalType, proposal_payload: proposal, status: 'pending_review' }]);
  if (proposalType === 'routing') {
    await supabaseWrite('/rest/v1/hub_routing_proposals', 'POST', [{ run_id: runId, artifact_id: artifactId, proposal_payload: proposal, status: 'pending_review', required_review: true }]);
  }
}
export async function persistGeminiRedactionEvents(runId: string, events: Array<{ type: string; count: number }>) {
  if (!events.length) return;
  await supabaseWrite('/rest/v1/hub_redaction_events', 'POST', events.map((event) => ({ run_id: runId, event_type: event.type, event_count: event.count })));
}
