/**
 * Outline — RLS verification for talent tables
 * Run against a real Supabase test project or local with appropriate roles.
 */

import { describe, it } from 'vitest';

describe('talent RLS', () => {
  it.todo('anon can select only status = published');
  it.todo('anon cannot insert / update / delete opportunities');
  it.todo('org member can insert draft for their organization');
  it.todo('org member cannot publish (status change to published) without review path');
  it.todo('user can insert application only for themselves');
  it.todo('user can select only their own applications (or org can see applicants)');
  it.todo('user can manage only their own saved_jobs and alerts');
});
