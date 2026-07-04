import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const rateLimit = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT    = 10
const RATE_WINDOW_MS = 60 * 1000

type Body = {
  query?: unknown
}

type RpcRow = {
  source_id:  string
  name:       string
  category:   string
  markets:    string[]
  reliability: string
  similarity: number
}

export async function POST(request: Request) {
  try {
    const openaiKey   = process.env.OPENAI_API_KEY?.trim()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

    if (!openaiKey || !supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Search service not configured' }, { status: 503 })
    }

    const ip  = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const now = Date.now()
    const rl  = rateLimit.get(ip)
    if (rl && rl.resetAt > now) {
      if (rl.count >= RATE_LIMIT) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
      }
      rl.count++
    } else {
      rateLimit.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    }

    const body  = (await request.json()) as Body
    const query = typeof body.query === 'string' ? body.query.trim() : ''
    if (!query)             return NextResponse.json({ error: 'Missing query' }, { status: 400 })
    if (query.length > 500) return NextResponse.json({ error: 'Query too long' }, { status: 400 })

    // Embed with OpenAI text-embedding-3-small (1536-dim, matches ia_source_embeddings)
    const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: query }),
    })
    if (!embedRes.ok) {
      console.error('[source-search] OpenAI embed failed', embedRes.status)
      return NextResponse.json({ results: [] })
    }
    const embedData = await embedRes.json() as { data?: { embedding: number[] }[] }
    const embedding = embedData.data?.[0]?.embedding
    if (!embedding?.length) {
      return NextResponse.json({ results: [] })
    }

    // Semantic search via ia_search_sources RPC
    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/ia_search_sources`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':         supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ p_query_embedding: embedding, p_match_count: 30 }),
    })
    if (!rpcRes.ok) {
      console.error('[source-search] RPC failed', rpcRes.status, await rpcRes.text())
      return NextResponse.json({ results: [] })
    }

    const results: RpcRow[] = await rpcRes.json()
    return NextResponse.json({ results })
  } catch (error) {
    console.error('[source-search route]', error)
    return NextResponse.json({ results: [] })
  }
}
