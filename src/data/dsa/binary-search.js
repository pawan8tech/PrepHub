import { createDSATopic } from '../schema';

export const binarySearch = createDSATopic({
  id: 'dsa-binary-search',
  title: 'Binary Search',
  slug: 'binary-search',
  keywords: ['sorted', 'search space', 'mid', 'lower bound', 'upper bound', 'monotonic'],
  difficulty: 'medium',
  relatedTopics: ['two-pointers', 'divide-and-conquer'],
  content: {
    learning: {
      explanation:
        'Binary search halves the search space each step, achieving O(log n). It works on sorted data or any monotonic condition.',
      whenToUse: 'Sorted arrays, searching for boundaries, optimizing over a monotonic search space ("minimum X such that...").',
      patternRecognition:
        '"Find minimum/maximum satisfying condition" → binary search on answer. Sorted input → direct binary search.',
      keyPoints: [
        'Classic: search for value in sorted array',
        'Lower bound / upper bound variants',
        'Binary search on answer: when the condition is monotonic',
        'Be careful with integer overflow: mid = lo + (hi - lo) / 2',
      ],
    },
    interview: {
      explanation: 'Binary search reduces search from O(n) to O(log n) by halving the search space. Works on sorted data or monotonic predicates.',
      importantPoints: [
        'Template matters: inclusive vs exclusive bounds',
        'Binary search on answer is a powerful technique for optimization problems',
        'Edge cases: empty array, single element, target not found',
      ],
    },
  },
  questions: [
    { id: 'search-in-rotated-sorted-array', title: 'Search in Rotated Sorted Array', url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/', difficulty: 'medium', pattern: 'modified', sheet: 'striver' },
    { id: 'find-peak-element', title: 'Find Peak Element', url: 'https://leetcode.com/problems/find-peak-element/', difficulty: 'medium', pattern: 'binary-search', sheet: 'striver' },
    { id: 'median-of-two-sorted-arrays', title: 'Median of Two Sorted Arrays', url: 'https://leetcode.com/problems/median-of-two-sorted-arrays/', difficulty: 'hard', pattern: 'binary-search', sheet: 'striver' },
    { id: 'binary-search', title: 'Binary Search', url: 'https://leetcode.com/problems/binary-search/', difficulty: 'easy', pattern: 'classic', sheet: 'love-babbar' },
    { id: 'square-root-of-number', title: 'Square Root of a Number', url: 'https://www.geeksforgeeks.org/problems/square-root/0', difficulty: 'easy', pattern: 'search-on-answer', sheet: 'love-babbar' },
    { id: 'allocate-minimum-pages', title: 'Allocate Minimum Pages', url: 'https://www.geeksforgeeks.org/problems/allocate-minimum-number-of-pages0937/1', difficulty: 'hard', pattern: 'search-on-answer', sheet: 'love-babbar' },
    { id: 'aggressive-cows', title: 'Aggressive Cows', url: 'https://www.geeksforgeeks.org/problems/aggressive-cows/0', difficulty: 'hard', pattern: 'search-on-answer', sheet: 'love-babbar' },
  ],
});
