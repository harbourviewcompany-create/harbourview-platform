import 'server-only';
import { GoogleGenAI } from '@google/genai';
import { buildGeminiPrompt, inferProposalType } from './prompts';
import { redactErrorMessage, redactOrBlockSecrets } from './redaction';
import { getGeminiConnectorConfig } from './status';
import type { GeminiOperation, GeminiRunResult, HubArtifact } from './types';

export async function runGeminiConnector({ artifact, operation }: { artifact: HubArtifact; operation: GeminiOperation }): Promise<GeminiRunResult> {
  const cfg = getGeminiConnectorConfig();
  if (!cfg.enabled) return { status: 'blocked', reason: 'disabled' };
  if (!cfg.apiKeyPresent) return { status: 'blocked', reason: 'missing_key' };
  if (artifact.sensitivity === 'secret') return { status: 'blocked', reason: 'secret_artifact' };

  const redaction = redactOrBlockSecrets(artifact.content.slice(0, Number(process.env.GEMINI_MAX_INPUT_CHARS || 60000)));
  if (redaction.blocked) return { status: 'blocked', reason: 'private_key_detected' };

  try {
    const ai = new GoogleGenAI({});
    const response = await ai.models.generateContent({
      model: cfg.model,
      contents: buildGeminiPrompt(operation, { ...artifact, content: redaction.redactedText }),
    });
    const text = response.text ?? '';
    let proposal: Record<string, unknown>;
    let proposalType = inferProposalType(operation);
    try {
      proposal = JSON.parse(text);
    } catch {
      proposalType = 'review_note';
      proposal = { confidence: 'low', note: text.slice(0, 2000), reason: 'non_json_model_output' };
    }
    return { status: 'succeeded', proposalType, proposal, redactionEvents: redaction.events };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Gemini error';
    return { status: 'failed', error: redactErrorMessage(message) };
  }
}
