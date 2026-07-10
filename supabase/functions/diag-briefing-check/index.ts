import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (_req: Request) => {
  const results: Record<string, unknown> = {};

  const cases = [
    { name: "germany_country", path: "/rest/v1/cc_jurisdiction_briefings?select=jurisdiction_slug,program_status&country_iso2=eq.DE&jurisdiction_type=eq.country", single: true },
    { name: "germany_plain", path: "/rest/v1/cc_jurisdiction_briefings?select=jurisdiction_slug,program_status&country_iso2=eq.DE&jurisdiction_type=eq.country", single: false },
    { name: "texas_country_wrong", path: "/rest/v1/cc_jurisdiction_briefings?select=jurisdiction_slug,program_status&country_iso2=eq.US-TX&jurisdiction_type=eq.country", single: true },
  ];

  for (const c of cases) {
    const headers: Record<string, string> = {
      apikey: ANON_KEY,
      authorization: `Bearer ${ANON_KEY}`,
    };
    if (c.single) {
      headers["accept"] = "application/vnd.pgrst.object+json";
    }
    const res = await fetch(`${SUPABASE_URL}${c.path}`, { headers });
    const text = await res.text();
    results[c.name] = {
      status: res.status,
      statusText: res.statusText,
      body: text.slice(0, 500),
    };
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
});
