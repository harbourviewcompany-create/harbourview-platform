import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// This function was a one-off dev tool and has been retired.
Deno.serve((_req: Request) => {
  return new Response(
    JSON.stringify({ error: "This function has been retired.", code: "RETIRED" }),
    { status: 410, headers: { "Content-Type": "application/json" } }
  );
});
