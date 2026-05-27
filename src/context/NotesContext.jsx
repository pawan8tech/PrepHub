import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { flushSync } from 'react-dom';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import {
  NOTE_MODES,
  noteBaseId,
  userNoteFirestoreId,
  documentToBlocks,
  mergedContentModeBlocks,
  cloneBlocks,
  parseBaseNoteId,
  baseNoteIdFromUserNoteDocId,
  mergeAdminUserNoteLayers,
} from '../utils/notesArch';

const NotesContext = createContext();

const DEBUG_NOTES_EDIT = import.meta.env.DEV;
const CACHE_KEY = 'prephub-notes-cache-v3';
const QUEUE_KEY = 'prephub-notes-queue-v3';
const COL_ADMIN = 'admin_notes';
const COL_USER = 'user_notes';
const COL_USER_HIDDEN = 'user_hidden_topics';

function cacheUid(uid) {
  return uid || 'anon';
}

function readCache(uid) {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY}-${cacheUid(uid)}`);
    if (!raw) return { notes: {}, sourceByBaseId: {}, topicMetaBySlug: {} };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { notes: {}, sourceByBaseId: {}, topicMetaBySlug: {} };
    }
    return {
      notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
      sourceByBaseId:
        parsed.sourceByBaseId && typeof parsed.sourceByBaseId === 'object'
          ? parsed.sourceByBaseId
          : {},
      topicMetaBySlug:
        parsed.topicMetaBySlug && typeof parsed.topicMetaBySlug === 'object'
          ? parsed.topicMetaBySlug
          : {},
    };
  } catch {
    return { notes: {}, sourceByBaseId: {}, topicMetaBySlug: {} };
  }
}

function writeCache(uid, notes, sourceByBaseId, topicMetaBySlug) {
  try {
    localStorage.setItem(
      `${CACHE_KEY}-${cacheUid(uid)}`,
      JSON.stringify({ notes, sourceByBaseId, topicMetaBySlug }),
    );
  } catch {}
}

function readQueue(uid) {
  try {
    const raw = localStorage.getItem(`${QUEUE_KEY}-${uid}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(uid, queue) {
  try {
    localStorage.setItem(`${QUEUE_KEY}-${uid}`, JSON.stringify(queue));
  } catch {}
}

function emptyTopicModes() {
  return {
    learning: { document: { blocks: [] }, sections: [] },
    interview: { document: { blocks: [] }, sections: [] },
    self: {},
  };
}

function titleFromSlug(slug) {
  if (!slug) return '';
  return slug
    .replace(/^custom-/, '')
    .split('-')
    .filter(Boolean)
    .map((x) => x[0].toUpperCase() + x.slice(1))
    .join(' ');
}

function buildTopicMeta(adminRows, userRows, uid) {
  const out = {};
    const upsert = (row, owner) => {
      let base = typeof row.baseNoteId === 'string' && row.baseNoteId ? row.baseNoteId : row.id;
      if (owner === 'user' && !parseBaseNoteId(base)) {
        const rowUid = typeof row.userId === 'string' ? row.userId : uid || '';
        const derived = baseNoteIdFromUserNoteDocId(row.id, rowUid);
        if (derived) base = derived;
      }
      const parsed = parseBaseNoteId(base);
      if (!parsed) return;
      const topicId = parsed.topicId;
      const prev = out[topicId] || {
        slug: topicId,
        title: titleFromSlug(topicId),
        category: 'general',
        isCustom: true,
        owner: owner,
      };
      out[topicId] = {
        ...prev,
        title: typeof row.title === 'string' && row.title.trim() ? row.title.trim() : prev.title,
        category:
          typeof row.category === 'string' && row.category.trim() ? row.category.trim() : prev.category,
        owner,
      };
    };

  for (const row of adminRows) upsert(row, 'admin');
  for (const row of userRows) {
    if (row?.userId && uid && row.userId !== uid) continue;
    upsert(row, 'user');
  }
  return out;
}

