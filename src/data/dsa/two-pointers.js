import { createDSATopic } from '../schema';

export const twoPointers = createDSATopic({
  id: 'dsa-two-pointers',
  title: 'Two Pointers',
  slug: 'two-pointers',
  keywords: ['left right', 'converging pointers', 'fast slow', 'pair sum', 'sorted'],
  difficulty: 'easy',
  relatedTopics: ['sliding-window', 'fast-slow-pointer', 'binary-search'],
  content: {
    learning: {
      explanation:
        'Two pointers uses two indices moving through a data structure (usually from both ends or at different speeds) to solve problems in O(n) instead of O(n²).',
      whenToUse: 'Sorted arrays, pair-sum problems, palindrome checks, removing duplicates, linked list cycle detection.',
      patternRecognition:
        'Converging pointers (left/right) for sorted pair problems. Fast/slow pointers for cycle detection or middle finding.',
      keyPoints: [
        'Converging: start from both ends, move inward based on condition',
        'Fast/slow: one pointer moves 2x speed — finds cycles or midpoints',
        'Often requires sorted input for converging pattern',
        'Reduces nested loops from O(n²) to O(n)',
      ],
    },
    interview: {
      explanation: 'Two pointers eliminate nested loops by moving two indices strategically through the data structure.',
      importantPoints: [
        'Works best on sorted data or when direction of movement is deterministic',
        'Fast/slow pointer detects cycles in O(1) space',
        'Three-pointer variant for 3Sum problem',
      ],
    },
  },
  questions: [
    { id: 'remove-duplicates-from-sorted-array', title: 'Remove Duplicates from Sorted Array', url: 'https://leetcode.com/problems/remove-duplicates-from-sorted-array/', difficulty: 'easy', pattern: 'read-write', sheet: 'striver' },
    { id: 'move-zeroes', title: 'Move Zeroes', url: 'https://leetcode.com/problems/move-zeroes/', difficulty: 'easy', pattern: 'read-write', sheet: 'striver' },
    { id: 'container-with-most-water', title: 'Container With Most Water', url: 'https://leetcode.com/problems/container-with-most-water/', difficulty: 'medium', pattern: 'converging', sheet: 'striver' },
    { id: 'three-sum', title: '3Sum', url: 'https://leetcode.com/problems/3sum/', difficulty: 'medium', pattern: 'converging', sheet: 'striver' },
    { id: 'four-sum', title: '4Sum', url: 'https://leetcode.com/problems/4sum/', difficulty: 'medium', pattern: 'converging', sheet: 'striver' },
    { id: 'reverse-the-array', title: 'Reverse the Array', url: 'https://www.geeksforgeeks.org/problems/reverse-an-array/0', difficulty: 'easy', pattern: 'two-pointers', sheet: 'love-babbar' },
    { id: 'sort-colors', title: 'Sort Colors (Dutch National Flag)', url: 'https://leetcode.com/problems/sort-colors/', difficulty: 'medium', pattern: 'three-pointer', sheet: 'love-babbar' },
    { id: 'merge-sorted-arrays', title: 'Merge Sorted Arrays', url: 'https://leetcode.com/problems/merge-sorted-array/', difficulty: 'easy', pattern: 'two-pointers', sheet: 'love-babbar' },
    { id: 'move-negative-numbers', title: 'Move All Negative Numbers to Beginning', url: 'https://www.geeksforgeeks.org/problems/move-all-negative-elements-to-end1813/1', difficulty: 'easy', pattern: 'two-pointers', sheet: 'love-babbar' },
    { id: 'find-pair-with-given-sum', title: 'Find Pair with Given Sum', url: 'https://www.geeksforgeeks.org/problems/find-pair-given-difference1559/1', difficulty: 'easy', pattern: 'two-pointers', sheet: 'love-babbar' },
  ],
});
