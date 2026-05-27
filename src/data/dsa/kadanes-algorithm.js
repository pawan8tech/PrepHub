import { createDSATopic } from '../schema';

export const kadanesAlgorithm = createDSATopic({
  id: 'dsa-kadanes-algorithm',
  title: "Kadane's Algorithm",
  slug: 'kadanes-algorithm',
  keywords: ['maximum subarray', 'contiguous sum', 'product subarray', 'running max'],
  difficulty: 'easy',
  relatedTopics: ['dp', 'prefix-sum', 'sliding-window'],
  content: {
    learning: {
      explanation: "Kadane's algorithm finds the maximum sum contiguous subarray in O(n). It maintains a running sum, resetting when the sum becomes negative. Extended variants handle circular arrays and maximum product.",
      whenToUse: 'Maximum/minimum subarray sum, maximum product subarray, circular subarray problems.',
      patternRecognition: '"Maximum contiguous subarray" → Kadane\'s. "Maximum product subarray" → track both max and min (negatives flip signs).',
      keyPoints: [
        'Core idea: currentMax = max(arr[i], currentMax + arr[i])',
        'Reset running sum when it goes negative',
        'For max product: track both maxProduct and minProduct',
        'Circular variant: max(normal Kadane, totalSum - minSubarraySum)',
      ],
    },
    interview: {
      explanation: "Kadane's finds max subarray sum in O(n) O(1). For product variant, track both max and min products due to negative number behavior.",
      importantPoints: [
        'Handle all-negative arrays correctly',
        'Product variant: a negative × negative = positive, so track min too',
        'Circular subarray: answer is max(Kadane result, total - min subarray)',
      ],
    },
  },
  questions: [
    { id: 'maximum-subarray', title: 'Maximum Subarray', url: 'https://leetcode.com/problems/maximum-subarray/', difficulty: 'medium', pattern: 'kadane', sheet: 'striver' },
    { id: 'maximum-product-subarray', title: 'Maximum Product Subarray', url: 'https://leetcode.com/problems/maximum-product-subarray/', difficulty: 'medium', pattern: 'kadane-variant', sheet: 'striver' },
    { id: 'max-subarray-sum-gfg', title: 'Maximum Subarray Sum', url: 'https://www.geeksforgeeks.org/problems/kadanes-algorithm-1587115620/1', difficulty: 'medium', pattern: 'kadane', sheet: 'love-babbar' },
    { id: 'max-product-subarray-gfg', title: 'Maximum Product Subarray', url: 'https://www.geeksforgeeks.org/problems/maximum-product-subarray3604/1', difficulty: 'medium', pattern: 'kadane-variant', sheet: 'love-babbar' },
  ],
  externalLinks: [
    { title: 'Kadane Algorithm — Striver', url: 'https://takeuforward.org/data-structure/kadanes-algorithm-maximum-subarray-sum-in-an-array/' },
  ],
});
