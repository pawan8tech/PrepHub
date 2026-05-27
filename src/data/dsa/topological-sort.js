import { createDSATopic } from '../schema';

export const topologicalSort = createDSATopic({
  id: 'dsa-topological-sort',
  title: 'Topological Sort',
  slug: 'topological-sort',
  keywords: ['topological order', 'DAG', 'kahn', 'course schedule', 'dependency', 'alien dictionary'],
  difficulty: 'medium',
  relatedTopics: ['graph', 'dfs', 'queue'],
  content: {
    learning: {
      explanation: 'Topological sort orders vertices of a DAG (directed acyclic graph) such that for every edge u→v, u comes before v. Two approaches: Kahn\'s (BFS with in-degree) and DFS-based (reverse post-order).',
      whenToUse: 'Dependency resolution, course prerequisites, build systems, task scheduling, alien dictionary.',
      patternRecognition: '"Order with dependencies" → topological sort. "Can all courses be completed?" → detect cycle via topo sort. "Alien dictionary" → build graph from orderings, topo sort.',
      keyPoints: [
        'Only works on DAGs — cycle means no valid ordering',
        'Kahn\'s: BFS using in-degree array, process nodes with in-degree 0',
        'DFS-based: run DFS, add to stack on finish — reverse gives topo order',
        'If not all nodes processed → cycle exists',
      ],
    },
    interview: {
      explanation: 'Topo sort linearizes DAG dependencies. Kahn\'s uses BFS + in-degree. Also detects cycles if not all nodes are processed.',
      importantPoints: [
        'Kahn\'s is often preferred in interviews for clarity',
        'Cycle detection: if processed count < total nodes → cycle',
        'Alien dictionary: compare adjacent words to build edges',
      ],
    },
  },
  questions: [
    { id: 'course-schedule', title: 'Course Schedule', url: 'https://leetcode.com/problems/course-schedule/', difficulty: 'medium', pattern: 'topological-sort', sheet: 'striver' },
    { id: 'alien-dictionary', title: 'Alien Dictionary', url: 'https://leetcode.com/problems/alien-dictionary/', difficulty: 'hard', pattern: 'topological-sort', sheet: 'striver' },
    { id: 'topological-sort-dfs-bfs', title: 'Topological Sort (DFS & BFS)', url: 'https://www.geeksforgeeks.org/problems/topological-sort/1', difficulty: 'medium', pattern: 'topological-sort', sheet: 'love-babbar' },
  ],
  externalLinks: [
    { title: 'Topological Sort — Striver', url: 'https://takeuforward.org/graph/topological-sort-bfs/' },
  ],
});
