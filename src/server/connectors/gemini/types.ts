export type GeminiOperation =
  | 'summarize_artifact'
  | 'classify_artifact'
  | 'extract_entities'
  | 'propose_routing'
  | 'generate_review_note';

export type GeminiProposalType = 'summary' | 'classification' | 'entities' | 'routing' | 'review_note';

export type HubArtifact = {
  id: string;
  sensitivity?: string | null;
  content: string;
  metadata?: Record<string, unknown> | null;
};

export type RedactionOutcome = {
  blocked: boolean;
  reason?: 'private_key_detected';
  redactedText: string;
  events: Array<{ type: string; count: number }>;
};

export type GeminiRunResult =
  | { status: 'blocked'; reason: 'disabled' | 'missing_key' | 'secret_artifact' | 'private_key_detected' }
  | { status: 'failed'; error: string }
  | {
      status: 'succeeded';
      proposalType: GeminiProposalType;
      proposal: Record<string, unknown>;
      redactionEvents: Array<{ type: string; count: number }>;
    };
