import { createDSATopic } from '../schema';

export const dp = createDSATopic({
  id: 'dsa-dp',
  title: 'Dynamic Programming',
  slug: 'dp',
  keywords: ['memoization', 'tabulation', 'overlapping subproblems', 'optimal substructure', 'state transition'],
  difficulty: 'hard',
  relatedTopics: ['recursion-backtracking', 'graph', 'tree', 'greedy'],
  content: {
    learning: {
      explanation:
        'Dynamic programming solves complex problems by breaking them into overlapping subproblems and storing results to avoid redundant computation. Two approaches: top-down (memoization) and bottom-up (tabulation).',
      whenToUse: 'When the problem has overlapping subproblems and optimal substructure — typically optimization or counting problems.',
      patternRecognition:
        '"Minimum/maximum cost", "number of ways", "is it possible" → likely DP. Look for choices at each step and repeating subproblems.',
      keyPoints: [
        'Top-down: recursive + memo cache (easier to write)',
        'Bottom-up: iterative + table (usually faster, no stack overhead)',
        'State definition is the hardest part — what info do you need at each step?',
        'Common patterns: 1D (fibonacci), 2D (grid), knapsack, LCS, interval DP',
        'Space optimization: often only need previous row/state',
      ],
    },
    interview: {
      explanation: 'DP stores solutions to subproblems to avoid recomputation. Define state → recurrence → base case → direction.',
      importantPoints: [
        'Always start with brute-force recursion, then add memoization',
        'State transition / recurrence relation is the core of every DP problem',
        'Optimize space when possible (rolling array)',
        'Practice recognizing DP vs greedy — DP when greedy fails to be optimal',
      ],
      commonQuestions: [
        { q: 'How do you identify a DP problem?', a: 'Look for: optimal substructure, overlapping subproblems, choices at each step. Keywords: minimum, maximum, count, ways, possible.' },
      ],
    },
  },
  questions: [
    { id: 'frog-jump', title: 'Frog Jump', url: 'https://www.geeksforgeeks.org/problems/geek-jump/1', difficulty: 'easy', pattern: '1D-DP', sheet: 'striver' },
    { id: 'house-robber', title: 'House Robber', url: 'https://leetcode.com/problems/house-robber/', difficulty: 'medium', pattern: '1D-DP', sheet: 'striver' },
    { id: 'longest-increasing-subsequence', title: 'LIS', url: 'https://leetcode.com/problems/longest-increasing-subsequence/', difficulty: 'medium', pattern: '1D-DP', sheet: 'striver' },
    { id: 'longest-common-subsequence', title: 'LCS', url: 'https://leetcode.com/problems/longest-common-subsequence/', difficulty: 'medium', pattern: '2D-DP', sheet: 'striver' },
    { id: 'edit-distance', title: 'Edit Distance', url: 'https://leetcode.com/problems/edit-distance/', difficulty: 'medium', pattern: '2D-DP', sheet: 'striver' },
    { id: '0-1-knapsack', title: '0/1 Knapsack', url: 'https://www.geeksforgeeks.org/problems/0-1-knapsack-problem0945/1', difficulty: 'medium', pattern: 'knapsack', sheet: 'love-babbar' },
    { id: 'coin-change', title: 'Coin Change', url: 'https://leetcode.com/problems/coin-change/', difficulty: 'medium', pattern: 'unbounded-knapsack', sheet: 'love-babbar' },
    { id: 'lcs-gfg', title: 'Longest Common Subsequence', url: 'https://www.geeksforgeeks.org/problems/longest-common-subsequence-1587115620/1', difficulty: 'medium', pattern: '2D-DP', sheet: 'love-babbar' },
    { id: 'matrix-chain-multiplication', title: 'Matrix Chain Multiplication', url: 'https://www.geeksforgeeks.org/problems/matrix-chain-multiplication0303/1', difficulty: 'hard', pattern: 'interval-DP', sheet: 'love-babbar' },
    { id: 'egg-dropping', title: 'Egg Dropping Problem', url: 'https://www.geeksforgeeks.org/problems/egg-dropping-puzzle-1587115620/1', difficulty: 'hard', pattern: 'interval-DP', sheet: 'love-babbar' },
  ],
});
