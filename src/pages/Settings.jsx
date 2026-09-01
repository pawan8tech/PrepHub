import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useMode } from '../context/ModeContext';
import { useBookmarks } from '../context/BookmarkContext';
import { useProgress } from '../context/ProgressContext';
import { useRecent } from '../context/RecentContext';
import { useAuth } from '../context/AuthContext';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import AdminInterviewMigration from '../components/admin/AdminInterviewMigration';
import AdminFileLibrary from '../components/admin/AdminFileLibrary';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { mode, toggleMode } = useMode();
  const { bookmarks, clearBookmarks } = useBookmarks();
  const { progress, clearProgress } = useProgress();
  const { recent, clearRecent } = useRecent();
  const { user, isAdmin, logout } = useAuth();
  const { canInstall, install } = useInstallPrompt();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate('/');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          Customize your PrepHub experience.
        </p>
      </div>

      <div className="space-y-4">
        {/* Appearance */}
        <SettingsSection title="Appearance">
          <SettingsRow
            label="Theme"
            description={`Currently using ${theme} mode`}
            action={<ThemeSwitch isDark={theme === 'dark'} onToggle={toggleTheme} />}
          />
          <SettingsRow
            label="Default Mode"
            description="Choose default content mode for topic pages"
            action={
              <button
                onClick={toggleMode}
                className="rounded-lg bg-surface-100 px-3 py-1.5 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
              >
                {mode === 'learning' ? '📖 Learning' : '🎯 Interview'}
              </button>
            }
          />
        </SettingsSection>

        {/* Data Management */}
        <SettingsSection title="Data Management">
          <SettingsRow
            label="Bookmarks"
            description={`${bookmarks.length} saved bookmark${bookmarks.length !== 1 ? 's' : ''}`}
            action={
              <button
                onClick={clearBookmarks}
                disabled={bookmarks.length === 0}
                className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                Clear
              </button>
            }
          />
          <SettingsRow
            label="Progress"
            description={`${Object.keys(progress).length} tracked topic${Object.keys(progress).length !== 1 ? 's' : ''}`}
            action={
              <button
                onClick={clearProgress}
                disabled={Object.keys(progress).length === 0}
                className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                Reset
              </button>
            }
          />
          <SettingsRow
            label="Recent History"
            description={`${recent.length} recent topic${recent.length !== 1 ? 's' : ''}`}
            action={
              <button
                onClick={clearRecent}
                disabled={recent.length === 0}
                className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                Clear
              </button>
            }
          />
        </SettingsSection>

        {/* Install App */}
        <SettingsSection title="App">
          <SettingsRow
            label="Install App"
            description={canInstall ? 'Install PrepHub as a desktop / mobile app' : 'App is already installed or install is unavailable'}
            action={
              <button
                onClick={install}
                disabled={!canInstall}
                className="flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/30"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 3v12m0 0l-4-4m4 4l4-4" />
                </svg>
                Install
              </button>
            }
          />
        </SettingsSection>

        {/* Admin tools */}
        {isAdmin && <AdminFileLibrary />}
        {isAdmin && <AdminInterviewMigration />}

        {/* Account */}
        {user && (
          <SettingsSection title="Account">
            <SettingsRow
              label={user.displayName || 'Signed in'}
              description={user.email || 'Google account'}
              action={
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  Logout
                </button>
              }
            />
          </SettingsSection>
        )}
      </div>

      {/* Logout confirmation dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-surface-200 bg-white p-6 shadow-xl dark:border-surface-700 dark:bg-surface-900">
            <h3 className="text-base font-semibold text-surface-900 dark:text-white">
              Confirm Logout
            </h3>
            <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
              Are you sure you want to logout? Your local data (bookmarks, progress) will remain saved.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsSection({ title, children }) {
  return (
    <div className="rounded-xl border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900">
      <div className="border-b border-surface-200 px-4 py-3 dark:border-surface-800">
        <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300">
          {title}
        </h2>
      </div>
      <div className="divide-y divide-surface-100 dark:divide-surface-800">
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ label, description, action }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-sm font-medium text-surface-800 dark:text-surface-200">
          {label}
        </p>
        <p className="text-xs text-surface-400 dark:text-surface-500">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

function ThemeSwitch({ isDark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${
        isDark ? 'bg-primary-600' : 'bg-surface-300'
      }`}
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark mode"
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300 ${
          isDark ? 'translate-x-6' : 'translate-x-1'
        }`}
      >
        <span className="text-[10px]">{isDark ? '🌙' : '☀️'}</span>
      </span>
    </button>
  );
}
