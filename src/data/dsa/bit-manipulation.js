import { createDSATopic } from '../schema';

export const bitManipulation = createDSATopic({
  id: 'dsa-bit-manipulation',
  title: 'Bit Manipulation',
  slug: 'bit-manipulation',
  keywords: ['XOR', 'AND', 'OR', 'shift', 'set bits', 'power of two', 'bitmask'],
  difficulty: 'medium',
  relatedTopics: ['hashing'],
  content: {
    learning: {
      explanation: 'Bit manipulation operates directly on binary representations of numbers. XOR, AND, OR, and shift operations can solve problems in O(1) space that would otherwise require extra data structures.',
      whenToUse: 'Finding single/unique numbers, power of two checks, counting set bits, XOR tricks, bitmask DP.',
      patternRecognition: '"Find single number" → XOR all elements. "Power of two" → n & (n-1) == 0. "Count set bits" → Brian Kernighan\'s algorithm.',
      keyPoints: [
        'XOR properties: a^a = 0, a^0 = a, commutative and associative',
        'n & (n-1) removes the lowest set bit',
        'Left shift (<<) = multiply by 2, right shift (>>) = divide by 2',
        'Bitmask can represent subsets: bit i = include element i',
      ],
    },
    interview: {
      explanation: 'Bit manipulation provides O(1) space solutions using XOR, AND, OR. XOR cancels duplicates. n&(n-1) checks power of two.',
      importantPoints: [
        'XOR of all elements finds the unique one in O(1) space',
        'Brian Kernighan: count set bits in O(set bits) time',
        'Two non-repeating: XOR all, split by rightmost set bit, XOR each group',
      ],
    },
  },
  questions: [
    { id: 'single-number', title: 'Single Number', url: 'https://leetcode.com/problems/single-number/', difficulty: 'easy', pattern: 'xor', sheet: 'striver' },
    { id: 'power-of-two', title: 'Power of Two', url: 'https://leetcode.com/problems/power-of-two/', difficulty: 'easy', pattern: 'bit-check', sheet: 'striver' },
    { id: 'count-set-bits', title: 'Count Set Bits', url: 'https://www.geeksforgeeks.org/problems/set-bits0143/1', difficulty: 'easy', pattern: 'bit-count', sheet: 'love-babbar' },
    { id: 'two-non-repeating-numbers', title: 'Find Two Non-Repeating Numbers', url: 'https://www.geeksforgeeks.org/problems/finding-the-numbers0215/1', difficulty: 'medium', pattern: 'xor', sheet: 'love-babbar' },
    { id: 'xor-queries-of-subarray', title: 'XOR Problems', url: 'https://leetcode.com/problems/xor-queries-of-a-subarray/', difficulty: 'medium', pattern: 'xor', sheet: 'love-babbar' },
  ],
  externalLinks: [
    { title: 'Bit Manipulation Tricks — Striver', url: 'https://takeuforward.org/bit-manipulation/introduction-to-bit-manipulation/' },
  ],
});
