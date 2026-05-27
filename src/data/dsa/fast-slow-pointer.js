import { createDSATopic } from '../schema';

export const fastSlowPointer = createDSATopic({
  id: 'dsa-fast-slow-pointer',
  title: 'Fast & Slow Pointer',
  slug: 'fast-slow-pointer',
  keywords: ['tortoise hare', 'cycle', 'middle', 'floyd', 'linked list loop'],
  difficulty: 'easy',
  relatedTopics: ['two-pointers'],
  content: {
    learning: {
      explanation: 'Fast & slow pointer (Floyd\'s algorithm) uses two pointers moving at different speeds. The slow pointer moves one step, the fast moves two. This detects cycles and finds midpoints in O(n) time with O(1) space.',
      whenToUse: 'Cycle detection in linked lists, finding the middle element, detecting the start of a loop.',
      patternRecognition: '"Detect cycle" → fast/slow. "Find middle" → fast/slow (when fast reaches end, slow is at middle).',
      keyPoints: [
        'Slow moves 1 step, fast moves 2 steps per iteration',
        'If they meet → cycle exists',
        'To find cycle start: reset one to head, move both at speed 1',
        'Finding middle: when fast reaches end, slow is at mid',
      ],
    },
    interview: {
      explanation: 'Two pointers at different speeds detect cycles in O(1) space and find midpoints without knowing length.',
      importantPoints: [
        'Floyd\'s cycle detection is O(n) time O(1) space',
        'Meeting point math: distance from head to cycle start = distance from meeting point to cycle start',
        'Used for linked list problems primarily',
      ],
    },
  },
  questions: [
    { id: 'find-middle-of-linked-list', title: 'Find Middle of Linked List', url: 'https://leetcode.com/problems/middle-of-the-linked-list/', difficulty: 'easy', pattern: 'fast-slow', sheet: 'striver' },
    { id: 'linked-list-cycle', title: 'Detect Loop', url: 'https://leetcode.com/problems/linked-list-cycle/', difficulty: 'easy', pattern: 'fast-slow', sheet: 'striver' },
    { id: 'linked-list-cycle-ii', title: 'Starting Point of Loop', url: 'https://leetcode.com/problems/linked-list-cycle-ii/', difficulty: 'medium', pattern: 'fast-slow', sheet: 'striver' },
    { id: 'detect-loop-in-linked-list', title: 'Detect Loop in Linked List', url: 'https://www.geeksforgeeks.org/problems/detect-loop-in-linked-list/1', difficulty: 'easy', pattern: 'fast-slow', sheet: 'love-babbar' },
    { id: 'remove-loop-in-linked-list', title: 'Remove Loop in Linked List', url: 'https://www.geeksforgeeks.org/problems/remove-loop-in-linked-list/1', difficulty: 'medium', pattern: 'fast-slow', sheet: 'love-babbar' },
  ],
  externalLinks: [
    { title: 'Floyd Cycle Detection — Wikipedia', url: 'https://en.wikipedia.org/wiki/Cycle_detection#Floyd\'s_tortoise_and_hare' },
  ],
});
