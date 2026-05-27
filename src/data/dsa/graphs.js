import { createDSATopic } from '../schema';

export const graphs = createDSATopic({
  id: 'dsa-graphs',
  title: 'Graph',
  slug: 'graph',
  keywords: ['adjacency list', 'adjacency matrix', 'traversal', 'connected components', 'topological sort', 'shortest path'],
  difficulty: 'hard',
  relatedTopics: ['tree', 'queue', 'dfs', 'topological-sort'],
  content: {
    learning: {
      explanation:
        'A graph is a collection of nodes (vertices) connected by edges. Graphs can be directed or undirected, weighted or unweighted, cyclic or acyclic.',
      whenToUse: 'Network problems, shortest path, connectivity, dependency resolution, maze solving.',
      patternRecognition:
        '"Connected components" → DFS/BFS + visited set. "Shortest path (unweighted)" → BFS. "Dependency order" → topological sort. "Shortest path (weighted)" → Dijkstra.',
      keyPoints: [
        'Representations: adjacency list (sparse) vs adjacency matrix (dense)',
        'DFS: explore as deep as possible — uses stack/recursion',
        'BFS: explore level by level — uses queue, gives shortest path for unweighted',
        'Topological sort: only for DAGs — Kahn\'s (BFS) or DFS-based',
        'Cycle detection: DFS with coloring or Union-Find',
      ],
    },
    interview: {
      explanation: 'Graphs model connections between entities. DFS/BFS traverse them. BFS gives shortest path in unweighted graphs.',
      importantPoints: [
        'Adjacency list is preferred for sparse graphs (most problems)',
        'Always track visited nodes to avoid infinite loops',
        'Topological sort is essential for dependency-resolution problems',
        'Union-Find is efficient for dynamic connectivity',
      ],
    },
  },
  questions: [
    { id: 'dijkstra', title: 'Dijkstra', url: 'https://www.geeksforgeeks.org/problems/implementing-dijkstra-set-1-adjacency-matrix/1', difficulty: 'medium', pattern: 'shortest-path', sheet: 'striver' },
    { id: 'bellman-ford', title: 'Bellman Ford', url: 'https://www.geeksforgeeks.org/problems/distance-from-the-source-bellman-ford-algorithm/1', difficulty: 'medium', pattern: 'shortest-path', sheet: 'striver' },
    { id: 'topological-sort-graph', title: 'Topological Sort', url: 'https://www.geeksforgeeks.org/problems/topological-sort/1', difficulty: 'medium', pattern: 'topological-sort', sheet: 'striver' },
    { id: 'bfs-of-graph', title: 'BFS of Graph', url: 'https://www.geeksforgeeks.org/problems/bfs-traversal-of-graph/1', difficulty: 'easy', pattern: 'BFS', sheet: 'love-babbar' },
    { id: 'dfs-of-graph', title: 'DFS of Graph', url: 'https://www.geeksforgeeks.org/problems/depth-first-traversal-for-a-graph/1', difficulty: 'easy', pattern: 'DFS', sheet: 'love-babbar' },
    { id: 'cycle-detection-graph', title: 'Cycle Detection', url: 'https://www.geeksforgeeks.org/problems/detect-cycle-in-an-undirected-graph/1', difficulty: 'medium', pattern: 'DFS', sheet: 'love-babbar' },
    { id: 'topological-sort-gfg', title: 'Topological Sort', url: 'https://www.geeksforgeeks.org/problems/topological-sort/1', difficulty: 'medium', pattern: 'topological-sort', sheet: 'love-babbar' },
  ],
});
