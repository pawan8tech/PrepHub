import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../common/SearchBar';
import ThemeToggle from '../common/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import ModeToggle from '../common/ModeToggle';

export default function Header({ onMenuToggle, onSearchOpen }) {
  const { user, loading, login, logout, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDocDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleLogoutClick = useCallback(async () => {
    setMenuOpen(false);
    try {
      await logout();
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  }, [logout]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-1.5 border-b border-surface-200 bg-white/80 px-2 backdrop-blur-md sm:gap-3 sm:px-4 dark:border-surface-800 dark:bg-surface-950/80">
      <button
        onClick={onMenuToggle}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200 lg:hidden"
        aria-label="Toggle menu"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <Link
        to="/"
        className="flex shrink-0 items-center gap-2 text-lg font-bold text-surface-900 dark:text-white"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-sm text-white">
          P
        </span>
        <span className="hidden sm:inline">PrepHub</span>
      </Link>

      <div className="mx-1 hidden min-w-0 flex-1 sm:mx-4 sm:block">
        <SearchBar onOpen={onSearchOpen} />
      </div>
      <div className="flex flex-1 justify-end sm:hidden">
        <button
          onClick={onSearchOpen}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200"
          aria-label="Open search"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <div className="md:hidden">
          <ModeToggle compact />
        </div>
        <div className="hidden md:block">
          <ModeToggle />
        </div>
        <ThemeToggle />

        {!loading && (
          user ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Open account menu"
                title={`Signed in as ${user.displayName || user.email}`}
                className="flex h-8 items-center rounded-lg px-1.5 transition-colors hover:bg-surface-100 sm:px-2 dark:hover:bg-surface-800"
              >
                <img
                  src={user.photoURL}
                  alt=""
                  className="h-6 w-6 rounded-full"
                  referrerPolicy="no-referrer"
                />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-lg border border-surface-200 bg-white shadow-lg dark:border-surface-700 dark:bg-surface-900"
                >
                  <div className="flex items-center gap-3 border-b border-surface-100 px-3 py-2.5 dark:border-surface-800">
                    <img
                      src={user.photoURL}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-100">
                        {user.displayName || 'Signed in'}
                      </p>
                      <p className="flex items-center gap-1.5 truncate text-xs text-surface-500 dark:text-surface-400">
                        <span className="truncate">{user.email}</span>
                        {isAdmin ? (
                          <span className="shrink-0 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                            Admin
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogoutClick}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <LogoutIcon />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={login}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-2 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-50 sm:px-2.5 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
              aria-label="Sign in"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="hidden sm:inline">Sign in</span>
            </button>
          )
        )}
      </div>
    </header>
  );
}

function LogoutIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h6a2 2 0 012 2v1" />
    </svg>
  );
}
