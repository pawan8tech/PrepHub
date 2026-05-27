import { useMemo } from 'react';
import { useDebounce } from './useDebounce';
import { getCategoryBySlug } from '../data';
import { useAllContent } from './useAllContent';

export function useSearch(query, delay = 150) {
  const debouncedQuery = useDebounce(query, delay);
  const { searchContent } = useAllContent();

  const results = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) return [];
    return searchContent(debouncedQuery);
  }, [debouncedQuery, searchContent]);

  const grouped = useMemo(() => {
    if (results.length === 0) return [];

    const map = new Map();
    for (const item of results) {
      const key = item.category;
      if (!map.has(key)) {
        const cat = getCategoryBySlug(key);
        map.set(key, {
          category: key,
          label: cat?.title || key,
          icon: cat?.icon || '📄',
          items: [],
        });
      }
      map.get(key).items.push(item);
    }

    return Array.from(map.values());
  }, [results]);

  return {
    results,
    grouped,
    query: debouncedQuery,
    isEmpty: debouncedQuery?.trim().length >= 2 && results.length === 0,
  };
}

export function getTopicRoute(item) {
  if (item.category === 'dsa') return `/dsa/${item.slug}`;
  return `/topic/${item.slug}`;
}

/** Route used by global search: lands on the inline category view and scrolls to the topic. */
export function getInlineTopicRoute(item) {
  if (!item) return '/';
  if (item.category === 'dsa') return `/dsa/${item.slug}`;
  return `/category/${item.category}#topic-${item.slug}`;
}
