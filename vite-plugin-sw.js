import { readFileSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';

/**
 * Vite plugin that injects a precache manifest into the service worker
 * after build, replacing the '__PRECACHE_MANIFEST__' placeholder with
 * an array of actual hashed asset URLs.
 */
export default function swPrecache() {
  let outDir = 'dist';

  return {
    name: 'vite-plugin-sw-precache',
    apply: 'build',

    configResolved(config) {
      outDir = config.build.outDir || 'dist';
    },

    closeBundle() {
      const dist = resolve(outDir);
      const swPath = join(dist, 'sw.js');

      let sw;
      try {
        sw = readFileSync(swPath, 'utf-8');
      } catch {
        return;
      }

      const urls = new Set(['/index.html', '/offline.html']);

      // Collect from Vite manifest
      try {
        const raw = readFileSync(join(dist, '.vite', 'manifest.json'), 'utf-8');
        const manifest = JSON.parse(raw);
        for (const entry of Object.values(manifest)) {
          if (entry.file) urls.add('/' + entry.file);
          for (const css of entry.css || []) urls.add('/' + css);
        }
      } catch {
        // no manifest — fall through
      }

      // Also add icons and manifest referenced in index.html
      for (const f of [
        '/manifest.webmanifest',
        '/favicon.svg',
        '/icon-192.svg',
        '/icon-512.svg',
      ]) {
        urls.add(f);
      }

      const list = JSON.stringify([...urls], null, 2);
      sw = sw.replace("'__PRECACHE_MANIFEST__'", list);

      writeFileSync(swPath, sw);
      console.log(`\n  SW precache: ${urls.size} URLs injected into sw.js`);
    },
  };
}
