// ── DSA data (22 patterns) ───────────────────────────
import { twoPointers } from './dsa/two-pointers';
import { slidingWindow } from './dsa/sliding-window';
import { prefixSum } from './dsa/prefix-sum';
import { hashing } from './dsa/hashing';
import { fastSlowPointer } from './dsa/fast-slow-pointer';
import { binarySearch } from './dsa/binary-search';
import { recursionBacktracking } from './dsa/recursion-backtracking';
import { divideAndConquer } from './dsa/divide-and-conquer';
import { greedy } from './dsa/greedy';
import { dp } from './dsa/dp';
import { kadanesAlgorithm } from './dsa/kadanes-algorithm';
import { stack } from './dsa/stack';
import { monotonicStack } from './dsa/monotonic-stack';
import { queue } from './dsa/queue';
import { dfs } from './dsa/dfs';
import { graphs } from './dsa/graphs';
import { trees } from './dsa/trees';
import { heap } from './dsa/heap';
import { bitManipulation } from './dsa/bit-manipulation';
import { trie } from './dsa/trie';
import { unionFind } from './dsa/union-find';
import { topologicalSort } from './dsa/topological-sort';

// ── Categories ───────────────────────────────────────
export { categories, getCategoryBySlug } from './categories';

// ── Regular topics now live in Firestore (admin_notes + user_notes). ──
// The hardcoded topic data files were removed; only DSA stays static.
export const allTopics = [];

// ── All DSA topics (22 patterns, ordered) ────────────
export const allDSATopics = [
  twoPointers,
  slidingWindow,
  prefixSum,
  hashing,
  fastSlowPointer,
  binarySearch,
  recursionBacktracking,
  divideAndConquer,
  greedy,
  dp,
  kadanesAlgorithm,
  stack,
  monotonicStack,
  queue,
  dfs,
  graphs,
  trees,
  heap,
  bitManipulation,
  trie,
  unionFind,
  topologicalSort,
];

// ── Combined (for global search) ─────────────────────
export const allContent = [...allTopics, ...allDSATopics];

// ── Lookup maps (built once at import time) ──────────
const dsaBySlug = new Map();
allDSATopics.forEach((t) => dsaBySlug.set(t.slug, t));

const contentBySlug = new Map();
allContent.forEach((t) => contentBySlug.set(t.slug, t));

// ── Lookup functions ─────────────────────────────────

/** Get a regular topic by slug — always null now (regular topics live in Firestore). */
export function getTopicBySlug() {
  return null;
}

/** Get a DSA topic by slug */
export function getDSATopicBySlug(slug) {
  return dsaBySlug.get(slug) || null;
}

/** Get any content item by slug (topic or DSA) */
export function getContentBySlug(slug) {
  return contentBySlug.get(slug) || null;
}

/** Get all topics belonging to a category — always empty now. Use `useAllContent().getTopicsByCategory` for the live merged result. */
export function getTopicsByCategory() {
  return [];
}

/** Resolve an array of slugs to their content objects (DSA only at the static layer) */
export function resolveRelatedTopics(slugs = []) {
  return slugs
    .map((slug) => contentBySlug.get(slug))
    .filter(Boolean);
}
