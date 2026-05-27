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

const CustomTopicsContext = createContext();

function toSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function CustomTopicsProvider({ children }) {
  const { user } = useAuth();
  const [customTopics, setCustomTopics] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setCustomTopics([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getDocs(collection(db, 'users', user.uid, 'customTopics'))
      .then((snapshot) => {
        if (cancelled) return;
        const topics = [];
        snapshot.forEach((d) => topics.push({ id: d.id, ...d.data() }));
        setCustomTopics(topics);
      })
      .catch((err) => console.error('Failed to fetch custom topics:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [user]);

  const addCustomTopic = useCallback(
    async ({ title, category }) => {
      if (!user) return null;

      const slug = `custom-${toSlug(title)}`;
      const ref = doc(db, 'users', user.uid, 'customTopics', slug);

      const topic = {
        title,
        slug,
        category,
        isCustom: true,
        content: { learning: {}, interview: {} },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(ref, topic);

      const localTopic = { ...topic, id: slug, createdAt: new Date(), updatedAt: new Date() };
      setCustomTopics((prev) => [...prev, localTopic]);
      return slug;
    },
    [user],
  );

  const deleteCustomTopic = useCallback(
    async (slug) => {
      if (!user) return;
      await deleteDoc(doc(db, 'users', user.uid, 'customTopics', slug));
      setCustomTopics((prev) => prev.filter((t) => t.slug !== slug));
    },
    [user],
  );

  const getCustomTopic = useCallback(
    (slug) => customTopics.find((t) => t.slug === slug) || null,
    [customTopics],
  );

  return (
    <CustomTopicsContext.Provider
      value={{ customTopics, loading, addCustomTopic, deleteCustomTopic, getCustomTopic }}
    >
      {children}
    </CustomTopicsContext.Provider>
  );
}

export function useCustomTopics() {
  const context = useContext(CustomTopicsContext);
  if (!context) throw new Error('useCustomTopics must be used within CustomTopicsProvider');
  return context;
}
