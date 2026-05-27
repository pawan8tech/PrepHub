import { createDSATopic } from '../schema';

export const greedy = createDSATopic({
  id: 'dsa-greedy',
  title: 'Greedy',
  slug: 'greedy',
  keywords: ['locally optimal', 'activity selection', 'intervals', 'job sequencing', 'knapsack fractional'],
  difficulty: 'medium',
  relatedTopics: ['dp', 'binary-search'],
  content: {
    learning: {
      explanation: 'Greedy algorithms make the locally optimal choice at each step, hoping to find a global optimum. They work when the problem has the greedy-choice property and optimal substructure.',
      whenToUse: 'Interval scheduling, activity selection, fractional knapsack, minimum coins (canonical systems), job sequencing.',
      patternRecognition: '"Maximize/minimize with intervals" → sort by end time/deadline. "Fractional selection" → greedy by value/weight ratio.',
      keyPoints: [
        'Greedy works only when local optimum leads to global optimum',
        'Often requires sorting first (by deadline, end time, ratio, etc.)',
        'Proof of correctness: exchange argument or greedy stays ahead',
        'If greedy fails → usually need DP',
      ],
    },
    interview: {
      explanation: 'Greedy picks the best local option each step. Works for intervals, scheduling, and fractional optimization. Fails when all subproblems must be considered (use DP instead).',
      importantPoints: [
        'Sort first — most greedy solutions start with sorting',
        'Greedy vs DP: greedy makes one choice and never reconsiders',
        'Activity selection: sort by finish time, pick non-overlapping',
        'Job sequencing: sort by profit, fill latest available slot',
      ],
    },
  },
  questions: [
    { id: 'assign-cookies', title: 'Assign Cookies', url: 'https://leetcode.com/problems/assign-cookies/', difficulty: 'easy', pattern: 'greedy', sheet: 'striver' },
    { id: 'job-sequencing', title: 'Job Sequencing', url: 'https://www.geeksforgeeks.org/problems/job-sequencing-problem-1587115620/1', difficulty: 'medium', pattern: 'greedy', sheet: 'striver' },
    { id: 'merge-intervals', title: 'Merge Intervals', url: 'https://leetcode.com/problems/merge-intervals/', difficulty: 'medium', pattern: 'intervals', sheet: 'striver' },
    { id: 'activity-selection', title: 'Activity Selection', url: 'https://www.geeksforgeeks.org/problems/activity-selection-1587115620/1', difficulty: 'easy', pattern: 'greedy', sheet: 'love-babbar' },
    { id: 'fractional-knapsack', title: 'Fractional Knapsack', url: 'https://www.geeksforgeeks.org/problems/fractional-knapsack-1587115620/1', difficulty: 'medium', pattern: 'greedy', sheet: 'love-babbar' },
    { id: 'job-sequencing-gfg', title: 'Job Sequencing Problem', url: 'https://www.geeksforgeeks.org/problems/job-sequencing-problem-1587115620/1', difficulty: 'medium', pattern: 'greedy', sheet: 'love-babbar' },
    { id: 'minimum-number-of-coins', title: 'Minimum Number of Coins', url: 'https://www.geeksforgeeks.org/problems/-minimum-number-of-coins4426/1', difficulty: 'easy', pattern: 'greedy', sheet: 'love-babbar' },
  ],
  externalLinks: [
    { title: 'Striver Greedy Algorithms', url: 'https://takeuforward.org/greedy/greedy-algorithm/' },
  ],
});
