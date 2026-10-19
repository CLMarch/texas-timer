/* 德州盲注计时器 · Service Worker
 * 策略：优先网络（保证更新及时）→ 失败回退缓存（离线可用）
 * 仅在安全上下文（https / localhost）下会被注册，file:// 打开不生效
 */
'use strict';
const VERSION = 'texas-timer-v2';
const SHELL = [
  './德州盲注计时器.html',
  './touch-icon.png',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(SHELL);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith((async () => {
    try {
      const fresh = await fetch(e.request);
      if (fresh && fresh.ok) {
        const c = await caches.open(VERSION);
        c.put(e.request, fresh.clone());
      }
      return fresh;
    } catch (err) {
      const hit = await caches.match(e.request, { ignoreSearch: true });
      if (hit) return hit;
      if (e.request.mode === 'navigate') {
        const idx = await caches.match('./德州盲注计时器.html');
        if (idx) return idx;
      }
      throw err;
    }
  })());
});
