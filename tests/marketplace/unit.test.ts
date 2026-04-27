// tests/marketplace/unit.test.ts
// Harbourview Marketplace v1 — unit tests
// Tests: Zod schemas, public type sanitizers, rate limiter, slug generator

import { describe, it, expect } from 'vitest';
import {
  ListingSubmissionSchema,
  WantedRequestSubmissionSchema,
  InquirySubmissionSchema,
  AdminListingUpdateSchema,
  AdminSupplierUpdateSchema,
  AdminWantedUpdateSchema,
  AdminInquiryUpdateSchema,
  ListingsQuerySchema,
  SuppliersQuerySchema,
} from '@/lib/marketplace/schemas';
import {
  toPublicListing,
  toPublicSupplier,
  toPublicWantedRequest,
} from '@/lib/marketplace/types';
import { checkRateLimit } from '@/lib/marketplace/rate-limit';
import { generateSlug } from '@/lib/marketplace/slugify';

// ── ListingSubmissionSchema ────────────────────────────────────────────────

describe('ListingSubmissionSchema', () => {
  const valid = {
    section: 'new_products',
    title: 'Industrial Pump Units',
    description: 'Brand new industrial pump units, never used, ready to ship.',
    location_country: 'CA',
    price_amount: 4999,
    price_currency: 'USD',
  };

  it('accepts a valid listing submission', () => {
    expect(ListingSubmissionSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects missing title', () => {
    const { title, ...rest } = valid;
    expect(ListingSubmissionSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects missing section', () => {
    const { section, ...rest } = valid;
    expect(ListingSubmissionSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects invalid section', () => {
    expect(ListingSubmissionSchema.safeParse({ ...valid, section: 'jobs' }).success).toBe(false);
  });

  it('rejects title shorter than 3 chars', () => {
    expect(ListingSubmissionSchema.safeParse({ ...valid, title: 'AB' }).success).toBe(false);
  });

  it('rejects description shorter than 10 chars', () => {
    expect(ListingSubmissionSchema.safeParse({ ...valid, description: 'Too short' }).success).toBe(false);
  });

  it('rejects review_status in submission body (strict mode)', () => {
    expect(
      ListingSubmissionSchema.safeParse({ ...valid, review_status: 'approved' }).success
    ).toBe(false);
  });

  it('rejects public_visibility in submission body (strict mode)', () => {
    expect(
      ListingSubmissionSchema.safeParse({ ...valid, public_visibility: true }).success
    ).toBe(false);
  });

  it('accepts all 7 valid sections', () => {
    const sections = [
      'new_products', 'used_surplus', 'cannabis_inventory', 'wanted_requests',
      'services', 'business_opportunities', 'supplier_directory',
    ];
    for (const section of sections) {
      expect(ListingSubmissionSchema.safeParse({ ...valid, section }).success).toBe(true);
    }
  });
});

// ── WantedRequestSubmissionSchema ─────────────────────────────────────────

describe('WantedRequestSubmissionSchema', () => {
  const valid = {
    title: 'Wanted: Used CNC Machines',
    description: 'Looking for used CNC machines in good working condition.',
    category: 'Manufacturing',
    budget_range: '$5,000 – $20,000',
  };

  it('accepts valid wanted request', () => {
    expect(WantedRequestSubmissionSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts without optional fields', () => {
    expect(WantedRequestSubmissionSchema.safeParse({
      title: valid.title,
      description: valid.description,
    }).success).toBe(true);
  });

  it('rejects review_status in submission body', () => {
    expect(
      WantedRequestSubmissionSchema.safeParse({ ...valid, review_status: 'approved' }).success
    ).toBe(false);
  });

  it('rejects public_visibility in submission body', () => {
    expect(
      WantedRequestSubmissionSchema.safeParse({ ...valid, public_visibility: true }).success
    ).toBe(false);
  });
});

// ── InquirySubmissionSchema ───────────────────────────────────────────────

describe('InquirySubmissionSchema', () => {
  const valid = {
    listing_id: '00000000-0000-4000-8000-000000000001',
    buyer_name: 'Jane Buyer',
    buyer_email: 'jane@example.com',
    message: 'I am very interested in this listing and would like more information.',
  };

  it('accepts valid inquiry', () => {
    expect(InquirySubmissionSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects non-uuid listing_id', () => {
    expect(InquirySubmissionSchema.safeParse({ ...valid, listing_id: 'not-a-uuid' }).success).toBe(false);
  });

  it('rejects invalid email', () => {
    expect(InquirySubmissionSchema.safeParse({ ...valid, buyer_email: 'not-email' }).success).toBe(false);
  });

  it('rejects message shorter than 10 chars', () => {
    expect(InquirySubmissionSchema.safeParse({ ...valid, message: 'Hi there' }).success).toBe(false);
  });

  it('accepts optional buyer_company and buyer_phone', () => {
    expect(InquirySubmissionSchema.safeParse({
      ...valid,
      buyer_company: 'Acme Corp',
      buyer_phone: '+1-800-555-0100',
    }).success).toBe(true);
  });
});

// ── AdminListingUpdateSchema ──────────────────────────────────────────────

describe('AdminListingUpdateSchema', () => {
  it('accepts review_status only', () => {
    expect(AdminListingUpdateSchema.safeParse({ review_status: 'approved' }).success).toBe(true);
  });

  it('accepts is_featured only', () => {
    expect(AdminListingUpdateSchema.safeParse({ is_featured: true }).success).toBe(true);
  });

  it('rejects invalid review_status', () => {
    expect(AdminListingUpdateSchema.safeParse({ review_status: 'deleted' }).success).toBe(false);
  });

  it('rejects unknown fields (strict mode)', () => {
    expect(AdminListingUpdateSchema.safeParse({ review_status: 'approved', hack: true }).success).toBe(false);
  });
});

// ── AdminWantedUpdateSchema ───────────────────────────────────────────────

describe('AdminWantedUpdateSchema', () => {
  it('accepts review_status update', () => {
    expect(AdminWantedUpdateSchema.safeParse({ review_status: 'approved' }).success).toBe(true);
  });

  it('accepts public_visibility toggle', () => {
    expect(AdminWantedUpdateSchema.safeParse({ public_visibility: true }).success).toBe(true);
  });

  it('rejects unknown fields', () => {
    expect(AdminWantedUpdateSchema.safeParse({ review_status: 'approved', extra: 'x' }).success).toBe(false);
  });
});

// ── AdminInquiryUpdateSchema ──────────────────────────────────────────────

describe('AdminInquiryUpdateSchema', () => {
  it('accepts status update', () => {
    expect(AdminInquiryUpdateSchema.safeParse({ status: 'read' }).success).toBe(true);
  });

  it('accepts internal_note', () => {
    expect(AdminInquiryUpdateSchema.safeParse({ internal_note: 'Follow up needed' }).success).toBe(true);
  });

  it('rejects invalid status', () => {
    expect(AdminInquiryUpdateSchema.safeParse({ status: 'deleted' }).success).toBe(false);
  });
});

// ── AdminSupplierUpdateSchema ─────────────────────────────────────────────

describe('AdminSupplierUpdateSchema', () => {
  it('accepts verification_status update', () => {
    expect(AdminSupplierUpdateSchema.safeParse({ verification_status: 'verified' }).success).toBe(true);
  });

  it('rejects unknown fields', () => {
    expect(AdminSupplierUpdateSchema.safeParse({ verification_status: 'verified', secret: 'x' }).success).toBe(false);
  });
});

// ── ListingsQuerySchema ───────────────────────────────────────────────────

describe('ListingsQuerySchema', () => {
  it('parses page and limit as numbers from strings', () => {
    const r = ListingsQuerySchema.safeParse({ page: '2', limit: '10' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.page).toBe(2);
      expect(r.data.limit).toBe(10);
    }
  });

  it('applies default page=1 limit=20', () => {
    const r = ListingsQuerySchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.page).toBe(1);
      expect(r.data.limit).toBe(20);
    }
  });

  it('rejects limit above 50', () => {
    expect(ListingsQuerySchema.safeParse({ limit: '999' }).success).toBe(false);
  });
});

// ── SuppliersQuerySchema ──────────────────────────────────────────────────

describe('SuppliersQuerySchema', () => {
  it('accepts featured filter', () => {
    expect(SuppliersQuerySchema.safeParse({ featured: 'true' }).success).toBe(true);
  });

  it('rejects invalid featured value', () => {
    expect(SuppliersQuerySchema.safeParse({ featured: 'yes' }).success).toBe(false);
  });
});

// ── toPublicListing sanitizer ─────────────────────────────────────────────

describe('toPublicListing', () => {
  const raw = {
    id: 'uuid-1',
    section: 'new_products',
    title: 'Test Listing',
    slug: 'test-listing-abc123',
    description: 'A listing description',
    price_amount: 1000,
    price_currency: 'USD',
    location_country: 'CA',
    is_featured: false,
    created_at: '2025-01-01T00:00:00Z',
    // Private fields that must be stripped
    review_status: 'approved',
    public_visibility: true,
    workspace_id: 'ws-uuid',
    contact_visibility: 'on_inquiry',
    created_by: 'user-uuid',
    updated_at: '2025-01-02T00:00:00Z',
    lead_quality: 'high',
    estimated_deal_value: 50000,
    monetization_path: 'direct',
    internal_notes: 'Admin-only note',
  };

  it('retains all public fields', () => {
    const pub = toPublicListing(raw);
    expect(pub.id).toBe('uuid-1');
    expect(pub.title).toBe('Test Listing');
    expect(pub.section).toBe('new_products');
    expect(pub.slug).toBe('test-listing-abc123');
    expect(pub.price_amount).toBe(1000);
    expect(pub.is_featured).toBe(false);
  });

  it('strips review_status', () => {
    expect((toPublicListing(raw) as unknown as Record<string, unknown>).review_status).toBeUndefined();
  });

  it('strips public_visibility', () => {
    expect((toPublicListing(raw) as unknown as Record<string, unknown>).public_visibility).toBeUndefined();
  });

  it('strips workspace_id', () => {
    expect((toPublicListing(raw) as unknown as Record<string, unknown>).workspace_id).toBeUndefined();
  });

  it('strips updated_at', () => {
    expect((toPublicListing(raw) as unknown as Record<string, unknown>).updated_at).toBeUndefined();
  });

  it('strips all private metadata fields', () => {
    const pub = toPublicListing(raw) as unknown as Record<string, unknown>;
    expect(pub.lead_quality).toBeUndefined();
    expect(pub.estimated_deal_value).toBeUndefined();
    expect(pub.monetization_path).toBeUndefined();
    expect(pub.internal_notes).toBeUndefined();
  });
});

// ── toPublicSupplier sanitizer ────────────────────────────────────────────

describe('toPublicSupplier', () => {
  const raw = {
    id: 'sup-1',
    company_name: 'Test Corp',
    slug: 'test-corp-xyz',
    description: 'A supplier',
    is_featured: true,
    created_at: '2025-01-01T00:00:00Z',
    // Private fields
    workspace_id: 'ws-uuid',
    verification_status: 'verified',
    status: 'approved',
    created_by: 'user-uuid',
    updated_at: '2025-01-02T00:00:00Z',
    contact_email: 'private@corp.com',
    contact_phone: '+1-555-000-0000',
    internal_notes: 'Admin-only note',
  };

  it('retains public fields', () => {
    const pub = toPublicSupplier(raw);
    expect(pub.id).toBe('sup-1');
    expect(pub.company_name).toBe('Test Corp');
    expect(pub.slug).toBe('test-corp-xyz');
    expect(pub.is_featured).toBe(true);
  });

  it('strips contact_email', () => {
    expect((toPublicSupplier(raw) as unknown as Record<string, unknown>).contact_email).toBeUndefined();
  });

  it('strips contact_phone', () => {
    expect((toPublicSupplier(raw) as unknown as Record<string, unknown>).contact_phone).toBeUndefined();
  });

  it('strips internal_notes', () => {
    expect((toPublicSupplier(raw) as unknown as Record<string, unknown>).internal_notes).toBeUndefined();
  });

  it('strips workspace_id', () => {
    expect((toPublicSupplier(raw) as unknown as Record<string, unknown>).workspace_id).toBeUndefined();
  });

  it('strips updated_at', () => {
    expect((toPublicSupplier(raw) as unknown as Record<string, unknown>).updated_at).toBeUndefined();
  });
});

// ── toPublicWantedRequest sanitizer ──────────────────────────────────────

describe('toPublicWantedRequest', () => {
  const raw = {
    id: 'wr-1',
    title: 'Wanted: Equipment',
    description: 'Looking for equipment',
    category: 'Industrial',
    budget_range: '$10k-$50k',
    created_at: '2025-01-01T00:00:00Z',
    // Private
    review_status: 'approved',
    public_visibility: true,
    submitter_name: 'Jane Secret',
    submitter_email: 'secret@example.com',
    updated_at: '2025-01-02T00:00:00Z',
  };

  it('retains public fields', () => {
    const pub = toPublicWantedRequest(raw);
    expect(pub.id).toBe('wr-1');
    expect(pub.title).toBe('Wanted: Equipment');
    expect(pub.category).toBe('Industrial');
    expect(pub.budget_range).toBe('$10k-$50k');
  });

  it('strips submitter_name and submitter_email', () => {
    const pub = toPublicWantedRequest(raw) as unknown as Record<string, unknown>;
    expect(pub.submitter_name).toBeUndefined();
    expect(pub.submitter_email).toBeUndefined();
  });

  it('strips review_status and public_visibility', () => {
    const pub = toPublicWantedRequest(raw) as unknown as Record<string, unknown>;
    expect(pub.review_status).toBeUndefined();
    expect(pub.public_visibility).toBeUndefined();
  });
});

// ── Rate limiter ──────────────────────────────────────────────────────────

describe('checkRateLimit', () => {
  it('allows requests within the limit', () => {
    const key = `test-allow-${Date.now()}-${Math.random()}`;
    expect(checkRateLimit(key, { maxRequests: 3, windowSeconds: 60 }).allowed).toBe(true);
    expect(checkRateLimit(key, { maxRequests: 3, windowSeconds: 60 }).allowed).toBe(true);
    expect(checkRateLimit(key, { maxRequests: 3, windowSeconds: 60 }).allowed).toBe(true);
  });

  it('blocks on limit exceeded', () => {
    const key = `test-block-${Date.now()}-${Math.random()}`;
    checkRateLimit(key, { maxRequests: 2, windowSeconds: 60 });
    checkRateLimit(key, { maxRequests: 2, windowSeconds: 60 });
    const r = checkRateLimit(key, { maxRequests: 2, windowSeconds: 60 });
    expect(r.allowed).toBe(false);
  });

  it('returns retryAfterSeconds when blocked', () => {
    const key = `test-retry-${Date.now()}-${Math.random()}`;
    checkRateLimit(key, { maxRequests: 1, windowSeconds: 60 });
    const r = checkRateLimit(key, { maxRequests: 1, windowSeconds: 60 });
    expect(r.allowed).toBe(false);
    if (!r.allowed) {
      expect(r.retryAfterSeconds).toBeGreaterThan(0);
      expect(r.retryAfterSeconds).toBeLessThanOrEqual(60);
    }
  });

  it('uses separate windows per key', () => {
    const ts = Date.now();
    const key1 = `test-sep-a-${ts}`;
    const key2 = `test-sep-b-${ts}`;
    checkRateLimit(key1, { maxRequests: 1, windowSeconds: 60 });
    // key2 is a fresh window
    expect(checkRateLimit(key2, { maxRequests: 1, windowSeconds: 60 }).allowed).toBe(true);
  });
});

// ── Slug generator ────────────────────────────────────────────────────────

describe('generateSlug', () => {
  it('generates a lowercase hyphenated slug', () => {
    const slug = generateSlug('Industrial Pump Units');
    expect(slug).toMatch(/^industrial-pump-units-[a-z0-9]+$/);
  });

  it('generates unique slugs for the same title', () => {
    const s1 = generateSlug('Same Title');
    const s2 = generateSlug('Same Title');
    expect(s1).not.toBe(s2);
  });

  it('strips special characters', () => {
    const slug = generateSlug('Title! With & Symbols #2');
    expect(slug).not.toMatch(/[!&#]/);
  });

  it('handles unicode and accents gracefully', () => {
    const slug = generateSlug('Café Equipment');
    expect(slug).not.toContain('é');
    expect(typeof slug).toBe('string');
    expect(slug.length).toBeGreaterThan(0);
  });

  it('truncates very long titles', () => {
    const slug = generateSlug('A'.repeat(300));
    expect(slug.length).toBeLessThan(90);
  });
});
