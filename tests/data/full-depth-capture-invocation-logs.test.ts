import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("full-depth capture invocation logging", () => {
  const root = process.cwd();
  const migration = fs.readFileSync(
    path.join(root, "supabase/migrations/20260925070000_full_depth_capture_invocation_logs.sql"),
    "utf8",
  );
  const worker = fs.readFileSync(
    path.join(root, "supabase/functions/full-depth-authority-capture/index.ts"),
    "utf8",
  );

  it("creates durable invocation and per-job event logs", () => {
    expect(migration).toContain("jurisdiction_data_depth_capture_invocations");
    expect(migration).toContain("jurisdiction_data_depth_capture_invocation_events");
    expect(migration).toContain("invocation_started");
    expect(migration).toContain("job_claimed");
    expect(migration).toContain("job_completed");
    expect(migration).toContain("job_needs_review");
    expect(migration).toContain("job_blocked");
    expect(migration).toContain("job_failed");
    expect(migration).toContain("invocation_completed");
    expect(migration).toContain("invocation_failed");
  });

  it("records invocation identity and completion telemetry", () => {
    expect(worker).toContain("const invocationId = crypto.randomUUID()");
    expect(worker).toContain("jurisdiction_data_depth_capture_invocations");
    expect(worker).toContain("invocation_id: invocationId");
    expect(worker).toContain("invocation_completed");
    expect(worker).toContain("invocation_failed");
    expect(worker).toContain("duration_ms");
  });

  it("never logs credentials or raw source text", () => {
    expect(worker).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(worker).not.toContain("OPENAI_API_KEY");
    expect(worker).not.toContain("captured_text:");
    expect(worker).not.toContain("evidence_quote:");
  });
});
