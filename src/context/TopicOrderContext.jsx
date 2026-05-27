import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { doc, getDoc, setDoc, deleteField, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { applyOrder as applyOrderImpl } from '../utils/topicOrderArch';

const TopicOrderContext = createContext();

const CACHE_KEY = 'prephub-topic-order-cache-v1';
const ADMIN_DOC = ['admin_meta', 'topicOrder'];
const USER_COL = 'user_topic_order';

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return { admin: {}, user: {} };
    const parsed = JSON.parse(raw);
    return {
      admin: parsed?.admin && typeof parsed.admin === 'object' ? parsed.admin : {},
      user: parsed?.user && typeof parsed.user === 'object' ? parsed.user : {},
    };
  } catch {
    return { admin: {}, user: {} };
  }
}

function writeCache(admin, user) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ admin, user }));
  } catch {}
}

function extractOrderByCategory(snap) {
  if (!snap || !snap.exists()) return {};
  const data = snap.data();
  const map = data && typeof data === 'object' ? data.orderByCategory : null;
  if (!map || typeof map !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(map)) {
    if (Array.isArray(v)) out[k] = v.filter((s) => typeof s === 'string');
  }
  return out;
}

export function TopicOrderProvider({ children }) {
  const { user, isAdmin } = useAuth();
  const cached = useMemo(() => readCache(), []);
  const [adminOrder, setAdminOrder] = useState(cached.admin);
  const [userOrder, setUserOrder] = useState(cached.user);
  const adminRef = useRef(adminOrder);
  const userRef = useRef(userOrder);
  adminRef.current = adminOrder;
  userRef.current = userOrder;

  useEffect(() => {
    let cancelled = false;
    getDoc(doc(db, ADMIN_DOC[0], ADMIN_DOC[1]))
      .then((snap) => {
        if (cancelled) return;
        const next = extractOrderByCategory(snap);
        setAdminOrder(next);
        writeCache(next, userRef.current);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setUserOrder({});
      writeCache(adminRef.current, {});
      return;
    }
    let cancelled = false;
    getDoc(doc(db, USER_COL, user.uid))
      .then((snap) => {
        if (cancelled) return;
        const next = extractOrderByCategory(snap);
        setUserOrder(next);
        writeCache(adminRef.current, next);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  const applyOrder = useCallback(
    (categoryId, topics) => {
      if (!isAdmin) {
        const userSlugs = userOrder[categoryId];
        if (Array.isArray(userSlugs) && userSlugs.length > 0) {
          return applyOrderImpl(userSlugs, topics);
        }
      }
      const adminSlugs = adminOrder[categoryId];
      if (Array.isArray(adminSlugs) && adminSlugs.length > 0) {
        return applyOrderImpl(adminSlugs, topics);
      }
      return Array.isArray(topics) ? [...topics] : [];
    },
    [adminOrder, userOrder, isAdmin],
  );

  const hasUserOverride = useCallback(
    (categoryId) => {
      const slugs = userOrder[categoryId];
      return Array.isArray(slugs) && slugs.length > 0;
    },
    [userOrder],
  );

  const setOrder = useCallback(
    async (categoryId, orderedSlugs) => {
      if (!user) return;
      const clean = Array.isArray(orderedSlugs)
        ? orderedSlugs.filter((s) => typeof s === 'string' && s.length > 0)
        : [];

      if (isAdmin) {
        const next = { ...adminRef.current, [categoryId]: clean };
        setAdminOrder(next);
        writeCache(next, userRef.current);
        try {
          await setDoc(
            doc(db, ADMIN_DOC[0], ADMIN_DOC[1]),
            { orderByCategory: { [categoryId]: clean }, updatedAt: serverTimestamp() },
            { merge: true },
          );
        } catch (err) {
          console.error('Failed to save admin topic order:', err);
        }
        return;
      }

      const next = { ...userRef.current, [categoryId]: clean };
      setUserOrder(next);
      writeCache(adminRef.current, next);
      try {
        await setDoc(
          doc(db, USER_COL, user.uid),
          { orderByCategory: { [categoryId]: clean }, updatedAt: serverTimestamp() },
          { merge: true },
        );
      } catch (err) {
        console.error('Failed to save user topic order:', err);
      }
    },
    [user, isAdmin],
  );

  const resetOrder = useCallback(
    async (categoryId) => {
      if (!user || isAdmin) return;
      const next = { ...userRef.current };
      delete next[categoryId];
      setUserOrder(next);
      writeCache(adminRef.current, next);
      try {
        await setDoc(
          doc(db, USER_COL, user.uid),
          {
            orderByCategory: { [categoryId]: deleteField() },
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      } catch (err) {
        console.error('Failed to reset user topic order:', err);
      }
    },
    [user, isAdmin],
  );

  const value = useMemo(
    () => ({ applyOrder, setOrder, resetOrder, hasUserOverride, canReorder: Boolean(user) }),
    [applyOrder, setOrder, resetOrder, hasUserOverride, user],
  );

  return <TopicOrderContext.Provider value={value}>{children}</TopicOrderContext.Provider>;
}

export function useTopicOrder() {
  const ctx = useContext(TopicOrderContext);
  if (!ctx) throw new Error('useTopicOrder must be used within TopicOrderProvider');
  return ctx;
}
