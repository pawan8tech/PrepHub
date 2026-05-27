import { createDSATopic } from '../schema';

export const recursionBacktracking = createDSATopic({
  id: 'dsa-recursion-backtracking',
  title: 'Recursion / Backtracking',
  slug: 'recursion-backtracking',
  keywords: ['subsets', 'permutations', 'combinations', 'pruning', 'decision tree', 'base case'],
  difficulty: 'medium',
  relatedTopics: ['dp', 'divide-and-conquer', 'tree'],
  content: {
    learning: {
      explanation: 'Recursion solves problems by breaking them into smaller identical subproblems. Backtracking extends recursion by building candidates incrementally and pruning paths that can\'t lead to valid solutions.',
      whenToUse: 'Generating subsets/permutations/combinations, constraint satisfaction (N-Queens, Sudoku), exploring all possible paths.',
      patternRecognition: '"Generate all" → backtracking. "All subsets/permutations" → recursive generation with include/exclude. "Place N items with constraints" → backtracking with pruning.',
      keyPoints: [
        'Base case + recursive case is the structure of every recursive solution',
        'Backtracking = recursion + pruning invalid branches early',
        'Time complexity is often exponential (2^n for subsets, n! for permutations)',
        'Use "choose → explore → unchoose" pattern for backtracking',
      ],
    },
    interview: {
      explanation: 'Recursion breaks problems into subproblems. Backtracking prunes invalid paths early to explore solution space efficiently.',
      importantPoints: [
        'Always define clear base cases',
        'Backtracking avoids TLE by pruning early',
        'Distinguish subsets (2^n) vs permutations (n!) vs combinations (nCr)',
        'Memoization converts recursion to DP if subproblems overlap',
      ],
    },
  },
  questions: [
    { id: 'subsets', title: 'Subsets', url: 'https://leetcode.com/problems/subsets/', difficulty: 'medium', pattern: 'backtracking', sheet: 'striver' },
    { id: 'combination-sum', title: 'Combination Sum', url: 'https://leetcode.com/problems/combination-sum/', difficulty: 'medium', pattern: 'backtracking', sheet: 'striver' },
    { id: 'n-queens', title: 'N Queens', url: 'https://leetcode.com/problems/n-queens/', difficulty: 'hard', pattern: 'backtracking', sheet: 'striver' },
    { id: 'sudoku-solver', title: 'Sudoku Solver', url: 'https://leetcode.com/problems/sudoku-solver/', difficulty: 'hard', pattern: 'backtracking', sheet: 'striver' },
    { id: 'print-all-subsets', title: 'Print All Subsets', url: 'https://www.geeksforgeeks.org/problems/subsets-1613027340/1', difficulty: 'medium', pattern: 'recursion', sheet: 'love-babbar' },
    { id: 'permutations-of-string', title: 'Permutations of String', url: 'https://www.geeksforgeeks.org/problems/permutations-of-a-given-string2041/1', difficulty: 'medium', pattern: 'backtracking', sheet: 'love-babbar' },
    { id: 'rat-in-a-maze', title: 'Rat in a Maze', url: 'https://www.geeksforgeeks.org/problems/rat-in-a-maze-problem/1', difficulty: 'medium', pattern: 'backtracking', sheet: 'love-babbar' },
    { id: 'n-queens-gfg', title: 'N-Queens Problem', url: 'https://www.geeksforgeeks.org/problems/n-queen-problem0315/1', difficulty: 'hard', pattern: 'backtracking', sheet: 'love-babbar' },
  ],
  externalLinks: [
    { title: 'Striver Recursion Series', url: 'https://takeuforward.org/recursion/introduction-to-recursion/' },
  ],
});
