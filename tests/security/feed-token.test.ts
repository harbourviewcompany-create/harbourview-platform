import { describe, expect, it } from "vitest";
import { constantTimeEqualHex, isValidBearerTokenShape, sha256Hex } from "@/lib/security/tokens";
import { sanitizeFeedSnapshot } from "@/lib/feed/sanitize";

describe("public feed token security", () => {
  it("hashes tokens as sha256 hex", () => {
    const hash = sha256Hex("hv_live_test_token_1234567890_abcdefghijklmnopqrstuvwxyz");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("compares token hashes with constant-time helper semantics", () => {
    const token = "hv_live_test_token_1234567890_abcdefghijklmnopqrstuvwxyz";
    const hash = sha256Hex(token);
    expect(constantTimeEqualHex(hash, hash)).toBe(true);
    expect(constantTimeEqualHex(hash, sha256Hex(`${token}_wrong`))).toBe(false);
    expect(constantTimeEqualHex(hash, "abc")).toBe(false);
  });

  it("rejects malformed token shapes", () => {
    expect(isValidBearerTokenShape("short")).toBe(false);
    expect(isValidBearerTokenShape("contains space and punctuation!")).toBe(false);
    expect(isValidBearerTokenShape("a".repeat(257))).toBe(false);
    expect(isValidBearerTokenShape("A".repeat(32))).toBe(true);
  });

  it("recursively removes sensitive fields from feed snapshots", () => {
    const snapshot = {
      title: "Safe dossier",
      workspace_id: "visible-workspace-id", // intentionally NOT blocked — workspace context is public in feed
      internal_notes: "hidden",
      analyst_notes: "hidden",
      items: [
        {
          title: "Visible item",
          reviewer_notes: "hidden",
          private_metadata: { secret: "hidden" },
          nested: {
            evidence: "visible",
            token_hash: "hidden",
            source: { url: "https://example.com", api_key: "hidden" },
          },
        },
      ],
    };

    expect(sanitizeFeedSnapshot(snapshot)).toEqual({
      title: "Safe dossier",
      workspace_id: "visible-workspace-id", // present: workspace_id is allowed in client feed
      items: [
        {
          title: "Visible item",
          nested: {
            evidence: "visible",
            source: { url: "https://example.com" },
          },
        },
      ],
    });
  });

  it("strips analyst_interpretation from feed snapshots", () => {
    const snapshot = {
      title: "Dossier",
      signals: [
        {
          id: "sig-1",
          summary: "Visible summary",
          analyst_interpretation: "INTERNAL: this must not appear in client feed",
        },
      ],
    };
    const result = sanitizeFeedSnapshot(snapshot) as any;
    expect(result.signals[0].analyst_interpretation).toBeUndefined();
    expect(result.signals[0].summary).toBe("Visible summary");
  });

  it("strips item_notes from feed snapshots", () => {
    const snapshot = {
      title: "Dossier",
      items: [
        {
          signal_id: "sig-1",
          item_notes: "INTERNAL: do not expose to client",
          display_order: 1,
        },
      ],
    };
    const result = sanitizeFeedSnapshot(snapshot) as any;
    expect(result.items[0].item_notes).toBeUndefined();
    expect(result.items[0].display_order).toBe(1);
  });

  it("strips snapshot_json from feed snapshots", () => {
    const snapshot = {
      title: "Dossier",
      snapshot_json: {
        internal: "raw DB snapshot column — must not re-embed in feed output",
      },
      summary: "Visible",
    };
    const result = sanitizeFeedSnapshot(snapshot) as any;
    expect(result.snapshot_json).toBeUndefined();
    expect(result.summary).toBe("Visible");
  });

  it("strips api_token from feed snapshots", () => {
    const snapshot = {
      title: "Dossier",
      publish_events: [
        {
          id: "pe-1",
          status: "completed",
          api_token: "hvfeed_raw_token_must_not_appear",
          created_at: "2025-01-01T00:00:00Z",
        },
      ],
    };
    const result = sanitizeFeedSnapshot(snapshot) as any;
    expect(result.publish_events[0].api_token).toBeUndefined();
    expect(result.publish_events[0].status).toBe("completed");
  });

  it("strips all blocked fields simultaneously in a realistic snapshot", () => {
    const snapshot = {
      schema_version: "1.0",
      dossier_id: "dos-1",
      title: "Germany Q1 Brief",
      internal_notes: "INTERNAL",
      snapshot_json: { raw: "data" },
      signals: [
        {
          id: "sig-1",
          title: "Visible signal",
          analyst_notes: "INTERNAL",
          analyst_interpretation: "INTERNAL",
          evidence: [
            {
              id: "ev-1",
              evidence_text: "Visible evidence",
              reviewer_notes: "INTERNAL",
            },
          ],
        },
      ],
      items: [
        {
          signal_id: "sig-1",
          item_notes: "INTERNAL",
          display_order: 1,
        },
      ],
      publish_events: [
        {
          id: "pe-1",
          api_token: "hvfeed_INTERNAL",
          status: "completed",
        },
      ],
    };

    const result = sanitizeFeedSnapshot(snapshot) as any;

    // Internal fields gone
    expect(result.internal_notes).toBeUndefined();
    expect(result.snapshot_json).toBeUndefined();
    expect(result.signals[0].analyst_notes).toBeUndefined();
    expect(result.signals[0].analyst_interpretation).toBeUndefined();
    expect(result.signals[0].evidence[0].reviewer_notes).toBeUndefined();
    expect(result.items[0].item_notes).toBeUndefined();
    expect(result.publish_events[0].api_token).toBeUndefined();

    // Public fields present
    expect(result.title).toBe("Germany Q1 Brief");
    expect(result.signals[0].title).toBe("Visible signal");
    expect(result.signals[0].evidence[0].evidence_text).toBe("Visible evidence");
    expect(result.items[0].display_order).toBe(1);
    expect(result.publish_events[0].status).toBe("completed");
  });
});
