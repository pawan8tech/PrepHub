import { createDSATopic } from '../schema';

export const monotonicStack = createDSATopic({
  id: 'dsa-monotonic-stack',
  title: 'Monotonic Stack',
  slug: 'monotonic-stack',
  keywords: ['next greater', 'next smaller', 'histogram', 'trapping rain water', 'increasing', 'decreasing'],
  difficulty: 'medium',
  relatedTopics: ['stack', 'two-pointers'],
  content: {
    learning: {
      explanation: 'A monotonic stack maintains elements in strictly increasing or decreasing order. It efficiently solves "next greater/smaller element" type problems in O(n) by popping elements that violate the monotonic property.',
      whenToUse: 'Next greater/smaller element, largest rectangle in histogram, trapping rain water, stock span.',
      patternRecognition: '"Next greater element" → decreasing stack. "Next smaller element" → increasing stack. "Rectangle/area" → monotonic stack.',
      keyPoints: [
        'Monotonically decreasing: pops when current > top (finds next greater)',
        'Monotonically increasing: pops when current < top (finds next smaller)',
        'Each element is pushed and popped at most once → O(n) total',
        'Histogram and trapping rain water are classic applications',
      ],
    },
    interview: {
      explanation: 'Monotonic stack gives O(n) solution for next greater/smaller problems by maintaining ordered elements and popping violations.',
      importantPoints: [
        'Decide increasing vs decreasing based on what you need',
        'Process from left or right depending on "next" vs "previous"',
        'Trapping rain water can be solved with monotonic stack or two pointers',
      ],
    },
  },
  questions: [
    { id: 'daily-temperatures', title: 'Daily Temperatures', url: 'https://leetcode.com/problems/daily-temperatures/', difficulty: 'medium', pattern: 'monotonic-stack', sheet: 'striver' },
    { id: 'trapping-rain-water', title: 'Trapping Rain Water', url: 'https://leetcode.com/problems/trapping-rain-water/', difficulty: 'hard', pattern: 'monotonic-stack', sheet: 'striver' },
    { id: 'next-smaller-element', title: 'Next Smaller Element', url: 'https://www.geeksforgeeks.org/problems/next-smaller-element4740/1', difficulty: 'medium', pattern: 'monotonic-stack', sheet: 'love-babbar' },
    { id: 'trapping-rain-water-gfg', title: 'Trapping Rain Water', url: 'https://www.geeksforgeeks.org/problems/trapping-rain-water-1587115621/1', difficulty: 'hard', pattern: 'monotonic-stack', sheet: 'love-babbar' },
  ],
  externalLinks: [
    { title: 'Monotonic Stack Patterns', url: 'https://takeuforward.org/data-structure/next-greater-element-using-stack/' },
  ],
});
