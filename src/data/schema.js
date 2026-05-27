/**
 * Factory for regular topic entries (React, JS, CSS, etc.).
 * Pass only the fields you have — everything else gets safe defaults.
 */
export function createTopic(overrides = {}) {
  return {
    id: '',
    title: '',
    slug: '',
    category: '',
    keywords: [],

    content: {
      learning: {
        explanation: '',
        keyPoints: [],
        examples: [],
        notes: '',
      },
      interview: {
        explanation: '',
        importantPoints: [],
        commonQuestions: [],
        trickyPoints: [],
      },
    },

    codeExamples: [],
    externalLinks: [],
    relatedTopics: [],

    ...overrides,

    content: {
      learning: {
        explanation: '',
        keyPoints: [],
        examples: [],
        notes: '',
        ...overrides.content?.learning,
      },
      interview: {
        explanation: '',
        importantPoints: [],
        commonQuestions: [],
        trickyPoints: [],
        ...overrides.content?.interview,
      },
    },
  };
}

/**
 * Factory for DSA topic entries.
 * Adds DSA-specific fields: difficulty, whenToUse, patternRecognition, questions.
 */
export function createDSATopic(overrides = {}) {
  return {
    id: '',
    title: '',
    slug: '',
    category: 'dsa',
    keywords: [],
    difficulty: 'medium',

    content: {
      learning: {
        explanation: '',
        whenToUse: '',
        patternRecognition: '',
        keyPoints: [],
        examples: [],
        notes: '',
      },
      interview: {
        explanation: '',
        importantPoints: [],
        commonQuestions: [],
        trickyPoints: [],
      },
    },

    questions: [],
    codeExamples: [],
    externalLinks: [],
    relatedTopics: [],

    ...overrides,

    content: {
      learning: {
        explanation: '',
        whenToUse: '',
        patternRecognition: '',
        keyPoints: [],
        examples: [],
        notes: '',
        ...overrides.content?.learning,
      },
      interview: {
        explanation: '',
        importantPoints: [],
        commonQuestions: [],
        trickyPoints: [],
        ...overrides.content?.interview,
      },
    },
  };
}
