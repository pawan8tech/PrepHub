import { createDSATopic } from '../schema';

export const heap = createDSATopic({
  id: 'dsa-heap',
  title: 'Heap',
  slug: 'heap',
  keywords: ['min heap', 'max heap', 'kth largest', 'median', 'top k', 'heapify'],
  difficulty: 'medium',
  relatedTopics: ['tree', 'greedy', 'binary-search'],
  content: {
    learning: {
      explanation: 'A heap is a complete binary tree where each parent is greater (max-heap) or smaller (min-heap) than its children. It supports O(log n) insert and extract, and O(1) peek. Implemented as a priority queue.',
      whenToUse: 'Top K elements, Kth largest/smallest, merge K sorted lists, running median, scheduling.',
      patternRecognition: '"Kth largest" → min-heap of size K. "Kth smallest" → max-heap of size K. "Merge K sorted" → min-heap. "Running median" → two heaps.',
      keyPoints: [
        'Min-heap: root is smallest. Max-heap: root is largest',
        'Insert: O(log n), Extract: O(log n), Peek: O(1)',
        'Heapify array: O(n) — faster than n individual inserts',
        'Two-heap pattern for median: max-heap (left half) + min-heap (right half)',
      ],
    },
    interview: {
      explanation: 'Heap gives O(log n) insert/extract and O(1) peek. Use min-heap of size K for Kth largest, two heaps for median.',
      importantPoints: [
        'Java: PriorityQueue (min-heap by default). Python: heapq (min-heap)',
        'For max-heap in languages with min-heap: negate values',
        'Merge K sorted lists: push first element of each, pop min, push next from that list',
      ],
    },
  },
  questions: [
    { id: 'kth-largest-element', title: 'Kth Largest Element', url: 'https://leetcode.com/problems/kth-largest-element-in-an-array/', difficulty: 'medium', pattern: 'heap', sheet: 'striver' },
    { id: 'find-median-from-data-stream', title: 'Median from Data Stream', url: 'https://leetcode.com/problems/find-median-from-data-stream/', difficulty: 'hard', pattern: 'two-heap', sheet: 'striver' },
    { id: 'heap-sort', title: 'Heap Sort', url: 'https://www.geeksforgeeks.org/problems/heap-sort/1', difficulty: 'medium', pattern: 'heap', sheet: 'love-babbar' },
    { id: 'k-largest-elements', title: 'K Largest Elements', url: 'https://www.geeksforgeeks.org/problems/k-largest-elements4206/1', difficulty: 'easy', pattern: 'heap', sheet: 'love-babbar' },
    { id: 'merge-k-sorted-arrays', title: 'Merge K Sorted Arrays', url: 'https://www.geeksforgeeks.org/problems/merge-k-sorted-arrays/1', difficulty: 'medium', pattern: 'heap', sheet: 'love-babbar' },
  ],
  externalLinks: [
    { title: 'Heaps — Striver', url: 'https://takeuforward.org/data-structure/heap-learning-resource/' },
  ],
});
