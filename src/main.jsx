import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  } else {
    // In dev, a previously-registered SW would serve stale modules
    // (stale-while-revalidate) and fight Vite HMR. Tear it down.
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });
    caches?.keys?.().then((keys) => {
      keys.filter((k) => k.startsWith('prephub-')).forEach((k) => caches.delete(k));
    });
  }
}
