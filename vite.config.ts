import { createHash } from 'node:crypto'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { Plugin } from 'vite'

function offlineShellPlugin(): Plugin {
  return {
    name: 'missed-offline-shell',
    generateBundle(_, bundle) {
      const appFiles = Object.values(bundle)
        .filter((file) =>
          file.type === 'chunk' ||
          (file.type === 'asset' && /\.(js|css|svg|png|webp|woff2?)$/i.test(file.fileName))
        )
        .map((file) => `/${file.fileName}`);
      const precacheUrls = JSON.stringify([...new Set(['/', '/index.html', ...appFiles])]);
      const version = createHash('sha256')
        .update(appFiles.filter((file) => /\.(js|css)$/.test(file)).join('|'))
        .digest('hex')
        .slice(0, 12);

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `
const CACHE_NAME = 'missed-shell-${version}';
const PRECACHE_URLS = ${precacheUrls};
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('missed-shell-') && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});
`,
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    offlineShellPlugin(),
  ],
})
