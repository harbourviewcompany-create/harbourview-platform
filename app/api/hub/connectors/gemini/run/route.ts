import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { runGeminiConnector } from '@/src/server/connectors/gemini/client';
import { createGeminiProcessingRun, finalizeGeminiProcessingRun, loadHubArtifactForGemini, persistGeminiProposal, persistGeminiRedactionEvents } from '@/src/server/connectors/gemini/persistence';
import type { GeminiOperation } from '@/src/server/connectors/gemini/types';

const allowed: GeminiOperation[] = ['summarize_artifact', 'classify_artifact', 'extract_entities', 'propose_routing', 'generate_review_note'];

export async function POST(request: Request) {
  await requireAdminAuth();
  const body = await request.json();
  if (!body?.artifactId || !allowed.includes(body.operation)) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  const artifact = await loadHubArtifactForGemini(body.artifactId);
  if (!artifact) return NextResponse.json({ error: 'artifact_not_found' }, { status: 404 });
  const run = await createGeminiProcessingRun(artifact.id, body.operation);
  const result = await runGeminiConnector({ artifact, operation: body.operation });
  await persistGeminiRedactionEvents(run.id, result.status === 'succeeded' ? result.redactionEvents : []);
  if (result.status === 'succeeded') await persistGeminiProposal(run.id, artifact.id, result.proposalType, result.proposal);
  await finalizeGeminiProcessingRun(run.id, result);
  return NextResponse.json({ runId: run.id, result });
}
