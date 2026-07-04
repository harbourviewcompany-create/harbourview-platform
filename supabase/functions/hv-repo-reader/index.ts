import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const REPO = "harbourviewcompany-create/harbourview-platform";
const GH_API = "https://api.github.com";

function ghHeaders(pat: string) {
  return {
    Authorization: `Bearer ${pat}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "harbourview-bridge/1.0",
  };
}

async function listDir(pat: string, path: string, ref: string) {
  const r = await fetch(`${GH_API}/repos/${REPO}/contents/${path}?ref=${ref}`, { headers: ghHeaders(pat) });
  if (!r.ok) return null;
  const data = await r.json();
  return Array.isArray(data) ? data.map((d: Record<string,string>) => ({ name: d.name, path: d.path, type: d.type })) : null;
}

async function readFile(pat: string, path: string, ref: string): Promise<string | null> {
  const r = await fetch(`${GH_API}/repos/${REPO}/contents/${path}?ref=${ref}`, { headers: ghHeaders(pat) });
  if (!r.ok) return null;
  const data = await r.json();
  if (data.encoding === "base64") {
    return new TextDecoder().decode(Uint8Array.from(atob(data.content.replace(/\n/g, "")), (c: string) => c.charCodeAt(0)));
  }
  return data.content ?? null;
}

async function mergePr(pat: string, prNumber: number, method = "squash", deleteAfter = true) {
  const res = await fetch(`${GH_API}/repos/${REPO}/pulls/${prNumber}/merge`, {
    method: "PUT",
    headers: ghHeaders(pat),
    body: JSON.stringify({ merge_method: method }),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, status: res.status, error: data.message };
  if (deleteAfter) {
    const pr = await fetch(`${GH_API}/repos/${REPO}/pulls/${prNumber}`, { headers: ghHeaders(pat) });
    const prData = await pr.json();
    const branch = prData?.head?.ref;
    if (branch && branch !== "main") {
      await fetch(`${GH_API}/repos/${REPO}/git/refs/heads/${branch}`, { method: "DELETE", headers: ghHeaders(pat) });
    }
  }
  return { ok: true, merged: true, pr: prNumber, sha: data.sha };
}

async function getJobLogs(pat: string, jobId: string): Promise<string> {
  // GitHub returns a 302 to a time-limited blob URL; fetch() follows redirects by default.
  const r = await fetch(`${GH_API}/repos/${REPO}/actions/jobs/${jobId}/logs`, {
    headers: ghHeaders(pat),
    redirect: "follow",
  });
  if (!r.ok) return `ERROR ${r.status}: ${await r.text()}`;
  return await r.text();
}

Deno.serve(async (req: Request) => {
  const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-github-token" };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const pat = req.headers.get("x-github-token") ?? Deno.env.get("GITHUB_PAT") ?? "";
  const body = await req.json();
  const ref = body.ref ?? "main";

  if (body.job_logs) {
    const logs = await getJobLogs(pat, String(body.job_logs));
    // Trim to last N chars since logs can be huge; errors are usually near the end
    const tail = body.tail ? Number(body.tail) : 8000;
    return new Response(JSON.stringify({ ok: true, logs: logs.slice(-tail) }), { headers: { ...cors, "Content-Type": "application/json" } });
  }

  if (body.merge_prs) {
    const results = [];
    for (const num of body.merge_prs as number[]) {
      const result = await mergePr(pat, num, body.method ?? "squash", body.delete_branch !== false);
      results.push({ pr: num, ...result });
    }
    return new Response(JSON.stringify({ ok: true, results }), { headers: { ...cors, "Content-Type": "application/json" } });
  }

  if (body.list) {
    const items = await listDir(pat, body.list, ref);
    return new Response(JSON.stringify({ ok: true, items }), { headers: { ...cors, "Content-Type": "application/json" } });
  }

  if (body.read) {
    const content = await readFile(pat, body.read, ref);
    return new Response(JSON.stringify({ ok: !!content, content }), { headers: { ...cors, "Content-Type": "application/json" } });
  }

  if (body.paths) {
    const results: Record<string, string | null> = {};
    for (const path of (body.paths as string[])) {
      results[path] = await readFile(pat, path, ref);
    }
    return new Response(JSON.stringify({ ok: true, results }), { headers: { ...cors, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "unknown op" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
});
