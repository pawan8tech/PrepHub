import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';

const CustomCategoriesContext = createContext();

function toSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const COLORS = [
  '#F97316', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B',
  '#6366F1', '#EF4444', '#22C55E', '#3B82F6', '#A855F7',
];

export function CustomCategoriesProvider({ children }) {
  const { user } = useAuth();
  const [customCategories, setCustomCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setCustomCategories([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getDocs(collection(db, 'users', user.uid, 'customCategories'))
      .then((snapshot) => {
        if (cancelled) return;
        const cats = [];
        snapshot.forEach((d) => cats.push({ id: d.id, ...d.data() }));
        setCustomCategories(cats);
      })
      .catch((err) => console.error('Failed to fetch custom categories:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [user]);

  const addCategory = useCallback(
    async (title) => {
      if (!user) return null;

      const slug = `custom-${toSlug(title)}`;
      const existing = customCategories.find((c) => c.slug === slug);
      if (existing) return existing.slug;

      const ref = doc(db, 'users', user.uid, 'customCategories', slug);
      const color = COLORS[customCategories.length % COLORS.length];

      const cat = {
        title: title.trim(),
        slug,
        icon: '📁',
        description: `Custom category: ${title.trim()}`,
        color,
        isCustom: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(ref, cat);
      const local = { ...cat, id: slug, createdAt: new Date(), updatedAt: new Date() };
      setCustomCategories((prev) => [...prev, local]);
      return slug;
    },
    [user, customCategories],
  );

  const updateCategory = useCallback(
    async (slug, title) => {
      if (!user || !slug) return;
      const nextTitle = (title || '').trim();
      if (!nextTitle) return;
      const ref = doc(db, 'users', user.uid, 'customCategories', slug);
      // setDoc + merge so renaming a synthesized (record-less) category materializes it.
      await setDoc(
        ref,
        { title: nextTitle, slug, isCustom: true, updatedAt: serverTimestamp() },
        { merge: true },
      );
      setCustomCategories((prev) => {
        const exists = prev.some((c) => c.slug === slug);
        if (exists) {
          return prev.map((c) => (c.slug === slug ? { ...c, title: nextTitle } : c));
        }
        return [
          ...prev,
          {
            id: slug,
            slug,
            title: nextTitle,
            icon: '📁',
            description: `Custom category: ${nextTitle}`,
            color: COLORS[prev.length % COLORS.length],
            isCustom: true,
          },
        ];
      });
    },
    [user],
  );

  const deleteCategory = useCallback(
    async (slug) => {
      if (!user) return;
      await deleteDoc(doc(db, 'users', user.uid, 'customCategories', slug));
      setCustomCategories((prev) => prev.filter((c) => c.slug !== slug));
    },
    [user],
  );

  const getCustomCategory = useCallback(
    (slug) => customCategories.find((c) => c.slug === slug) || null,
    [customCategories],
  );

  return (
    <CustomCategoriesContext.Provider
      value={{ customCategories, loading, addCategory, updateCategory, deleteCategory, getCustomCategory }}
    >
      {children}
    </CustomCategoriesContext.Provider>
  );
}

export function useCustomCategories() {
  const context = useContext(CustomCategoriesContext);
  if (!context) throw new Error('useCustomCategories must be used within CustomCategoriesProvider');
  return context;
}
