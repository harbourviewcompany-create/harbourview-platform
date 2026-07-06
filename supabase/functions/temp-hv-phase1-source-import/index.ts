Deno.serve((_req: Request) => {
  return new Response(JSON.stringify({
    ok: false,
    disabled: true,
    function: 'temp-hv-phase1-source-import',
    reason: 'Temporary importer disabled. No source import is available through this endpoint.'
  }), {
    status: 410,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
});
