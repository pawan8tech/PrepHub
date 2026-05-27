export const categories = [
  {
    id: 'react',
    title: 'React',
    slug: 'react',
    icon: '⚛️',
    description: 'Components, hooks, state, routing, and patterns',
    color: '#61DAFB',
  },
  {
    id: 'nextjs',
    title: 'Next.js',
    slug: 'nextjs',
    icon: '▲',
    description: 'SSR, SSG, routing, API routes, and deployment',
    color: '#000000',
  },
  {
    id: 'javascript',
    title: 'JavaScript',
    slug: 'javascript',
    icon: '🟨',
    description: 'Core JS, ES6+, async, closures, and prototypes',
    color: '#F7DF1E',
  },
  {
    id: 'html',
    title: 'HTML',
    slug: 'html',
    icon: '🌐',
    description: 'Semantic HTML, forms, accessibility, and APIs',
    color: '#E34F26',
  },
  {
    id: 'css',
    title: 'CSS',
    slug: 'css',
    icon: '🎨',
    description: 'Layout, flexbox, grid, animations, and responsive design',
    color: '#1572B6',
  },
  {
    id: 'scss',
    title: 'SCSS',
    slug: 'scss',
    icon: '💅',
    description: 'Variables, mixins, nesting, and architecture',
    color: '#CC6699',
  },
  {
    id: 'java',
    title: 'Java',
    slug: 'java',
    icon: '☕',
    description: 'OOP, collections, multithreading, and core concepts',
    color: '#ED8B00',
  },
  {
    id: 'dsa',
    title: 'DSA',
    slug: 'dsa',
    icon: '🧩',
    description: 'Data structures, algorithms, and problem-solving patterns',
    color: '#10B981',
  },
  {
    id: 'frontend-concepts',
    title: 'Frontend Concepts',
    slug: 'frontend-concepts',
    icon: '🖥️',
    description: 'Browser, performance, security, and architecture',
    color: '#8B5CF6',
  },
];

export function getCategoryBySlug(slug) {
  return categories.find((c) => c.slug === slug);
}
