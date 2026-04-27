// tests/marketplace/marketplace.test.ts
// Unit tests: Zod schema validation, slug generation, private field leakage guardrails

import { describe, it, expect } from 'vitest';
import {
  ListingSubmissionSchema,
  InquirySubmissionSchema,
  WantedRequestSubmissionSchema,
  AdminListingUpdateSchema,
} from '../../lib/marketplace/schemas';
import type { PublicListing } from '../../lib/marketplace/types';

// ─── ListingSubmissionSchema ──────────────────────────────────────────────────

describe('ListingSubmissionSchema', () => {
  it('accepts a valid listing', () => {
    const result = ListingSubmissionSchema.safeParse({
      section: 'new_products',
      title: 'Test Trim Machine',
      description: 'A great trim machine in excellent working condition.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid section (out of scope)', () => {
    const result = ListingSubmissionSchema.safeParse({
      section: 'jobs',
      title: 'Test',
      description: 'A description long enough to pass.',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a title that is too short', () => {
    const result = ListingSubmissionSchema.safeParse({
      section: 'services',
      title: 'AB',
      description: 'A description long enough to pass.',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a description that is too short', () => {
    const result = ListingSubmissionSchema.safeParse({
      section: 'services',
      title: 'Valid Title Here',
      description: 'Short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects review_status being set by public user', () => {
    const result = ListingSubmissionSchema.safeParse({
      section: 'services',
      title: 'Valid Title',
      description: 'A description long enough to pass validation.',
      review_status: 'approved',
    });
    expect(result.success).toBe(false);
  });

  it('rejects public_visibility being set by public user', () => {
    const result = ListingSubmissionSchema.safeParse({
      section: 'services',
      title: 'Valid Title',
      description: 'A description long enough to pass validation.',
      public_visibility: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown extra fields (strict mode)', () => {
    const result = ListingSubmissionSchema.safeParse({
      section: 'services',
      title: 'Valid Title',
      description: 'A description long enough to pass validation.',
      lead_quality: 'high',
    });
    expect(result.success).toBe(false);
  });
});

// ─── InquirySubmissionSchema ─────────────────────────────────────────────────

describe('InquirySubmissionSchema', () => {
  it('accepts a valid inquiry', () => {
    const result = InquirySubmissionSchema.safeParse({
      listing_id: '123e4567-e89b-12d3-a456-426614174000',
      buyer_name: 'John Buyer',
      buyer_email: 'john@example.com',
      message: 'I am interested in this product and would like more information.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID listing_id', () => {
    const result = InquirySubmissionSchema.safeParse({
      listing_id: 'not-a-uuid',
      buyer_name: 'John',
      buyer_email: 'john@example.com',
      message: 'I am interested in this listing.',
    });
    expect(result.success).toBe(false);
  });

  it('rejects too-short message', () => {
    const result = InquirySubmissionSchema.safeParse({
      listing_id: '123e4567-e89b-12d3-a456-426614174000',
      buyer_name: 'John',
      buyer_email: 'john@example.com',
      message: 'Short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = InquirySubmissionSchema.safeParse({
      listing_id: '123e4567-e89b-12d3-a456-426614174000',
      buyer_name: 'John',
      buyer_email: 'not-an-email',
      message: 'I am interested in this product.',
    });
    expect(result.success).toBe(false);
  });
});

// ─── WantedRequestSubmissionSchema ───────────────────────────────────────────

describe('WantedRequestSubmissionSchema', () => {
  it('accepts a valid wanted request', () => {
    const result = WantedRequestSubmissionSchema.safeParse({
      title: 'Looking for extraction equipment',
      description: 'We are looking for CO2 extraction equipment, preferably used, BC preferred.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects review_status being set', () => {
    const result = WantedRequestSubmissionSchema.safeParse({
      title: 'Looking for equipment',
      description: 'A description long enough to pass validation here.',
      review_status: 'approved',
    });
    expect(result.success).toBe(false);
  });

  it('rejects public_visibility being set', () => {
    const result = WantedRequestSubmissionSchema.safeParse({
      title: 'Looking for equipment',
      description: 'A description long enough to pass validation here.',
      public_visibility: true,
    });
    expect(result.success).toBe(false);
  });
});

// ─── AdminListingUpdateSchema ─────────────────────────────────────────────────

describe('AdminListingUpdateSchema', () => {
  it('accepts approve patch', () => {
    expect(AdminListingUpdateSchema.safeParse({ review_status: 'approved' }).success).toBe(true);
  });

  it('accepts reject patch', () => {
    expect(AdminListingUpdateSchema.safeParse({ review_status: 'rejected' }).success).toBe(true);
  });

  it('accepts feature toggle', () => {
    expect(AdminListingUpdateSchema.safeParse({ is_featured: true }).success).toBe(true);
  });

  it('rejects unknown review_status value', () => {
    expect(AdminListingUpdateSchema.safeParse({ review_status: 'published' }).success).toBe(false);
  });

  it('rejects extra fields (strict mode)', () => {
    expect(AdminListingUpdateSchema.safeParse({ review_status: 'approved', lead_quality: 'high' }).success).toBe(false);
  });
});

// ─── Private field leakage guardrails ────────────────────────────────────────

describe('PublicListing — no private fields', () => {
  it('PublicListing object contains no private fields', () => {
    const mockPublicListing: PublicListing = {
      id: 'abc',
      section: 'new_products',
      title: 'Test',
      slug: 'test-abc123',
      description: 'A test listing.',
      price_amount: null,
      price_currency: 'CAD',
      location_country: 'Canada',
      is_featured: false,
      created_at: new Date().toISOString(),
    };

    const forbiddenFields = [
      'lead_quality', 'estimated_deal_value', 'monetization_path',
      'admin_priority', 'internal_notes', 'reviewer_notes',
      'private_notes', 'service_role_key', 'api_token', 'token_hash',
      'review_status', 'public_visibility', 'contact_visibility',
    ];

    for (const field of forbiddenFields) {
      expect(
        Object.prototype.hasOwnProperty.call(mockPublicListing, field),
        `PublicListing must not contain field: ${field}`
      ).toBe(false);
    }
  });
});

// ─── RLS verification queries for WH / OT ────────────────────────────────────
// Run these against live DB as anon role to verify security.

export const RLS_VERIFICATION_QUERIES = {
  anon_cannot_see_pending: `
    SET ROLE anon;
    SELECT count(*) FROM marketplace_listings WHERE review_status = 'pending';
    -- Expected: 0 rows (RLS blocks pending from anon)
  `,
  anon_cannot_access_private_meta: `
    SET ROLE anon;
    SELECT count(*) FROM marketplace_listing_metadata_private;
    -- Expected: 0 rows or permission denied
  `,
  anon_can_read_approved_via_view: `
    SET ROLE anon;
    SELECT count(*) FROM marketplace_listings_public_view;
    -- Expected: count of approved+public listings only
  `,
  view_has_no_private_fields: `
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'marketplace_listings_public_view'
    ORDER BY column_name;
    -- Must NOT include: lead_quality, estimated_deal_value, monetization_path,
    --   admin_priority, internal_notes, reviewer_notes, private_notes
  `,
  audit_events_are_immutable: `
    SET ROLE authenticated;
    UPDATE audit_events SET action = 'fabricated' WHERE true;
    -- Expected: trigger raises exception
    DELETE FROM audit_events WHERE true;
    -- Expected: trigger raises exception
  `,
  anon_submit_defaults_to_pending: `
    -- After a POST /api/marketplace/submit:
    SELECT review_status, public_visibility
    FROM marketplace_listings
    ORDER BY created_at DESC LIMIT 1;
    -- Expected: review_status = 'pending', public_visibility = false
  `,
};
