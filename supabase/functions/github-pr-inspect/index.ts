import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const INSPECT_KEY = Deno.env.get("GITHUB_PR_INSPECT_KEY");

Deno.serve(async (req: Request) => {
  if (!INSPECT_KEY) {
    return new Response(
      JSON.stringify({ error: "Service not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const provided = req.headers.get("x-inspect-key");
  if (!provided || provided !== INSPECT_KEY) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const { pr_url } = await req.json().catch(() => ({}));
  if (!pr_url || typeof pr_url !== "string") {
    return new Response(
      JSON.stringify({ error: "pr_url required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Extract owner/repo/number from GitHub PR URL
  const match = pr_url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) {
    return new Response(
      JSON.stringify({ error: "Invalid GitHub PR URL" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const [, owner, repo, number] = match;

  const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN") ?? "";
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "harbourview-pr-inspect",
  };
  if (GITHUB_TOKEN) headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;

  const prRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`,
    { headers }
  );
  const pr = await prRes.json();

  return new Response(JSON.stringify({ pr }), {
    headers: { "Content-Type": "application/json" },
  });
});
