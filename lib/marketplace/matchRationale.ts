// lib/marketplace/matchRationale.ts
//
// Best-effort AI-generated explanation of *why* a listing and a buyer_request
// were matched, layered on top of the deterministic category+region match in
// matchEngine.ts. This never blocks or fails a match — if the gateway is
// disabled, unconfigured, or errors, the caller gets `null` and the match
// proceeds with only the existing templated internal_notes line.
//
// Server-only.

import 'server-only';
import { executeLlmGateway } from '@/lib/llm/gateway';
import { LlmGatewayError } from '@/lib/llm/types';

export interface MatchRationaleInput {
  listing: {
    title: string;
    description: string | null;
    category: string;
    region: string;
    high_level_specs?: unknown;
  };
  buyerRequest: {
    title: string;
    description: string | null;
    category: string;
    region: string;
    requirements?: unknown;
  };
}

export interface MatchRationaleResult {
  rationale: string;
  model: string;
}

const MAX_FIELD_CHARS = 1_200;

function truncate(value: string | null | undefined): string {
  if (!value) return '(no description provided)';
  return value.length > MAX_FIELD_CHARS ? `${value.slice(0, MAX_FIELD_CHARS)}…` : value;
}

function safeJson(value: unknown): string {
  if (!value) return '{}';
  try {
    const text = JSON.stringify(value);
    return text.length > MAX_FIELD_CHARS ? `${text.slice(0, MAX_FIELD_CHARS)}…` : text;
  } catch {
    return '{}';
  }
}

function buildPrompt(input: MatchRationaleInput): string {
  const { listing, buyerRequest } = input;
  return `You are a B2B cannabis marketplace analyst for Harbourview. Given a supplier listing and a buyer request that were matched on category + region, write a short, specific explanation of why this is (or isn't, if you have doubts) a strong commercial fit.

Rules:
- 2-3 sentences, plain prose, no markdown, no bullet points
- Reference concrete specifics from the listing/request text where possible (capacity, format, certifications, volume), not generic category language
- If the descriptions don't actually support a strong fit beyond category/region, say so plainly instead of inventing a connection
- Do not invent facts not present in the text below

LISTING
Title: ${listing.title}
Category: ${listing.category}
Region: ${listing.region}
Description: ${truncate(listing.description)}
Specs: ${safeJson(listing.high_level_specs)}

BUYER REQUEST
Title: ${buyerRequest.title}
Category: ${buyerRequest.category}
Region: ${buyerRequest.region}
Description: ${truncate(buyerRequest.description)}
Requirements: ${safeJson(buyerRequest.requirements)}

Write only the explanation, nothing else.`;
}

/**
 * Generates a short rationale for a listing/buyer_request match.
 * Returns null on any failure (disabled gateway, missing config, provider
 * error, timeout) — callers should treat this as optional enrichment.
 */
export async function generateMatchRationale(
  input: MatchRationaleInput,
): Promise<MatchRationaleResult | null> {
  try {
    const result = await executeLlmGateway({
      provider: 'anthropic',
      messages: [{ role: 'user', content: buildPrompt(input) }],
      temperature: 0.2,
      maxOutputTokens: 220,
    });
    return { rationale: result.text, model: result.model };
  } catch (error) {
    if (error instanceof LlmGatewayError) {
      console.info(`matchRationale: skipped (${error.code})`);
    } else {
      console.warn('matchRationale: unexpected error', error instanceof Error ? error.message : error);
    }
    return null;
  }
}
