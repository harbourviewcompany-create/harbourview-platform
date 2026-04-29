import { NextResponse } from 'next/server'

type AgentKey = 'ChatGPT' | 'Claude' | 'Perplexity' | 'Gemini'

type DispatchRequest = {
  agent: AgentKey
  prompt: string
}

const providerEnv: Record<AgentKey, { key: string; model: string; label: string }> = {
  ChatGPT: { key: 'OPENAI_API_KEY', model: 'OPENAI_MODEL', label: 'OpenAI' },
  Claude: { key: 'ANTHROPIC_API_KEY', model: 'ANTHROPIC_MODEL', label: 'Anthropic' },
  Perplexity: { key: 'PERPLEXITY_API_KEY', model: 'PERPLEXITY_MODEL', label: 'Perplexity' },
  Gemini: { key: 'GEMINI_API_KEY', model: 'GEMINI_MODEL', label: 'Google Gemini' },
}

const defaultModels: Record<AgentKey, string> = {
  ChatGPT: 'gpt-5.5-thinking',
  Claude: 'claude-sonnet-4-5',
  Perplexity: 'sonar-pro',
  Gemini: 'gemini-2.5-pro',
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, output: '', blocker: message }, { status })
}

async function callOpenAI(prompt: string, apiKey: string, model: string) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, input: prompt }),
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data?.error?.message || 'OpenAI request failed')

  return data.output_text || JSON.stringify(data)
}

async function callClaude(prompt: string, apiKey: string, model: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data?.error?.message || 'Anthropic request failed')

  return data.content?.map((part: { text?: string }) => part.text || '').join('\n') || JSON.stringify(data)
}

async function callPerplexity(prompt: string, apiKey: string, model: string) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data?.error?.message || 'Perplexity request failed')

  return data.choices?.[0]?.message?.content || JSON.stringify(data)
}

async function callGemini(prompt: string, apiKey: string, model: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  )

  const data = await response.json()
  if (!response.ok) throw new Error(data?.error?.message || 'Gemini request failed')

  return data.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('\n') || JSON.stringify(data)
}

export async function POST(request: Request) {
  let body: DispatchRequest

  try {
    body = await request.json()
  } catch {
    return jsonError('Invalid JSON request body.')
  }

  const { agent, prompt } = body
  if (!agent || !providerEnv[agent]) return jsonError('Unsupported agent.')
  if (!prompt || prompt.trim().length < 20) return jsonError('Prompt is too short to dispatch safely.')

  const provider = providerEnv[agent]
  const apiKey = process.env[provider.key]
  const model = process.env[provider.model] || defaultModels[agent]

  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      output: '',
      blocker: `${provider.label} is not connected. Add ${provider.key} to the deployment environment to enable one-click dispatch for ${agent}.`,
      provider: provider.label,
      model,
      missingEnv: provider.key,
    })
  }

  try {
    const output =
      agent === 'ChatGPT'
        ? await callOpenAI(prompt, apiKey, model)
        : agent === 'Claude'
          ? await callClaude(prompt, apiKey, model)
          : agent === 'Perplexity'
            ? await callPerplexity(prompt, apiKey, model)
            : await callGemini(prompt, apiKey, model)

    return NextResponse.json({ ok: true, output, blocker: '', provider: provider.label, model })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown dispatch failure.'
    return NextResponse.json({ ok: false, output: '', blocker: message, provider: provider.label, model }, { status: 502 })
  }
}
