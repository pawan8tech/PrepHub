import { createDSATopic } from '../schema';

export const slidingWindow = createDSATopic({
  id: 'dsa-sliding-window',
  title: 'Sliding Window',
  slug: 'sliding-window',
  keywords: ['window', 'expand', 'shrink', 'maximum', 'minimum', 'subarray', 'substring'],
  difficulty: 'medium',
  relatedTopics: ['two-pointers', 'hashing', 'prefix-sum'],
  content: {
    learning: {
      explanation:
        'Sliding window maintains a window (subarray/substring) that expands or shrinks based on conditions. It converts O(n²) brute-force into O(n) by reusing computation from the previous window.',
      whenToUse: 'When asked about contiguous subarrays/substrings with a constraint (max, min, at most K distinct, etc.).',
      patternRecognition:
        'Keywords: "contiguous", "subarray", "substring", "at most K", "longest/shortest with condition".',
      keyPoints: [
        'Fixed window: size known in advance — slide one element at a time',
        'Variable window: expand right, shrink left when condition breaks',
        'Often combined with a hash map for character/element counting',
        'Time complexity usually O(n) since each element is added/removed at most once',
      ],
    },
    interview: {
      explanation: 'Sliding window optimizes subarray/substring problems from O(n²) to O(n) by maintaining a moving window.',
      importantPoints: [
        'Fixed vs variable window — know which pattern fits',
        'Shrink window from left when constraint is violated',
        'Often combined with hash maps for frequency tracking',
      ],
    },
  },
  questions: [
    { id: 'maximum-points-from-cards', title: 'Maximum Points You Can Obtain from Cards', url: 'https://leetcode.com/problems/maximum-points-you-can-obtain-from-cards/', difficulty: 'medium', pattern: 'sliding-window', sheet: 'striver' },
    { id: 'longest-substring-without-repeating-characters', title: 'Longest Substring Without Repeating Characters', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', difficulty: 'medium', pattern: 'variable-window', sheet: 'striver' },
    { id: 'longest-repeating-character-replacement', title: 'Longest Repeating Character Replacement', url: 'https://leetcode.com/problems/longest-repeating-character-replacement/', difficulty: 'medium', pattern: 'variable-window', sheet: 'striver' },
    { id: 'binary-subarrays-with-sum', title: 'Binary Subarrays With Sum', url: 'https://leetcode.com/problems/binary-subarrays-with-sum/', difficulty: 'medium', pattern: 'sliding-window', sheet: 'striver' },
    { id: 'max-sum-subarray-of-size-k', title: 'Maximum Sum Subarray of Size K', url: 'https://www.geeksforgeeks.org/problems/max-sum-subarray-of-size-k5313/1', difficulty: 'easy', pattern: 'fixed-window', sheet: 'love-babbar' },
    { id: 'first-negative-in-window', title: 'First Negative Integer in Every Window of Size K', url: 'https://www.geeksforgeeks.org/problems/first-negative-integer-in-every-window-of-size-k3345/1', difficulty: 'medium', pattern: 'sliding-window', sheet: 'love-babbar' },
    { id: 'count-occurrences-of-anagrams', title: 'Count Occurrences of Anagrams', url: 'https://www.geeksforgeeks.org/problems/count-occurences-of-anagrams5839/1', difficulty: 'medium', pattern: 'fixed-window', sheet: 'love-babbar' },
  ],
});
