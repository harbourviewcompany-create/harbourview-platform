import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type Body = {
  model?: unknown
  input?: unknown
  temperature?: unknown
  max_output_tokens?: unknown
}

const endpoint = 'https://api.x.ai/v1/responses'
const defaultModel = 'grok-build-0.1'
const maxInputChars = 20000

function env(name: string) {
  return process.env[name]?.trim() || ''
}

function requireSecret(request: Request) {
  const secret = env('HARBOURVIEW_XAI_ROUTE_SECRET')
  if (!secret) throw new Error('xAI route secret not configured')

  const bearer = request.headers.get('authorization')
  const headerSecret = request.headers.get('x-harbourview-xai-secret')

  if (bearer === ['Bearer', secret].join(' ') || headerSecret === secret) return
  throw new Error('xAI route unauthorized')
}

function getProviderKey() {
  const key = env('XAI_API_KEY')
  if (!key) throw new Error('XAI_API_KEY is not configured')
  return key
}

function payload(body: Body) {
  const model = typeof body.model === 'string' && body.model.trim() ? body.model.trim() : defaultModel
  const input = typeof body.input === 'string' ? body.input.trim() : ''

  if (!input) throw new Error('Missing required string field: input')
  if (input.length > maxInputChars) throw new Error(`input exceeds ${maxInputChars} characters`)

  const temperature =
    typeof body.temperature === 'number' && Number.isFinite(body.temperature)
      ? Math.min(Math.max(body.temperature, 0), 2)
      : undefined

  const maxOutputTokens =
    typeof body.max_output_tokens === 'number' && Number.isFinite(body.max_output_tokens)
      ? Math.min(Math.max(Math.floor(body.max_output_tokens), 1), 8000)
      : undefined

  return {
    model,
    input,
    ...(temperature === undefined ? {} : { temperature }),
    ...(maxOutputTokens === undefined ? {} : { max_output_tokens: maxOutputTokens }),
  }
}

async function readResponse(response: Response) {
  const text = await response.text()
  try {
    return JSON.parse(text) as unknown
  } catch {
    return { raw: text }
  }
}

export async function POST(request: Request) {
  try {
    requireSecret(request)
    const providerKey = getProviderKey()
    const body = payload((await request.json()) as Body)

    const headers = new Headers()
    headers.set('Content-Type', 'application/json')
    headers.set('Authorization', ['Bearer', providerKey].join(' '))

    const upstream = await fetch(endpoint, {
      method: 'POST',
      cache: 'no-store',
      headers,
      body: JSON.stringify(body),
    })

    const data = await readResponse(upstream)

    return NextResponse.json(
      { ok: upstream.ok, provider: 'xai', model: body.model, data },
      { status: upstream.status },
    )
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'xAI request failed' },
      { status: 400 },
    )
  }
}
