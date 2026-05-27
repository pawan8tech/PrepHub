import { createDSATopic } from '../schema';

export const trie = createDSATopic({
  id: 'dsa-trie',
  title: 'Trie',
  slug: 'trie',
  keywords: ['prefix', 'autocomplete', 'dictionary', 'word search', 'insert', 'search'],
  difficulty: 'medium',
  relatedTopics: ['hashing', 'tree', 'bit-manipulation'],
  content: {
    learning: {
      explanation: 'A Trie (prefix tree) stores strings character by character in a tree structure. Each node represents a character, and paths from root to marked nodes form stored words. Enables O(L) insert/search where L is word length.',
      whenToUse: 'Autocomplete, spell check, prefix matching, word dictionaries, maximum XOR problems.',
      patternRecognition: '"Prefix search" → Trie. "Word dictionary with wildcard" → Trie + DFS. "Maximum XOR" → bitwise Trie.',
      keyPoints: [
        'Each node has up to 26 children (for lowercase English)',
        'Insert and search are O(L) where L = word length',
        'Space can be large but prefix sharing saves memory',
        'Bitwise Trie: store numbers bit by bit for XOR queries',
      ],
    },
    interview: {
      explanation: 'Trie provides O(L) prefix operations. Stores characters in a tree. Used for dictionaries, autocomplete, and XOR problems.',
      importantPoints: [
        'Trie vs HashMap: Trie supports prefix queries, HashMap does not',
        'Mark end-of-word nodes to distinguish complete words from prefixes',
        'Maximum XOR: insert all numbers in bitwise Trie, greedily pick opposite bits',
      ],
    },
  },
  questions: [
    { id: 'implement-trie', title: 'Implement Trie', url: 'https://leetcode.com/problems/implement-trie-prefix-tree/', difficulty: 'medium', pattern: 'trie', sheet: 'striver' },
    { id: 'maximum-xor', title: 'Maximum XOR', url: 'https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/', difficulty: 'medium', pattern: 'bitwise-trie', sheet: 'striver' },
    { id: 'implement-trie-gfg', title: 'Implement Trie', url: 'https://www.geeksforgeeks.org/problems/trie-insert-and-search0651/1', difficulty: 'medium', pattern: 'trie', sheet: 'love-babbar' },
    { id: 'phone-directory', title: 'Phone Directory', url: 'https://www.geeksforgeeks.org/problems/phone-directory4628/1', difficulty: 'hard', pattern: 'trie', sheet: 'love-babbar' },
  ],
  externalLinks: [
    { title: 'Trie Series — Striver', url: 'https://takeuforward.org/trie/implement-trie-1/' },
  ],
});
