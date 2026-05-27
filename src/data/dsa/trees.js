import { createDSATopic } from '../schema';

export const trees = createDSATopic({
  id: 'dsa-trees',
  title: 'Tree',
  slug: 'tree',
  keywords: ['root', 'node', 'leaf', 'DFS', 'BFS', 'inorder', 'preorder', 'postorder', 'height'],
  difficulty: 'medium',
  relatedTopics: ['graph', 'stack', 'queue', 'dfs'],
  content: {
    learning: {
      explanation:
        'A tree is a hierarchical data structure with a root node and child nodes forming a connected acyclic graph. Binary trees have at most two children per node. BSTs maintain sorted order.',
      whenToUse: 'Hierarchical data, searching (BST), prefix matching (Trie), expression parsing, and file systems.',
      patternRecognition:
        '"Tree traversal" → DFS (recursive or stack) or BFS (queue). "Validate BST" → inorder must be sorted. "Lowest common ancestor" → recursive DFS.',
      keyPoints: [
        'DFS: inorder (left-root-right), preorder (root-left-right), postorder (left-right-root)',
        'BFS: level-order using a queue',
        'BST: left < root < right — enables O(log n) search in balanced trees',
        'Height of a tree = 1 + max(height(left), height(right))',
        'Recursive solutions are natural for trees',
      ],
    },
    interview: {
      explanation: 'Trees are hierarchical structures traversed via DFS or BFS. BSTs enable O(log n) search when balanced.',
      importantPoints: [
        'Know all three DFS orders and when each is useful',
        'BST property: inorder traversal gives sorted output',
        'Balanced BST (AVL, Red-Black) guarantees O(log n) operations',
      ],
    },
  },
  questions: [
    { id: 'diameter-of-binary-tree', title: 'Diameter of Binary Tree', url: 'https://leetcode.com/problems/diameter-of-binary-tree/', difficulty: 'easy', pattern: 'DFS', sheet: 'striver' },
    { id: 'lowest-common-ancestor', title: 'LCA', url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/', difficulty: 'medium', pattern: 'DFS', sheet: 'striver' },
    { id: 'binary-tree-maximum-path-sum', title: 'Maximum Path Sum', url: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/', difficulty: 'hard', pattern: 'DFS', sheet: 'striver' },
    { id: 'tree-traversals', title: 'Traversals (Inorder, Preorder, Postorder)', url: 'https://www.geeksforgeeks.org/problems/tree-traversals-inorder-preorder-and-postorder/1', difficulty: 'easy', pattern: 'traversal', sheet: 'love-babbar' },
    { id: 'height-of-tree', title: 'Height of Tree', url: 'https://www.geeksforgeeks.org/problems/height-of-binary-tree/1', difficulty: 'easy', pattern: 'DFS', sheet: 'love-babbar' },
    { id: 'diameter-of-tree-gfg', title: 'Diameter of Tree', url: 'https://www.geeksforgeeks.org/problems/diameter-of-binary-tree/1', difficulty: 'easy', pattern: 'DFS', sheet: 'love-babbar' },
    { id: 'left-right-view', title: 'Left View / Right View', url: 'https://www.geeksforgeeks.org/problems/left-view-of-binary-tree/1', difficulty: 'easy', pattern: 'BFS', sheet: 'love-babbar' },
  ],
});
