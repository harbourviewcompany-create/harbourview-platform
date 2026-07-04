import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const LOADER_SECRET = Deno.env.get("SOURCE_UNIVERSE_LOADER_SECRET");

Deno.serve(async (req: Request) => {
  if (!LOADER_SECRET) {
    return new Response(
      JSON.stringify({ error: "Service not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const provided = req.headers.get("x-loader-secret");
  if (!provided || provided !== LOADER_SECRET) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // PostgREST on this project only exposes the `api` schema (not `public`).
  // Without db.schema set, the upsert below 406'd with PGRST106.
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { db: { schema: "api" } }
  );

  const sources = [
    { name: "Health Canada", url: "https://www.canada.ca/en/health-canada.html", jurisdiction: "CA", category: "regulator" },
    { name: "OLCC", url: "https://www.oregon.gov/olcc/marijuana/Pages/default.aspx", jurisdiction: "US-OR", category: "regulator" },
    { name: "MED Colorado", url: "https://sbg.colorado.gov/med", jurisdiction: "US-CO", category: "regulator" },
    { name: "BCC California", url: "https://www.bcc.ca.gov", jurisdiction: "US-CA", category: "regulator" },
    { name: "OCM New York", url: "https://cannabis.ny.gov", jurisdiction: "US-NY", category: "regulator" },
    { name: "CCC Massachusetts", url: "https://masscannabiscontrol.com", jurisdiction: "US-MA", category: "regulator" },
    { name: "AGCO Ontario", url: "https://www.agco.ca/cannabis", jurisdiction: "CA-ON", category: "regulator" },
    { name: "AGLC Alberta", url: "https://aglc.ca/cannabis", jurisdiction: "CA-AB", category: "regulator" },
    { name: "German BfArM", url: "https://www.bfarm.de/EN/Federal-Opium-Agency/_node.html", jurisdiction: "DE", category: "regulator" },
    { name: "UK Home Office", url: "https://www.gov.uk/guidance/cannabis-licensing", jurisdiction: "GB", category: "regulator" },
  ];

  const { data, error } = await supabase
    .from("source_registry")
    .upsert(sources, { onConflict: "url", ignoreDuplicates: true })
    .select();

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ inserted: data?.length ?? 0, total: sources.length }),
    { headers: { "Content-Type": "application/json" } }
  );
});
