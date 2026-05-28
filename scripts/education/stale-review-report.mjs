const REVIEW_WINDOW_DAYS = 90

function isStale(lastReviewedAt) {
  if (!lastReviewedAt) return true
  const reviewed = new Date(lastReviewedAt)
  const ageMs = Date.now() - reviewed.getTime()
  return ageMs > REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000
}

const fixtures = [
  { slug: 'clinical-governance-foundations', lastReviewedAt: '2026-05-01T00:00:00.000Z' },
  { slug: 'legacy-article', lastReviewedAt: '2025-01-01T00:00:00.000Z' },
]

const stale = fixtures.filter((item) => isStale(item.lastReviewedAt)).map((item) => item.slug)
console.log(JSON.stringify({ staleCount: stale.length, stale }, null, 2))
