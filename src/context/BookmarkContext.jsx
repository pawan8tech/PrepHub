import { createContext, useContext, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const BookmarkContext = createContext();

export function BookmarkProvider({ children }) {
  const [bookmarks, setBookmarks] = useLocalStorage('prephub-bookmarks', []);

  const toggleBookmark = useCallback(
    (slug) => {
      setBookmarks((prev) =>
        prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
      );
    },
    [setBookmarks]
  );

  const isBookmarked = useCallback(
    (slug) => bookmarks.includes(slug),
    [bookmarks]
  );

  const clearBookmarks = useCallback(
    () => setBookmarks([]),
    [setBookmarks]
  );

  return (
    <BookmarkContext.Provider
      value={{ bookmarks, toggleBookmark, isBookmarked, clearBookmarks }}
    >
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (!context)
    throw new Error('useBookmarks must be used within BookmarkProvider');
  return context;
}
