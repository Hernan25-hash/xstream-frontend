import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/xstream-frontend/', // 🔑 important for subdirectory deployment
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // 🔄 auto-refresh when new version is available
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'android-chrome-192x192.png',
        'android-chrome-512x512.png'
      ],
      manifest: {
        name: 'XStream 18+ Adult Video Platform',
        short_name: 'XStream',
        description: 'XStream (18+) - Adult video embed platform as a PWA.',
        theme_color: '#d7263d',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/xstream-frontend/',      // 🔑 match base
        start_url: '/xstream-frontend/',   // 🔑 match base
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true, // 🧹 removes old caches when updating
        clientsClaim: true,          // ensures SW controls all clients immediately
        skipWaiting: true,           // forces update without manual reload
        runtimeCaching: [
          {
            // 🖼️ Cache images
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
          {
            // ⚡ Cache static JS/CSS/HTML
            urlPattern: ({ request }) =>
              ['style', 'script', 'worker', 'document'].includes(request.destination),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            // 🎬 Optional: Cache video files
            urlPattern: ({ url }) => url.pathname.endsWith('.mp4'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'video-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 3, // 3 days
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true, // ✅ enables PWA on localhost for testing
      },
    }),
  ],
});
