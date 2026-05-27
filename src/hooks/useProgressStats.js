import { useMemo } from 'react';
import { useProgress } from '../context/ProgressContext';
import { allDSATopics, categories } from '../data';
import { useAllContent } from './useAllContent';

const STATUS_ORDER = ['completed', 'revised', 'learning', 'not-started'];

export function useProgressStats() {
  const { progress, getTopicStatus } = useProgress();
  const { allTopics } = useAllContent();

  return useMemo(() => {
    const allItems = [...allTopics, ...allDSATopics];

    const overall = {
      total: allItems.length,
      completed: 0,
      revised: 0,
      learning: 0,
      notStarted: 0,
    };

    const byCategory = new Map();

    for (const cat of categories) {
      byCategory.set(cat.slug, {
        ...cat,
        total: 0,
        completed: 0,
        revised: 0,
        learning: 0,
        notStarted: 0,
        topics: [],
      });
    }

    for (const item of allItems) {
      const status = getTopicStatus(item.slug);
      const catSlug = item.category;

      // Overall counts
      if (status === 'completed') overall.completed++;
      else if (status === 'revised') overall.revised++;
      else if (status === 'learning') overall.learning++;
      else overall.notStarted++;

      // Per-category counts
      const catData = byCategory.get(catSlug);
      if (catData) {
        catData.total++;
        if (status === 'completed') catData.completed++;
        else if (status === 'revised') catData.revised++;
        else if (status === 'learning') catData.learning++;
        else catData.notStarted++;
        catData.topics.push({ ...item, _status: status });
      }
    }

    // Sort topics within each category by status priority
    for (const catData of byCategory.values()) {
      catData.topics.sort(
        (a, b) => STATUS_ORDER.indexOf(a._status) - STATUS_ORDER.indexOf(b._status)
      );
    }

    const categoryList = Array.from(byCategory.values()).filter(
      (c) => c.total > 0
    );

    overall.percent =
      overall.total > 0
        ? Math.round(((overall.completed + overall.revised) / overall.total) * 100)
        : 0;

    return { overall, categoryList };
  }, [progress, getTopicStatus, allTopics]);
}
