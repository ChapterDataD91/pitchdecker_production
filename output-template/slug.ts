// ---------------------------------------------------------------------------
// Candidate slug generation.
// Slugs are computed at render time (not stored) so renaming a candidate in
// the editor stays consistent — the URL updates on next publish.
//
// Collisions (two candidates with the same slugified name) are resolved by
// appending -2, -3, … in stable order (by ranking, then id).
// ---------------------------------------------------------------------------

import type { Candidate } from '@/lib/types'

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function ensureUniqueSlugs(
  candidates: readonly Candidate[],
): Map<string, string> {
  // Stable ordering: ranking ascending (lower = more important), then id.
  const sorted = [...candidates].sort((a, b) => {
    if (a.ranking !== b.ranking) return a.ranking - b.ranking
    return a.id.localeCompare(b.id)
  })

  const used = new Map<string, number>()
  const result = new Map<string, string>()

  for (const c of sorted) {
    const base = slugify(c.name || c.id) || c.id
    const count = used.get(base) ?? 0
    const slug = count === 0 ? base : `${base}-${count + 1}`
    used.set(base, count + 1)
    result.set(c.id, slug)
  }

  return result
}
