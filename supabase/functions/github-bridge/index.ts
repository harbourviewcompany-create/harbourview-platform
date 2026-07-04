/**
 * github-bridge v3
 * Token resolution order:
 *   1. GITHUB_PAT env var (set as Supabase secret — never touches the transcript)
 *   2. x-github-token request header (legacy, still works if provided)
 */

const OWNER = 'harbourviewcompany-create'
const REPO  = 'harbourview-platform'
const BASE  = `https://api.github.com/repos/${OWNER}/${REPO}`

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return json(null, 204)

  // Prefer env-injected token; fall back to header for legacy calls
  const token = Deno.env.get('GITHUB_PAT') ?? req.headers.get('x-github-token')
  if (!token) return json({ error: 'No GitHub token available. Set GITHUB_PAT secret or pass x-github-token header.' }, 401)

  const h: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'harbourview-bridge/3',
    'Content-Type': 'application/json',
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

  try {
    return json(await dispatch(body, h))
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500)
  }
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
      const data = await gh(`${BASE}/pulls/${op.pr_number}`, h)
      return { ok: true, pr: data }
    }

    case 'get_file': {
      const ref = op.ref ? `?ref=${encodeURIComponent(op.ref as string)}` : ''
      const data = await gh(`${BASE}/contents/${op.path}${ref}`, h)
      if (data.type !== 'file') return { ok: false, error: 'Not a file', type: data.type }
      const content = atob((data.content as string).replace(/\n/g, ''))
      return { ok: true, content, sha: data.sha, path: data.path }
    }

    case 'get_tree': {
      const ref = (op.ref as string) ?? 'main'
      const recursive = op.recursive !== false ? '?recursive=1' : ''
      const data = await gh(`${BASE}/git/trees/${encodeURIComponent(ref)}${recursive}`, h)
      return {
        ok: true, sha: data.sha, truncated: data.truncated,
        tree: (data.tree as Record<string, unknown>[]).map(n => ({
          path: n.path, type: n.type, size: n.size, sha: n.sha
        }))
      }
    }

    case 'get_pr_files': {
      const per_page = Math.min((op.per_page as number) ?? 100, 100)
      const data = await gh(`${BASE}/pulls/${op.pr_number}/files?per_page=${per_page}`, h)
      return {
        ok: true, count: data.length,
        files: (data as Record<string, unknown>[]).map(f => ({
          filename: f.filename, status: f.status,
          additions: f.additions, deletions: f.deletions, changes: f.changes, patch: f.patch
        }))
      }
    }

    case 'get_pr_diff': {
      const diffHeaders = { ...h, 'Accept': 'application/vnd.github.diff' }
      const res = await fetch(`${BASE}/pulls/${op.pr_number}`, { headers: diffHeaders })
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
      const putBody: Record<string, unknown> = {
        message: op.message,
        content: op.content,
        branch: op.branch ?? 'main',
      }
      if (op.sha) putBody.sha = op.sha
      const res = await fetch(`${BASE}/contents/${op.path}`, {
        method: 'PUT', headers: h, body: JSON.stringify(putBody),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(`GitHub PUT ${res.status}: ${JSON.stringify(result)}`)
      return { ok: true, sha: result.content?.sha, html_url: result.content?.html_url, commit: result.commit?.sha }
    }

    case 'batch': {
      const ops = op.ops as Record<string, unknown>[]
      if (!Array.isArray(ops) || ops.length > 8)
        return { ok: false, error: 'batch.ops must be array of 1-8 operations' }
      const results = await Promise.allSettled(ops.map(o => dispatch(o, h)))
      return {
        ok: true,
        results: results.map(r =>
          r.status === 'fulfilled'
            ? { ok: true, data: r.value }
            : { ok: false, error: (r.reason as Error)?.message ?? String(r.reason) }
        )
      }
    }

    default:
      return { error: `Unknown operation: ${op.operation}` }
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
    labels: (pr.labels as Array<{name:string}>).map(l => l.name),
    head: (pr.head as {ref:string}).ref, base: (pr.base as {ref:string}).ref,
    user: (pr.user as {login:string}).login,
    created_at: pr.created_at, updated_at: pr.updated_at, merged_at: pr.merged_at,
    body: pr.body,
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, x-github-token',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    }
  })
}
