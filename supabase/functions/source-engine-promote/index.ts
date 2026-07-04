import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const jsonHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...jsonHeaders,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  return new Response(
    JSON.stringify({
      ok: false,
      disabled: true,
      function: "source-engine-promote",
      reason: "HTTP Edge Function disabled by HAR-28 controlled Supabase hardening. Promotion is owned by the database RPC/cron path, not this public HTTP function.",
      canonical_path: "promote_all_extracted_snapshots() via scheduled database job",
    }),
    {
      status: 410,
      headers: jsonHeaders,
    },
  );
});
