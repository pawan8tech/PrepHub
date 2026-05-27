import { useMemo } from 'react';
import { categories as systemCategories } from '../data/categories';
import { useCustomCategories } from '../context/CustomCategoriesContext';
import { useNotes } from '../context/NotesContext';

function titleFromCategorySlug(slug) {
  if (!slug) return '';
  return slug
    .replace(/^custom-/, '')
    .split('-')
    .filter(Boolean)
    .map((x) => x[0].toUpperCase() + x.slice(1))
    .join(' ');
}

export function useAllCategories() {
  const { customCategories } = useCustomCategories();
  const { noteTopics } = useNotes();

  return useMemo(() => {
    const bySlug = new Map();
    for (const c of systemCategories) bySlug.set(c.slug, c);
    for (const c of customCategories) bySlug.set(c.slug, c);

    for (const t of noteTopics || []) {
      const cs = (t.category || '').trim();
      if (!cs || bySlug.has(cs)) continue;
      bySlug.set(cs, {
        slug: cs,
        title: titleFromCategorySlug(cs),
        icon: '📁',
        description: `Category: ${titleFromCategorySlug(cs)}`,
        color: '#64748B',
        isCustom: true,
      });
    }

    const merged = Array.from(bySlug.values());

    function getCategoryBySlug(slug) {
      return merged.find((c) => c.slug === slug) || null;
    }

    return { allCategories: merged, getCategoryBySlug };
  }, [customCategories, noteTopics]);
}
