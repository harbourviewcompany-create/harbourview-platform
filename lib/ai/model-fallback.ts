// lib/ai/model-fallback.ts
// Unified model fallback chain for all AI operations.
// Primary: Claude Sonnet → Fallback 1: Gemini 2.5 Flash → Fallback 2: HF Qwen

import { structuredLog } from '@/lib/observability/structuredLog'

export interface ModelConfig {
  name: string
  endpoint: string
  apiKey: string | undefined
  headers: Record<string, string>
  buildBody: (prompt: string) => unknown
  extractText: (response: unknown) => string
}

function createClaudeConfig(): ModelConfig {
  return {
    name: 'claude-sonnet-4-6',
    endpoint: 'https://api.anthropic.com/v1/messages',
    apiKey: process.env.ANTHROPIC_API_KEY,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    buildBody: (prompt) => ({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
    extractText: (response: unknown) => {
      const r = response as { content?: Array<{ text?: string }> }
      return r.content?.[0]?.text ?? ''
    },
  }
}

function createGeminiConfig(): ModelConfig {
  return {
    name: 'gemini-2.5-flash',
    endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY ?? ''}`,
    apiKey: process.env.GEMINI_API_KEY,
    headers: { 'Content-Type': 'application/json' },
    buildBody: (prompt) => ({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }),
    extractText: (response: unknown) => {
      const r = response as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
      return r.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    },
  }
}

function createHFConfig(): ModelConfig {
  return {
    name: 'hf-qwen3-4b',
    endpoint: process.env.HF_ENDPOINT_EXTRACT_QWEN3_4B ?? '',
    apiKey: process.env.HF_TOKEN_SERVER,
    headers: {
      Authorization: `Bearer ${process.env.HF_TOKEN_SERVER ?? ''}`,
      'Content-Type': 'application/json',
    },
    buildBody: (prompt) => ({
      inputs: prompt,
      parameters: { max_new_tokens: 2048, return_full_text: false },
    }),
    extractText: (response: unknown) => {
      const r = response as Array<{ generated_text?: string }>
      return r[0]?.generated_text ?? ''
    },
  }
}

/** Execute a prompt through the fallback chain */
export async function executeWithFallback<T>(
  prompt: string,
  parseFn: (text: string) => T,
): Promise<{ result: T; model: string; latencyMs: number }> {
  const configs = [createClaudeConfig(), createGeminiConfig(), createHFConfig()]
  const start = Date.now()

  for (const config of configs) {
    if (!config.apiKey) {
      structuredLog('ai.fallback.skip', { model: config.name, reason: 'no_api_key' }, 'warn')
      continue
    }

    const modelStart = Date.now()
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: config.headers,
        body: JSON.stringify(config.buildBody(prompt)),
      })

      if (!response.ok) {
        const text = await response.text()
        structuredLog('ai.fallback.error', {
          model: config.name,
          status: response.status,
          error: text.slice(0, 200),
        }, 'warn')
        continue
      }

      const data = await response.json()
      const text = config.extractText(data)
      const result = parseFn(text)

      structuredLog('ai.fallback.success', {
        model: config.name,
        latencyMs: Date.now() - modelStart,
      })

      return { result, model: config.name, latencyMs: Date.now() - start }
    } catch (err) {
      structuredLog('ai.fallback.exception', {
        model: config.name,
        error: err instanceof Error ? err.message : String(err),
      }, 'warn')
    }
  }

  throw new Error('All AI models in fallback chain failed')
}
