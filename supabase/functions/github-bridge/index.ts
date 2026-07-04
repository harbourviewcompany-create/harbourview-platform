// DISABLED 2026-07-04: this function was publicly callable (verify_jwt=false)
// with NO caller authentication of any kind, and supported push_file
// (arbitrary commits to the production repo) plus PR/file/tree reads using a
// server-side GITHUB_PAT. Anyone who found this URL could commit to the repo.
// Retired rather than patched with new auth, matching the pattern already
// used for other one-off dev/agent tools in this project (fix-jsx-apostrophes,
// hv-three-audit, hv-push-commandcentre, hv-patch-commandcentre). Not
// referenced by any scheduled pg_cron job.
// If this capability is needed again, rebuild it with a required secret
// header checked before any GitHub API call is made.
Deno.serve((_req: Request) => {
  return new Response(
    JSON.stringify({
      error: "This function has been retired.",
      code: "RETIRED",
      reason: "Publicly callable with no caller authentication and write access to the repo (push_file). Disabled 2026-07-04.",
    }),
    {
      status: 410,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    }
  );
});
