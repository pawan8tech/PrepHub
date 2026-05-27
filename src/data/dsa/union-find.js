import { createDSATopic } from '../schema';

export const unionFind = createDSATopic({
  id: 'dsa-union-find',
  title: 'Union Find (DSU)',
  slug: 'union-find',
  keywords: ['DSU', 'union', 'find', 'path compression', 'rank', 'connected components', 'kruskal'],
  difficulty: 'medium',
  relatedTopics: ['graph', 'tree'],
  content: {
    learning: {
      explanation: 'Union-Find (Disjoint Set Union) tracks elements partitioned into non-overlapping sets. Supports near O(1) union and find operations with path compression and union by rank.',
      whenToUse: 'Dynamic connectivity, connected components, cycle detection in undirected graphs, Kruskal\'s MST.',
      patternRecognition: '"Are nodes connected?" → Union-Find. "Number of connected components" → Union-Find. "MST" → Kruskal + Union-Find.',
      keyPoints: [
        'Find: returns the root representative of a set',
        'Union: merges two sets',
        'Path compression: flatten tree during find for near O(1)',
        'Union by rank/size: attach smaller tree under larger',
        'With both optimizations: amortized O(α(n)) ≈ O(1)',
      ],
    },
    interview: {
      explanation: 'DSU provides near-O(1) union/find for dynamic connectivity. Path compression + union by rank give amortized O(α(n)).',
      importantPoints: [
        'Path compression: point every node directly to root during find',
        'Union by rank: prevents tree from becoming linear',
        'Kruskal MST: sort edges, union if different components',
      ],
    },
  },
  questions: [
    { id: 'number-of-provinces', title: 'Number of Provinces', url: 'https://leetcode.com/problems/number-of-provinces/', difficulty: 'medium', pattern: 'union-find', sheet: 'striver' },
    { id: 'accounts-merge', title: 'Accounts Merge', url: 'https://leetcode.com/problems/accounts-merge/', difficulty: 'medium', pattern: 'union-find', sheet: 'striver' },
    { id: 'dsu-implementation', title: 'Disjoint Set Implementation', url: 'https://www.geeksforgeeks.org/problems/disjoint-set-union-find/1', difficulty: 'medium', pattern: 'union-find', sheet: 'love-babbar' },
    { id: 'kruskal-algorithm', title: 'Kruskal Algorithm', url: 'https://www.geeksforgeeks.org/problems/minimum-spanning-tree/1', difficulty: 'medium', pattern: 'mst', sheet: 'love-babbar' },
  ],
  externalLinks: [
    { title: 'DSU — Striver Graph Series', url: 'https://takeuforward.org/graph/disjoint-set-union-by-rank-union-by-size/' },
  ],
});
