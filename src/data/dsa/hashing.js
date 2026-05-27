import { createDSATopic } from '../schema';

export const hashing = createDSATopic({
  id: 'dsa-hashing',
  title: 'Hashing',
  slug: 'hashing',
  keywords: ['hash map', 'hash set', 'frequency count', 'collision', 'lookup'],
  difficulty: 'easy',
  relatedTopics: ['two-pointers', 'sliding-window', 'prefix-sum'],
  content: {
    learning: {
      explanation:
        'Hashing maps keys to values using a hash function, enabling O(1) average lookup, insert, and delete. Hash maps and hash sets are the most common implementations.',
      whenToUse: 'When you need fast lookup, counting frequencies, checking duplicates, or mapping relationships.',
      patternRecognition:
        '"Find if exists" → HashSet. "Count occurrences" → HashMap. "Two Sum pattern" → HashMap storing complement.',
      keyPoints: [
        'Average O(1) for get/put/contains, worst case O(n) with collisions',
        'Hash sets for membership checks, hash maps for key-value pairs',
        'Frequency counting is one of the most common patterns',
        'Two Sum is the classic hash map pattern',
      ],
    },
    interview: {
      explanation: 'Hashing provides O(1) average-case lookup via hash maps/sets. Essential for frequency counting, deduplication, and complement lookups.',
      importantPoints: [
        'Understand collision resolution: chaining vs open addressing',
        'HashMap vs TreeMap trade-offs (O(1) vs O(log n) but ordered)',
        'Hash function quality affects performance',
      ],
    },
  },
  questions: [
    { id: 'longest-consecutive-sequence', title: 'Longest Consecutive Sequence', url: 'https://leetcode.com/problems/longest-consecutive-sequence/', difficulty: 'medium', pattern: 'hashset', sheet: 'striver' },
    { id: 'majority-element', title: 'Majority Element', url: 'https://leetcode.com/problems/majority-element/', difficulty: 'easy', pattern: 'frequency', sheet: 'striver' },
    { id: 'majority-element-ii', title: 'Majority Element II', url: 'https://leetcode.com/problems/majority-element-ii/', difficulty: 'medium', pattern: 'frequency', sheet: 'striver' },
    { id: 'find-duplicates-in-array', title: 'Find Duplicates in Array', url: 'https://www.geeksforgeeks.org/problems/find-duplicates-in-an-array/1', difficulty: 'easy', pattern: 'hashing', sheet: 'love-babbar' },
    { id: 'first-repeating-element', title: 'First Repeating Element', url: 'https://www.geeksforgeeks.org/problems/first-repeating-element4018/1', difficulty: 'easy', pattern: 'hashing', sheet: 'love-babbar' },
    { id: 'count-distinct-in-window', title: 'Count Distinct Elements in Every Window', url: 'https://www.geeksforgeeks.org/problems/count-distinct-elements-in-every-window/1', difficulty: 'medium', pattern: 'hashing', sheet: 'love-babbar' },
  ],
});
