import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260808190500_reconcile_marketplace_image_trust_contract.sql',
)
const sql = fs.readFileSync(migrationPath, 'utf8')

describe('marketplace image trust reconciliation migration', () => {
  it('reconciles the legacy production relation without dropping the table', () => {
    expect(sql).toContain('alter table public.marketplace_item_images')
    expect(sql).toContain('add column if not exists item_id uuid')
    expect(sql).toContain('add column if not exists image_class public.marketplace_image_class')
    expect(sql).toContain('add column if not exists rights_status public.marketplace_image_rights_status')
    expect(sql).not.toMatch(/drop\s+table\s+(if\s+exists\s+)?public\.marketplace_item_images/i)
  })

  it('replaces the legacy permissive public policy with the complete trust gate', () => {
    expect(sql).toContain('drop policy if exists public_read_approved_images')
    expect(sql).toContain('review_status::text = \'APPROVED_PUBLIC\'')
    expect(sql).toContain("rights_status::text <> 'UNKNOWN'")
    expect(sql).toContain("image_class::text <> 'ADMIN_PRIVATE_EVIDENCE'")
    expect(sql).toContain('item_id is not null')
    expect(sql).toContain('public_url is not null')
  })

  it('recreates the API view with the public image DTO allowlist only', () => {
    const view = sql.slice(sql.indexOf('create view api.marketplace_item_images'))
    for (const allowed of [
      'item_id',
      'image_class',
      'image_role',
      'source_type',
      'public_url',
      'thumbnail_url',
      'hero_url',
      'gallery_url',
      'social_url',
      'alt_text',
      'caption',
      'is_illustrative',
      'review_status',
      'rights_status',
    ]) {
      expect(view).toContain(allowed)
    }

    for (const privateField of [
      'source_name',
      'source_url',
      'source_reference',
      'original_storage_bucket',
      'original_storage_path',
      'edited_storage_path',
      'adobe_edit_summary',
      'content_credentials_reference',
      'reviewed_by',
      'uploaded_by',
    ]) {
      const selectBlock = view.slice(view.indexOf('select'), view.indexOf('from public.marketplace_item_images'))
      expect(selectBlock).not.toContain(privateField)
    }
  })

  it('restores all three intended image storage buckets', () => {
    expect(sql).toContain("'marketplace-item-originals'")
    expect(sql).toContain("'marketplace-item-working'")
    expect(sql).toContain("'marketplace-item-public'")
  })
})
