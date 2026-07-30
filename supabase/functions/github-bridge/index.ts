/**
 * github-bridge v17 — added grep_file, patch_file (2026-07-28)
 *   Editing a small section of a huge file (CommandCentre.tsx / MobileCommandCentre.tsx,
 *   600KB+) previously meant fetching and reconstructing the WHOLE file through
 *   the calling agent's limited text channel just to change a few lines —
 *   expensive and error-prone. Added two server-side operations that never
 *   transfer full file content back to the caller:
 *     - grep_file: fetch a file, search line-by-line (substring or regex),
 *       return only matching lines with context. Use this to find exact,
 *       unique anchor text before patching.
 *     - patch_file: fetch a file, do a single str_replace-style old_str ->
 *       new_str substitution (old_str must match exactly once, same
 *       uniqueness contract as Claude's own str_replace tool), push the
 *       result back. The full file content never leaves GitHub/this function.
 *   Both decode with the same UTF-8-safe method as get_blob (byte array ->
 *   TextDecoder), not get_file's lossy atob().
 *
 * github-bridge v16 — added get_check_run_output (2026-07-26)
 *   list_check_runs slims out each run's `output` field (summary/text), which
 *   is where the actual failure reason lives for checks like a drift-detector.
 *   Added `get_check_run_output` (GET /check-runs/{id}) to fetch it. Purely
 *   additive.
 *
 * github-bridge v15 — GITHUB_PAT moved to vault (2026-07-26)
 *   The env-var GITHUB_PAT secret went bad ("Bad credentials" from GitHub) and
 *   could only be fixed via the Supabase dashboard, which the calling agent has
 *   no tool access to — a rotation dead end. Moved the token into Postgres
 *   Vault (secret name `hv_github_pat`), fetched via a new SECURITY DEFINER RPC
 *   `api.hv_get_github_pat()` (service_role-only execute, same pattern as
 *   `hv_bridge_key_matches`). Rotation is now a `select vault.update_secret(...)`
 *   away instead of a dashboard trip. Falls back to Deno.env.get('GITHUB_PAT')
 *   if the vault lookup returns nothing, so this is non-breaking if the vault
 *   secret isn't set yet.
 *
 * github-bridge v14 — added comment_pr, close_pr (2026-07-26)
 *   Added `comment_pr` (POST /issues/{number}/comments — PRs are issues in the
 *   GitHub API) and `close_pr` (PATCH /pulls/{number}, state=closed). Purely
 *   additive.
 *
 * github-bridge v13 — added merge_pr (2026-07-26)
 *   No operation existed to merge a PR — every merge had to happen through the
 *   GitHub UI. Added `merge_pr` (PUT /pulls/{number}/merge, squash by default,
 *   matching this repo's existing merge convention). Purely additive.
 *
 * github-bridge v12 — fixed create_ref base-sha resolution (2026-07-23)
 *   create_ref (v11) resolved the base branch's sha via GET /git/ref/heads/<ref>,
 *   which returns a 422 ("sha wasn't supplied") when GitHub treats the ref as
 *   ambiguous and responds with an array instead of a single ref object — this
 *   repo hit that on its very first use, even for `main`. Switched to
 *   GET /branches/<branch>, which always returns a single object for an exact
 *   branch name.
 *
 * github-bridge v11 — added create_ref (2026-07-23)
 *   No operation existed to create a branch, which blocks any edit-and-push-back
 *   workflow that needs to land work on a fresh branch + PR instead of committing
 *   to an existing one. Added `create_ref` (POST /git/refs) so callers can create
 *   `refs/heads/<branch>` from a base ref's current sha before calling `push_file`
 *   with that branch. Purely additive; no existing case changed.
 *
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

/**
 * Fetch the GitHub PAT from Postgres Vault via the service-role-only RPC
 * api.hv_get_github_pat(). Falls back to the GITHUB_PAT env var if the vault
 * lookup fails or returns nothing, so this stays non-breaking during the
 * migration to vault-based rotation.
 */
