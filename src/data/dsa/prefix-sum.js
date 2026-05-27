import { createDSATopic } from '../schema';

export const prefixSum = createDSATopic({
  id: 'dsa-prefix-sum',
  title: 'Prefix Sum',
  slug: 'prefix-sum',
  keywords: ['cumulative sum', 'range sum', 'subarray sum', 'precomputation'],
  difficulty: 'easy',
  relatedTopics: ['hashing', 'sliding-window', 'kadanes-algorithm'],
  content: {
    learning: {
      explanation:
        'Prefix sum precomputes cumulative sums so any subarray sum can be answered in O(1). prefix[i] = sum of elements from index 0 to i.',
      whenToUse: 'Range sum queries, subarray sum equals K, counting subarrays with specific sum properties.',
      patternRecognition:
        '"Subarray sum" or "range sum" → prefix sum. Combined with hash map for "subarray sum equals K" pattern.',
      keyPoints: [
        'prefix[i] = prefix[i-1] + arr[i]',
        'Sum of subarray [l, r] = prefix[r] - prefix[l-1]',
        'Combined with hash map: count subarrays with sum = K in O(n)',
        'Can be extended to 2D for matrix region sums',
      ],
    },
    interview: {
      explanation: 'Prefix sum enables O(1) range sum queries after O(n) precomputation.',
      importantPoints: [
        'Use prefix[0] = 0 as sentinel for clean indexing',
        'Prefix sum + hash map is a key pattern for subarray sum problems',
      ],
    },
  },
  questions: [
    { id: 'longest-subarray-with-sum-k', title: 'Longest Subarray with Given Sum K', url: 'https://www.geeksforgeeks.org/problems/longest-sub-array-with-sum-k0809/1', difficulty: 'medium', pattern: 'prefix-map', sheet: 'striver' },
    { id: 'largest-subarray-with-0-sum', title: 'Largest Subarray with 0 Sum', url: 'https://www.geeksforgeeks.org/problems/largest-subarray-with-0-sum/1', difficulty: 'medium', pattern: 'prefix-map', sheet: 'striver' },
    { id: 'xor-subarray-with-given-xor', title: 'XOR Subarray with Given XOR', url: 'https://www.interviewbit.com/problems/subarray-with-given-xor/', difficulty: 'medium', pattern: 'prefix-xor', sheet: 'striver' },
    { id: 'subarray-with-given-sum', title: 'Subarray with Given Sum', url: 'https://www.geeksforgeeks.org/problems/subarray-with-given-sum-1587115621/1', difficulty: 'easy', pattern: 'prefix-sum', sheet: 'love-babbar' },
    { id: 'largest-subarray-0-sum-gfg', title: 'Largest Subarray with 0 Sum', url: 'https://www.geeksforgeeks.org/problems/largest-subarray-with-0-sum/1', difficulty: 'medium', pattern: 'prefix-map', sheet: 'love-babbar' },
    { id: 'count-subarrays-equal-0s-1s', title: 'Count Subarrays with Equal 0s and 1s', url: 'https://www.geeksforgeeks.org/problems/count-subarrays-with-equal-number-of-1s-and-0s-1587115620/1', difficulty: 'medium', pattern: 'prefix-map', sheet: 'love-babbar' },
  ],
});
