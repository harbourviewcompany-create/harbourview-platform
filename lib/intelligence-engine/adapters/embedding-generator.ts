// lib/intelligence-engine/adapters/embedding-generator.ts
// Free-tier embedding generation via HF Serverless Inference API.
//
// Default model: sentence-transformers/all-MiniLM-L6-v2 (384-dim)
//   — free with any HF read token (HF_TOKEN_SERVER), no dedicated endpoint needed.
//   — writes into hv_embeddings.embedding_384, which already has an HNSW index
//     and is wired into public.hv_search_artifacts() as the "Branch 3" fallback.
//
// Upgrade path (when revenue allows):
//   Provision HF_ENDPOINT_EMBED_BGE_M3 (dedicated inference endpoint) →
//   switches to BGE-M3 1024-dim. hv_search_artifacts() already prefers the
//   1024-dim branch over 384-dim, so no search-side changes are needed later.
//
// Rate limit: HF free-tier serverless inference is approximately 300 req/hr
// per token — comfortably within daily batch volumes used by embed-artifacts cron.

import 'server-only'

const HF_SERVERLESS_BASE = 'https://api-inference.huggingface.co/models'
const FREE_MODEL = 'sentence-transformers/all-MiniLM-L6-v2' // 384-dim
const FREE_DIMS = 384
const UPGRADE_DIMS = 1024

const MODEL_LOADING_WAIT_MS = 20_000
const REQUEST_TIMEOUT_MS = 30_000

export class EmbeddingGenerator {
  private readonly endpointUrl: string
  private readonly token: string
  readonly dims: number
  readonly modelId: string

  constructor() {
    this.token = process.env.HF_TOKEN_SERVER ?? ''

    const dedicated = process.env.HF_ENDPOINT_EMBED_BGE_M3?.trim()
    if (dedicated) {
      this.endpointUrl = dedicated
      this.dims = UPGRADE_DIMS
      this.modelId = 'BAAI/bge-m3'
    } else {
      this.endpointUrl = `${HF_SERVERLESS_BASE}/${FREE_MODEL}`
      this.dims = FREE_DIMS
      this.modelId = FREE_MODEL
    }
  }

  get isConfigured(): boolean {
    return Boolean(this.token)
  }

  /**
   * Embed a batch of strings (max ~8 per HF serverless request for reliability).
   * Returns one vector per input string, in the same order.
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.token) throw new Error('[embed] HF_TOKEN_SERVER not set')
    if (texts.length === 0) return []

    const response = await fetch(this.endpointUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: texts, options: { wait_for_model: true } }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    // Cold start — HF returns 503 with an estimated_time while the model loads.
    if (response.status === 503) {
      console.info('[embed] HF model loading, waiting 20s before retry...')
      await new Promise((r) => setTimeout(r, MODEL_LOADING_WAIT_MS))
      return this.embedBatch(texts)
    }

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`[embed] HF API ${response.status}: ${body.slice(0, 200)}`)
    }

    const data = (await response.json()) as number[][] | number[]

    // Single string → flat array; batch → 2-D array. Normalize to 2-D.
    if (texts.length === 1 && typeof data[0] === 'number') {
      return [data as number[]]
    }
    return data as number[][]
  }

  /** Embed a single string. */
  async embed(text: string): Promise<number[]> {
    const batch = await this.embedBatch([text])
    return batch[0]
  }

  /**
   * Chunk text into pieces of ≤ maxChars characters on word boundaries.
   * Used before calling embedBatch to stay within model context limits.
   */
  static chunkText(text: string, maxChars = 1500): string[] {
    if (text.length <= maxChars) return [text]

    const chunks: string[] = []
    const words = text.split(/\s+/).filter(Boolean)
    let current = ''

    for (const word of words) {
      if (current.length + word.length + 1 > maxChars) {
        if (current) chunks.push(current.trim())
        current = word
      } else {
        current = current ? `${current} ${word}` : word
      }
    }
    if (current) chunks.push(current.trim())

    return chunks.length ? chunks : [text.slice(0, maxChars)]
  }
}
