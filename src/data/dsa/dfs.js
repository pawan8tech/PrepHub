import { createDSATopic } from '../schema';

export const dfs = createDSATopic({
  id: 'dsa-dfs',
  title: 'DFS',
  slug: 'dfs',
  keywords: ['depth first', 'recursion', 'backtrack', 'connected component', 'flood fill', 'grid'],
  difficulty: 'medium',
  relatedTopics: ['graph', 'tree', 'recursion-backtracking', 'stack'],
  content: {
    learning: {
      explanation: 'Depth-First Search explores as deep as possible along each branch before backtracking. It uses recursion or an explicit stack. DFS is fundamental for graph/tree traversal, connectivity, and pathfinding.',
      whenToUse: 'Connected components, cycle detection, topological sorting, flood fill, pathfinding in grids/graphs.',
      patternRecognition: '"Number of islands/components" → DFS + visited. "Flood fill" → DFS on grid. "All paths" → DFS backtracking.',
      keyPoints: [
        'Uses recursion (implicit stack) or explicit stack',
        'Mark nodes visited to avoid infinite loops',
        'Grid DFS: 4-directional or 8-directional neighbors',
        'Time: O(V + E) for adjacency list representation',
      ],
    },
    interview: {
      explanation: 'DFS explores depth-first using recursion or stack. O(V+E) time. Essential for connectivity, cycle detection, and grid problems.',
      importantPoints: [
        'Always track visited nodes/cells',
        'Grid DFS uses boundary checks + visited matrix',
        'DFS vs BFS: DFS for exhaustive search, BFS for shortest path (unweighted)',
      ],
    },
  },
  questions: [
    { id: 'number-of-islands', title: 'Number of Islands', url: 'https://leetcode.com/problems/number-of-islands/', difficulty: 'medium', pattern: 'grid-dfs', sheet: 'striver' },
    { id: 'flood-fill', title: 'Flood Fill', url: 'https://leetcode.com/problems/flood-fill/', difficulty: 'easy', pattern: 'grid-dfs', sheet: 'striver' },
    { id: 'dfs-traversal', title: 'DFS Traversal', url: 'https://www.geeksforgeeks.org/problems/depth-first-traversal-for-a-graph/1', difficulty: 'easy', pattern: 'graph-dfs', sheet: 'love-babbar' },
    { id: 'count-islands-gfg', title: 'Count Number of Islands', url: 'https://www.geeksforgeeks.org/problems/find-the-number-of-islands/1', difficulty: 'medium', pattern: 'grid-dfs', sheet: 'love-babbar' },
  ],
  externalLinks: [
    { title: 'DFS — Striver Graph Series', url: 'https://takeuforward.org/graph/depth-first-search-dfs/' },
  ],
});
