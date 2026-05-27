import { useState, useEffect, useCallback } from 'react';

let deferredPrompt = null;

export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    function onBeforeInstall(e) {
      e.preventDefault();
      deferredPrompt = e;
      setCanInstall(true);
    }

    function onAppInstalled() {
      deferredPrompt = null;
      setCanInstall(false);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);

    if (deferredPrompt) setCanInstall(true);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      deferredPrompt = null;
      setCanInstall(false);
    }
  }, []);

  return { canInstall, install };
}