export function NotesProvider({ children }) {
  const { user, isAdmin } = useAuth();
  const [notes, setNotes] = useState({});
  const [sourceByBaseId, setSourceByBaseId] = useState({});
  const [topicMetaBySlug, setTopicMetaBySlug] = useState({});
  const [hiddenTopics, setHiddenTopics] = useState(() => new Set());
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [saveStatus, setSaveStatus] = useState('idle');
  const syncingRef = useRef(false);
  const savedTimerRef = useRef(null);
  const notesRef = useRef(notes);
  const sourceRef = useRef(sourceByBaseId);
  const metaRef = useRef(topicMetaBySlug);
  const hiddenRef = useRef(hiddenTopics);
  notesRef.current = notes;
  sourceRef.current = sourceByBaseId;
  metaRef.current = topicMetaBySlug;
  hiddenRef.current = hiddenTopics;

  const visibleNotes = useMemo(() => {
    if (hiddenTopics.size === 0) return notes;
    const out = {};
    for (const [slug, value] of Object.entries(notes)) {
      if (!hiddenTopics.has(slug)) out[slug] = value;
    }
    return out;
  }, [notes, hiddenTopics]);

  const visibleTopicMeta = useMemo(() => {
    if (hiddenTopics.size === 0) return topicMetaBySlug;
    const out = {};
    for (const [slug, meta] of Object.entries(topicMetaBySlug)) {
      if (!hiddenTopics.has(slug)) out[slug] = meta;
    }
    return out;
  }, [topicMetaBySlug, hiddenTopics]);

  const noteTopics = useMemo(() => {
    return Object.values(visibleTopicMeta).map((m) => ({
      id: m.slug,
      slug: m.slug,
      title: m.title || titleFromSlug(m.slug),
      category: m.category || 'general',
      keywords: [],
      relatedTopics: [],
      externalLinks: [],
      isCustom: true,
      content: { learning: {}, interview: {} },
    }));
  }, [visibleTopicMeta]);

  const commitLocal = useCallback(
    (nextNotes, nextSourceByBaseId, nextMetaBySlug, syncNow = false) => {
      if (syncNow) {
        flushSync(() => {
          setNotes(nextNotes);
          setSourceByBaseId(nextSourceByBaseId);
          setTopicMetaBySlug(nextMetaBySlug);
        });
      } else {
        setNotes(nextNotes);
        setSourceByBaseId(nextSourceByBaseId);
        setTopicMetaBySlug(nextMetaBySlug);
      }
      writeCache(user?.uid, nextNotes, nextSourceByBaseId, nextMetaBySlug);
    },
    [user],
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const loadRemoteNotes = useCallback(async () => {
    const adminSnap = await getDocs(collection(db, COL_ADMIN));
    const adminRows = adminSnap.docs.map((d) => ({ ...d.data(), id: d.id }));
    let userRows = [];
    if (user) {
      const userQ = query(collection(db, COL_USER), where('userId', '==', user.uid));
      const userSnap = await getDocs(userQ);
      userRows = userSnap.docs.map((d) => ({ ...d.data(), id: d.id }));
    }
    const mergedResult = mergeAdminUserNoteLayers(adminRows, userRows);
    const meta = buildTopicMeta(adminRows, userRows, user?.uid);
    return { ...mergedResult, topicMetaBySlug: meta };
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    const cached = readCache(user?.uid);
    setNotes(cached.notes || {});
    setSourceByBaseId(cached.sourceByBaseId || {});
    setTopicMetaBySlug(cached.topicMetaBySlug || {});

    setLoading(true);
    loadRemoteNotes()
      .then(({ merged, sourceByBaseId: sources, topicMetaBySlug: meta }) => {
        if (cancelled) return;
        commitLocal(merged, sources, meta, false);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, loadRemoteNotes, commitLocal]);

  const upsertUserNote = useCallback(
    async (topicId, mode, blocks, title, category, baseNoteId) => {
      if (!user) return;
      const baseId = baseNoteId || noteBaseId(topicId, mode);
      const ref = doc(db, COL_USER, userNoteFirestoreId(user.uid, baseId));
      await setDoc(
        ref,
        {
          userId: user.uid,
          baseNoteId: baseId,
          title: title || topicId,
          category: category || 'general',
          blocks: cloneBlocks(blocks),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    },
    [user],
  );

  const upsertAdminNote = useCallback(async (topicId, mode, blocks, title, category) => {
    const baseId = noteBaseId(topicId, mode);
    const ref = doc(db, COL_ADMIN, baseId);
    await setDoc(
      ref,
      {
        title: title || topicId,
        category: category || 'general',
        blocks: cloneBlocks(blocks),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }, []);

  const applyLocalModeBlocks = useCallback(
    (topicId, mode, blocks, sourceType, title, category, syncNow = false) => {
      const baseId = noteBaseId(topicId, mode);
      const prevTopic = notesRef.current[topicId] || emptyTopicModes();
      const nextTopic = {
        ...prevTopic,
        [mode]: {
          ...(prevTopic[mode] || { document: { blocks: [] }, sections: [] }),
          document: { blocks: cloneBlocks(blocks) },
          sections: [],
        },
      };
      const nextNotes = { ...notesRef.current, [topicId]: nextTopic };
      const nextSources = { ...sourceRef.current, [baseId]: sourceType };
      const prevMeta = metaRef.current[topicId] || {
        slug: topicId,
        title: titleFromSlug(topicId),
        category: 'general',
        isCustom: true,
      };
      const nextMeta = {
        ...metaRef.current,
        [topicId]: {
          ...prevMeta,
          title: title || prevMeta.title,
          category: category || prevMeta.category,
          owner: sourceType,
        },
      };
      notesRef.current = nextNotes;
      sourceRef.current = nextSources;
      metaRef.current = nextMeta;
      commitLocal(nextNotes, nextSources, nextMeta, syncNow);

      if (DEBUG_NOTES_EDIT) {
        // eslint-disable-next-line no-console
        console.log('[notes-edit] applyLocalModeBlocks', {
          topicId,
          mode,
          noteType: sourceType,
          currentNoteId: sourceType === 'user' && user ? userNoteFirestoreId(user.uid, baseId) : baseId,
          baseNoteId: baseId,
        });
      }
    },
    [commitLocal, user],
  );

  const enqueue = useCallback((uid, item) => {
    const queue = readQueue(uid);
    const idx = queue.findIndex((e) => e.baseId === item.baseId && e.target === item.target);
    if (idx >= 0) queue[idx] = item;
    else queue.push(item);
    writeQueue(uid, queue);
  }, []);

  const flushQueue = useCallback(async () => {
    if (!user || syncingRef.current) return;
    const queue = readQueue(user.uid);
    if (queue.length === 0) return;

    syncingRef.current = true;
    setSyncing(true);
    const remaining = [];

    for (const item of queue) {
      try {
        if (!NOTE_MODES.includes(item.mode)) continue;
        if (item.target === 'admin') {
          await upsertAdminNote(item.topicId, item.mode, item.blocks, item.title, item.category);
        } else {
          await upsertUserNote(item.topicId, item.mode, item.blocks, item.title, item.category, item.baseId);
        }
      } catch {
        remaining.push(item);
      }
    }

    writeQueue(user.uid, remaining);
    syncingRef.current = false;
    setSyncing(false);
  }, [user, upsertAdminNote, upsertUserNote]);

  useEffect(() => {
    if (online && user) flushQueue();
  }, [online, user, flushQueue]);

  useEffect(() => {
    if (!user || isAdmin) {
      setHiddenTopics(new Set());
      return;
    }
    let cancelled = false;
    getDoc(doc(db, COL_USER_HIDDEN, user.uid))
      .then((snap) => {
        if (cancelled) return;
        const data = snap.exists() ? snap.data() : null;
        const slugs = Array.isArray(data?.slugs)
          ? data.slugs.filter((s) => typeof s === 'string')
          : [];
        setHiddenTopics(new Set(slugs));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, isAdmin]);

  const deleteTopic = useCallback(
    async (topicId) => {
      if (!user || !topicId) return;

      if (isAdmin) {
        await Promise.all(
          NOTE_MODES.map((mode) =>
            deleteDoc(doc(db, COL_ADMIN, noteBaseId(topicId, mode))).catch(() => {}),
          ),
        );
        flushSync(() => {
          const nextNotes = { ...notesRef.current };
          delete nextNotes[topicId];
          const nextSources = { ...sourceRef.current };
          for (const mode of NOTE_MODES) delete nextSources[noteBaseId(topicId, mode)];
          const nextMeta = { ...metaRef.current };
          delete nextMeta[topicId];
          notesRef.current = nextNotes;
          sourceRef.current = nextSources;
          metaRef.current = nextMeta;
          setNotes(nextNotes);
          setSourceByBaseId(nextSources);
          setTopicMetaBySlug(nextMeta);
          writeCache(user.uid, nextNotes, nextSources, nextMeta);
        });
        return;
      }

      await Promise.all(
        NOTE_MODES.map((mode) =>
          deleteDoc(
            doc(db, COL_USER, userNoteFirestoreId(user.uid, noteBaseId(topicId, mode))),
          ).catch(() => {}),
        ),
      );
      try {
        await setDoc(
          doc(db, COL_USER_HIDDEN, user.uid),
          { slugs: arrayUnion(topicId), updatedAt: serverTimestamp() },
          { merge: true },
        );
      } catch (err) {
        console.error('Failed to record hidden topic:', err);
      }
      setHiddenTopics((prev) => {
        const next = new Set(prev);
        next.add(topicId);
        return next;
      });
    },
    [user, isAdmin],
  );

  const getUserNotes = useCallback(
    (topicId) => {
      if (hiddenTopics.has(topicId)) return null;
      return notes[topicId] || null;
    },
    [notes, hiddenTopics],
  );

  const getNoteSource = useCallback(
    (topicId, mode) => {
      if (!topicId || hiddenTopics.has(topicId)) return null;
      if (mode) return sourceByBaseId[noteBaseId(topicId, mode)] || null;
      const hasUser = NOTE_MODES.some((m) => sourceByBaseId[noteBaseId(topicId, m)] === 'user');
      if (hasUser) return 'user';
      const hasAdmin = NOTE_MODES.some((m) => sourceByBaseId[noteBaseId(topicId, m)] === 'admin');
      return hasAdmin ? 'admin' : null;
    },
    [sourceByBaseId, hiddenTopics],
  );

  const getNoteTopic = useCallback(
    (slug) => {
      if (hiddenTopics.has(slug)) return null;
      return noteTopics.find((t) => t.slug === slug) || null;
    },
    [noteTopics, hiddenTopics],
  );

  const ensurePersonalNoteCopy = useCallback(
    async (topicId, title, mode, mergedContent) => {
      if (!user || !NOTE_MODES.includes(mode)) return;
      if (isAdmin) return;
      const source = sourceRef.current[noteBaseId(topicId, mode)] || 'admin';
      if (source === 'user') return;

      const meta = metaRef.current[topicId] || {};
      const blocks = mergedContentModeBlocks(mergedContent, mode);
      const category = meta.category || 'general';
      const noteTitle = title || meta.title || topicId;
      const baseId = noteBaseId(topicId, mode);
      try {
        await upsertUserNote(topicId, mode, blocks, noteTitle, category);
      } catch (err) {
        if (DEBUG_NOTES_EDIT) {
          // eslint-disable-next-line no-console
          console.warn('[notes-edit] ensurePersonalNoteCopy: remote copy failed, queuing + opening editor locally', err);
        }
        enqueue(user.uid, {
          target: 'user',
          baseId,
          topicId,
          mode,
          title: noteTitle,
          category,
          blocks,
          timestamp: Date.now(),
        });
      }
      applyLocalModeBlocks(topicId, mode, blocks, 'user', noteTitle, category, true);
    },
    [user, isAdmin, upsertUserNote, applyLocalModeBlocks, enqueue],
  );

  const ensureUserRowBeforeWrite = useCallback(
    async (topicId, mode) => {
      if (!user || !NOTE_MODES.includes(mode) || isAdmin) return;
      if (sourceRef.current[noteBaseId(topicId, mode)] === 'user') return;
      const current = notesRef.current[topicId];
      const blocks = documentToBlocks(current?.[mode]?.document);
      const meta = metaRef.current[topicId] || {};
      const title = meta.title || topicId;
      const category = meta.category || 'general';
      const baseId = noteBaseId(topicId, mode);
      try {
        await upsertUserNote(topicId, mode, blocks, title, category);
      } catch {
        enqueue(user.uid, {
          target: 'user',
          baseId,
          topicId,
          mode,
          title,
          category,
          blocks,
          timestamp: Date.now(),
        });
      }
      applyLocalModeBlocks(topicId, mode, blocks, 'user', title, category, true);
    },
    [user, isAdmin, upsertUserNote, applyLocalModeBlocks, enqueue],
  );

  const markSaved = useCallback(() => {
    setSaveStatus('saved');
    clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2500);
  }, []);

  const markError = useCallback(() => {
    setSaveStatus('error');
    clearTimeout(savedTimerRef.current);
  }, []);

  const updateModeDocument = useCallback(
    async (topicId, mode, document) => {
      if (!user || !NOTE_MODES.includes(mode)) return;
      const baseId = noteBaseId(topicId, mode);
      const source = sourceRef.current[baseId] || 'admin';
      const meta = metaRef.current[topicId] || {};
      const title = meta.title || topicId;
      const category = meta.category || 'general';
      const blocks = documentToBlocks(document);

      if (!isAdmin) {
        await ensureUserRowBeforeWrite(topicId, mode);
      }

      setSaveStatus('saving');
      const target = isAdmin && source === 'admin' ? 'admin' : 'user';
      applyLocalModeBlocks(topicId, mode, blocks, target, title, category);

      try {
        if (target === 'admin') {
          await upsertAdminNote(topicId, mode, blocks, title, category);
        } else {
          await upsertUserNote(topicId, mode, blocks, title, category);
        }
        markSaved();
      } catch {
        enqueue(user.uid, {
          target,
          baseId,
          topicId,
          mode,
          title,
          category,
          blocks,
          timestamp: Date.now(),
        });
        markError();
      }
    },
    [
      user,
      isAdmin,
      ensureUserRowBeforeWrite,
      upsertAdminNote,
      upsertUserNote,
      applyLocalModeBlocks,
      markSaved,
      enqueue,
      markError,
    ],
  );

  const updateNotes = useCallback(
    async (topicId, partialData) => {
      if (!user || !partialData || typeof partialData !== 'object') return;
      for (const mode of NOTE_MODES) {
        const modeData = partialData[mode];
        if (!modeData || typeof modeData !== 'object') continue;
        const blocks = Array.isArray(modeData.blocks)
          ? cloneBlocks(modeData.blocks)
          : documentToBlocks(modeData.document);
        await updateModeDocument(topicId, mode, { blocks });
      }
    },
    [user, updateModeDocument],
  );

  const saveNotes = useCallback(async (topicId, data) => {
    await updateNotes(topicId, data);
  }, [updateNotes]);

  const createTopicNote = useCallback(
    async ({ slug, title, category, initialByMode }) => {
      if (!user) return null;
      const nextTitle = (title || '').trim() || titleFromSlug(slug);
      const nextCategory = (category || '').trim() || 'general';

      for (const mode of NOTE_MODES) {
        const blocks = cloneBlocks(initialByMode?.[mode] || []);
        if (isAdmin) {
          await upsertAdminNote(slug, mode, blocks, nextTitle, nextCategory);
        } else {
          await upsertUserNote(slug, mode, blocks, nextTitle, nextCategory);
        }
      }

      flushSync(() => {
        let nextNotes = { ...notesRef.current };
        let nextSources = { ...sourceRef.current };
        let nextMetaMap = { ...metaRef.current };

        for (const mode of NOTE_MODES) {
          const blocks = cloneBlocks(initialByMode?.[mode] || []);
          const baseId = noteBaseId(slug, mode);
          const prevTopic = nextNotes[slug] || emptyTopicModes();
          const nextTopic = {
            ...prevTopic,
            [mode]: {
              ...(prevTopic[mode] || { document: { blocks: [] }, sections: [] }),
              document: { blocks: cloneBlocks(blocks) },
              sections: [],
            },
          };
          nextNotes = { ...nextNotes, [slug]: nextTopic };
          nextSources = { ...nextSources, [baseId]: isAdmin ? 'admin' : 'user' };
        }

        const prevMeta = nextMetaMap[slug] || {
          slug,
          title: titleFromSlug(slug),
          category: 'general',
          isCustom: true,
        };
        nextMetaMap = {
          ...nextMetaMap,
          [slug]: {
            ...prevMeta,
            title: nextTitle,
            category: nextCategory,
            owner: isAdmin ? 'admin' : 'user',
          },
        };

        notesRef.current = nextNotes;
        sourceRef.current = nextSources;
        metaRef.current = nextMetaMap;
        setNotes(nextNotes);
        setSourceByBaseId(nextSources);
        setTopicMetaBySlug(nextMetaMap);
        writeCache(user?.uid, nextNotes, nextSources, nextMetaMap);
      });

      return slug;
    },
    [user, isAdmin, upsertAdminNote, upsertUserNote],
  );

  const pendingCount = user ? readQueue(user.uid).length : 0;

  const retrySave = useCallback(() => {
    setSaveStatus('idle');
    flushQueue();
  }, [flushQueue]);

  return (
    <NotesContext.Provider
      value={{
        notes: visibleNotes,
        noteTopics,
        loading,
        online,
        syncing,
        saveStatus,
        pendingCount,
        getUserNotes,
        getNoteSource,
        getNoteTopic,
        ensurePersonalNoteCopy,
        createTopicNote,
        saveNotes,
        updateNotes,
        updateModeDocument,
        deleteTopic,
        flushQueue,
        retrySave,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) throw new Error('useNotes must be used within NotesProvider');
  return context;
}
