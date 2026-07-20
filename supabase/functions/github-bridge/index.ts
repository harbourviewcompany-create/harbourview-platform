/**
 * github-bridge v6 — added get_blob (raw base64, no lossy decode) (2026-07-11)
 *
 * SECURITY HISTORY — read before changing:
 *   v4 shipped with `verify_jwt=false` and NO caller authentication of any kind.
 *   Because this function holds a server-side, admin-scoped GITHUB_PAT
 *   (admin:org, admin:enterprise, delete_repo), anyone on the public internet
 *   who knew the function URL could POST {"operation":"push_file", ...} and
 *   commit arbitrary content to any path on any branch of this repo. The vault
 *   secret `hv_github_bridge_caller_secret` was created 2026-07-06 to close
 *   exactly this hole; the deployed function then regressed to a build with the
 *   check missing entirely.
 *
 *   Two controls are now in place. DO NOT remove either:
 *     1. verify_jwt=true      — gateway rejects callers with no project JWT.
 *     2. x-hv-bridge-key      — shared secret, checked below.
 *
 *   This function deliberately does NOT hold a copy of the bridge key. It calls
 *   api.hv_bridge_key_matches() (service-role-only, SECURITY DEFINER) which
 *   digest-compares the candidate against the vault secret and returns only a
 *   boolean. The secret never leaves Postgres, and this function cannot leak it.
 *
 *   The old `x-github-token` request-header fallback has been removed: it let a
 *   caller supply their own token, which served no purpose here and widened the
 *   surface. The PAT comes from the environment only.
 *
 * ENCODING BUG FOUND 2026-07-11 — read before touching get_file:
 *   `get_file` decodes GitHub's base64 content with `atob()`, which treats each
 *   decoded byte as one UTF-16 code unit rather than reassembling multi-byte
 *   UTF-8 sequences. Any non-ASCII character (em-dashes, curly quotes, emoji)
 *   comes back mangled ("—" becomes "Ã¢ÂÂ" once round-tripped through JSON).
 *   This corrupted at least one production doc (HANDOFF.md) when an agent used
 *   get_file's output as the basis for an edit-and-push-back. `get_file` is left
 *   as-is for now (existing callers may depend on its current, imperfect
 *   behavior) but callers doing edit-and-push-back on any file with non-ASCII
 *   content should use `get_blob` instead, decode the base64 themselves with a
 *   real UTF-8-aware decoder (e.g. Postgres `convert_from(decode(b64,
 *   'base64'), 'UTF8')`), edit that, and push back through `push_file`.
 */

const OWNER = 'harbourviewcompany-create'
const REPO = 'harbourview-platform'
const BASE = `https://api.github.com/repos/${OWNER}/${REPO}`

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

/**
 * Verify the caller-supplied bridge key against the vault secret.
 * Fails closed on any error — a broken verifier must never mean "allow".
 */
