// lib/signals/digestNarrative.ts
//
// Best-effort AI-generated executive summary for the daily signal digest
// email. Sits in front of buildSignalDigestHtml() — if generation is
// disabled/unconfigured/fails, callers should fall back to the existing
// list-only digest with no narrative paragraph. Never blocks sending.
//
// Server-only.
//
// Optimizations (2026-09):
// - Stronger commercial-operator framing and impact prioritization.
// - Slightly higher token budget for better synthesis when many signals.
// - Explicit handling of empty / low-signal days.
// - Clearer logging for observability.

import 'server-only'
import { executeLlmGateway } from '@/lib/llm/gateway'
import { LlmGatewayError } from '@/lib/llm/types'
import type { DigestSignal } from '@/lib/signals/notification'

const MAX_SIGNALS_IN_PROMPT = 12
const MAX_FIELD_CHARS = 420

function truncate(value: string): string {
  return value.length > MAX_FIELD_CHARS ? `${value.slice(0, MAX_FIELD_CHARS)}…` : value
}

function buildPrompt(signals: DigestSignal[]): string {
  const items = signals
    .slice(0, MAX_SIGNALS_IN_PROMPT)
    .map(
      (s, i) =>
        `${i + 1}. [${s.type} · ${s.market} · ${s.commercial_impact} impact] ${s.title} — ${truncate(s.summary)}`
    )
    .join('\n')

  return `You are writing the opening paragraph of a daily intelligence digest email for Harbourview, a B2B cannabis market intelligence platform. The recipient is a licensed cannabis operator, cultivator, or investor who cares about commercial impact, regulatory risk, supply, and market-entry timing.

Below are today's signals matching their subscription filters. Write a single short paragraph (2–4 sentences, plain prose, no markdown, no bullet points, no greeting/sign-off) that synthesizes the most commercially notable through-line or highest-impact development. Prioritize regulatory changes, supply disruptions, pricing signals, and corridor/market-entry developments over pure noise. If nothing is high-impact, say so plainly in one sentence.

Signals:
${items}

Write only the paragraph, nothing else.`
}

/**
 * Generates a short executive-summary paragraph for a digest email.
 * Returns null on any failure or when there are no signals — callers should
 * fall back to the existing list-only digest format.
 */
export async function generateDigestNarrative(signals: DigestSignal[]): Promise<string | null> {
  if (!signals.length) return null

  try {
    const result = await executeLlmGateway({
      provider: 'anthropic',
      messages: [{ role: 'user', content: buildPrompt(signals) }],
      temperature: 0.25,
      maxOutputTokens: 280,
    })
    const text = result.text?.trim()
    if (!text || text.length < 20) return null
    return text
  } catch (error) {
    if (error instanceof LlmGatewayError) {
      console.info(`digestNarrative: skipped (${error.code})`)
    } else {
      console.warn(
        'digestNarrative: unexpected error',
        error instanceof Error ? error.message : error
      )
    }
    return null
  }
}
