import type { GeminiOperation, GeminiProposalType, HubArtifact } from './types';

export function inferProposalType(operation: GeminiOperation): GeminiProposalType {
  const map: Record<GeminiOperation, GeminiProposalType> = {
    summarize_artifact: 'summary',
    classify_artifact: 'classification',
    extract_entities: 'entities',
    propose_routing: 'routing',
    generate_review_note: 'review_note',
  };
  return map[operation];
}

export function buildGeminiPrompt(operation: GeminiOperation, artifact: HubArtifact) {
  return `You are a controlled connector.\noutputAuthority = proposal_only\ncanonicalWritesAllowed = false\nexternalWritesAllowed = false\nhumanReviewRequired = true\nReturn strict JSON only.\nDo not assert facts beyond the artifact.\nMark uncertainty explicitly.\nDo not include secrets or credentials.\nOperation: ${operation}\nArtifact:\n${artifact.content}`;
}