async function callerKeyIsValid(req: Request): Promise<boolean> {
  const candidate = req.headers.get('x-hv-bridge-key')
  if (!candidate) return false
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('[github-bridge] missing SUPABASE_URL / SERVICE_ROLE_KEY; refusing request')
    return false
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/hv_bridge_key_matches`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Profile': 'api',
      },
      body: JSON.stringify({ candidate }),
    })
    if (!res.ok) {
      console.error(`[github-bridge] key verifier returned ${res.status}`)
      return false
    }
    return (await res.json()) === true
  } catch (e) {
    console.error('[github-bridge] key verifier threw:', e)
    return false
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return json(null, 204)
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  if (!(await callerKeyIsValid(req))) {
    // Deliberately vague: do not tell an unauthenticated caller whether the
    // header was missing, malformed, or simply wrong.
    return json({ error: 'Unauthorized' }, 401)
  }

  const token = Deno.env.get('GITHUB_PAT')
  if (!token) return json({ error: 'No GitHub token. Set GITHUB_PAT secret.' }, 500)

  const h: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'harbourview-bridge/6',
    'Content-Type': 'application/json',
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

  try { return json(await dispatch(body, h)) }
  catch (e) { return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500) }
})

async function dispatch(op: Record<string, unknown>, h: Record<string, string>): Promise<unknown> {
  switch (op.operation) {

    case 'list_prs': {
      const state = (op.state as string) ?? 'open'
      const per_page = Math.min((op.per_page as number) ?? 25, 100)
      const data = await gh(`${BASE}/pulls?state=${state}&per_page=${per_page}&sort=updated&direction=desc`, h)
      return { ok: true, count: data.length, prs: data.map(slimPr) }
    }

    case 'get_pr': {
      return { ok: true, pr: await gh(`${BASE}/pulls/${op.pr_number}`, h) }
    }

    case 'create_pr': {
      const res = await fetch(`${BASE}/pulls`, {
        method: 'POST', headers: h,
        body: JSON.stringify({
          title: op.title,
          head: op.head,
          base: (op.base as string) ?? 'main',
          body: op.body,
          draft: op.draft ?? false,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(`GitHub POST pulls ${res.status}: ${JSON.stringify(data)}`)
      return { ok: true, pr: slimPr(data) }
    }

    case 'get_file': {
      const ref = op.ref ? `?ref=${encodeURIComponent(op.ref as string)}` : ''
      const data = await gh(`${BASE}/contents/${op.path}${ref}`, h)
      if (data.type !== 'file') return { ok: false, error: 'Not a file', type: data.type }
      return { ok: true, content: atob((data.content as string).replace(/\n/g, '')), sha: data.sha, path: data.path }
    }

    case 'get_file_sha': {
      const ref = op.ref ? `?ref=${encodeURIComponent(op.ref as string)}` : ''
      const data = await gh(`${BASE}/contents/${op.path}${ref}`, h)
      return { ok: true, sha: data.sha, path: data.path, size: data.size }
    }

    // Returns the file's raw base64 content (untouched, straight from GitHub),
    // plus its sha, without running it through get_file's lossy atob() decode.
    // Callers should decode with a proper UTF-8-aware decoder on their side.
    case 'get_file_raw': {
      const ref = op.ref ? `?ref=${encodeURIComponent(op.ref as string)}` : ''
      const data = await gh(`${BASE}/contents/${op.path}${ref}`, h)
      if (data.type !== 'file') return { ok: false, error: 'Not a file', type: data.type }
      return { ok: true, content_base64: (data.content as string).replace(/\n/g, ''), sha: data.sha, path: data.path }
    }

    // Fetch a git blob directly by its sha (works regardless of which commit /
    // branch currently points at it — useful for recovering a pre-edit version
    // of a file). Returns raw base64, same rationale as get_file_raw.
    case 'get_blob': {
      const data = await gh(`${BASE}/git/blobs/${op.sha}`, h)
      return { ok: true, content_base64: (data.content as string).replace(/\n/g, ''), sha: data.sha, size: data.size }
    }

    case 'get_tree': {
      const ref = (op.ref as string) ?? 'main'
      const data = await gh(`${BASE}/git/trees/${encodeURIComponent(ref)}?recursive=1`, h)
      return {
        ok: true, sha: data.sha, truncated: data.truncated,
        tree: (data.tree as Record<string, unknown>[]).map(n => ({ path: n.path, type: n.type, size: n.size, sha: n.sha }))
      }
    }

    case 'get_pr_files': {
      const data = await gh(`${BASE}/pulls/${op.pr_number}/files?per_page=100`, h)
      return {
        ok: true, count: data.length,
        files: (data as Record<string, unknown>[]).map(f => ({
          filename: f.filename, status: f.status,
          additions: f.additions, deletions: f.deletions, changes: f.changes, patch: f.patch
        }))
      }
    }

    case 'get_pr_diff': {
      const res = await fetch(`${BASE}/pulls/${op.pr_number}`, { headers: { ...h, 'Accept': 'application/vnd.github.diff' } })
      if (!res.ok) throw new Error(`GitHub diff ${res.status}: ${await res.text()}`)
      return { ok: true, diff: await res.text() }
    }

    case 'list_check_runs': {
      const data = await gh(`${BASE}/commits/${encodeURIComponent(op.ref as string)}/check-runs?per_page=100`, h)
      return {
        ok: true, total: data.total_count,
        runs: ((data.check_runs ?? []) as Record<string, unknown>[]).map(r => ({
          id: r.id, name: r.name, status: r.status, conclusion: r.conclusion,
          started_at: r.started_at, completed_at: r.completed_at, html_url: r.html_url
        }))
      }
    }

    case 'push_file': {
      const putBody: Record<string, unknown> = { message: op.message, content: op.content, branch: op.branch ?? 'main' }
      if (op.sha) putBody.sha = op.sha
      const res = await fetch(`${BASE}/contents/${op.path}`, { method: 'PUT', headers: h, body: JSON.stringify(putBody) })
      const result = await res.json()
      if (!res.ok) throw new Error(`GitHub PUT ${res.status}: ${JSON.stringify(result)}`)
      return { ok: true, sha: result.content?.sha, html_url: result.content?.html_url, commit: result.commit?.sha }
    }

    case 'batch': {
      const ops = op.ops as Record<string, unknown>[]
      if (!Array.isArray(ops) || ops.length > 8) return { ok: false, error: 'batch.ops must be 1-8 operations' }
      const results = await Promise.allSettled(ops.map(o => dispatch(o, h)))
      return {
        ok: true,
        results: results.map(r =>
          r.status === 'fulfilled' ? { ok: true, data: r.value } : { ok: false, error: (r.reason as Error)?.message ?? String(r.reason) }
        )
      }
    }

    default: return { error: `Unknown operation: ${op.operation}` }
  }
}

async function gh(url: string, headers: Record<string, string>) {
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`GitHub GET ${url} -> ${res.status}: ${await res.text()}`)
  return res.json()
}

function slimPr(pr: Record<string, unknown>) {
  return {
    number: pr.number, title: pr.title, state: pr.state, draft: pr.draft,
    labels: ((pr.labels ?? []) as Array<{name:string}>).map(l => l.name),
    head: (pr.head as {ref:string}).ref, base: (pr.base as {ref:string}).ref,
    user: (pr.user as {login:string}).login,
    created_at: pr.created_at, updated_at: pr.updated_at, merged_at: pr.merged_at, body: pr.body,
    html_url: pr.html_url,
  }
}

// No wildcard CORS: this is a server-to-server function and must never be
// reachable from a browser page on an arbitrary origin.
function json(data: unknown, status = 200) {
  return new Response(data === null ? null : JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
