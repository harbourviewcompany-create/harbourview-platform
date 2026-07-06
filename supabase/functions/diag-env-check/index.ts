import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Diagnostic: check which Anthropic-related env vars are present (names only, never values)
Deno.serve((_req: Request) => {
  const candidates = [
    "ANTHROPIC_API_KEY",
    "ANTHROPIC_KEY",
    "CLAUDE_API_KEY",
    "HV_ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
    "HV_DEV_BYPASS_SECRET",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  const result: Record<string, boolean> = {};
  for (const name of candidates) {
    const val = Deno.env.get(name);
    result[name] = Boolean(val && val.length > 0);
  }
  return new Response(JSON.stringify({ ok: true, env_present: result }), {
    headers: { "Content-Type": "application/json" },
  });
});
