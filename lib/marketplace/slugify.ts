// lib/marketplace/slugify.ts
// Harbourview Marketplace v1 — URL-safe slug generator with collision suffix

export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);

  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}
