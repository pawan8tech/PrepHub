import { createDSATopic } from '../schema';

export const divideAndConquer = createDSATopic({
  id: 'dsa-divide-and-conquer',
  title: 'Divide & Conquer',
  slug: 'divide-and-conquer',
  keywords: ['merge sort', 'quick sort', 'inversions', 'split', 'merge'],
  difficulty: 'medium',
  relatedTopics: ['recursion-backtracking', 'binary-search'],
  content: {
    learning: {
      explanation: 'Divide & conquer splits a problem into smaller subproblems, solves each recursively, and combines results. Classic examples: merge sort (O(n log n)), quick sort, and count inversions.',
      whenToUse: 'Sorting, counting inversions, closest pair of points, problems that naturally decompose into independent halves.',
      patternRecognition: '"Sort efficiently" → merge/quick sort. "Count inversions" → modified merge sort. "Split and combine" → D&C.',
      keyPoints: [
        'Three steps: divide, conquer (recurse), combine',
        'Merge sort is stable, O(n log n) worst case',
        'Quick sort is O(n log n) average, O(n²) worst case',
        'Count inversions is a classic merge sort modification',
      ],
    },
    interview: {
      explanation: 'D&C recursively breaks problems in half. Merge sort guarantees O(n log n). Count inversions modifies the merge step.',
      importantPoints: [
        'Merge sort: stable, predictable O(n log n)',
        'Quick sort: in-place but O(n²) worst case — use random pivot',
        'Master theorem gives time complexity for D&C recurrences',
      ],
    },
  },
  questions: [
    { id: 'merge-sort', title: 'Merge Sort', url: 'https://leetcode.com/problems/sort-an-array/', difficulty: 'medium', pattern: 'divide-conquer', sheet: 'striver' },
    { id: 'count-inversions', title: 'Count Inversions', url: 'https://www.geeksforgeeks.org/problems/inversion-of-array-1587115620/1', difficulty: 'medium', pattern: 'merge-sort-variant', sheet: 'striver' },
    { id: 'merge-sort-gfg', title: 'Merge Sort', url: 'https://www.geeksforgeeks.org/problems/merge-sort/1', difficulty: 'medium', pattern: 'divide-conquer', sheet: 'love-babbar' },
    { id: 'quick-sort', title: 'Quick Sort', url: 'https://www.geeksforgeeks.org/problems/quick-sort/1', difficulty: 'medium', pattern: 'divide-conquer', sheet: 'love-babbar' },
    { id: 'count-inversions-gfg', title: 'Count Inversions', url: 'https://www.geeksforgeeks.org/problems/inversion-of-array-1587115620/1', difficulty: 'medium', pattern: 'merge-sort-variant', sheet: 'love-babbar' },
  ],
  externalLinks: [
    { title: 'Merge Sort Visualizer', url: 'https://visualgo.net/en/sorting' },
  ],
});
