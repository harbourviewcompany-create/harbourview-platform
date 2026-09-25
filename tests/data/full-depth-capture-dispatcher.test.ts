import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("full-depth capture dispatcher", () => {
  const root = process.cwd();
  const setup = fs.readFileSync(path.join(root, "supabase/migrations/20260925070000_full_depth_capture_invocation_logs.sql"), "utf8");
  const reconcile = fs.readFileSync(path.join(root, "supabase/migrations/20260925071000_full_depth_capture_dispatcher_url.sql"), "utf8");
  const worker = fs.readFileSync(path.join(root, "supabase/functions/full-depth-authority-capture/index.ts"), "utf8");

  it("creates a private dispatcher token and scheduled job", () => {
    expect(setup).toContain("full_depth_capture_dispatch_config");
    expect(setup).toContain("gen_random_bytes(32)");
    expect(setup).toContain("cron.schedule");
    expect(setup).toContain("*/2 * * * *");
  });

  it("binds the cron dispatcher to the deployed function and batch size", () => {
    expect(reconcile).toContain("https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/full-depth-authority-capture?limit=25");
    expect(reconcile).toContain("x-harbourview-dispatch-token");
  });

  it("validates the dispatcher token server-side", () => {
    expect(worker).toContain("full_depth_capture_dispatch_config");
    expect(worker).toContain("dispatch_token!==suppliedDispatch");
    expect(worker).toContain("invalid_dispatch_token");
  });
});
