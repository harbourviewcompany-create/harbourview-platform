import {
  BROWSER_COMPATIBLE_USER_AGENT,
  containsHtmlTable,
  fetchAuthorityRepresentation,
} from "./authority-fetch.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

Deno.test("containsHtmlTable recognizes regulator tables case-insensitively", () => {
  assert(containsHtmlTable("<TABLE class=\"data\"><tr></tr></TABLE>"), "expected TABLE to be recognized");
  assert(!containsHtmlTable("<main><p>No tabular representation</p></main>"), "did not expect a table");
});

Deno.test("structured HTML retries the exact canonical URL once with a browser-compatible profile", async () => {
  const calls: Array<{ url: string; headers: Headers }> = [];
  const canonicalUrl = "https://authority.example.gov/products";
  const fetchImpl = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = String(input);
    calls.push({ url, headers: new Headers(init?.headers) });
    if (calls.length === 1) {
      return new Response("<html><body>reduced representation</body></html>", { status: 200 });
    }
    return new Response("<html><body><table><tr><td>record</td></tr></table></body></html>", { status: 200 });
  };

  const result = await fetchAuthorityRepresentation(canonicalUrl, {
    structuredHtmlTable: true,
    fetchImpl,
  });

  assert(calls.length === 2, `expected two requests, got ${calls.length}`);
  assert(calls[0].url === canonicalUrl && calls[1].url === canonicalUrl, "retry must remain on the canonical URL");
  assert(result.retriedWithBrowserProfile, "expected browser-compatible retry evidence");
  assert(containsHtmlTable(result.raw), "expected retry representation to contain a table");
  assert(calls[1].headers.get("User-Agent") === BROWSER_COMPATIBLE_USER_AGENT, "expected browser user agent on retry");
  assert(calls[1].headers.get("Accept")?.startsWith("text/html") === true, "expected browser HTML content negotiation");
  assert(calls[1].headers.get("Accept-Language") === "en-AU,en;q=0.9", "expected regulator-local browser language negotiation");
});

Deno.test("structured HTML does not retry when the first representation already contains a table", async () => {
  let calls = 0;
  const fetchImpl = async (): Promise<Response> => {
    calls += 1;
    return new Response("<table><tr><td>record</td></tr></table>", { status: 200 });
  };

  const result = await fetchAuthorityRepresentation("https://authority.example.gov/table", {
    structuredHtmlTable: true,
    fetchImpl,
  });

  assert(calls === 1, `expected one request, got ${calls}`);
  assert(!result.retriedWithBrowserProfile, "did not expect browser retry");
});

Deno.test("non-tabular sources never use the browser retry solely because no table is present", async () => {
  let calls = 0;
  const fetchImpl = async (): Promise<Response> => {
    calls += 1;
    return new Response("<html><body>ordinary article</body></html>", { status: 200 });
  };

  const result = await fetchAuthorityRepresentation("https://authority.example.gov/article", {
    structuredHtmlTable: false,
    fetchImpl,
  });

  assert(calls === 1, `expected one request, got ${calls}`);
  assert(!result.retriedWithBrowserProfile, "non-tabular source must not use browser retry");
});

Deno.test("failed first responses are returned without a second request", async () => {
  let calls = 0;
  const fetchImpl = async (): Promise<Response> => {
    calls += 1;
    return new Response("service unavailable", { status: 503 });
  };

  const result = await fetchAuthorityRepresentation("https://authority.example.gov/table", {
    structuredHtmlTable: true,
    fetchImpl,
  });

  assert(calls === 1, `expected one request, got ${calls}`);
  assert(result.response.status === 503, "expected original HTTP failure to be preserved");
  assert(!result.retriedWithBrowserProfile, "HTTP failure must not trigger representation retry");
});
