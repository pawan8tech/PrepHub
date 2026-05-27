import { createDSATopic } from '../schema';

export const stack = createDSATopic({
  id: 'dsa-stack',
  title: 'Stack',
  slug: 'stack',
  keywords: ['push', 'pop', 'peek', 'monotonic stack', 'parentheses', 'LIFO'],
  difficulty: 'easy',
  relatedTopics: ['queue', 'monotonic-stack', 'recursion-backtracking'],
  content: {
    learning: {
      explanation:
        'A stack is a LIFO (Last In, First Out) data structure. Elements are added and removed from the same end (top). Key operations: push, pop, peek — all O(1).',
      whenToUse: 'Parentheses matching, undo operations, DFS, expression evaluation, monotonic stack for "next greater element" problems.',
      patternRecognition:
        '"Next greater/smaller element" → monotonic stack. "Valid parentheses" → stack. "Evaluate expression" → two stacks.',
      keyPoints: [
        'LIFO: last in, first out',
        'All operations O(1)',
        'Monotonic stack: maintains increasing/decreasing order',
        'Used in DFS (explicit or implicit via recursion)',
      ],
    },
    interview: {
      explanation: 'Stack provides LIFO access in O(1). Monotonic stack is a key pattern for "next greater element" type problems.',
      importantPoints: [
        'Stack vs Queue: LIFO vs FIFO',
        'Monotonic stack gives O(n) for next-greater/smaller problems',
        'Recursion uses the call stack implicitly',
      ],
    },
  },
  questions: [
    { id: 'next-greater-element', title: 'Next Greater Element', url: 'https://leetcode.com/problems/next-greater-element-i/', difficulty: 'easy', pattern: 'stack', sheet: 'striver' },
    { id: 'largest-rectangle-in-histogram', title: 'Largest Rectangle in Histogram', url: 'https://leetcode.com/problems/largest-rectangle-in-histogram/', difficulty: 'hard', pattern: 'monotonic-stack', sheet: 'striver' },
    { id: 'valid-parentheses', title: 'Valid Parentheses', url: 'https://leetcode.com/problems/valid-parentheses/', difficulty: 'easy', pattern: 'matching', sheet: 'love-babbar' },
    { id: 'implement-stack-using-array', title: 'Implement Stack Using Array', url: 'https://www.geeksforgeeks.org/problems/implement-stack-using-array/1', difficulty: 'easy', pattern: 'design', sheet: 'love-babbar' },
    { id: 'sort-a-stack', title: 'Sort a Stack', url: 'https://www.geeksforgeeks.org/problems/sort-a-stack/1', difficulty: 'medium', pattern: 'recursion', sheet: 'love-babbar' },
    { id: 'next-greater-element-gfg', title: 'Next Greater Element', url: 'https://www.geeksforgeeks.org/problems/next-larger-element-1587115620/1', difficulty: 'medium', pattern: 'stack', sheet: 'love-babbar' },
  ],
});
