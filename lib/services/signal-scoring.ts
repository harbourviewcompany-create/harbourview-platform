export type SignalScoringInput = {
  title?: string | null;
  summary?: string | null;
  source_url?: string | null;
  jurisdiction?: string | null;
  confidence_level?: string | null;
  evidence_count?: number | null;
  human_evidence_count?: number | null;
};

export function scoreSignal(input: SignalScoringInput): number {
  let score = 0;
  const text = `${input.title ?? ''} ${input.summary ?? ''}`.toLowerCase();

  if (input.source_url) score += 10;
  if (input.jurisdiction) score += 10;
  if ((input.evidence_count ?? 0) > 0) score += Math.min(20, (input.evidence_count ?? 0) * 5);
  if ((input.human_evidence_count ?? 0) > 0) score += Math.min(25, (input.human_evidence_count ?? 0) * 10);

  if (input.confidence_level === 'high') score += 25;
  if (input.confidence_level === 'medium') score += 15;
  if (input.confidence_level === 'low') score += 5;

  const commercialTerms = ['buyer', 'supply', 'import', 'export', 'license', 'pharmacy', 'distribution', 'tender', 'shortage', 'facility', 'equipment', 'inventory'];
  for (const term of commercialTerms) {
    if (text.includes(term)) score += 3;
  }

  return Math.max(0, Math.min(100, score));
}
