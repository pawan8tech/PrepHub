import { createDSATopic } from '../schema';

export const queue = createDSATopic({
  id: 'dsa-queue',
  title: 'Queue / BFS',
  slug: 'queue',
  keywords: ['enqueue', 'dequeue', 'BFS', 'circular queue', 'breadth first', 'level order'],
  difficulty: 'easy',
  relatedTopics: ['stack', 'tree', 'graph'],
  content: {
    learning: {
      explanation:
        'A queue is a FIFO (First In, First Out) data structure. Elements are added at the back and removed from the front. Variants include deque, circular queue, and priority queue.',
      whenToUse: 'BFS traversal, scheduling, level-order traversal, sliding window maximum (deque).',
      patternRecognition:
        '"Level order" or "BFS" → queue. "Sliding window max/min" → monotonic deque. "Process in order" → queue.',
      keyPoints: [
        'FIFO: first in, first out',
        'BFS uses a queue for level-by-level traversal',
        'Deque (double-ended queue) supports both ends in O(1)',
        'Priority queue (heap) is often used alongside queues',
      ],
    },
    interview: {
      explanation: 'Queue is FIFO with O(1) enqueue/dequeue. Primary use: BFS and level-order traversal.',
      importantPoints: [
        'Queue vs Stack: FIFO vs LIFO',
        'Deque for sliding window problems',
        'Priority queue is technically a heap, not a simple queue',
      ],
    },
  },
  questions: [
    { id: 'rotting-oranges', title: 'Rotten Oranges', url: 'https://leetcode.com/problems/rotting-oranges/', difficulty: 'medium', pattern: 'BFS', sheet: 'striver' },
    { id: 'word-ladder', title: 'Word Ladder', url: 'https://leetcode.com/problems/word-ladder/', difficulty: 'hard', pattern: 'BFS', sheet: 'striver' },
    { id: 'implement-queue', title: 'Implement Queue', url: 'https://www.geeksforgeeks.org/problems/implement-queue-using-array/1', difficulty: 'easy', pattern: 'design', sheet: 'love-babbar' },
    { id: 'circular-queue', title: 'Circular Queue', url: 'https://leetcode.com/problems/design-circular-queue/', difficulty: 'medium', pattern: 'design', sheet: 'love-babbar' },
    { id: 'first-non-repeating-in-stream', title: 'First Non-Repeating Character in Stream', url: 'https://www.geeksforgeeks.org/problems/first-non-repeating-character-in-a-stream1702/1', difficulty: 'medium', pattern: 'queue', sheet: 'love-babbar' },
  ],
});
