import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import CommandPalette from '../common/CommandPalette';
import { useKeyboard } from '../../hooks/useKeyboard';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useKeyboard('k', openSearch, { ctrl: true });

  return (
    <div className="flex min-h-screen flex-col">
      <Header onMenuToggle={toggleSidebar} onSearchOpen={openSearch} />

      <div className="flex flex-1">
        <Sidebar open={sidebarOpen} onClose={closeSidebar} />

        <main className="flex-1 overflow-y-auto pb-20 lg:pb-6">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileNav />
      <CommandPalette open={searchOpen} onClose={closeSearch} />
    </div>
  );
}
