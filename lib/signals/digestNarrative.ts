// lib/signals/digestNarrative.ts
//
// Best-effort AI-generated executive summary for the daily signal digest
// email. Sits in front of buildSignalDigestHtml() — if generation is
// disabled/unconfigured/fails, callers should fall back to the existing
// list-only digest with no narrative paragraph. Never blocks sending.
//
// Server-only.

import 'server-only';
import { executeLlmGateway } from '@/lib/llm/gateway';
import { LlmGatewayError } from '@/lib/llm/types';
import type { DigestSignal } from '@/lib/signals/notification';

const MAX_SIGNALS_IN_PROMPT = 10;
const MAX_FIELD_CHARS = 400;

function truncate(value: string): string {
  return value.length > MAX_FIELD_CHARS ? `${value.slice(0, MAX_FIELD_CHARS)}…` : value;
}

function buildPrompt(signals: DigestSignal[]): string {
  const items = signals.slice(0, MAX_SIGNALS_IN_PROMPT).map((s, i) =>
    `${i + 1}. [${s.type} · ${s.market} · ${s.commercial_impact} impact] ${s.title} — ${truncate(s.summary)}`
  ).join('\n');

  return `You are writing the opening paragraph of a daily intelligence digest email for Harbourview, a B2B cannabis market intelligence platform. The recipient is a licensed cannabis operator or investor.

Below are today's signals matching their subscription filters. Write a single short paragraph (2-3 sentences, plain prose, no markdown, no bullet points, no greeting/sign-off) that synthesizes what's actually notable across these signals for a commercial operator — the throughline or highest-impact item, not a recap of every line item.

Signals:
${items}

Write only the paragraph, nothing else.`;
}

/**
 * Generates a short executive-summary paragraph for a digest email.
 * Returns null on any failure or when there are no signals — callers should
 * fall back to the existing list-only digest format.
 */
export async function generateDigestNarrative(signals: DigestSignal[]): Promise<string | null> {
  if (!signals.length) return null;

  try {
    const result = await executeLlmGateway({
      provider: 'anthropic',
      messages: [{ role: 'user', content: buildPrompt(signals) }],
      temperature: 0.3,
      maxOutputTokens: 200,
    });
    return result.text;
  } catch (error) {
    if (error instanceof LlmGatewayError) {
      console.info(`digestNarrative: skipped (${error.code})`);
    } else {
      console.warn('digestNarrative: unexpected error', error instanceof Error ? error.message : error);
    }
    return null;
  }
}