async function getGithubPat(): Promise<string | null> {
  if (SUPABASE_URL && SERVICE_ROLE_KEY) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/hv_get_github_pat`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Content-Profile': 'api',
        },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        const token = await res.json()
        if (typeof token === 'string' && token.length > 0) return token
      } else {
        console.error(`[github-bridge] vault PAT lookup returned ${res.status}`)
      }
    } catch (e) {
      console.error('[github-bridge] vault PAT lookup threw:', e)
    }
  }
  return Deno.env.get('GITHUB_PAT') ?? null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return json(null, 204)
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  if (!(await callerKeyIsValid(req))) {
    // Deliberately vague: do not tell an unauthenticated caller whether the
    // header was missing, malformed, or simply wrong.
    return json({ error: 'Unauthorized' }, 401)
  }

  const token = await getGithubPat()
  if (!token) return json({ error: 'No GitHub token. Set hv_github_pat vault secret or GITHUB_PAT env secret.' }, 500)

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

    // Create a new branch (ref) from an existing ref's current commit sha.
    // op.branch: new branch name (without refs/heads/ prefix).
    // op.from_ref: base ref to branch from, defaults to 'main'.
    //
    // v12 fix (2026-07-23): originally resolved the base sha via
    // GET /git/ref/heads/<ref>, which 422s ("sha wasn't supplied") whenever
    // GitHub treats the ref as ambiguous and returns an array instead of a
    // single object (observed in practice even for 'main' on this repo, which
    // has many branches). Switched to GET /branches/<branch>, which always
    // returns a single object for an exact branch name and is not subject to
    // this ambiguity.
    case 'create_ref': {
      const fromRef = (op.from_ref as string) ?? 'main'
      const baseBranch = await gh(`${BASE}/branches/${encodeURIComponent(fromRef)}`, h)
      const baseSha = baseBranch.commit?.sha
      if (!baseSha) throw new Error(`Could not resolve sha for base ref ${fromRef}`)
      const res = await fetch(`${BASE}/git/refs`, {
        method: 'POST', headers: h,
        body: JSON.stringify({ ref: `refs/heads/${op.branch}`, sha: baseSha })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(`GitHub POST git/refs ${res.status}: ${JSON.stringify(data)}`)
      return { ok: true, ref: data.ref, sha: data.object?.sha }
    }

    case 'merge_pr': {
      const res = await fetch(`${BASE}/pulls/${op.pr_number}/merge`, {
        method: 'PUT', headers: h,
        body: JSON.stringify({
          merge_method: (op.merge_method as string) ?? 'squash',
          commit_title: op.commit_title,
          commit_message: op.commit_message,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(`GitHub PUT merge ${res.status}: ${JSON.stringify(data)}`)
      return { ok: true, merged: data.merged, sha: data.sha, message: data.message }
    }

    case 'comment_pr': {
      const res = await fetch(`${BASE}/issues/${op.pr_number}/comments`, {
        method: 'POST', headers: h,
        body: JSON.stringify({ body: op.body })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(`GitHub POST issue comment ${res.status}: ${JSON.stringify(data)}`)
      return { ok: true, id: data.id, html_url: data.html_url }
    }

    case 'close_pr': {
      const res = await fetch(`${BASE}/pulls/${op.pr_number}`, {
        method: 'PATCH', headers: h,
        body: JSON.stringify({ state: 'closed' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(`GitHub PATCH pulls ${res.status}: ${JSON.stringify(data)}`)
      return { ok: true, state: data.state, number: data.number }
    }

    case 'get_check_run_output': {
      const data = await gh(`${BASE}/check-runs/${op.check_run_id}`, h)
      let annotations: unknown[] = []
      if (data.output?.annotations_url) {
        try { annotations = await gh(data.output.annotations_url, h) } catch { /* best-effort */ }
      }
      return { ok: true, name: data.name, conclusion: data.conclusion, output: data.output, annotations, html_url: data.html_url }
    }

    // Server-side search — never returns the whole file. Use before patch_file
    // to find exact, unique anchor text in a large file without paying the
    // cost of transferring it all back to the caller.
    // op.pattern: substring (default) or regex source if op.regex is true.
    // op.context: lines of context above/below each match (default 2).
    case 'grep_file': {
      const ref = op.ref ? `?ref=${encodeURIComponent(op.ref as string)}` : ''
      const data = await gh(`${BASE}/contents/${op.path}${ref}`, h)
      if (data.type !== 'file') return { ok: false, error: 'Not a file', type: data.type }
      const bytes = Uint8Array.from(atob((data.content as string).replace(/\n/g, '')), c => c.charCodeAt(0))
      const text = new TextDecoder('utf-8').decode(bytes)
      const lines = text.split('\n')
      const pattern = op.pattern as string
      const contextLines = (op.context as number) ?? 2
      const re = op.regex ? new RegExp(pattern) : null
      const matches: { line: number; text: string; context: string[] }[] = []
      lines.forEach((line, i) => {
        const isMatch = re ? re.test(line) : line.includes(pattern)
        if (isMatch) {
          const start = Math.max(0, i - contextLines)
          const end = Math.min(lines.length, i + contextLines + 1)
          matches.push({ line: i + 1, text: line, context: lines.slice(start, end) })
        }
      })
      return { ok: true, totalLines: lines.length, matchCount: matches.length, matches: matches.slice(0, 30), sha: data.sha }
    }

    // Server-side patch — fetches, applies ONE old_str -> new_str replacement,
    // pushes back. old_str must match exactly once (same contract as Claude's
    // own str_replace tool); zero or multiple matches is rejected rather than
    // guessing. Full file content never crosses back to the caller.
    case 'patch_file': {
      const ref = op.ref ? `?ref=${encodeURIComponent(op.ref as string)}` : ''
      const data = await gh(`${BASE}/contents/${op.path}${ref}`, h)
      if (data.type !== 'file') return { ok: false, error: 'Not a file', type: data.type }
      const bytes = Uint8Array.from(atob((data.content as string).replace(/\n/g, '')), c => c.charCodeAt(0))
      const text = new TextDecoder('utf-8').decode(bytes)
      const oldStr = op.old_str as string
      const newStr = op.new_str as string
      const occurrences = text.split(oldStr).length - 1
      if (occurrences !== 1) {
        return { ok: false, error: `old_str matched ${occurrences} times, expected exactly 1`, occurrences }
      }
      const patchedText = text.split(oldStr).join(newStr)
      const patchedBytes = new TextEncoder().encode(patchedText)
      let binary = ''
      for (const byte of patchedBytes) binary += String.fromCharCode(byte)
      const newB64 = btoa(binary)
      const res = await fetch(`${BASE}/contents/${op.path}`, {
        method: 'PUT', headers: h,
        body: JSON.stringify({ message: op.message, content: newB64, branch: op.branch ?? 'main', sha: data.sha })
      })
      const result = await res.json()
      if (!res.ok) throw new Error(`GitHub PUT ${res.status}: ${JSON.stringify(result)}`)
      return { ok: true, sha: result.content?.sha, commit: result.commit?.sha }
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
  }))
}
