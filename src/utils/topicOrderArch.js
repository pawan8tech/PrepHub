/**
 * Pure helpers for sidebar topic ordering.
 *
 * The order is stored as `string[]` of topic slugs. Topics whose slug is not
 * in the list (e.g. newly added custom topics, or admin-added topics after
 * a user already reordered) get appended at the end, preserving their input
 * order. Unknown slugs in the saved list are dropped on read.
 */

export function applyOrder(orderedSlugs, topics) {
  if (!Array.isArray(topics) || topics.length === 0) return [];
  if (!Array.isArray(orderedSlugs) || orderedSlugs.length === 0) return [...topics];

  const known = new Set(orderedSlugs);
  const bySlug = new Map();
  for (const t of topics) {
    if (t && typeof t.slug === 'string') bySlug.set(t.slug, t);
  }

  const ordered = [];
  for (const slug of orderedSlugs) {
    const t = bySlug.get(slug);
    if (t) ordered.push(t);
  }
  for (const t of topics) {
    if (!t || typeof t.slug !== 'string') continue;
    if (!known.has(t.slug)) ordered.push(t);
  }
  return ordered;
}

export function moveItem(arr, from, to) {
  if (!Array.isArray(arr)) return arr;
  if (from === to || from < 0 || from >= arr.length || to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
